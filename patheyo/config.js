// শুধু পাবলিক তথ্য। service_role key কখনো এখানে দেবেন না।
window.PATHEYO={
  SITE_URL:"https://patheyobygunjoron.github.io",
  GITHUB_REPO:"PatheyobyGunjoron/PatheyobyGunjoron.github.io", // GitHub Releases থেকে ভার্সন ও ডাউনলোড সংখ্যা আসে
  APP_PACKAGE:"com.gunjoron.patheyo",   // অ্যাপের package নাম — "অ্যাপ আপডেট করুন" অ্যাপের নিজের আপডেটার খোলে
  APP_SCHEME:"patheyo", // অ্যাপের ডিপ-লিংক স্কিম (patheyo://update)
  SOCIAL:{facebook:"https://www.facebook.com/gonjoron",instagram:"",youtube:"https://www.youtube.com/@GunjoronStudio"}, // খালি রাখলে সেই আইকন দেখাবে না
  CONTACT_EMAIL:"", // ঐচ্ছিক: সাপোর্ট ইমেইল দিলে যোগাযোগ পেজে দেখাবে (যেমন "support@example.com")

  // স্ক্রিনশট: screenshots/ ফোল্ডারে Dark-1..30 ও Light-1..30 (PNG/JPG/JPEG/WEBP/GIF)
  SHOTS_DIR:"screenshots",
  HERO_SHOTS:[1,4,7],            // হিরোর তিনটি ফোনে কোন নম্বরের ছবি
  SHOT_CAPTIONS:{},              // গ্যালারির ক্যাপশন বদলাতে: {4:["কুরআন","সূরা ও পারার তালিকা"], 14:["নতুন স্ক্রিন","ছোট বিবরণ"]}

  // হোমের "আজকের নামাজের সময়" (অ্যাপের একই হিসাব): বাংলাদেশে ইসলামিক ফাউন্ডেশনের সময়সূচি, বাইরে করাচি পদ্ধতি
  HIJRI_ADJUST:0,                // চাঁদ দেখার ঘোষণা অনুযায়ী হিজরি তারিখ ±১ দিন সমন্বয় (অ্যাপের সাথে মেলাতে)

  SUPABASE_URL:"https://zullugdawmkajmzxwrwx.supabase.co",       // সক্রিয় ব্যবহারকারী, ডাউনলোড গণনা, যোগাযোগ বার্তা ও অ্যাডমিন প্যানেলের জন্য
  SUPABASE_ANON_KEY:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bGx1Z2Rhd21rYWptenh3cnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjIyOTQsImV4cCI6MjEwNjkzODI5NH0.CUrhF4YHcVuxgvvXeSbY2SExI2rbiTdHiIgynPIBZmc"
};
