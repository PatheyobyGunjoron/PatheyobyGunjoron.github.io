// Patheyo — send-push (Supabase Edge Function, Deno)
// অ্যাডমিন প্যানেল (বা GitHub Release অটোমেশন) থেকে অ্যাপের সব ইউজারের ফোনে FCM পুশ নোটিফিকেশন পাঠায়।
//
// সিক্রেট (Supabase → Edge Functions → Secrets): 
//   FCM_SERVICE_ACCOUNT = Firebase সার্ভিস-অ্যাকাউন্ট JSON-এর পুরো লেখা
//   PUSH_HOOK_SECRET    = নিজের বানানো লম্বা একটি গোপন শব্দ (GitHub Action এটা দিয়ে অনুমতি পায়)
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY — Supabase নিজেই দেয়।
//
// ডিপ্লয়: supabase functions deploy send-push --no-verify-jwt   (ফাংশন নিজেই অনুমতি যাচাই করে)
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
  let s = ""; bytes.forEach((c) => (s += String.fromCharCode(c)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Google OAuth2 access token (service account JWT → token)
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

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const isHttps = (u: string) => /^https:\/\/[^\s]+$/i.test(u);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // ---- অনুমতি: (ক) লগইন করা অ্যাডমিন, অথবা (খ) GitHub Action-এর গোপন শব্দ ----
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

  // কাদের পাঠানো হবে: সবাইকে ("all") অথবা নির্দিষ্ট ভার্সনের ইউজারকে ("ver_1_6_0")
  const version = clip(b.target_version, 32);
  const topic = version ? "ver_" + version.replace(/[^A-Za-z0-9_]/g, "_") : "all";
  const target = version ? `version:${version}` : "all";

  const data: Record<string, string> = {};
  if (kind === "app_update") {
    const vn = clip(b.version_name, 32), apk = clip(b.apk_url, 500);
    if (!vn || !isHttps(apk)) return json({ error: "version_name ও https apk_url দরকার" }, 400);
    title = title || "পাথেয়-র নতুন আপডেট এসেছে";
    message = message || `পাথেয় v${vn} এখন ডাউনলোডের জন্য প্রস্তুত। আপডেট করতে ট্যাপ করুন।`;
    Object.assign(data, {
      update_type: "app_update", version_name: vn, apk_url: apk,
      notes: clip(b.notes, 900), size_mb: String(parseInt(String(b.size_mb ?? "0")) || 0), mandatory: b.mandatory ? "true" : "false",
    });
  } else {
    if (!title || !message) return json({ error: "শিরোনাম ও বার্তা দিন" }, 400);
    Object.assign(data, { title, message });
    if (link) data.link = link;
    if (image) data.image = image;
  }
  data.title = title; data.message = message;   // app_update-এও title/message থাকলে ব্যাকআপ হিসেবে কাজে লাগে

  let status = "sent", detail = "";
  try {
    const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!saRaw) throw new Error("FCM_SERVICE_ACCOUNT সিক্রেট সেট করা নেই");
    const sa = JSON.parse(saRaw);
    const token = await accessToken(sa);
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      // শুধু data মেসেজ: অ্যাপ বন্ধ থাকলেও PatheyoMessagingService নিজের ডিজাইনে নোটিফিকেশন দেখায়
      body: JSON.stringify({ message: { topic, data, android: { priority: "HIGH", ttl: "86400s" } } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`FCM ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
    detail = String(j.name ?? "");
  } catch (e) {
    status = "failed"; detail = String((e as Error).message ?? e).slice(0, 400);
  }

  await admin.from("notifications").insert({
    kind, title, message, link: link || null, image: image || null, target, status, detail, sent_by: sender,
  });
  return status === "sent" ? json({ ok: true, target, detail }) : json({ ok: false, error: detail }, 502);
});
