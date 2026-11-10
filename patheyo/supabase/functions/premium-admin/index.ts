// Patheyo — premium-admin (Supabase Edge Function, Deno)
// অ্যাডমিন প্যানেলের "প্রিমিয়াম" ট্যাবের জন্য দুটি কাজ:
//   action "sync" → Firebase Realtime Database থেকে প্রিমিয়ামের হিসাব এনে Supabase-এর premium_* টেবিলে বসায়
//   action "send" → শুধু প্রিমিয়াম সদস্য / নির্দিষ্ট সদস্যদের পুশ নোটিফিকেশন পাঠায় (FCM টপিক)
//
// গোপনীয়তা: Firebase থেকে uid পড়া হলেও Supabase-এ শুধু বেনামী সদস্য কোড, প্ল্যান, মেয়াদ ও টাকার অঙ্ক যায়।
//   নাম, ইমেইল, ফোন, uid, পেমেন্টের কার্ড/ফোন নম্বর কোথাও রাখা বা দেখানো হয় না।
//
// Secrets (Supabase > Edge Functions > Secrets) — send-push-এর জন্য যা আছে তা-ই যথেষ্ট:
//   FCM_SERVICE_ACCOUNT = Firebase service-account JSON (একই Firebase প্রজেক্ট)
//   RTDB_URL (ঐচ্ছিক)  = https://hijri-tarikh-default-rtdb.firebaseio.com
// Deploy: supabase functions deploy premium-admin --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

/* প্ল্যানের দাম — server/payments/plans.js ও অ্যাপের পেওয়ালের সাথে মিল */
const PLANS: Record<string, { amount: number; days: number }> = {
  monthly: { amount: 49, days: 30 },
  yearly: { amount: 399, days: 365 },
  lifetime: { amount: 999, days: 0 },
};

const b64url = (b: ArrayBuffer | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = "";
  bytes.forEach((c) => (s += String.fromCharCode(c)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const tokens: Record<string, { token: string; exp: number }> = {};
async function accessToken(sa: { client_email: string; private_key: string }, scope: string) {
  const c = tokens[scope];
  if (c && c.exp > Date.now() + 60_000) return c.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claim}`));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64url(sig)}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("Google token error: " + JSON.stringify(j).slice(0, 200));
  tokens[scope] = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token as string;
}

/** অ্যাপের PremiumBridge.memberCode()-এর হুবহু একই হিসাব */
async function memberCode(uid: string) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("patheyo-premium:" + uid)));
  const hex = Array.from(h).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 8);
  return "PM-" + hex.slice(0, 4) + "-" + hex.slice(4);
}
const topicOf = (code: string) => "pm_" + code.replace("PM-", "").replace(/-/g, "").toLowerCase();
const CODE_RE = /^PM-[0-9A-F]{4}-[0-9A-F]{4}$/;
const iso = (ms: unknown) => (typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null);
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "লগইন করুন" }, 401);
  const { data: a } = await admin.from("admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
  if (!a) return json({ error: "অ্যাডমিন অনুমতি নেই" }, 403);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "ভুল JSON" }, 400); }

  let sa: { client_email: string; private_key: string; project_id: string };
  try { sa = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") || ""); } catch { return json({ error: "FCM_SERVICE_ACCOUNT সিক্রেট সেট করা নেই" }, 500); }

  if (b.action === "ping") return json({ ok: true });

  /* ------------------------------------------------------------ সিঙ্ক */
  if (b.action === "sync") {
    try {
      const RTDB = (Deno.env.get("RTDB_URL") || "https://hijri-tarikh-default-rtdb.firebaseio.com").replace(/\/$/, "");
      const tok = await accessToken(sa, "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email");
      const get = async (path: string, q = "") => {
        const r = await fetch(`${RTDB}/${path}.json?access_token=${encodeURIComponent(tok)}${q}`);
        if (!r.ok) throw new Error(`Firebase ${path}: ${r.status} ${(await r.text()).slice(0, 120)}`);
        return await r.json();
      };
      const orders: Record<string, Record<string, unknown>> = (await get("orders")) || {};
      const playTokens: Record<string, string> = (await get("play_tokens")) || {};
      const uids = new Set<string>();
      for (const o of Object.values(orders)) if (o && o.status === "paid" && typeof o.uid === "string") uids.add(o.uid);
      for (const v of Object.values(playTokens)) if (typeof v === "string") uids.add(v);
      /* "সম্পূর্ণ স্ক্যান": Firebase Console থেকে হাতে দেওয়া প্রিমিয়ামও ধরতে সব অ্যাকাউন্টের শুধু premium অংশ দেখা */
      if (b.full) {
        const keys = (await get("users", "&shallow=true")) || {};
        Object.keys(keys).slice(0, 5000).forEach((k) => uids.add(k));
      }

      const codeOf = new Map<string, string>();
      const members: Record<string, unknown>[] = [];
      const payments: Record<string, unknown>[] = [];
      const list = [...uids];
      for (let i = 0; i < list.length; i += 40) {
        const chunk = list.slice(i, i + 40);
        const res = await Promise.all(chunk.map(async (uid) => [uid, await get(`users/${encodeURIComponent(uid)}/premium`).catch(() => null)] as const));
        for (const [uid, p] of res) {
          const code = await memberCode(uid);
          codeOf.set(uid, code);
          if (!p || !PLANS[p.plan]) continue;
          members.push({
            member_code: code, plan: p.plan, since: iso(p.since), until: p.plan === "lifetime" ? null : iso(p.until),
            source: clip(p.source, 30) || null, synced_at: new Date().toISOString(),
          });
          /* Google Play-র কেনা: orders-এ থাকে না → প্ল্যানের দাম ধরে আনুমানিক এন্ট্রি (প্রতি কেনার টোকেনে একবার) */
          if (p.source === "play" && p.order) {
            const oid = "play:" + (await memberCode(String(p.order))).slice(3);
            payments.push({ order_id: oid, member_code: code, plan: p.plan, amount: PLANS[p.plan].amount, gateway: "play", method: "Google Play", paid_at: iso(p.at) || new Date().toISOString(), estimated: true });
          }
        }
      }
      for (const [id, o] of Object.entries(orders)) {
        if (!o || o.status !== "paid" || typeof o.uid !== "string") continue;
        const code = codeOf.get(o.uid) || (await memberCode(o.uid));
        payments.push({
          order_id: clip(id, 64), member_code: code, plan: PLANS[String(o.plan)] ? o.plan : "monthly",
          amount: Number(o.amount) || 0, gateway: clip(o.gateway, 30) || null, method: clip(o.method, 40) || null,
          paid_at: iso(o.paidAt) || iso(o.at) || new Date().toISOString(), estimated: false,
        });
      }
      for (let i = 0; i < members.length; i += 500) {
        const { error } = await admin.from("premium_members").upsert(members.slice(i, i + 500), { onConflict: "member_code" });
        if (error) throw new Error("premium_members: " + error.message);
      }
      for (let i = 0; i < payments.length; i += 500) {
        const { error } = await admin.from("premium_payments").upsert(payments.slice(i, i + 500), { onConflict: "order_id" });
        if (error) throw new Error("premium_payments: " + error.message);
      }
      const info = { at: new Date().toISOString(), members: members.length, payments: payments.length, scanned: uids.size, full: !!b.full };
      await admin.from("premium_meta").upsert({ k: "sync", v: info, updated_at: new Date().toISOString() });
      return json({ ok: true, ...info });
    } catch (e) {
      return json({ ok: false, error: String((e as Error).message ?? e).slice(0, 300) }, 502);
    }
  }

  /* ------------------------------------------------------------ নোটিফিকেশন */
  if (b.action === "send") {
    const title = clip(b.title, 100), message = clip(b.message, 1000), link = clip(b.link, 500);
    if (!title || !message) return json({ error: "শিরোনাম ও বার্তা দিন" }, 400);
    if (link && !/^https:\/\/\S+$/i.test(link)) return json({ error: "লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে" }, 400);
    const target = clip(b.target, 40);

    /* কাকে: টপিক বা সদস্য কোডের তালিকা */
    let topics: string[] = [];
    let codes: string[] = [];
    const nowIso = new Date().toISOString();
    if (target === "all") topics = ["premium"];
    else if (/^plan:(monthly|yearly|lifetime)$/.test(target)) topics = ["premium_" + target.slice(5)];
    else if (/^expiring:\d{1,3}$/.test(target)) {
      const days = Math.min(365, parseInt(target.split(":")[1]));
      const { data } = await admin.from("premium_members").select("member_code").neq("plan", "lifetime").gt("until", nowIso)
        .lte("until", new Date(Date.now() + days * 86400000).toISOString()).limit(5000);
      codes = (data ?? []).map((r: { member_code: string }) => r.member_code);
    } else if (target === "expired") {
      const { data } = await admin.from("premium_members").select("member_code").neq("plan", "lifetime").lte("until", nowIso).limit(5000);
      codes = (data ?? []).map((r: { member_code: string }) => r.member_code);
    } else if (target === "codes") {
      codes = (Array.isArray(b.codes) ? b.codes : []).map((c) => String(c).trim().toUpperCase()).filter((c) => CODE_RE.test(c)).slice(0, 500);
    } else return json({ error: "কাকে পাঠাবেন তা ঠিক নয়" }, 400);
    if (!topics.length && !codes.length) return json({ error: "এই দলে কোনো সদস্য নেই" }, 400);

    const data: Record<string, string> = { push_id: crypto.randomUUID(), title, message };
    if (link) data.link = link;
    const android = { priority: "HIGH", ttl: "86400s" };
    let status = "sent", detail = "", ok = 0, total = 0;
    try {
      const access = await accessToken(sa, "https://www.googleapis.com/auth/firebase.messaging");
      const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
      const send = async (dest: Record<string, string>) => {
        const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { ...dest, data, android } }) });
        if (!r.ok) throw new Error(`FCM ${r.status}: ${(await r.text()).slice(0, 160)}`);
      };
      const jobs: Record<string, string>[] = topics.map((t) => ({ topic: t }));
      /* FCM condition-এ একসাথে ৫টি টপিক — ৫ জন করে একেকটি পাঠানো */
      for (let i = 0; i < codes.length; i += 5) jobs.push({ condition: codes.slice(i, i + 5).map((c) => `'${topicOf(c)}' in topics`).join(" || ") });
      total = jobs.length;
      let lastErr = "";
      for (let i = 0; i < jobs.length; i += 20) {
        const rs = await Promise.allSettled(jobs.slice(i, i + 20).map(send));
        rs.forEach((r) => { if (r.status === "fulfilled") ok++; else lastErr = String(r.reason?.message ?? r.reason); });
      }
      if (!ok) throw new Error(lastErr || "পাঠানো যায়নি");
      detail = topics.length ? `topic ${topics[0]}` : `${codes.length} জন সদস্য · ${ok}/${total} ব্যাচ`;
      if (lastErr) detail += `; শেষ ত্রুটি: ${lastErr}`;
    } catch (e) {
      status = "failed";
      detail = String((e as Error).message ?? e).slice(0, 400);
    }
    const tgt = "premium:" + (target === "codes" ? (codes.length === 1 ? codes[0] : codes.length + " জন বাছাই") : target);
    await admin.from("notifications").insert({ kind: "premium", title, message, link: link || null, target: tgt, status, detail, sent_by: u.user.email ?? "admin" });
    return status === "sent" ? json({ ok: true, members: codes.length || null, detail }) : json({ ok: false, error: detail }, 502);
  }

  return json({ error: "অজানা কাজ" }, 400);
});
