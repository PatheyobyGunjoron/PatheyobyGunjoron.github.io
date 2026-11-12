এই ফোল্ডারে সাইটের সব ফন্ট আছে — সাইট চালাতে ইন্টারনেট থেকে কোনো ফন্ট আনতে হয় না।

ব্র্যান্ড ফন্ট: Noto Serif by Gunjoron ("NotoSerifByGunjoron") — বাংলা লেখা, বাংলা সংখ্যা (০-৯) ও ইংরেজি সংখ্যা (0-9)। (© Gunjoron | গুঞ্জরণ, SIL OFL 1.1 — OFL-NotoSerifByGunjoron.txt)
- NotoSerifByGunjoron-Light / Regular / Medium / SemiBold / Bold / ExtraBold.woff2 → ওজন 300 / 400 / 500 / 600 / 700 / 800
- ফাইলে শুধু বাংলা, সংখ্যা ও কয়েকটি চিহ্ন রাখা (সাবসেট) — ছোট ফাইল। অ্যাপের মূল ফন্ট থেকে tools/fonts-এর মতো করে বানানো: pyftsubset ... --flavor=woff2
- মাপ অ্যাপের মতোই: ফন্ট ১০০০ UPM, তাই CSS-এ size-adjust:85.47% + ascent/descent override — লেআউট আগের মাপেই থাকে।
ইংরেজি অক্ষর: Plus Jakarta Sans (SIL OFL; লাইসেন্স ফাইল সাথে আছে) — PlusJakartaSans-300/500/700/800.woff2
