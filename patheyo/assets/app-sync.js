/* পাথেয় — অ্যাপের সাথে হুবহু একই তারিখ ও নামাজের সময় (অ্যাপের namaz/js/07, 08, 09, 10, 21 নম্বর ফাইলের যুক্তি এখানে আনা)
   ১) হিজরি তারিখ: aladhan-এর আজকের হিজরি তারিখ (ভিত্তি) → মাগরিবের পর +১ দিন → Firebase prayer_config-এর hijri_adjustment;
      Firebase-এ hijri_override চালু থাকলে সেই তারিখই (bn/en), পুরনো hijri_date-ও চলে। ইন্টারনেট না থাকলে অ্যাপের মতোই ট্যাবুলার হিসাব।
   ২) নামাজের সময়: পদ্ধতি অ্যাপের মতোই — "স্বয়ংক্রিয়": বাংলাদেশে ইসলামিক ফাউন্ডেশনের সূচি, বাইরে aladhan (করাচি, পদ্ধতি ১);
      মাযহাব ডিফল্ট হানাফি; মাগরিব/সূর্যাস্তে স্থায়ী +৩ মিনিট। ইন্টারনেট না থাকলে অ্যাপের একই অফলাইন ইঞ্জিন (shared/prayer-calc.js)। */
(function(W){'use strict';
const FB='https://hijri-tarikh-default-rtdb.firebaseio.com/prayer_config.json';
const BN_DIGITS=['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const hijriMonthsBN=["মুহাররম","সফর","রবিউল আউয়াল","রবিউস সানি","জমাদিউল উলা","জমাদিউস সানি","রজব","শাবান","রমজান","শাওয়াল","জিলকদ","জিলহজ"];
const MAGHRIB_FIXED_OFFSET_MIN=3;
const S={adj:0,override:null,direct:null,methodId:1,anchor:null,live:null,cfgAt:0,listeners:[]};
const ss=(k,v)=>{try{if(v===undefined)return JSON.parse(sessionStorage.getItem(k)||'null');sessionStorage.setItem(k,JSON.stringify(v))}catch{return null}};
function shiftTimeStr(hhmm,off){if(!hhmm||!off)return hhmm;const[h,m]=hhmm.split(':').map(Number);let t=h*60+m+off;t=((t%1440)+1440)%1440;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function toDateOnlyStr(d){return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function gregorianToJDN(y,m,d){const a=Math.floor((14-m)/12),y2=y+4800-a,m2=m+12*a-3;return d+Math.floor((153*m2+2)/5)+365*y2+Math.floor(y2/4)-Math.floor(y2/100)+Math.floor(y2/400)-32045}
function localGregorianToHijri(date,ignoreAdjustment){let l=gregorianToJDN(date.getFullYear(),date.getMonth()+1,date.getDate())-1948440+10632;if(!ignoreAdjustment)l+=S.adj;
  const n=Math.floor((l-1)/10631);l=l-10631*n+354;const j=Math.floor((10985-l)/5316)*Math.floor((50*l)/17719)+Math.floor(l/5670)*Math.floor((43*l)/15238);
  l=l-Math.floor((30-j)/15)*Math.floor((17719*j)/50)-Math.floor(j/16)*Math.floor((15238*j)/43)+29;const month=Math.floor((24*l)/709),day=l-Math.floor((709*month)/24),year=30*n+j-30;return{day,month:month-1,year,monthLength:null}}
function addHijriDays(a,n){if(n===0)return a;let{day,month,year}=a;const len=a.monthLength||30;day+=n;
  if(day>len){day-=len;month+=1;if(month>11){month=0;year+=1}}else if(day<1){month-=1;if(month<0){month=11;year-=1}day+=30}return{day,month,year,monthLength:a.monthLength}}
let MAGHRIB=null;   // আজকের মাগরিব "HH:MM" (অ্যাপের globalTimings.Maghrib-এর মতো)
function maghribPassed(now){if(!MAGHRIB)return false;const[h,m]=MAGHRIB.split(':').map(Number);return now>=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0)}
function disp(now,ignoreAdjustment,ignoreMaghrib){const mp=!ignoreMaghrib&&maghribPassed(now);
  if(S.anchor&&S.anchor.fetchedForDateStr===toDateOnlyStr(now)){let h=Object.assign({},S.anchor);if(mp)h=addHijriDays(h,1);if(!ignoreAdjustment&&S.adj!==0)h=addHijriDays(h,S.adj);return h}
  return localGregorianToHijri(mp?new Date(now.getTime()+864e5):now,ignoreAdjustment)}
function formatHijriDate(h){return `${h.day} ${hijriMonthsBN[h.month]} ${h.year}`}
const hijriMonthsEN = ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"];

// মাসের নাম (বাংলা/ইংরেজি, বানান-ভিন্নতাসহ) থেকে ০–১১ ইনডেক্স; চিনতে না পারলে -১
function hijriMonthIndexFromName(name) {
    const c = String(name || '').toLowerCase().replace(/[’'‘`ʼʿʾ\-_.,]/g, '').replace(/\s+/g, '');
    if (!c) return -1;
    if (/q[ai]d|kad|কদ|ক্বদ/.test(c)) return 10;
    if (/hij|haj|হজ/.test(c)) return 11;
    if (/muharr?am|moharr?am|মুহা?র+ম|মহর+ম/.test(c)) return 0;
    if (/safar|sofar|সফর|ছফর/.test(c)) return 1;
    if (/rabi|rabb?i|রবি/.test(c)) return /thani|thaani|sani|akhir|akher|আখ[িে]র|আখেরা|সানি|সানী|দ্বিতীয়|ii$|2$|২$/.test(c) ? 3 : 2;
    if (/jum?ad|jamad|জুমা|জামাদ|জমাদ/.test(c)) return /thani|thaani|sani|akhir|akher|আখ[িে]র|আখেরা|সানি|সানী|দ্বিতীয়|ii$|2$|২$/.test(c) ? 5 : 4;
    if (/rajab|রজব/.test(c)) return 6;
    if (/sha+ban|শা?বান/.test(c)) return 7;
    if (/ramad|ramz|ramaz|রমজান|রমযান|রামাদান/.test(c)) return 8;
    if (/shaw+al|শাওয়াল|শাউয়াল|শওয়াল/.test(c)) return 9;
    return -1;
}

function hijriToBnDigits(v) { return String(v).replace(/[0-9]/g, d => BN_DIGITS[d]); }
function hijriToEnDigits(v) { return String(v).replace(/[০-৯]/g, ch => String(BN_DIGITS.indexOf(ch))); }
function hijriParseFlag(v) {
    if (v === true || v === false) return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === 'true' || s === 'on' || s === 'yes' || s === '1') return true;
        if (s === 'false' || s === 'off' || s === 'no' || s === '0') return false;
    }
    return null;
}

// বছর দেওয়া না থাকলে অ্যাপের নিজস্ব হিসাব থেকে বছর নেওয়া (বছরের সীমানা মিলিয়ে)
function hijriDeriveYear(monthIdx, now) {
    try {
        const base = disp(now || new Date(), true, true);
        let year = base.year;
        if (monthIdx === 0 && base.month === 11) year += 1;
        else if (monthIdx === 11 && base.month === 0) year -= 1;
        return year;
    } catch (e) { return null; }
}

// Firebase prayer_config → { override, directDate } (সুইচ বন্ধ হলে দুটোই null = অটোমেটিক)
function hijriOverrideFromFirebaseConfig(cfg) {
    const flag = hijriParseFlag(cfg.hijri_override);
    const legacy = (cfg.hijri_date && String(cfg.hijri_date).trim() !== '') ? String(cfg.hijri_date).trim() : null;
    if (flag === false) return { override: null, directDate: null };
    if (flag === true) {
        const o = { on: true };
        let any = false;
        Object.keys(cfg).forEach(function (k) {
            const v = cfg[k];
            if (v && typeof v === 'object' && (v.day != null || v.month != null)) {
                o[k] = { day: v.day != null ? String(v.day) : '', month: v.month != null ? String(v.month) : '', year: v.year != null ? String(v.year) : '' };
                any = true;
            }
        });
        return { override: any ? o : null, directDate: null };
    }
    return { override: null, directDate: legacy };   // hijri_override না থাকলে: আগের একক hijri_date
}

// ভাষা-ভিত্তিক ওভাররাইড ({on, bn:{day,month,year}, en:{...}}) → দিন/মাস/বছর + প্রতিটা ভাষার লেখা
function resolveStructuredHijriOverride(o, now) {
    const keys = Object.keys(o).filter(k => k !== 'on' && o[k] && typeof o[k] === 'object');
    const order = ['bn', 'en'].concat(keys.filter(k => k !== 'bn' && k !== 'en'));
    const get = (k, f) => (o[k] && o[k][f] != null) ? String(o[k][f]).trim() : '';
    let dayStr = '', idx = -1, yearStr = '';
    order.forEach(function (k) {
        if (!dayStr) dayStr = get(k, 'day');
        if (idx < 0) idx = hijriMonthIndexFromName(get(k, 'month'));
        if (!yearStr) { const y = hijriToEnDigits(get(k, 'year')); if (/^\d{3,4}$/.test(y)) yearStr = y; }
    });
    const day = parseInt(hijriToEnDigits(dayStr).replace(/\D/g, ''), 10);
    if (!(day >= 1 && day <= 30)) return null;
    const anyMonthText = order.map(k => get(k, 'month')).find(Boolean) || '';
    if (idx < 0 && !anyMonthText) return null;
    const year = yearStr ? parseInt(yearStr, 10) : (idx >= 0 ? hijriDeriveYear(idx, now) : null);
    if (year === null) return null;
    const hasBn = t => /[\u0980-\u09FF]/.test(t);
    const monthFor = function (k) {                      // bn/en-এ মাসের নাম সবসময় অ্যাপের নির্ধারিত বানানে; চেনা না গেলে অ্যাডমিনের লেখাই
        const typed = get(k, 'month');
        if (k === 'bn') return idx >= 0 ? hijriMonthsBN[idx] : typed;
        if (k === 'en') return idx >= 0 ? hijriMonthsEN[idx] : typed;
        return typed || (idx >= 0 ? hijriMonthsEN[idx] : anyMonthText);
    };
    const dayFor = k => k === 'bn' ? hijriToBnDigits(day) : (k === 'en' ? String(day) : (get(k, 'day') || String(day)));
    const yearFor = k => k === 'bn' ? hijriToBnDigits(year) : String(year);
    const texts = {};
    ['bn', 'en'].concat(keys.filter(k => k !== 'bn' && k !== 'en')).forEach(function (k) {
        texts[k] = { day: dayFor(k), month: monthFor(k), year: yearFor(k) };
        texts[k].text = texts[k].day + ' ' + texts[k].month + ' ' + texts[k].year;
    });
    const lang = (window.__hijriLang && texts[window.__hijriLang]) ? window.__hijriLang : 'bn';
    return { day: day, monthIdx: idx, monthBn: texts.bn.month, monthEn: texts.en.month, year: year,
             text: texts[lang].text, langs: texts };
}

// আগের একক লেখা: "৩০ রবিউস সানি [১৪৪৮]" / "30 Rabi al-Thani"
function resolveLegacyHijriOverride(raw, now) {
    const parts = hijriToEnDigits(raw).trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length < 2 || !/^\d{1,2}$/.test(parts[0])) return null;
    const day = parseInt(parts[0], 10);
    if (!(day >= 1 && day <= 30)) return null;
    let year = null, monthParts = parts.slice(1);
    if (/^\d{3,4}$/.test(parts[parts.length - 1])) { year = parseInt(parts[parts.length - 1], 10); monthParts = parts.slice(1, -1); }
    const monthText = monthParts.join(' ');
    if (!monthText) return null;
    const idx = hijriMonthIndexFromName(monthText);
    if (year === null) year = hijriDeriveYear(idx, now);
    if (year === null) return null;
    const monthBn = idx >= 0 ? hijriMonthsBN[idx] : monthText;
    const monthEn = idx >= 0 ? hijriMonthsEN[idx] : monthText;
    const bn = { day: hijriToBnDigits(day), month: monthBn, year: hijriToBnDigits(year) };
    const en = { day: String(day), month: monthEn, year: String(year) };
    bn.text = bn.day + ' ' + bn.month + ' ' + bn.year; en.text = en.day + ' ' + en.month + ' ' + en.year;
    return { day: day, monthIdx: idx, monthBn: monthBn, monthEn: monthEn, year: year,
             text: (window.__hijriLang === 'en') ? en.text : bn.text, langs: { bn: bn, en: en } };
}

let _hijriOverrideCache = { key: null, val: null };
function resolveHijriOverride(now) {
    const o = S.override, raw = S.direct;
    if (!o && !raw) return null;
    const key = (o ? JSON.stringify(o) : '') + '|' + (raw || '') + '|' + (window.__hijriLang || '') + '|' + (now || new Date()).toDateString();
    if (_hijriOverrideCache.key === key) return _hijriOverrideCache.val;
    let val = o ? resolveStructuredHijriOverride(o, now) : null;
    if (!val && raw) val = resolveLegacyHijriOverride(raw, now);
    
    _hijriOverrideCache = { key: key, val: val };
    return val;
}

// চলতি হিজরি মাসের ইনডেক্স (০–১১): ওভাররাইড থাকলে সেটি, নইলে অ্যাপের হিসাব — রমজান-মোড ইত্যাদির জন্য
function getEffectiveHijriMonthIndex(now) {
    const ov = (S.override || S.direct) ? resolveHijriOverride(now) : null;
    return (ov && ov.monthIdx >= 0) ? ov.monthIdx : disp(now).month;
}

// অন্য/ইংরেজি ইন্টারফেসের জন্য: ওভাররাইডের দিন, মাস, বছর আলাদাভাবে (প্রতিটা ভাষায়); ওভাররাইড না থাকলে null
//   window.getHijriOverrideParts()        → { day, monthBn, monthEn, year, langs: { bn: {day, month, year, text}, en: {...} } }
//   window.getHijriOverrideParts(now,'en') → শুধু ওই ভাষার { day, month, year, text }
S.parts = function (now, lang) {
    const ov = (S.override || S.direct) ? resolveHijriOverride(now || new Date()) : null;
    if (!ov) return null;
    if (lang) return ov.langs[lang] || ov.langs.bn || null;
    return { day: ov.day, monthBn: ov.monthBn, monthEn: ov.monthEn, year: ov.year, langs: ov.langs };
};


function finalHijri(now){if(S.override||S.direct){const ov=resolveHijriOverride(now);if(ov)return ov.text}return formatHijriDate(disp(now))}
function applyCfg(cfg){if(!cfg||typeof cfg!=='object')return;const a=cfg.hijri_adjustment;S.adj=(a!==undefined&&a!==null)?(parseInt(a,10)||0):0;
  const r=hijriOverrideFromFirebaseConfig(cfg);S.override=r.override;S.direct=r.directDate;_hijriOverrideCache={key:null,val:null}}
async function loadCfg(){const c=ss('pat_fbcfg');if(c&&Date.now()-c.t<10*60e3){applyCfg(c.d);return}
  try{const r=await fetch(FB,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json();applyCfg(d);ss('pat_fbcfg',{t:Date.now(),d})}catch{if(c)applyCfg(c.d)}}
// aladhan: আজকের হিজরি ভিত্তি তারিখ (সবসময়) + বাংলাদেশের বাইরে নামাজের সময়
async function loadAladhan(lat,lng,method,school){const now=new Date(),ds=`${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
  const key='pat_al_'+ds+'_'+(+lat).toFixed(3)+'_'+(+lng).toFixed(3)+'_'+method+'_'+school,c=ss(key);let d=c;
  if(!d){try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),12000);
    const r=await fetch(`https://api.aladhan.com/v1/timings/${ds}?latitude=${lat}&longitude=${lng}&method=${method===100?1:method}&school=${school}&adjustment=0`,{signal:ctl.signal});
    if(!r.ok)throw 0;const j=await r.json();d={timings:j.data.timings,hijri:j.data.date.hijri};ss(key,d)}catch{return false}}
  const hj=d.hijri;S.anchor={day:parseInt(hj.day,10),month:parseInt(hj.month.number,10)-1,year:parseInt(hj.year,10),monthLength:hj.month&&hj.month.days?parseInt(hj.month.days,10):null,fetchedForDateStr:toDateOnlyStr(now)};
  if(method!==100){const t=Object.assign({},d.timings);t.Maghrib=shiftTimeStr(t.Maghrib,MAGHRIB_FIXED_OFFSET_MIN);t.Sunset=shiftTimeStr(t.Sunset,MAGHRIB_FIXED_OFFSET_MIN);
    ['Fajr','Sunrise','Dhuhr','Asr','Sunset','Maghrib','Isha'].forEach(k=>{t[k]=String(t[k]).slice(0,5)});S.live={date:toDateOnlyStr(now),key:(+lat).toFixed(3)+','+(+lng).toFixed(3),t}}else S.live=null;
  return true}
W.PtSync={
  hijri:(now,maghrib)=>{MAGHRIB=maghrib;return finalHijri(now)},
  // অ্যাপের মতো আজকের সময়: অনলাইনে (বাংলাদেশের বাইরে) aladhan, নইলে অফলাইন ইঞ্জিন
  times:(d,lat,lng,method)=>{const L=S.live;if(L&&L.date===toDateOnlyStr(d)&&L.key===(+lat).toFixed(3)+','+(+lng).toFixed(3)&&method!==100)return Object.assign({},L.t);return null},
  load:async(lat,lng,method,school)=>{await Promise.all([loadCfg(),loadAladhan(lat,lng,method,school)])},
  state:S};
})(window);
