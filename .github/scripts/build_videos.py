# -*- coding: utf-8 -*-
"""
পাথেয় — ওয়েবসাইটের ভিডিও তালিকা (patheyo/data/videos.json) GitHub Release থেকে নিজে থেকে বানায়।

কীভাবে কাজ করে:
  * GitHub-এ "videos" ট্যাগের একটি Release থাকে (নাম যেকোনো, যেমন "ভিডিও গাইড")।
  * সেই রিলিজে .mp4 ভিডিও আপলোড করা হয়। একই নামের .jpg/.png/.webp থাকলে সেটা ভিডিওর কভার (poster) হয়।
      যেমন: intro.mp4 + intro.jpg,  install-guide.mp4 + install-guide.webp
  * রিলিজের বর্ণনায় (description) প্রতি ভিডিওর জন্য এক লাইন লিখলে শিরোনাম/বিভাগ/বিবরণ সেখান থেকে আসে:
      intro.mp4 | পাথেয় অ্যাপের পরিচিতি | অ্যাপ পরিচিতি | ২ মিনিটে পুরো অ্যাপ ঘুরে দেখুন
      install-guide.mp4 | কীভাবে ইনস্টল করবেন | ইনস্টল গাইড | ডাউনলোড থেকে প্রথমবার খোলা পর্যন্ত
    (ফাইলের নাম | শিরোনাম | বিভাগ | ছোট বিবরণ — শুধু ফাইলের নাম আর শিরোনাম দিলেও চলে)
  * ভিডিওগুলো ওয়েবসাইটে এই লাইনের ক্রমেই সাজানো থাকে।

ব্যবহার: python3 build_videos.py /tmp/releases.json patheyo/data/videos.json
"""
import json
import os
import re
import sys
from datetime import datetime, timezone

VIDEO_EXT = (".mp4", ".webm", ".m4v", ".mov")
IMAGE_EXT = (".jpg", ".jpeg", ".png", ".webp")
TYPES = {".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mov": "video/mp4"}


def norm(name):
    """GitHub আপলোডে ফাঁকা জায়গা '.' হয়ে যায় — তাই নাম মেলানোর সময় সব চিহ্ন বাদ দিয়ে তুলনা।"""
    base = os.path.splitext(name.strip().lower())[0]
    return re.sub(r"[^0-9a-zঀ-৿]+", "", base)


def slug(name):
    base = os.path.splitext(name.strip().lower())[0]
    return re.sub(r"[^0-9a-z]+", "-", base).strip("-") or "video"


def default_category(name):
    n = name.lower()
    if re.search(r"install|setup|ইনস্টল", n):
        return "ইনস্টল গাইড"
    if re.search(r"update|আপডেট", n):
        return "আপডেট গাইড"
    if re.search(r"how|guide|tutorial|tips|গাইড", n):
        return "কীভাবে ব্যবহার করবেন"
    return "অ্যাপ পরিচিতি"


def parse_body(body):
    meta, order = {}, []
    for raw in (body or "").splitlines():
        line = re.sub(r"^[\s>*\-•+]+", "", raw.strip()).replace("`", "").replace("**", "")
        m = re.match(r"^([^\s|]+?\.(?:mp4|webm|m4v|mov))\s*[|=:]\s*(.+)$", line, re.I)
        if not m:
            continue
        parts = [p.strip() for p in m.group(2).split("|")]
        key = norm(m.group(1))
        meta[key] = {
            "title": parts[0] if len(parts) > 0 else "",
            "category": parts[1] if len(parts) > 1 else "",
            "desc": parts[2] if len(parts) > 2 else "",
        }
        order.append(key)
    return meta, order


def main():
    for _s in (sys.stdout, sys.stderr):
        try:
            _s.reconfigure(encoding="utf-8")
        except Exception:
            pass
    src, out = sys.argv[1], sys.argv[2]
    with open(src, encoding="utf-8") as f:
        releases = json.load(f)
    if not isinstance(releases, list):
        print("রিলিজ তালিকা পাওয়া যায়নি — videos.json আগের মতোই থাকলো")
        return
    vids = []
    seen = set()
    for r in releases:
        if r.get("draft") or not str(r.get("tag_name", "")).lower().startswith("video"):
            continue
        assets = r.get("assets") or []
        posters = {norm(a["name"]): a["browser_download_url"] for a in assets
                   if a["name"].lower().endswith(IMAGE_EXT)}
        meta, order = parse_body(r.get("body"))
        files = [a for a in assets if a["name"].lower().endswith(VIDEO_EXT)]
        rank = {k: i for i, k in enumerate(order)}
        files.sort(key=lambda a: (rank.get(norm(a["name"]), 10_000), a["name"].lower()))
        for a in files:
            key = norm(a["name"])
            if key in seen:
                continue
            seen.add(key)
            m = meta.get(key, {})
            ext = os.path.splitext(a["name"].lower())[1]
            vids.append({
                "id": slug(a["name"]),
                "title": m.get("title") or "পাথেয় ভিডিও",
                "category": m.get("category") or default_category(a["name"]),
                "desc": m.get("desc", ""),
                "src": a["browser_download_url"],
                "type": TYPES.get(ext, "video/mp4"),
                "poster": posters.get(key, ""),
                "size_mb": round((a.get("size") or 0) / 1048576, 1),
                "published_at": r.get("published_at") or "",
            })
    cats = []
    for v in vids:
        if v["category"] not in cats:
            cats.append(v["category"])
    data = {"videos": vids, "categories": cats}
    old = None
    try:
        with open(out, encoding="utf-8") as f:
            old = json.load(f)
    except Exception:
        pass
    if old and {k: old.get(k) for k in data} == data:
        print(f"videos.json অপরিবর্তিত ({len(vids)}টি ভিডিও)")
        return
    data["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"videos.json তৈরি হলো — {len(vids)}টি ভিডিও, বিভাগ: {', '.join(cats) or '—'}")


if __name__ == "__main__":
    main()
