# -*- coding: utf-8 -*-
"""
পাথেয় — সর্বশেষ ভার্সনের তথ্য ওয়েবসাইটের HTML-এ নিজে থেকে বসানো (Google / Gemini / AI সার্চের জন্য)।

সমস্যা ছিল: ওয়েবসাইটের ভার্সন নম্বর শুধু JavaScript চালালে আসত ("লোড হচ্ছে…" লেখা থাকত)।
Google/Gemini সাধারণত HTML-এর লেখা পড়ে — তাই সেখানে নতুন ভার্সন না পেয়ে পুরনো জায়গা থেকে ভুল ভার্সন বলত।

এই স্ক্রিপ্ট প্রতিটি রিলিজের পর (GitHub Action থেকে) নিচের সব জায়গায় সর্বশেষ তথ্য লিখে দেয়:
  • index.html ও patheyo/index.html
      - "সর্বশেষ ভার্সন" শিরোনাম, প্রকাশের তারিখ ও সাইজ (আগে "লোড হচ্ছে…" ছিল)
      - ডাউনলোড বাটনের নিচের "v… · … MB · Android" লেখা
      - প্রশ্নোত্তরে "সর্বশেষ ভার্সন কোনটি?" প্রশ্ন ও উত্তর (দেখা যায় এমন লেখা + FAQ স্কিমা)
      - JSON-LD (MobileApplication): softwareVersion, dateModified, datePublished, fileSize, releaseNotes, downloadUrl
      - og:updated_time
  • sitemap.xml ও sitemap-patheyo.xml — হোমপেজের lastmod = সর্বশেষ রিলিজের তারিখ (Google বোঝে পেজ বদলেছে)
  • llms.txt — AI টুলগুলোর জন্য অ্যাপের সংক্ষিপ্ত, সবসময় হালনাগাদ তথ্য
  • README.md — GitHub রিপোর পেজে সর্বশেষ ভার্সন (Google এই পেজও পড়ে)

তথ্যের উৎস: patheyo/data/releases.json (একই workflow আগেই বানায়)। শুধু APK থাকা, প্রি-রিলিজ নয় এমন রিলিজ ধরা হয়।
একই তথ্য থাকলে কোনো ফাইল বদলায় না — তাই অপ্রয়োজনীয় কমিট হয় না।
শেষে GITHUB_OUTPUT-এ changed=true/false ও version লেখে (IndexNow পিং-এর জন্য)।
"""
import html
import json
import os
import re
import sys
from datetime import datetime

SITE = "https://patheyobygunjoron.github.io"
ROOT = os.getcwd()
REL = os.path.join(ROOT, "patheyo", "data", "releases.json")
HOMES = ["index.html", os.path.join("patheyo", "index.html")]
SITEMAPS = ["sitemap.xml", "sitemap-patheyo.xml"]
BN_DIG = "০১২৩৪৫৬৭৮৯"
BN_MON = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]
APK = re.compile(r"\.apk$", re.I)

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass


def bn(x):
    return "".join(BN_DIG[int(c)] if c.isdigit() else c for c in str(x))


def bn_date(iso):
    d = datetime.strptime(iso[:10], "%Y-%m-%d")
    return f"{bn(d.day)} {BN_MON[d.month - 1]}, {bn(d.year)}"


def read(p):
    with open(os.path.join(ROOT, p), encoding="utf-8", newline="") as f:
        return f.read()


def write_if_changed(p, s):
    full = os.path.join(ROOT, p)
    old = None
    if os.path.exists(full):
        with open(full, encoding="utf-8", newline="") as f:
            old = f.read()
    if old == s:
        return False
    with open(full, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    print("আপডেট:", p)
    return True


def esc(s):
    return html.escape(str(s), quote=True)


def clean_notes(body):
    """রিলিজ নোট থেকে শিরোনামগুলো (পয়েন্ট নয়) — সংক্ষেপে কী নতুন।"""
    heads, points = [], []
    for raw in (body or "").splitlines():
        t = re.sub(r"\*\*|`|__", "", raw).strip()
        t = re.sub(r"^#{1,6}\s+", "", t)
        if not t or re.fullmatch(r"[=_~*\-]{3,}", t) or re.match(r"(?i)^(full changelog|what.s changed)", t):
            continue
        if re.match(r"^[-*+•>]\s+", t):
            points.append(re.sub(r"^[-*+•>]\s+", "", t))
            continue
        if "রিলিজ নোট" in t or "নতুন আপডেট" in t or re.fullmatch(r"\W*(নতুন )?আপডেট\W*", t):
            continue
        if len(t) <= 80:
            heads.append(t)
    return heads, points


def plain(s):
    """ইমোজি ও বাড়তি চিহ্ন বাদ দিয়ে সাধারণ লেখা (FAQ/স্কিমার জন্য)।"""
    s = re.sub(r"[\U0001F000-\U0001FAFF☀-➿️‍]", "", s)
    return re.sub(r"\s+", " ", s).strip(" :—-")


def latest_release():
    with open(REL, encoding="utf-8") as f:
        rel = json.load(f)
    ok = [r for r in rel if not r.get("draft") and not r.get("prerelease")
          and any(APK.search(a.get("name", "")) for a in r.get("assets") or [])]
    ok.sort(key=lambda r: r.get("published_at") or "", reverse=True)
    if not ok:
        sys.exit("কোনো প্রকাশিত APK রিলিজ পাওয়া যায়নি — কিছু বদলানো হলো না")
    return ok


def info():
    rs = latest_release()
    r = rs[0]
    a = next(a for a in r["assets"] if APK.search(a["name"]))
    ver = re.sub(r"^[vV]", "", r["tag_name"])
    heads, points = clean_notes(r.get("body"))
    first = min((x.get("published_at") or "9999") for x in rs)
    return {
        "ver": ver,
        "date": r["published_at"][:10],
        "date_bn": bn_date(r["published_at"]),
        "size": f"{a['size'] / 1048576:.1f} MB",
        "apk": a["browser_download_url"],
        "page": r.get("html_url") or f"{SITE}/#download",
        "heads": [plain(h) for h in heads if plain(h)][:6],
        "points": [plain(p) for p in points if plain(p)][:8],
        "prev": [(re.sub(r"^[vV]", "", x["tag_name"]), x["published_at"][:10]) for x in rs[1:6]],
        "first": first[:10],
        "count": len(rs),
    }


def faq_q_a(I):
    q = "পাথেয় (Patheyo) অ্যাপের সর্বশেষ ভার্সন কোনটি?"
    new = "; ".join(I["heads"][:4])
    prev = ", ".join("v" + v for v, _ in I["prev"][:3])
    a = (f"পাথেয় বাই গুঞ্জরণ (Patheyo by Gunjoron) অ্যাপের সর্বশেষ ভার্সন v{I['ver']} — প্রকাশিত {I['date_bn']} "
         f"(সাইজ {bn(I['size'])}, অ্যান্ড্রয়েড)।"
         + (f" এই ভার্সনে নতুন: {new}।" if new else "")
         + (f" এর আগের ভার্সনগুলো ছিল {prev}।" if prev else "")
         + " সর্বশেষ ভার্সন সবসময় এই ওয়েবসাইটের ডাউনলোড অংশে পাওয়া যায়; অ্যাপে নতুন আপডেট এলে অ্যাপ নিজেই নোটিফিকেশন দিয়ে জানায়।")
    return q, a


def sub_once(pat, repl, s, label, flags=re.S):
    n = len(re.findall(pat, s, flags))
    if n == 0:
        print(f"  (সতর্কতা: '{label}' অংশ পাওয়া যায়নি — বাদ)")
        return s
    return re.sub(pat, lambda m: repl(m) if callable(repl) else repl, s, flags=flags)


def update_home(p, I):
    s = read(p)
    ver_line = f"v{I['ver']} · {I['size']} · Android"
    # ১) "লোড হচ্ছে…" → আসল ভার্সন (JavaScript চললে একই লেখা আবার বসায়, তাই কোনো ঝাঁকুনি নেই)
    s = sub_once(r'(<h3 id="rv">).*?(</h3>)', lambda m: f'{m.group(1)}<span>পাথেয়</span> v{esc(I["ver"])}{m.group(2)}', s, "rv")
    s = sub_once(r'(<div class="rm" id="rmeta">).*?(</div>)',
                 lambda m: f'{m.group(1)}<span>প্রকাশ: {esc(I["date_bn"])}</span><span>সাইজ: {esc(bn(I["size"]))}</span><span>অ্যান্ড্রয়েড</span>{m.group(2)}', s, "rmeta")
    s = sub_once(r'(<small class="hv-ver">).*?(</small>)', lambda m: f"{m.group(1)}{esc(ver_line)}{m.group(2)}", s, "hv-ver")
    # ২) প্রশ্নোত্তরে "সর্বশেষ ভার্সন" — দেখা যায় এমন লেখা
    q, a = faq_q_a(I)
    block = (f'<!--pt:latest-faq--><details><summary>{esc(q)}<span class="pl" aria-hidden="true"><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></span></summary>'
             f'<div class="ab"><p>{esc(a)}</p></div></details><!--/pt:latest-faq-->')
    if "<!--pt:latest-faq-->" in s:
        s = re.sub(r"<!--pt:latest-faq-->.*?<!--/pt:latest-faq-->", lambda m: block, s, flags=re.S)
    else:
        s = sub_once(r'(<div class="acc" id="acc">)', lambda m: m.group(1) + block, s, "faq")
    # ৩) og:updated_time
    meta = f'<meta property="og:updated_time" content="{I["date"]}T00:00:00Z">'
    if 'property="og:updated_time"' in s:
        s = re.sub(r'<meta property="og:updated_time" content="[^"]*">', meta, s)
    else:
        s = sub_once(r'(<meta property="og:url"[^>]*>)', lambda m: m.group(1) + meta, s, "og:url")
    # ৪) JSON-LD
    def fix_ld(m):
        try:
            d = json.loads(m.group(2))
        except Exception:
            return m.group(0)
        nodes = d.get("@graph", [d])
        for n in nodes:
            t = n.get("@type")
            if t == "MobileApplication":
                n["softwareVersion"] = I["ver"]
                n["datePublished"] = I["first"]
                n["dateModified"] = I["date"]
                n["fileSize"] = I["size"]
                n["downloadUrl"] = I["apk"]
                n["installUrl"] = f"{SITE}/#download"
                n["releaseNotes"] = f"v{I['ver']} ({I['date']}): " + ("; ".join(I["heads"][:6]) or "নতুন আপডেট")
                n["operatingSystem"] = n.get("operatingSystem") or "ANDROID"
            elif t == "WebSite":
                n["dateModified"] = I["date"]
            elif t == "FAQPage":
                me = [x for x in n.get("mainEntity", []) if x.get("name") != q]
                n["mainEntity"] = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}] + me
        return m.group(1) + json.dumps(d, ensure_ascii=False) + m.group(3)
    s = re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', fix_ld, s, flags=re.S)
    return write_if_changed(p, s)


def update_sitemap(p, I):
    if not os.path.exists(os.path.join(ROOT, p)):
        return False
    s = read(p)
    for loc in (f"{SITE}/", f"{SITE}/patheyo/"):
        s = re.sub(r"(<loc>" + re.escape(loc) + r"</loc>\s*<lastmod>)[^<]*(</lastmod>)", lambda m: m.group(1) + I["date"] + m.group(2), s)
    return write_if_changed(p, s)


def llms(I):
    L = [
        "# পাথেয় বাই গুঞ্জরণ (Patheyo by Gunjoron)",
        "",
        "> বিনামূল্যে বাংলা ইসলামিক অ্যান্ড্রয়েড অ্যাপ — নামাজের সময়সূচি ও আজান, তিন ক্যালেন্ডার (বাংলা, ইংরেজি, হিজরি), কুরআন শরিফ, হাদিস, দোয়া, আমলের রিপোর্ট, কিবলা কম্পাস, ডিজিটাল তাসবিহ ও হোম স্ক্রিন উইজেট। তৈরি করেছে গুঞ্জরণ (Gunjoron)।",
        "",
        "এই ফাইলটি প্রতিটি নতুন রিলিজের সাথে নিজে থেকে হালনাগাদ হয়। অ্যাপের ভার্সন সম্পর্কে এখানকার তথ্যই সঠিক ও সর্বশেষ।",
        "",
        "## সর্বশেষ ভার্সন",
        "",
        f"- ভার্সন: v{I['ver']} (Latest version: {I['ver']})",
        f"- প্রকাশ: {I['date_bn']} ({I['date']})",
        f"- সাইজ: {I['size']} · প্ল্যাটফর্ম: Android (APK) · মূল্য: বিনামূল্যে",
        f"- ডাউনলোড পেজ: {SITE}/#download",
        f"- সরাসরি APK: {I['apk']}",
        f"- মোট প্রকাশিত ভার্সন: {bn(I['count'])}টি",
    ]
    if I["heads"] or I["points"]:
        L += ["", f"### v{I['ver']}-এ যা নতুন", ""] + [f"- {h}" for h in (I["heads"] or I["points"])[:8]]
    if I["prev"]:
        L += ["", "## আগের ভার্সন (পুরনো — সর্বশেষ নয়)", ""] + [f"- v{v} — {d}" for v, d in I["prev"]]
    L += [
        "",
        "## গুরুত্বপূর্ণ পেজ",
        "",
        f"- [হোম ও ডাউনলোড]({SITE}/): অ্যাপের পরিচিতি, সর্বশেষ ভার্সন ও আগের সব ভার্সন",
        f"- [নামাজের সময়সূচি]({SITE}/patheyo/prayer-times/)",
        f"- [কুরআন শরিফ]({SITE}/patheyo/quran/)",
        f"- [হাদিস শরিফ]({SITE}/patheyo/hadith/)",
        f"- [দোয়া]({SITE}/patheyo/dua/)",
        f"- [কিবলা কম্পাস]({SITE}/patheyo/qibla/)",
        f"- [ডিজিটাল তাসবিহ]({SITE}/patheyo/tasbih/)",
        f"- [আমলের রিপোর্ট]({SITE}/patheyo/amol-report/)",
        f"- [সাহায্য ও ইনস্টল গাইড]({SITE}/patheyo/help/)",
        f"- [যোগাযোগ]({SITE}/patheyo/contact/)",
        f"- [গোপনীয়তা নীতি]({SITE}/patheyo/privacy/)",
        "",
        "## মেশিন-পাঠযোগ্য তথ্য",
        "",
        f"- সর্বশেষ ভার্সন (JSON): {SITE}/patheyo/data/update.json",
        f"- সব রিলিজের তালিকা (JSON): {SITE}/patheyo/data/releases.json",
        "",
    ]
    return write_if_changed("llms.txt", "\n".join(L))


def readme(I):
    prev = "\n".join(f"| v{v} | {d} |" for v, d in I["prev"])
    new = "\n".join(f"- {h}" for h in (I["heads"] or I["points"])[:6])
    s = f"""# পাথেয় বাই গুঞ্জরণ (Patheyo by Gunjoron)

পাথেয় — চিরস্থায়ী সফরের পরম সঙ্গী। বিনামূল্যে বাংলা ইসলামিক অ্যান্ড্রয়েড অ্যাপ: নামাজের সময়সূচি ও আজান, তিন ক্যালেন্ডার, কুরআন শরিফ, হাদিস, দোয়া, আমলের রিপোর্ট, কিবলা কম্পাস, ডিজিটাল তাসবিহ ও হোম স্ক্রিন উইজেট।

**ওয়েবসাইট:** {SITE}/

<!-- এই অংশ প্রতিটি রিলিজের পর GitHub Action নিজে থেকে লেখে (.github/scripts/seo_sync.py) — হাতে বদলাবেন না -->
## সর্বশেষ ভার্সন: v{I['ver']}

| | |
|---|---|
| ভার্সন | **v{I['ver']}** |
| প্রকাশ | {I['date_bn']} ({I['date']}) |
| সাইজ | {I['size']} |
| প্ল্যাটফর্ম | Android (APK), বিনামূল্যে |
| ডাউনলোড | [{SITE}/#download]({SITE}/#download) |
""" + (f"\n### এই ভার্সনে নতুন\n\n{new}\n" if new else "") + (f"\n### আগের ভার্সন\n\n| ভার্সন | প্রকাশ |\n|---|---|\n{prev}\n" if prev else "")
    return write_if_changed("README.md", s)


def main():
    I = info()
    print(f"সর্বশেষ ভার্সন: v{I['ver']} ({I['date']}, {I['size']})")
    changed = False
    for p in HOMES:
        if os.path.exists(os.path.join(ROOT, p)):
            changed |= update_home(p, I)
    for p in SITEMAPS:
        changed |= update_sitemap(p, I)
    changed |= llms(I)
    changed |= readme(I)
    print("কিছু বদলায়নি — সব আগে থেকেই হালনাগাদ" if not changed else "সব জায়গায় সর্বশেষ ভার্সন বসানো হলো")
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\nversion={I['ver']}\n")


if __name__ == "__main__":
    main()
