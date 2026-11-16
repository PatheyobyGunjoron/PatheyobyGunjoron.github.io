# -*- coding: utf-8 -*-
"""
পাথেয় — নতুন ভার্সনের পুশ নোটিফিকেশন (Firebase FCM v1, সরাসরি)।

কে চালায়: .github/workflows/releases-json.yml (রিলিজ দিলে সাথে সাথে + প্রতি ঘণ্টায় ব্যাকআপ চেক)।

কেন এভাবে:
  * মেসেজে "notification" অংশ থাকে → অ্যাপ বন্ধ/কিল থাকলেও ফোনের সিস্টেম নিজেই নোটিফিকেশন দেখায়
    (শুধু data-মেসেজ Xiaomi/Realme/Vivo/Oppo-র মতো ফোনে অ্যাপ বন্ধ থাকলে প্রায়ই হারিয়ে যায়)।
  * সাথে "data" অংশে update_type=app_update থাকে → অ্যাপ খোলা থাকলে অ্যাপ নিজের সুন্দর আপডেট-নোটিফিকেশন দেখায়।
  * patheyo/data/notify-state.json-এ শেষ যে ভার্সনের নোটিফিকেশন গেছে তা লেখা থাকে →
    একই ভার্সনে কখনো দুইবার যায় না, আবার কোনো কারণে রিলিজ-ইভেন্ট মিস হলে ঘণ্টার চেকে ঠিকই যায়।

পরিবেশ (env):
  FIREBASE_SERVICE_ACCOUNT_KEY  Firebase service-account JSON (GitHub Secret)
  FORCE                         "true" হলে আগে পাঠানো হলেও আবার পাঠায় (হাতে চালানোর সময়)
  DRY_RUN                       "true" হলে কিছু পাঠায় না, শুধু দেখায় কী পাঠানো হতো
"""
import json
import os
import sys
import time
import uuid
import urllib.error
import urllib.request
from datetime import datetime, timezone

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = os.getcwd()
AUTO_JSON = os.path.join(ROOT, "patheyo", "data", "update.json")     # রিলিজ থেকে অটো তৈরি
MANUAL_JSON = os.path.join(ROOT, "docs", "update.json")              # হাতে লেখা (ঐচ্ছিক)
STATE_JSON = os.path.join(ROOT, "patheyo", "data", "notify-state.json")
LIVE_URL = "https://patheyobygunjoron.github.io/patheyo/data/update.json"
TOPIC = "all"
MAX_AGE_DAYS = 7          # এর চেয়ে পুরনো রিলিজের জন্য অটো-নোটিফিকেশন যাবে না (হাতে FORCE দিলে যাবে)
MAX_MESSAGE_BYTES = 3800  # FCM সীমা 4096 bytes — নিরাপদ মার্জিন

FORCE = os.environ.get("FORCE", "").lower() == "true"
DRY_RUN = os.environ.get("DRY_RUN", "").lower() == "true"


def log(msg):
    print(msg, flush=True)


def summary(msg):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    log(msg)


def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def vtuple(v):
    out = []
    for part in str(v or "").lstrip("vV").split("."):
        digits = "".join(ch for ch in part if ch.isdigit())
        out.append(int(digits) if digits else 0)
    while len(out) < 4:
        out.append(0)
    return tuple(out)


def clip_bytes(s, n):
    s = (s or "").strip()
    b = s.encode("utf-8")
    if len(b) <= n:
        return s
    return b[: max(0, n - 3)].decode("utf-8", errors="ignore").rstrip() + "..."


def notes_of(info):
    t = info.get("release_notes_text")
    if isinstance(t, str) and t.strip():
        return t.strip()
    arr = info.get("release_notes")
    if isinstance(arr, list):
        return "\n".join(str(x) for x in arr).strip()
    if isinstance(arr, str):
        return arr.strip()
    return ""


def pick_candidate():
    """অটো (রিলিজ) ও হাতে লেখা update.json — দুটোর মধ্যে যেটার ভার্সন বড় সেটাই।"""
    cands = []
    for path, src in ((AUTO_JSON, "release"), (MANUAL_JSON, "docs")):
        d = load(path)
        if not isinstance(d, dict):
            continue
        vn = str(d.get("versionName") or "").lstrip("vV").strip()
        apk = str(d.get("apk_url") or "").strip()
        if not vn or not apk.startswith("https://"):
            continue
        cands.append((vtuple(vn), src, vn, d))
    if not cands:
        return None
    cands.sort(key=lambda c: (c[0], c[1] == "release"), reverse=True)
    _, src, vn, d = cands[0]
    return {"source": src, "version": vn, "info": d}


def age_days(info):
    p = info.get("published_at")
    if not p:
        return 0.0
    try:
        dt = datetime.strptime(p, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except Exception:
        return 0.0


def wait_until_live(version, max_seconds=240):
    """ট্যাপ করে অ্যাপ খুললে পপআপ যেন নতুন নোট পায় — ওয়েবসাইটে update.json লাইভ হওয়া পর্যন্ত অপেক্ষা।"""
    deadline = time.time() + max_seconds
    while True:
        try:
            req = urllib.request.Request(f"{LIVE_URL}?t={int(time.time())}", headers={"Cache-Control": "no-cache"})
            with urllib.request.urlopen(req, timeout=15) as r:
                got = str(json.loads(r.read().decode("utf-8")).get("versionName", "")).lstrip("vV")
            if got == version:
                log(f"ওয়েবসাইটে update.json লাইভ ({version})")
                return True
        except Exception as e:
            got = f"error: {e}"
        if time.time() >= deadline:
            log(f"update.json এখনো লাইভ হয়নি (পাওয়া গেছে: {got}) — তবুও নোটিফিকেশন পাঠানো হচ্ছে")
            return False
        log(f"update.json লাইভ হওয়ার অপেক্ষা… (এখন: {got})")
        time.sleep(15)


def build_message(version, info):
    notes = notes_of(info)
    lines = [l.strip() for l in notes.splitlines() if l.strip()]
    heads = [l for l in lines if not l.startswith("•") and len(l) <= 70 and "রিলিজ নোট" not in l]
    body_hint = " · ".join(heads[1:5] if heads and "আপডেট" in heads[0] and len(heads) > 1 else heads[:4])
    title = f"🌙 পাথেয় v{version} — নতুন আপডেট এসেছে"
    body = "আপডেট করতে ট্যাপ করুন।"
    if body_hint:
        body = clip_bytes(body_hint, 300) + "\nআপডেট করতে ট্যাপ করুন।"
    size_mb = str(int(round(float(info.get("size_mb") or 0))))
    push_id = str(uuid.uuid4())

    def make(n_bytes):
        data = {
            "push_id": push_id,
            "update_type": "app_update",
            "version_name": version,
            "apk_url": str(info["apk_url"]),
            "notes": clip_bytes(notes, n_bytes),
            "size_mb": size_mb,
            "mandatory": "true" if info.get("mandatory") is True else "false",
            "title": title,
            "message": f"পাথেয় v{version} এখন ডাউনলোডের জন্য প্রস্তুত। আপডেট করতে ট্যাপ করুন।",
        }
        return {
            "message": {
                "topic": TOPIC,
                "notification": {"title": title, "body": body},
                "data": data,
                "android": {
                    "priority": "HIGH",
                    "ttl": "604800s",                       # ফোন বন্ধ/অফলাইন থাকলেও ৭ দিন পর্যন্ত অপেক্ষা করে পৌঁছায়
                    "collapse_key": "app_update",            # অফলাইন ফোনে শুধু সর্বশেষটি যায়
                    "notification": {
                        "channel_id": "app_update",
                        "tag": "patheyo_app_update",
                        "notification_priority": "PRIORITY_HIGH",
                        "default_sound": True,
                        "visibility": "PUBLIC",
                    },
                },
            }
        }

    n = 2000
    msg = make(n)
    while len(json.dumps(msg, ensure_ascii=False).encode("utf-8")) > MAX_MESSAGE_BYTES and n > 0:
        n = int(n * 0.8) if n > 50 else 0
        msg = make(n)
    return msg


def send(msg):
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request

    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY", "").strip()
    if not raw:
        raise SystemExit("::error::FIREBASE_SERVICE_ACCOUNT_KEY secret নেই — Settings → Secrets → Actions-এ দিন।")
    info = json.loads(raw)
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/firebase.messaging"])
    creds.refresh(Request())
    url = f"https://fcm.googleapis.com/v1/projects/{info['project_id']}/messages:send"
    body = json.dumps(msg, ensure_ascii=False).encode("utf-8")
    last = ""
    for attempt in range(1, 6):
        req = urllib.request.Request(url, data=body, method="POST", headers={
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json; charset=UTF-8",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                res = json.loads(r.read().decode("utf-8"))
                log(f"FCM OK: {res}")
                return res.get("name", "")
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}: {e.read().decode('utf-8', 'ignore')[:400]}"
            retry = e.code in (429, 500, 502, 503, 504)
        except Exception as e:
            last = str(e)
            retry = True
        log(f"FCM পাঠাতে সমস্যা (চেষ্টা {attempt}/5): {last}")
        if not retry:
            break
        time.sleep(10 * attempt)
    raise SystemExit(f"::error::নোটিফিকেশন পাঠানো যায়নি — {last}")


def main():
    cand = pick_candidate()
    if not cand:
        summary("কোনো বৈধ update.json পাওয়া যায়নি — নোটিফিকেশন বাদ।")
        return
    version, info = cand["version"], cand["info"]
    state = load(STATE_JSON) or {}
    last = str(state.get("last_notified_version") or "")

    if not FORCE and last and vtuple(version) <= vtuple(last):
        summary(f"✅ v{version}-এর নোটিফিকেশন আগেই পাঠানো হয়েছে ({state.get('notified_at', '?')}) — আবার পাঠানোর দরকার নেই।")
        return

    if not FORCE and age_days(info) > MAX_AGE_DAYS:
        summary(f"v{version} রিলিজটি {MAX_AGE_DAYS} দিনের বেশি পুরনো — অটো-নোটিফিকেশন বাদ (দরকার হলে হাতে FORCE দিয়ে চালান)।")
        state.update({"last_notified_version": version, "skipped_old": True,
                      "notified_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
        with open(STATE_JSON, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
            f.write("\n")
        return

    msg = build_message(version, info)
    log(json.dumps(msg, ensure_ascii=False, indent=2))
    if DRY_RUN:
        summary(f"🧪 DRY RUN — v{version}-এর নোটিফিকেশন পাঠানো হয়নি (শুধু পরীক্ষা)।")
        return

    if cand["source"] == "release":
        wait_until_live(version)
    name = send(msg)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(STATE_JSON, "w", encoding="utf-8") as f:
        json.dump({"last_notified_version": version, "notified_at": now, "topic": TOPIC,
                   "fcm_message": name, "source": cand["source"]}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    summary(f"🔔 v{version}-এর নোটিফিকেশন সব ইউজারের কাছে পাঠানো হয়েছে (টপিক \"{TOPIC}\", {now})।")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        print(f"::error::{e}", file=sys.stderr)
        raise
