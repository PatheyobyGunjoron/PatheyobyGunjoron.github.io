# পাথেয় | Patheyo — ওয়েবসাইট + অ্যাডমিন (GitHub Pages + Supabase)

> **ডিজাইন v4:** আসল সূর্যের মতো ঝাপসা আলো (উদয়ে বাঁ দিকের নিচে, অস্তে ডান দিকের নিচে), আকাশজুড়ে উড়ে চলা মেঘ, দর্শকের এলাকার আসল আবহাওয়া (মেঘলা/বৃষ্টি/বজ্রপাত/কুয়াশা) — **Open-Meteo** থেকে (সম্পূর্ণ ফ্রী, কোনো key লাগে না)। এলাকা নিজে থেকে বোঝা হয়: আগে অনুমতি দেওয়া থাকলে ফোনের লোকেশন, নইলে ইন্টারনেট সংযোগের আনুমানিক শহর (geojs.io); কোনো অনুমতি চাওয়া হয় না, ব্যবহারকারী শহর বদলাতেও পারেন। অ্যাপের হিরোর মসজিদ দিগন্তে, আগের নিজে-চলা স্ক্রিনশট-স্লাইডার ও "উপরে যান" বাটন ফেরত।
>
> **ডিজাইন v3:** পুরো সাইট কাচের (glass) ডিজাইনে; হিরোর আকাশ সূর্যের আসল উচ্চতা ও দিক থেকে প্রতি মুহূর্তে হিসাব হয় (সূর্যের আজকের পথ, চাঁদের আসল কলা ও অবস্থানসহ); হেডারে অ্যাপের মতো "পাথেয় বাই গুঞ্জরণ"; মোবাইলে অ্যাপের মতো নিচের ডক-মেনু; স্ক্রিনশট অ্যাপ v272-এর নতুন ডিজাইন থেকে তোলা (WebP)।
>
> **ডিজাইন v2 (নভেম্বর ২০২৬):** পুরো সাইট নতুন করে সাজানো। নতুন: ওয়াক্ত অনুযায়ী বদলানো হিরোর আকাশ ও "আজকের নামাজের সময়", ফিচার এক্সপ্লোরার (প্রতিটি ফিচারের পাশে অ্যাপের স্ক্রিনশট), লাইটবক্সসহ স্ক্রিনশট গ্যালারি, কম্পিউটারে QR কোড, **যোগাযোগ/মতামত/সমস্যা জানানোর পেজ** (বার্তা অ্যাডমিন প্যানেলের "বার্তা" ট্যাবে আসে, আপনার উত্তর ব্যবহারকারী একই পেজে দেখেন), সাহায্য পেজ, আইনি পেজ (গোপনীয়তা নীতি, শর্তাবলি, ডেটা মুছে ফেলা ইত্যাদি — অ্যাপের লেখা হুবহু) ও ৪০৪ পেজ।
>
> **একবারের কাজ:** Supabase → SQL Editor-এ `supabase/messages.sql` পুরোটা Run করুন। এটুকু না করলে যোগাযোগ ফর্ম বার্তা জমা দিতে পারবে না (তখন ব্যবহারকারীকে লেখা কপি করে ফেসবুকে পাঠানোর বিকল্প দেখায়)।

## পেজের ঠিকানা
| পেজ | ঠিকানা |
|---|---|
| হোম | `/` (রুটের `index.html` = `patheyo/index.html`-এর কপি) |
| যোগাযোগ, মতামত, সমস্যা | `/patheyo/contact/` — `?type=message|feedback|bug|feature|content|deletion` দিলে সেই ধরন আগে থেকে বাছা থাকে |
| সাহায্য ও সমাধান | `/patheyo/help/` |
| আমাদের সম্পর্কে, গোপনীয়তা নীতি, শর্তাবলি, কপিরাইট, দায়মুক্তি, ডেটা মুছে ফেলা, লাইসেন্স | `/patheyo/about/`, `/privacy/`, `/terms/`, `/copyright/`, `/disclaimer/`, `/delete-account/`, `/licenses/` |
| অ্যাডমিন | `/patheyo/admin/` |

Google Play-তে দিতে চাইলে: Privacy Policy URL = `https://patheyobygunjoron.github.io/patheyo/privacy/`, Data deletion URL = `https://patheyobygunjoron.github.io/patheyo/delete-account/`।

## অ্যাপ থেকে যোগাযোগ পেজ খোলা
```
https://patheyobygunjoron.github.io/patheyo/contact/?from=app&app=3.0.0&device=SM-A155F&android=14&type=bug
```
`app`, `device`, `android` দিলে বার্তার সাথে সেগুলো নিজে থেকে যুক্ত হয় (অ্যাডমিনে দেখা যায়)। অ্যাপ **Patheyo_v273**-এ এটি যুক্ত করা আছে: অ্যাপের "যোগাযোগ ও সহায়তা" পপআপে "বার্তা পাঠান / মতামত দিন / সমস্যা জানান" বাটন আসে, যা ঠিক এই লিংক খোলে।

## কনফিগ (`config.js`)
- `SOCIAL` — ফেসবুক/ইনস্টাগ্রাম/ইউটিউব; খালি রাখলে সেই আইকন লুকানো থাকে
- `CONTACT_EMAIL` — দিলে যোগাযোগ পেজে ইমেইলও দেখায়
- `HERO_SHOTS` — হিরোর তিন ফোনে কোন নম্বরের স্ক্রিনশট; `SHOT_CAPTIONS` — গ্যালারির ক্যাপশন
- `HIJRI_ADJUST` — হোমের হিজরি তারিখ অ্যাপের সাথে মেলাতে ±১

## ফিচার তালিকা
`data/features.json` — প্রতিটি অংশে `title`, `desc` (এক লাইনের পরিচিতি), `svg` (আইকন `ic0`–`ic14`), `shot`/`shots` (পাশের ফোনে কোন স্ক্রিনশট), `items`। নতুন ফিচার যোগ করতে শুধু এই ফাইল এডিট করুন।

---


> **ভার্সন ১৮:** অ্যাপ ↔ ওয়েবসাইট ↔ অ্যাডমিন প্যানেলের পূর্ণ সংযোগের (ইউজার/ভার্সন গণনা, নোটিফিকেশন পাঠানো, রিলিজে অটো আপডেট-নোটিফিকেশন) ধাপে ধাপে নির্দেশিকা: **`SETUP-BANGLA.md`** (আগে এটা পড়ুন)।

## ফাইল কোথায় কী
- `index.html`, `assets/`, `data/features.json` — পাবলিক সাইট (ফিচার তালিকা `data/features.json` থেকে হুবহু আসে)
- `admin/index.html` — অ্যাডমিন প্যানেল (`/admin/`)
- `supabase/schema.sql` — ডাটাবেস, RLS, ট্র্যাকিং ফাংশন
- `config.js` — শুধু Supabase URL ও **anon** key (service_role key কখনো নয়)

## সেটআপ (ধাপে ধাপে)
1. supabase.com এ প্রজেক্ট খুলুন → **SQL Editor** এ `supabase/schema.sql` পুরোটা Run করুন।
2. **Authentication → Users → Add user** দিয়ে নিজের ইমেইল/পাসওয়ার্ড দিয়ে অ্যাডমিন বানান। Sign-ups বন্ধ রাখুন (Auth → Providers → Email → "Allow new users to sign up" off)।
3. SQL Editor এ চালান: `insert into admins(user_id) values('<আপনার-user-uuid>');`
4. **Project Settings → API** থেকে URL ও `anon` key কপি করে `config.js` এ বসান; `SITE_URL` ও `index.html` এর canonical/og লিংক আপডেট করুন।
5. GitHub এ নতুন repo বানিয়ে এই ফোল্ডারের সব ফাইল আপলোড করুন → **Settings → Pages → Deploy from branch → main / root**। বিল্ড লাগে না।
6. কাস্টম ডোমেইন: Pages → Custom domain এ ডোমেইন দিন, DNS এ `CNAME` (সাবডোমেইন) বা GitHub এর `A` রেকর্ড দিন, তারপর Enforce HTTPS।
7. Supabase → Auth → URL Configuration এ আপনার সাইট URL যোগ করুন।

## নতুন ভার্সন প্রকাশ
GitHub → Releases এ APK আপলোড করুন → লিংক কপি। `/admin/` এ লগইন → New release → ভার্সন, তারিখ, সাইজ, https লিংক, নোট দিন → Status **published**, Latest **Yes** → Save। আগের ভার্সন স্বয়ংক্রিয়ভাবে "পুরোনো ভার্সন" এ চলে যায় (ট্রিগার)। পুরোনো ভার্সন যোগ: একই ফর্মে Latest **No** রেখে published করুন। চেঞ্জলগ: Edit চেপে নোট বদলান (প্রতি লাইনে একটি আইটেম)।

## পরিসংখ্যান যেভাবে কাজ করে
- **ডাউনলোড:** ডাউনলোড বাটনে ক্লিক করলে `track_download(version)` চলে ও গণনা হয়।
- **আপডেট:** অ্যাপ `app_heartbeat` পাঠায়; একই installation এর ভার্সন আগের থেকে বদলালে একটি `update` ইভেন্ট তৈরি হয়।
- **সক্রিয় ব্যবহারকারী:** গত ১৫ মিনিটে heartbeat পাঠানো ইনস্টলেশন। শুধু বেনামী ইনস্টলেশন আইডি, ভার্সন ও সময় রাখা হয়; কোনো ব্যক্তিগত তথ্য নয়।

## অ্যাপ থেকে API কল (অ্যাপ v49 নিজেই করে; প্রতি ~৫ মিনিটে ও অ্যাপ খোলার সময়)
```
POST {SUPABASE_URL}/rest/v1/rpc/app_heartbeat
Headers: apikey: <anon key>, Authorization: Bearer <anon key>, Content-Type: application/json
Body: {"p_installation":"<random UUID>","p_version":"1.6.0","p_version_code":6,"p_device":"samsung SM-A155F","p_android":"14","p_source":"open"}
```
সর্বশেষ ভার্সন জানতে: `GET {SUPABASE_URL}/rest/v1/releases?status=eq.published&is_latest=eq.true&select=version,download_url` (একই হেডার)।

## রক্ষণাবেক্ষণ
- সিক্রেট কোডে রাখবেন না; `anon` key ছাড়া কিছু ক্লায়েন্টে নেই। সব লেখার অনুমতি RLS + `is_admin()` দিয়ে সুরক্ষিত।
- স্ক্রিনশট: `screenshots/` ফোল্ডারে (নিয়ম `screenshots/README.txt`-এ)।
- ফিচার বদলাতে `data/features.json` এডিট করুন।

## রুটে বসানোর নিয়ম (GitHub Pages)
জিপ খুলে ভেতরের সব কিছু রিপোর রুটে রাখুন: `index.html`, `robots.txt`, `sitemap.xml`, `.github/` এবং `patheyo/` ফোল্ডার।
- রুটের `index.html` হলো `patheyo/index.html`-এর পূর্ণ কপি (পাথ ঠিক করা), যাতে Google সরাসরি আসল পেজ দেখে। এটি আমি তৈরি করে দিই, নিজে এডিট করবেন না।
- `robots.txt` ও `sitemap.xml` অবশ্যই রুটে থাকতে হবে (ফোল্ডারের ভেতরে নয়)।
- আগে রুটে থাকা পুরোনো `index.html`, `assets/`, `config.js` ইত্যাদি মুছে দিন।

## ডাউনলোড ১০০% নির্ভরযোগ্য রাখতে (GitHub Action)
`.github/workflows/releases-json.yml` নতুন রিলিজ দিলে নিজে থেকে `patheyo/data/releases.json` বানায়। এতে সাইট GitHub API-র রেট-লিমিটের ওপর নির্ভর করে না।
একবার রিপোতে Actions ট্যাব → "Update releases.json" → Run workflow চালিয়ে নিন।

## SEO পরবর্তী ধাপ
Google Search Console-এ সাইট যোগ করুন (URL prefix: https://patheyobygunjoron.github.io/), `sitemap.xml` জমা দিন এবং "URL পরিদর্শন → ইনডেক্সের অনুরোধ" দিন।

## ফোল্ডার
- `fonts/` — ব্র্যান্ড ফন্ট Noto Serif by Gunjoron (Light–ExtraBold, সাবসেট woff2): সব বাংলা লেখা ও বাংলা/ইংরেজি সংখ্যা এই ফন্টে; ইংরেজি অক্ষর Plus Jakarta Sans
- `screenshots/` — `Dark-1`…`Dark-30` ও `Light-1`…`Light-30` (একই নম্বর = একই স্ক্রিন)
- সোশ্যাল লিংক: `config.js` এর `SOCIAL`
- ফিচারের আইকন: `ic0`–`ic14`; `data/features.json` এ `"svg":"icN"` দিন

## "অ্যাপ আপডেট করুন" বাটন
- ইনস্টল না থাকলে বা পুরোনো ভার্সন থাকলে সর্বশেষ APK ডাউনলোড শুরু হয় (সাথে ইনস্টল/আপডেটের ধাপ দেখায়); সর্বশেষ ভার্সনে থাকলে সবুজ অভিনন্দন অ্যানিমেশন।
- ওয়েবসাইট ফোনের অ্যাপ-তালিকা পড়তে পারে না। তাই ইনস্টল করা ভার্সন জানা যায় দুইভাবে: (১) এই ফোন থেকে সাইটে ডাউনলোড করা সর্বশেষ ভার্সন, (২) অ্যাপ নিজে সাইট খুললে লিংকে ভার্সন পাঠালে: `https://আপনার-সাইট/?app=1.0.0#update` (এতে ডায়ালগ নিজে খুলে যায়)।
- অ্যাপে "আপডেট চেক" বাটন রেখে ওই লিংক খুললে ফলাফল একদম নিখুঁত হয়।

### অ্যাপের নিজের GitHub আপডেটার ব্যবহার করা (প্রস্তাবিত)
১) `config.js` এ `APP_PACKAGE` এ অ্যাপের package নাম বসান।
২) অ্যাপের `AndroidManifest.xml` এ MainActivity-তে যোগ করুন:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW"/>
  <category android:name="android.intent.category.DEFAULT"/>
  <category android:name="android.intent.category.BROWSABLE"/>
  <data android:scheme="patheyo" android:host="update"/>
</intent-filter>
```
৩) MainActivity-র `onCreate` ও `onNewIntent` এ: `intent?.data?.host == "update"` হলে অ্যাপের আগে থেকে থাকা আপডেট-চেক ফাংশন চালান।
এরপর সাইটের বাটন চাপলে: অ্যাপ ইনস্টল থাকলে অ্যাপ নিজেই খুলে নিজের আপডেটার চালাবে; না থাকলে APK ডাউনলোড হবে।

## অ্যানিমেশন নীতি
সব অ্যানিমেশন (লোডিং স্ক্রিন, ফোন ঘোরা, লোডিং বার, স্ক্রিনশট স্লাইড, ডাস্ট, সুইপ) পিসি/ফোনের "Reduce motion / অ্যানিমেশন বন্ধ" সেটিং নির্বিশেষে সবসময় চলে।
## কোড ফাইল
সাইট চলে `assets/app.min.js` ও `index.html`-এর ভেতরের CSS-এ। পড়ার মতো মূল কোড `assets/app.js` ও `assets/style.css`। এডিট করতে হলে আমাকে (Claude) বলুন, আমি আবার বিল্ড করে দেব।
