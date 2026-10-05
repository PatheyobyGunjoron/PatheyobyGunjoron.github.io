# পাথেয় | Patheyo — ল্যান্ডিং পেজ + অ্যাডমিন (GitHub Pages + Supabase)

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

## অ্যাপ থেকে API কল (প্রতি ~৫ মিনিটে ও অ্যাপ খোলার সময়)
```
POST {SUPABASE_URL}/rest/v1/rpc/app_heartbeat
Headers: apikey: <anon key>, Authorization: Bearer <anon key>, Content-Type: application/json
Body: {"p_installation":"<অ্যাপ প্রথম চালুর সময় বানানো random UUID>","p_version":"1.4.0"}
```
সর্বশেষ ভার্সন জানতে: `GET {SUPABASE_URL}/rest/v1/releases?status=eq.published&is_latest=eq.true&select=version,download_url` (একই হেডার)।

## রক্ষণাবেক্ষণ
- সিক্রেট কোডে রাখবেন না; `anon` key ছাড়া কিছু ক্লায়েন্টে নেই। সব লেখার অনুমতি RLS + `is_admin()` দিয়ে সুরক্ষিত।
- স্ক্রিনশট: `assets/shots/` এ ছবি রেখে `index.html` এর `.ph` এর ভেতরে `<img>` বসান।
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
- `fonts/` — Kothamala (Regular, Bold, Light), সব লেখা এই ফন্টে
- `screenshots/` — `1`–`8` নামে ছবি (PNG/JPG/JPEG/WEBP/GIF যেকোনোটা); ১–৩ হিরো, ৪–৮ নিচের স্ক্রিনশট সেকশন
- সোশ্যাল লিংক: `config.js` এর `SOCIAL`
- ফিচারের আইকন: `index.html` এর SVG স্প্রাইটে (`ic0`–`ic12`); নতুন ফিচারে `data/features.json` এ `"svg":"icN"` দিন

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
