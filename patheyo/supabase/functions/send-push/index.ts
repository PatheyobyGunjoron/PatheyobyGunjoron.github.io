// Patheyo - send-push (Supabase Edge Function, Deno)  [v2]
// Sends FCM push to: (a) topic "all" / "ver_X" AND (b) every registered device token.
// Device tokens come from push_tokens table (see supabase/push_tokens.sql).
// Each message carries a unique push_id; the app de-duplicates, so a device that gets both copies shows one notification.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   FCM_SERVICE_ACCOUNT = full Firebase service-account JSON text
//   PUSH_HOOK_SECRET    = your long random secret (GitHub Action uses it)
// Deploy: supabase functions deploy send-push --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const b64url = (b: ArrayBuffer | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = "";
  bytes.forEach((c) => (s += String.fromCharCode(c)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let cached: { token: string; exp: number } | null = null;
async function accessToken(sa: { client_email: string; private_key: string }) {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claim}`));
  const jwt = `${head}.${claim}.${b64url(sig)}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("Google token error: " + JSON.stringify(j).slice(0, 200));
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cached.token;
}

// One FCM v1 send. dead = token is no longer valid (device uninstalled / token changed)
async function fcmPost(url: string, access: string, message: Record<string, unknown>) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, dead: false, err: "" };
    const txt = JSON.stringify(j);
    return { ok: false, dead: /UNREGISTERED/.test(txt), err: `FCM ${r.status}: ${txt.slice(0, 200)}` };
  } catch (e) {
    return { ok: false, dead: false, err: String((e as Error).message ?? e).slice(0, 200) };
  }
}

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const isHttps = (u: string) => /^https:\/\/[^\s]+$/i.test(u);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // Auth: GitHub Action secret, or logged-in admin
  let sender = "";
  const hook = req.headers.get("x-hook-secret");
  const want = Deno.env.get("PUSH_HOOK_SECRET");
  if (hook && want && hook === want) {
    sender = "github-release";
  } else {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ error: "লগইন করুন" }, 401);
    const { data: a } = await admin.from("admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
    if (!a) return json({ error: "অ্যাডমিন অনুমতি নেই" }, 403);
    sender = u.user.email ?? "admin";
  }

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "ভুল JSON" }, 400); }

  const kind = b.kind === "app_update" ? "app_update" : "announcement";
  let title = clip(b.title, 100), message = clip(b.message, 1000);
  const link = clip(b.link, 500), image = clip(b.image, 500);
  if (link && !isHttps(link)) return json({ error: "লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে" }, 400);
  if (image && !isHttps(image)) return json({ error: "ছবির লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে" }, 400);

  const version = clip(b.target_version, 32);
  const topic = version ? "ver_" + version.replace(/[^A-Za-z0-9_]/g, "_") : "all";
  const target = version ? `version:${version}` : "all";

  const data: Record<string, string> = { push_id: crypto.randomUUID() };
  if (kind === "app_update") {
    const vn = clip(b.version_name, 32), apk = clip(b.apk_url, 500);
    if (!vn || !isHttps(apk)) return json({ error: "version_name ও https apk_url দরকার" }, 400);
    title = title || "পাথেয়-র নতুন আপডেট এসেছে";
    message = message || `পাথেয় v${vn} এখন ডাউনলোডের জন্য প্রস্তুত। আপডেট করতে ট্যাপ করুন।`;
    Object.assign(data, {
      update_type: "app_update", version_name: vn, apk_url: apk,
      notes: clip(b.notes, 900), size_mb: String(parseInt(String(b.size_mb ?? "0")) || 0),
      mandatory: b.mandatory ? "true" : "false",
    });
  } else {
    if (!title || !message) return json({ error: "শিরোনাম ও বার্তা দিন" }, 400);
    if (link) data.link = link;
    if (image) data.image = image;
  }
  data.title = title;
  data.message = message;

  let status = "sent";
  let detail = "";
  let topicOk = false, tokenOk = 0, tokenTotal = 0;
  try {
    const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!saRaw) throw new Error("FCM_SERVICE_ACCOUNT সিক্রেট সেট করা নেই");
    const sa = JSON.parse(saRaw);
    const access = await accessToken(sa);
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
    const android = { priority: "HIGH", ttl: "86400s" };

    // (a) topic copy - devices that subscribed to topic
    const t = await fcmPost(fcmUrl, access, { topic, data, android });
    topicOk = t.ok;
    const topicErr = t.ok ? "" : t.err;

    // (b) direct copy - every registered device token (fast, not dependent on topic delivery)
    let q = admin.from("push_tokens").select("token").limit(20000);
    if (version) q = q.eq("version", version);
    const { data: rows } = await q;
    const tokens: string[] = (rows ?? []).map((r: { token: string }) => r.token);
    tokenTotal = tokens.length;
    const dead: string[] = [];
    let lastErr = "";
    for (let i = 0; i < tokens.length; i += 25) {
      const chunk = tokens.slice(i, i + 25);
      const results = await Promise.all(
        chunk.map((tk) => fcmPost(fcmUrl, access, { token: tk, data, android })),
      );
      results.forEach((r, idx) => {
        if (r.ok) tokenOk++;
        else {
          lastErr = r.err;
          if (r.dead) dead.push(chunk[idx]);
        }
      });
    }
    if (dead.length) {
      for (let i = 0; i < dead.length; i += 200) {
        await admin.from("push_tokens").delete().in("token", dead.slice(i, i + 200));
      }
    }

    if (!topicOk && tokenOk === 0) {
      throw new Error(`topic: ${topicErr || "ok"}; tokens: ${tokenTotal === 0 ? "কোনো ডিভাইস নিবন্ধিত নেই" : lastErr}`);
    }
    detail = `topic=${topicOk ? "ok" : "fail"}; tokens ${tokenOk}/${tokenTotal}` +
      (topicErr ? `; topicErr=${topicErr}` : "");
  } catch (e) {
    status = "failed";
    detail = String((e as Error).message ?? e).slice(0, 400);
  }

  await admin.from("notifications").insert({
    kind, title, message, link: link || null, image: image || null, target, status, detail, sent_by: sender,
  });
  return status === "sent"
    ? json({ ok: true, target, detail, tokens_ok: tokenOk, tokens_total: tokenTotal })
    : json({ ok: false, error: detail }, 502);
});
