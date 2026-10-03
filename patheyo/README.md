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
জিপ খুলে ভেতরের **দুটি জিনিসই** রিপোর রুটে রাখুন: `index.html` (ছোট লোডার) এবং `patheyo/` ফোল্ডার। GitHub Pages রুটে `index.html` ছাড়া কিছু দেখায় না, তাই এই ছোট ফাইলটি দরকার; এটি `patheyo/` এর সাইটকে মূল ঠিকানাতেই দেখায় (ঠিকানা বদলায় না) এবং কখনো এডিট করতে হয় না।
- আগে রুটে থাকা পুরোনো `index.html`, `assets/`, `config.js` ইত্যাদি মুছে দিন।
- `patheyo/` এর ভেতরের সব পাথ রিলেটিভ, তাই `…/patheyo/` ঠিকানাতেও সাইট চলে।

## ফোল্ডার
- `fonts/` — Kothamala (Regular, Bold, Light), সব লেখা এই ফন্টে
- `screenshots/` — `1`–`8` নামে ছবি (PNG/JPG/JPEG/WEBP/GIF যেকোনোটা); ১–৩ হিরো, ৪–৮ নিচের স্ক্রিনশট সেকশন
- সোশ্যাল লিংক: `config.js` এর `SOCIAL`
- ফিচারের আইকন: `index.html` এর SVG স্প্রাইটে (`ic0`–`ic12`); নতুন ফিচারে `data/features.json` এ `"svg":"icN"` দিন
