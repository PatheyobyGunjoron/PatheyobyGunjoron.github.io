/* পাথেয় — হোম পেজ: ওয়াক্তের আকাশ ও আজকের সময়, হিরোর ফোন, ফিচার এক্সপ্লোরার, স্ক্রিনশট, রিলিজ/ডাউনলোড, আপডেট, মতামত */
(function(W,D){'use strict';
const{C,$,$$,esc,bn,SB_OK,H,rpc,snack}=W.PT;const root=D.documentElement;
const _s=D.currentScript||[...D.scripts].find(x=>/assets\/app(?:\.min)?\.js/.test(x.src));
const BASE=_s&&_s.src?new URL('../',_s.src).href:location.href.replace(/[^/]*$/,'');
const en=n=>Number(n).toLocaleString('en-US');
const waiting=()=>root.classList.contains('ld');           // স্প্ল্যাশ চলছে কি না
const dark=()=>root.dataset.theme==='dark',curTheme=()=>dark()?'Dark':'Light';
const REFRESH=[];new MutationObserver(()=>REFRESH.forEach(f=>f())).observe(root,{attributes:true,attributeFilter:['data-theme']});

/* ================= আজকের নামাজের সময় ও আকাশ ================= */
const CITIES=[['ঢাকা',23.8103,90.4125],['চট্টগ্রাম',22.3569,91.7832],['সিলেট',24.8949,91.8687],['রাজশাহী',24.3745,88.6042],['খুলনা',22.8456,89.5403],['বরিশাল',22.701,90.3535],['রংপুর',25.7439,89.2752],['ময়মনসিংহ',24.7471,90.4203],['কুমিল্লা',23.4607,91.1809]];
const WN={Fajr:'ফজর',Sunrise:'সূর্যোদয়',Dhuhr:'যোহর',Asr:'আসর',Maghrib:'মাগরিব',Isha:'এশা'};
const DAYS=['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
const GM=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const toM=s=>{const p=String(s||'').split(':');return p.length===2?(+p[0])*60+(+p[1]):NaN};
const h12=m=>{m=((m%1440)+1440)%1440;let h=Math.floor(m/60)%12||12;return bn(String(h).padStart(2,'0')+':'+String(m%60).padStart(2,'0'))};
const cd=sec=>{sec=Math.max(0,Math.round(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return bn((h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'))};
let LOC=null;
function loadLoc(){try{const j=JSON.parse(localStorage.getItem('pat_loc')||'null');if(j&&isFinite(j.lat)&&isFinite(j.lng))return j}catch{}const c=CITIES[0];return{name:c[0],lat:c[1],lng:c[2],i:0}}
function locSelect(){const sel=$('#loc');if(!sel)return;
  sel.innerHTML=CITIES.map((c,i)=>`<option value="${i}">${c[0]}</option>`).join('')+(LOC.i==='geo'?`<option value="geo">${esc(LOC.name)}</option>`:'')+'<option value="me">📍 আমার অবস্থান</option>';
  sel.value=String(LOC.i);
  sel.onchange=()=>{const v=sel.value;
    if(v==='me'){if(!navigator.geolocation){snack('এই ব্রাউজারে লোকেশন পাওয়া যায় না।');sel.value=String(LOC.i);return}
      sel.disabled=true;navigator.geolocation.getCurrentPosition(p=>{sel.disabled=false;
        LOC={name:`আমার অবস্থান (${bn(p.coords.latitude.toFixed(2))}°, ${bn(p.coords.longitude.toFixed(2))}°)`,lat:p.coords.latitude,lng:p.coords.longitude,i:'geo'};save()},
        ()=>{sel.disabled=false;sel.value=String(LOC.i);snack('লোকেশন পাওয়া যায়নি। তালিকা থেকে শহর বেছে নিন।')},{timeout:12000,maximumAge:3600e3});return}
    if(v==='geo')return;const c=CITIES[+v];LOC={name:c[0],lat:c[1],lng:c[2],i:+v};save()};
  function save(){try{localStorage.setItem('pat_loc',JSON.stringify(LOC))}catch{}locSelect();tick(true)}}
let TT=null,TDAY='',lastWaqt='';
function times(d){const P=W.PtPrayer;if(!P)return null;
  const m=P.effectiveMethod(C.PRAYER_METHOD||'0',C.PRAYER_METHOD_DEFAULT||'1',LOC.lat,LOC.lng);
  return P.times(d,{lat:LOC.lat,lng:LOC.lng,method:m,school:'1'})}
function state(now,T){
  const t=now.getHours()*60+now.getMinutes()+now.getSeconds()/60,F=toM(T.Fajr),SR=toM(T.Sunrise),Dh=toM(T.Dhuhr),A=toM(T.Asr),M=toM(T.Maghrib),I=toM(T.Isha);
  const nextDay=times(new Date(now.getTime()+864e5)),F2=toM(nextDay&&nextDay.Fajr)+1440;
  let w,ends,sky,forbid=null,next,nextAt;
  if(t<F){w='Isha';ends=F;sky='isha';next='Fajr';nextAt=F}
  else if(t<SR){w='Fajr';ends=SR;sky='fajr';next='Dhuhr';nextAt=Dh}
  else if(t<SR+15){w=null;forbid='সূর্যোদয়';ends=SR+15;sky='sunrise';next='Dhuhr';nextAt=Dh}
  else if(t<Dh-12){w=null;ends=Dh-12;sky=t<SR+60?'sunrise':'duha';next='Dhuhr';nextAt=Dh}
  else if(t<Dh){w=null;forbid='দুপুর (জাওয়াল)';ends=Dh;sky='dhuhr';next='Dhuhr';nextAt=Dh}
  else if(t<A){w='Dhuhr';ends=A;sky='dhuhr';next='Asr';nextAt=A}
  else if(t<M-15){w='Asr';ends=M;sky=t<M-35?'asr':'maghrib';next='Maghrib';nextAt=M}
  else if(t<M){w='Asr';forbid='সূর্যাস্ত';ends=M;sky='maghrib';next='Maghrib';nextAt=M}
  else if(t<I){w='Maghrib';ends=I;sky=t<M+30?'maghrib':'isha';next='Isha';nextAt=I}
  else{w='Isha';ends=F2;sky='isha';next='Fajr';nextAt=F2}
  // সূর্য/চাঁদের অবস্থান
  let p,moon;if(t>=SR&&t<M){p=(t-SR)/(M-SR);moon=false}else{p=((t<M?t+1440:t)-M)/(F+1440-M);moon=true}
  p=Math.min(Math.max(p,0),1);
  return{w,ends,sky,forbid,next,nextAt,t,p,moon}}
function tick(force){
  const now=new Date(),key=now.toDateString()+LOC.lat+LOC.lng;
  if(force||key!==TDAY){TT=times(now);TDAY=key;renderWaqts()}
  if(!TT)return;const S=state(now,TT);
  // ঘড়ি
  const ck=$('#clock');if(ck){const h=now.getHours()%12||12;ck.innerHTML=`${String(h).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}<small>${now.getHours()<12?'AM':'PM'}</small>`}
  if(force||!tick._sk||Date.now()-tick._sk>15000){tick._sk=Date.now();SKY.update(now)}
  // সারি হাইলাইট
  const cur=S.w||'',key2=cur+'|'+S.next;if(key2!==lastWaqt){lastWaqt=key2;$$('#waqts li').forEach(li=>{li.classList.toggle('now',li.dataset.k===cur);li.classList.toggle('next',li.dataset.k===S.next&&li.dataset.k!==cur)});
    if(cur)$$('#waqts li.now').forEach(li=>li.setAttribute('aria-current','true'));$$('#waqts li:not(.now)').forEach(li=>li.removeAttribute('aria-current'))}
  const left=(S.ends-S.t)*60,nl=(S.nextAt-S.t)*60;let msg;
  if(S.forbid)msg=`<span class="forbid">নিষিদ্ধ সময় চলছে — ${S.forbid}</span> · শেষ হতে <span class="cd">${cd(left)}</span>`;
  else if(S.w)msg=`এখন <b>${WN[S.w]}</b>-এর ওয়াক্ত · শেষ হতে <span class="cd">${cd(left)}</span>`;
  else msg=`এখন চাশতের সময় · <b>যোহর</b> শুরু হতে <span class="cd">${cd(nl)}</span>`;
  if(S.w&&S.next&&S.next!==S.w)msg+=` <span style="color:var(--ink-3)">· পরবর্তী ${WN[S.next]} ${h12(S.nextAt)}</span>`;
  const wn=$('#wnow');if(wn)wn.innerHTML=msg;
  // তারিখ (মাগরিবের পর হিজরি তারিখ পরের দিনে যায়)
  if(force||!tick._d||tick._d!==now.getDate()+'-'+(S.t>=toM(TT.Maghrib))){tick._d=now.getDate()+'-'+(S.t>=toM(TT.Maghrib));
    const P=W.PtPrayer,hd=S.t>=toM(TT.Maghrib)?new Date(now.getTime()+864e5):now;
    const hj=P.hijri(hd,+C.HIJRI_ADJUST||0),bg=P.bangla(now);
    $('#dates').innerHTML=`<span>${DAYS[now.getDay()]}, ${bn(now.getDate())} ${GM[now.getMonth()]} ${bn(now.getFullYear())}</span>${hj?`<span>${bn(hj)} হিজরি</span>`:''}<span>${bn(bg)} বঙ্গাব্দ</span>`}}
function renderWaqts(){const ol=$('#waqts');if(!ol||!TT)return;lastWaqt='';
  ol.innerHTML=['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'].map(k=>`<li data-k="${k}" class="${k==='Sunrise'?'sr':''}"><span class="wn">${WN[k]}</span><span class="wt">${h12(toM(TT[k]))}</span></li>`).join('')}
function prayerInit(){if(!W.PtPrayer||!$('#tcard'))return;LOC=loadLoc();locSelect();tick(true);setInterval(()=>{if(!D.hidden)tick()},1000);D.addEventListener('visibilitychange',()=>{if(!D.hidden)tick(true)})}


/* ================= আসল সূর্য ও চাঁদ =================
   সূর্য ও চাঁদের উচ্চতা (altitude) আর দিক (azimuth) এই মুহূর্তে, নির্বাচিত এলাকা থেকে হিসাব করা হয়।
   আকাশের রং সূর্যের উচ্চতা থেকে, সূর্য/চাঁদের জায়গা তাদের আসল দিক ও উচ্চতা থেকে, আর দিগন্তের আভা সূর্য যেদিকে সেদিকে। */
const SKY=(function(){
  const R=Math.PI/180,jd=d=>d.getTime()/864e5+2440587.5,mod=(a,m)=>((a%m)+m)%m;
  function sunEq(d){const n=jd(d)-2451545,L=mod(280.46+.9856474*n,360),g=mod(357.528+.9856003*n,360)*R,lam=(L+1.915*Math.sin(g)+.02*Math.sin(2*g))*R,e=(23.439-4e-7*n)*R;
    return{ra:Math.atan2(Math.cos(e)*Math.sin(lam),Math.cos(lam)),dec:Math.asin(Math.sin(e)*Math.sin(lam)),lon:lam}}
  function moonEq(d){const n=jd(d)-2451545,L=(218.316+13.176396*n)*R,M=(134.963+13.064993*n)*R,F=(93.272+13.22935*n)*R,l=L+6.289*R*Math.sin(M),b=5.128*R*Math.sin(F),e=23.4397*R;
    return{ra:Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l)),dec:Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l)),lon:l,lat:b}}
  function altaz(q,d,lat,lng){const n=jd(d)-2451545,lst=(mod(280.46061837+360.98564736629*n,360)+lng)*R,H=lst-q.ra,p=lat*R;
    const alt=Math.asin(Math.sin(p)*Math.sin(q.dec)+Math.cos(p)*Math.cos(q.dec)*Math.cos(H));
    const az=Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(p)-Math.tan(q.dec)*Math.cos(p));return{alt:alt/R,az:mod(az/R+180,360)}}
  // আকাশের রং: সূর্যের উচ্চতা (ডিগ্রি) → উপর/মাঝ/নিচের রং ও দিগন্তের আভা
  const ST=[[-90,'#020817','#071634','#0f2856',[0,0,0,0]],[-14,'#030c22','#0c1f49','#1d3a72',[70,80,170,.18]],[-8,'#0f1a45','#2f3a78','#7d5f95',[255,130,120,.32]],
    [-3,'#1e2c66','#5d5491','#e08f86',[255,150,110,.55]],[0,'#2c4a90','#9a7aa3','#ffb98a',[255,175,115,.7]],[4,'#4a84cc','#a7c5e6','#ffd7ab',[255,205,150,.55]],
    [10,'#3e88da','#94c6f0','#ecf2ff',[255,236,200,.35]],[25,'#2f7fe0','#7fbdf3','#dceeff',[255,250,235,.22]],[90,'#2470d8','#6eb2f2','#cfe7ff',[255,255,255,.18]]];
  const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const rgb=c=>`rgb(${c.map(v=>Math.round(v)).join(',')})`,rgba=c=>`rgba(${c.slice(0,3).map(v=>Math.round(v)).join(',')},${c[3].toFixed(3)})`;
  function palette(alt){let i=0;while(i<ST.length-2&&alt>ST[i+1][0])i++;const A=ST[i],B=ST[i+1],t=Math.min(Math.max((alt-A[0])/(B[0]-A[0]),0),1),e=t*t*(3-2*t);
    return{s1:mix(hx(A[1]),hx(B[1]),e),s2:mix(hx(A[2]),hx(B[2]),e),s3:mix(hx(A[3]),hx(B[3]),e),g:mix(A[4],B[4],e)}}
  const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
  // দিক → পর্দার x (পূর্ব বাঁয়ে, পশ্চিম ডানে), উচ্চতা → y
  const HZ=72,xOf=az=>Math.min(Math.max(6+(az-60)/240*88,4),96);
  const yOf=(alt,top)=>alt>=0?HZ-Math.min(alt/top,1)*(HZ-9):HZ+Math.min(-alt,12)*1.2;
  const DIR=['উত্তর','উত্তর-পূর্ব','পূর্ব','দক্ষিণ-পূর্ব','দক্ষিণ','দক্ষিণ-পশ্চিম','পশ্চিম','উত্তর-পশ্চিম'],dir=az=>DIR[Math.round(az/45)%8];
  let pathKey='';
  function sunPath(d,lat,lng,top){const key=d.toDateString()+lat.toFixed(2)+lng.toFixed(2);if(key===pathKey)return;pathKey=key;
    const d0=new Date(d);d0.setHours(0,0,0,0);let pts=[];
    for(let m=0;m<=1440;m+=8){const t=new Date(d0.getTime()+m*6e4),p=altaz(sunEq(t),t,lat,lng);if(p.alt>-1)pts.push([xOf(p.az)*10,yOf(p.alt,top)*10])}
    const el=$('#sp-arc');if(el)el.setAttribute('d',pts.length?'M'+pts.map(p=>p.map(v=>v.toFixed(1)).join(' ')).join(' L'):'')}
  function moonPath(k,waxing){const r=48,c=50,rx=Math.abs(1-2*k)*r,big=k>.5;
    // আলোকিত প্রান্ত (অর্ধবৃত্ত) + টার্মিনেটরের উপবৃত্ত
    if(waxing)return`M${c} ${c-r} A${r} ${r} 0 0 1 ${c} ${c+r} A${rx} ${r} 0 0 ${big?1:0} ${c} ${c-r}Z`;
    return`M${c} ${c-r} A${r} ${r} 0 0 0 ${c} ${c+r} A${rx} ${r} 0 0 ${big?0:1} ${c} ${c-r}Z`}
  function update(now){const sky=$('#sky');if(!sky||!LOC)return;const lat=+LOC.lat,lng=+LOC.lng;
    const se=sunEq(now),sp=altaz(se,now,lat,lng),me=moonEq(now),mp=altaz(me,now,lat,lng);
    const noon=90-Math.abs(lat-se.dec/R),top=Math.max(noon,20);
    const P=palette(sp.alt),st=sky.style;
    st.setProperty('--s1',rgb(P.s1));st.setProperty('--s2',rgb(P.s2));st.setProperty('--s3',rgb(P.s3));st.setProperty('--gc',rgba(P.g));st.setProperty('--gx',xOf(sp.az).toFixed(1)+'%');
    const light=lum(P.s2)>.36;st.setProperty('--sfg',light?'#08214a':'#ffffff');st.setProperty('--sfg2',light?'rgba(8,33,74,.74)':'rgba(255,255,255,.8)');
    st.setProperty('--star',Math.min(Math.max((-sp.alt-3)/9,0),1).toFixed(2));
    const h=$('#hdr');h&&h.style.setProperty('--sky-fg',light?'#08214a':'#ffffff');
    // সূর্য
    const sun=$('#sun');if(sun){sun.style.setProperty('--x',xOf(sp.az).toFixed(2)+'%');sun.style.setProperty('--y',yOf(sp.alt,top).toFixed(2)+'%');
      sun.style.setProperty('--o',Math.min(Math.max((sp.alt+3)/4,0),1).toFixed(2));
      const warm=Math.min(Math.max(1-sp.alt/14,0),1);sun.style.setProperty('--sc',rgb(mix([255,246,214],[255,170,96],warm)))}
    // চাঁদ: কলা (phase) ও অবস্থান
    const el=Math.acos(Math.cos(me.lat)*Math.cos(me.lon-se.lon)),k=(1-Math.cos(el))/2,waxing=mod(me.lon-se.lon,2*Math.PI)<Math.PI;
    const moon=$('#moon');if(moon){moon.style.setProperty('--x',xOf(mp.az).toFixed(2)+'%');moon.style.setProperty('--y',yOf(mp.alt,top).toFixed(2)+'%');
      const vis=Math.min(Math.max((mp.alt+2)/4,0),1)*(sp.alt>8?.55:1)*(k<.03?0:1);moon.style.setProperty('--o',vis.toFixed(2));
      const ml=$('#mlit');ml&&ml.setAttribute('d',moonPath(k,waxing))}
    sunPath(now,lat,lng,top);STARS.set&&STARS.set();
    // তথ্য-লাইন
    const si=$('#suninfo');if(si){const up=sp.alt>=-.83;
      const s1=up?`<span><i></i>সূর্য এখন <b>${dir(sp.az)}</b> আকাশে, <b>${bn(Math.round(sp.alt))}°</b> উচ্চতায়</span>`:`<span><i></i>সূর্য দিগন্তের <b>${bn(Math.round(-sp.alt))}°</b> নিচে (${dir(sp.az)})</span>`;
      const s2=(mp.alt>0&&k>=.03)?`<span><i class="m"></i>চাঁদ ${dir(mp.az)} আকাশে · <b>${bn(Math.round(k*100))}%</b> আলোকিত</span>`:'';
      si.innerHTML=s1+s2}}
  return{update}})();

/* ================= তারা ================= */
const STARS={};
(function(){const cv=$('#stars');if(!cv)return;let x;try{x=cv.getContext('2d')}catch{}if(!x)return;
  let w=0,h=0,S=[],on=true,lf=0;const R=Math.random;
  const size=()=>{const r=cv.getBoundingClientRect();w=r.width;h=r.height;if(!w||!h)return;const d=Math.min(devicePixelRatio||1,1.5);cv.width=Math.round(w*d);cv.height=Math.round(h*d);x.setTransform(d,0,0,d,0,0);
    S=Array.from({length:Math.round(Math.min(260,w*h/4200))},()=>({x:R()*w,y:R()*h*.82,r:R()<.08?1.4:.5+R()*.7,a:.35+R()*.65,f:.4+R()*1.6,ph:R()*6.28}))};
  const vis=()=>{const v=parseFloat(getComputedStyle($('#sky')).getPropertyValue('--star'))||0;return v>0};
  let show=true;STARS.set=()=>{show=vis()};
  const draw=now=>{x.clearRect(0,0,w,h);for(const s of S){const a=s.a*(.55+.45*Math.sin(now/1000*s.f+s.ph));x.fillStyle=`rgba(255,255,255,${a.toFixed(3)})`;x.beginPath();x.arc(s.x,s.y,s.r,0,6.2832);x.fill()}};
  const loop=now=>{if(on&&show&&!D.hidden&&now-lf>45){lf=now;draw(now)}requestAnimationFrame(loop)};
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(size,150)});
  if('IntersectionObserver' in W)new IntersectionObserver(e=>{on=e[0].isIntersecting}).observe(cv);
  size();STARS.set();requestAnimationFrame(loop)})();

/* ================= স্ক্রিনশট খোঁজা ================= */
// screenshots/ ফোল্ডারে Light-1, Light-2 … ও Dark-1, Dark-2 … (webp/png/jpg/jpeg/gif)। কোনো নম্বর না থাকলে শুধু সেটা বাদ যায়।
const EXT=['webp','png','jpg','jpeg','gif','WEBP','PNG','JPG','JPEG','GIF'],SHOT_MAX=+C.SHOTS_MAX||30,cache=new Map();
const probe=u=>new Promise(r=>{const m=new Image();m.onload=()=>r(u);m.onerror=()=>r(null);m.src=u});
function shotFor(th,n){const k=th+'-'+n;if(!cache.has(k))cache.set(k,(async()=>{const b=BASE+(C.SHOTS_DIR||'screenshots')+'/'+k;for(const e of EXT){const u=await probe(b+'.'+e);if(u)return u}return null})());return cache.get(k)}
const CAP=Object.assign({1:['হোম','লাইভ ঘড়ি, তিন তারিখ ও আজকের নামাজ'],2:['নামাজের সময়','পরের ওয়াক্ত, বাকি সময় ও নিষিদ্ধ সময়'],3:['কুরআন শরিফ','১১৪ সূরা, ৩০ পারা ও খতমের পরিকল্পনা'],4:['আসল মুসহাফ','হাফেজি কুরআনের পাতায় তিলাওয়াত'],5:['তরজমা','আরবি, উচ্চারণ ও বাংলা অর্থ একসাথে'],6:['হাদিস শরিফ','ছয় কিতাব, অফলাইনে পড়ার জন্য'],7:['হাদিস পাঠ','মূল আরবি ও বাংলা অনুবাদ'],8:['আমলের রিপোর্ট','দৈনিক হিসাব, ধারা ও কাজা'],9:['দোয়া','আরবি, উচ্চারণ, অর্থ ও উৎস'],10:['কিবলা কম্পাস','কিবলার কোণ ও কাবার দূরত্ব'],11:['ডিজিটাল তাসবিহ','নামাজের পরের তাসবিহ ও নিজের জিকির'],12:['সকল ফিচার','আজকের পাঠ ও সব ফিচার এক জায়গায়'],13:['সেটিংস','অ্যাকাউন্ট, প্রিমিয়াম, থিম ও রিমাইন্ডার']},C.SHOT_CAPTIONS||{});
const img=(u,n,lazy)=>`<img src="${esc(u)}" alt="পাথেয় অ্যাপ — ${esc((CAP[n]||['স্ক্রিনশট ' + bn(n)])[0])}" decoding="async"${lazy?' loading="lazy"':''} draggable="false">`;
const emptyScr=()=>`<div class="ph-empty"><img src="${BASE}assets/icon-192.png" alt=""><span>স্ক্রিনশট শীঘ্রই</span></div>`;
// এক থিমে ছবি না থাকলে অন্য থিমেরটা দেখায়
async function anyShot(n,th){return(await shotFor(th||curTheme(),n))||(await shotFor((th||curTheme())==='Dark'?'Light':'Dark',n))}

/* ================= হিরোর তিন ফোন ================= */
(function(){const ps=[...$$('.hp')];if(!ps.length)return;let gen=0;const NUMS=(C.HERO_SHOTS||[1,2,3]).slice(0,3);
  const fill=()=>{const g=++gen;ps.forEach((p,i)=>anyShot(NUMS[i]).then(u=>{if(g!==gen)return;const box=p.querySelector('.scr');if(u){box.innerHTML=img(u,NUMS[i]);p.style.visibility=''}else{box.innerHTML='';p.style.visibility='hidden'}}))};
  REFRESH.push(fill);fill();
  const P=['translate3d(0,0,0) rotate(0deg) scale(1)','translate3d(62%,-3%,0) rotate(6deg) scale(.84)','translate3d(-62%,-3%,0) rotate(-6deg) scale(.84)'];
  const Dm=1500,FL=.3,out=()=>matchMedia('(max-width:480px)').matches?96:108;
  const fly=(p,from,to)=>{if(!p.animate)return;let kf;
    if(from===1&&to===0){const O=`translate3d(${out()}%,-4%,0) rotate(8deg) scale(.88)`;kf=[{transform:P[1],zIndex:1,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:O,zIndex:1,offset:FL},{transform:O,zIndex:4,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[0],zIndex:4,offset:1}]}
    else if(from===0&&to===2){const M='translate3d(-14%,0,0) rotate(-2deg) scale(.95)';kf=[{transform:P[0],zIndex:3,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:M,zIndex:3,offset:FL},{transform:M,zIndex:2,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[2],zIndex:2,offset:1}]}
    else kf=[{transform:P[2],zIndex:1,offset:0,easing:'cubic-bezier(.55,0,.25,1)'},{transform:P[1],zIndex:1,offset:1}];
    try{p.animate(kf,{duration:Dm})}catch{}};
  let t=0;const set=()=>ps.forEach((p,i)=>{const to=((i-t)%3+3)%3,from=p.dataset.pos==null?to:+p.dataset.pos;p.dataset.pos=to;if(from!==to)fly(p,from,to)});set();
  const bar=$('#hbar'),CYC=3400,GRN=220;let acc=0,lt=performance.now(),mv=0,ps_='',ss_='';
  const setBar=(p,s='')=>{if(!bar)return;const v=p.toFixed(3);if(v!==ps_){bar.style.setProperty('--p',v);ps_=v}if(s!==ss_){if(s)bar.dataset.s=s;else delete bar.dataset.s;ss_=s}};
  const tk=()=>{const now=performance.now(),raw=now-lt;if(raw<4)return;lt=now;const dt=raw>600?16:raw;
    if(!D.hidden&&!waiting()){acc+=dt;if(acc>=CYC){acc-=CYC;mv=Dm;t++;set()}const w=CYC-mv-GRN,d=acc-mv;if(d<=0)setBar(0);else if(d>=w)setBar(1,'done');else setBar(d/w)}};
  requestAnimationFrame(function f(){tk();requestAnimationFrame(f)});setInterval(tk,250)})();

/* ================= ফিচার এক্সপ্লোরার ================= */
(function(){const box=$('#fx');if(!box)return;
  fetch(BASE+'data/features.json?v='+Math.floor(Date.now()/36e5)).then(r=>r.json()).then(list=>{
    const li=i=>`<li>${esc(i.t)}${i.sub&&i.sub.length?`<ul>${i.sub.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}</li>`;
    box.innerHTML=`<div class="fx-list" role="tablist" aria-label="ফিচারের অংশ" aria-orientation="vertical">${list.map((c,k)=>`<button role="tab" id="fxt${k}" aria-controls="fxp" aria-selected="${k===0}" tabindex="${k===0?0:-1}" data-k="${k}"><span class="gi" aria-hidden="true"><svg class="i"><use href="#i-${esc(c.svg||'ic'+Math.min(k,14))}"/></svg></span><span>${esc(c.title)}</span><span class="ct">${bn(c.items.length)}</span></button>`).join('')}</div>
      <div class="fx-phone"><div class="phone"><div class="scr" id="fxs"></div></div><div class="fx-dots" id="fxd"></div></div>
      <div class="fx-body" id="fxp" role="tabpanel" tabindex="0"></div>`;
    const tabs=[...box.querySelectorAll('[role=tab]')];let cur=0,si=0,timer=null,gen=0;
    const shots=c=>c.shots||(c.shot?[c.shot]:[]);
    const showShot=()=>{const c=list[cur],ss=shots(c),g=++gen,s=$('#fxs');
      $('#fxd').innerHTML=ss.length>1?ss.map((n,i)=>`<button type="button" aria-label="স্ক্রিনশট ${bn(i+1)}" aria-current="${i===si}" data-i="${i}"></button>`).join(''):'';
      if(!ss.length){s.innerHTML=emptyScr();return}
      anyShot(ss[si]).then(u=>{if(g!==gen)return;s.innerHTML=u?img(u,ss[si]):emptyScr();const im=s.querySelector('img');im&&im.classList.add('fx-anim')})};
    const pick=(k,focus)=>{cur=k;si=0;tabs.forEach((t,i)=>{t.setAttribute('aria-selected',i===k);t.tabIndex=i===k?0:-1});
      const c=list[k],p=$('#fxp');p.setAttribute('aria-labelledby','fxt'+k);
      p.innerHTML=`<div class="fx-anim"><h3>${esc(c.title)}</h3>${c.desc?`<p class="d">${esc(c.desc)}</p>`:''}<ul class="ticks">${c.items.map(li).join('')}</ul></div>`;
      showShot();if(focus)tabs[k].focus();
      const L=tabs[k].parentElement;if(L.scrollWidth>L.clientWidth+4)L.scrollTo({left:tabs[k].offsetLeft-(L.clientWidth-tabs[k].offsetWidth)/2,behavior:'smooth'})};
    box.querySelector('.fx-list').addEventListener('click',e=>{const b=e.target.closest('[role=tab]');if(b){pick(+b.dataset.k);restart()}});
    box.querySelector('.fx-list').addEventListener('keydown',e=>{const k={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(e.key==='Home'){e.preventDefault();pick(0,1)}else if(e.key==='End'){e.preventDefault();pick(list.length-1,1)}else if(k){e.preventDefault();pick((cur+k+list.length)%list.length,1)}});
    $('#fxd').addEventListener('click',e=>{const b=e.target.closest('button');if(b){si=+b.dataset.i;showShot();restart()}});
    // একাধিক স্ক্রিনশট থাকলে দেখার সময় নিজে বদলায়
    let vis=false;const restart=()=>{clearInterval(timer);timer=setInterval(()=>{if(!vis||D.hidden)return;const ss=shots(list[cur]);if(ss.length>1){si=(si+1)%ss.length;showShot()}},3800)};
    if('IntersectionObserver' in W)new IntersectionObserver(e=>{vis=e[0].isIntersecting}).observe(box);
    REFRESH.push(showShot);pick(0);restart();
  }).catch(()=>{box.innerHTML='<p class="gempty">ফিচার তালিকা লোড করা যায়নি। পেজটি রিফ্রেশ করুন।</p>'})})();

/* ================= স্ক্রিনশট গ্যালারি + লাইটবক্স ================= */
(function(){const trk=$('#gtrack');if(!trk)return;let th=null,items=[],gen=0,loaded=false;
  const segs=$$('#screenshots .seg button');
  const setSeg=()=>segs.forEach(b=>b.setAttribute('aria-pressed',b.dataset.th===(th||curTheme())));
  const load=()=>{const g=++gen,t=th||curTheme(),ks=[];for(let k=1;k<=SHOT_MAX;k++)ks.push(k);setSeg();
    Promise.all(ks.map(k=>shotFor(t,k).then(u=>u?[k,u]:null))).then(r=>{if(g!==gen)return;items=r.filter(Boolean);
      trk.innerHTML=items.length?items.map(([k,u],i)=>`<figure class="gitem" data-i="${i}"><div class="phone"><div class="scr">${img(u,k,true)}</div></div><figcaption>${esc((CAP[k]||['স্ক্রিনশট '+bn(k)])[0])}${CAP[k]&&CAP[k][1]?`<small>${esc(CAP[k][1])}</small>`:''}</figcaption></figure>`).join(''):`<p class="gempty">এই থিমের স্ক্রিনশট এখনো যোগ করা হয়নি।</p>`;
      trk.scrollLeft=0;navState()})};
  segs.forEach(b=>b.onclick=()=>{th=b.dataset.th;load()});
  REFRESH.push(()=>{if(loaded&&!th)load()});
  if('IntersectionObserver' in W)new IntersectionObserver((e,o)=>{if(e.some(z=>z.isIntersecting)){loaded=true;o.disconnect();load()}},{rootMargin:'800px 0px'}).observe(trk);else{loaded=true;load()}
  const step=()=>{const f=trk.querySelector('.gitem');return f?f.getBoundingClientRect().width+20:300};
  const pv=$('#screenshots .gnav .prev'),nx=$('#screenshots .gnav .next');
  const navState=()=>{if(!pv)return;pv.disabled=trk.scrollLeft<8;nx.disabled=trk.scrollLeft+trk.clientWidth>=trk.scrollWidth-8};
  pv&&(pv.onclick=()=>trk.scrollBy({left:-step()*2,behavior:'smooth'}));nx&&(nx.onclick=()=>trk.scrollBy({left:step()*2,behavior:'smooth'}));
  trk.addEventListener('scroll',()=>requestAnimationFrame(navState),{passive:true});addEventListener('resize',navState);
  // মাউসে টেনে স্ক্রল
  let dr=null;trk.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;dr={x:e.clientX,s:trk.scrollLeft,m:false}});
  addEventListener('pointermove',e=>{if(!dr)return;const dx=e.clientX-dr.x;if(Math.abs(dx)>5){dr.m=true;trk.style.scrollSnapType='none';trk.scrollLeft=dr.s-dx}});
  addEventListener('pointerup',()=>{if(dr&&dr.m){trk.style.scrollSnapType='';trk._drag=Date.now()}dr=null});
  trk.addEventListener('dragstart',e=>e.preventDefault());
  // লাইটবক্স
  let lb=null,li=0;const show=()=>{const[k,u]=items[li];lb.querySelector('img').src=u;lb.querySelector('img').alt=(CAP[k]||['স্ক্রিনশট'])[0];lb.querySelector('figcaption').textContent=`${(CAP[k]||['স্ক্রিনশট '+bn(k)])[0]} · ${bn(li+1)}/${bn(items.length)}`};
  const close=()=>{if(!lb)return;lb.remove();lb=null;root.classList.remove('um-open');last&&last.focus()};let last=null;
  const open=i=>{li=i;last=D.activeElement;lb=D.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','স্ক্রিনশট');
    lb.innerHTML=`<figure style="margin:0"><img alt=""><figcaption></figcaption></figure><button class="x" type="button" aria-label="বন্ধ করুন"><svg class="i"><use href="#i-x"/></svg></button><button class="l" type="button" aria-label="আগের"><svg class="i"><use href="#i-arrow"/></svg></button><button class="r" type="button" aria-label="পরের"><svg class="i"><use href="#i-arrow"/></svg></button>`;
    D.body.appendChild(lb);root.classList.add('um-open');show();lb.querySelector('.x').focus();
    lb.onclick=e=>{if(e.target.closest('.x')||e.target===lb)close();else if(e.target.closest('.l')){li=(li-1+items.length)%items.length;show()}else if(e.target.closest('.r')){li=(li+1)%items.length;show()}};
    let sx=null;lb.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});lb.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50){li=(li+(dx<0?1:-1)+items.length)%items.length;show()}sx=null})};
  addEventListener('keydown',e=>{if(!lb)return;if(e.key==='Escape')close();if(e.key==='ArrowRight'){li=(li+1)%items.length;show()}if(e.key==='ArrowLeft'){li=(li-1+items.length)%items.length;show()}});
  trk.addEventListener('click',e=>{if(trk._drag&&Date.now()-trk._drag<300)return;const f=e.target.closest('.gitem');if(f)open(+f.dataset.i)});
  trk.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();trk.scrollBy({left:step(),behavior:'smooth'})}if(e.key==='ArrowLeft'){e.preventDefault();trk.scrollBy({left:-step(),behavior:'smooth'})}})})();

/* ================= মোট ডাউনলোড ================= */
const DL={gh:0,sb:0};
const count=(el,v)=>{if(!el)return;v=Math.max(0,Math.round(+v||0));const t0=performance.now();(function f(t){const p=Math.min((t-t0)/900,1);el.textContent=en(Math.round(v*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(f)})(t0)};
const showDl=()=>count($('#sd'),Math.max(DL.gh,DL.sb));
async function stats(){if(!SB_OK)return;try{const s=await rpc('get_public_stats');const d=Array.isArray(s)?s[0]:s;DL.sb=+d.downloads||0;showDl()}catch{}}

/* ================= রিলিজ ================= */
// ১) data/releases.json (GitHub Action বানায়)  ২) GitHub API  ৩) এই ফোনে আগে সেভ করা কপি
const RELPAGE=`https://github.com/${C.GITHUB_REPO}/releases/latest`;
const mapRel=raw=>{const a=raw.filter(x=>!x.draft);DL.gh=a.reduce((n,x)=>n+(x.assets||[]).reduce((m,f)=>m+(f.download_count||0),0),0);showDl();
  return a.map((x,i)=>{const f=(x.assets||[]).find(f=>/\.apk$/i.test(f.name))||(x.assets||[])[0];return{version:String(x.tag_name).replace(/^v/i,''),release_date:x.published_at,download_url:f?f.browser_download_url:(x.html_url||RELPAGE),file_size:f?(f.size/1048576).toFixed(1)+' MB':null,is_latest:i===0&&!x.prerelease,body:x.body||''}})};
const getJson=async(u,ms)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t)}};
const gh=async()=>{let raw=null;
  try{const a=await getJson(BASE+'data/releases.json?v='+Math.floor(Date.now()/600000),6000);if(Array.isArray(a)&&a.length)raw=a}catch{}
  if(!raw){try{const a=await getJson(`https://api.github.com/repos/${C.GITHUB_REPO}/releases`,8000);if(Array.isArray(a)&&a.length)raw=a}catch{}}
  if(raw){try{localStorage.setItem('pat_rel',JSON.stringify(raw))}catch{}}else{try{raw=JSON.parse(localStorage.getItem('pat_rel')||'null')}catch{}}
  if(!raw)throw 0;return mapRel(raw)};
// রিলিজ নোট পড়ে কোনটা নতুন ফিচার আর কোনটা সমস্যা সমাধান তা আলাদা করা; ইমোজি দিয়ে শুরু লাইন = শিরোনাম
const FIXRE=/ফিক্স|সমাধান|সংশোধন|বাগ|ক্র্যাশ|ক্রাশ|ত্রুটি|ভুল|সমস্যা|ঠিক (?:করা|হয়েছে|হয়)|\b(?:fix(?:e[sd]|es)?|bugs?|crash(?:es)?|errors?|resolved?|patch(?:ed)?|hotfix|issues?)\b/i;
const FEATRE=/ফিচার|feature|নতুন|new\b|উন্নত|improve|added?\b|enhance/i;
let EMO;try{EMO=new RegExp('^(?:\\p{Extended_Pictographic}|[\\u{1F1E6}-\\u{1F1FF}])','u')}catch{EMO=/^[←-⯿\uD83C-\uD83E]/}
const clean=t=>t.replace(/\*\*|__|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\s+by\s+@\S+(\s+in\s+\S+)?\s*$/i,'').replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
function parseBody(body){const bl=[];let cur=null,sec=null,first=true;
  for(const raw of String(body||'').split(/\r?\n/)){const l=raw.trim();if(!l||/^[-*_=]{3,}$/.test(l)||/^\**full changelog/i.test(l))continue;
    const hm=/^#{1,6}\s+(.*)$/.exec(l);let t=clean(hm?hm[1]:l.replace(/^(?:[-*•+]|\d+[.)])\s+/,''));
    if(!t||/^what['’]?s changed:?$/i.test(t))continue;
    if(first&&/আপডেট নোট|release notes?/i.test(t)){first=false;continue}first=false;   // নোটের প্রধান শিরোনাম বাদ
    if(EMO.test(t)){cur={title:t,hint:FIXRE.test(t)?'fix':(FEATRE.test(t)?'feat':sec),items:[]};bl.push(cur);continue}
    if(hm){sec=FIXRE.test(t)?'fix':(FEATRE.test(t)?'feat':null);cur=null;continue}
    if(!cur){cur={title:null,hint:sec,items:[]};bl.push(cur)}cur.items.push(t)}
  return bl}
function noteData(r){const out={feat:[],fix:[]},add=(k,title,items)=>{if(title||items.length)out[k].push({title,items})};
  for(const b of parseBody(r.body)){
    if(b.hint){add(b.hint==='fix'?'fix':'feat',b.title,b.items);continue}
    if(b.title){const fx=b.items.length?b.items.every(x=>FIXRE.test(x)):FIXRE.test(b.title);add(fx?'fix':'feat',b.title,b.items);continue}
    add('feat',null,b.items.filter(x=>!FIXRE.test(x)));add('fix',null,b.items.filter(x=>FIXRE.test(x)))}
  return out}
const blk=b=>`${b.title?`<h5 class="nt">${esc(b.title)}</h5>`:''}${b.items.length?`<ul>${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}`;
const panel=(t,c,bs)=>bs.length?`<div class="np ${c}"><h4 class="nh">${t}</h4>${bs.map(blk).join('')}</div>`:'';
const notes=r=>{const d=noteData(r),h=panel('নতুন ও উন্নত','ft',d.feat)+panel('সমস্যা সমাধান','fz',d.fix);return h?`<div class="notes">${h}</div>`:''};
const date=d=>new Date(d).toLocaleDateString('bn-BD',{year:'numeric',month:'long',day:'numeric'});
let LATEST=null;
async function releases(){
  try{const rs=await gh(),l=rs.find(r=>r.is_latest)||rs[0];
    if(!l){$('#rv').textContent='শীঘ্রই আসছে';$('#old').innerHTML='<p class="gempty">এখনো কোনো ভার্সন প্রকাশ হয়নি</p>';return}
    LATEST=l;
    $('#rv').innerHTML=`<span>পাথেয়</span> v${esc(l.version)}`;
    $('#rmeta').innerHTML=`<span>প্রকাশ: ${date(l.release_date)}</span>${l.file_size?`<span>সাইজ: ${esc(bn(l.file_size))}</span>`:''}<span>অ্যান্ড্রয়েড</span>`;
    $$('.hv-ver').forEach(x=>x.textContent=`v${l.version}${l.file_size?' · '+l.file_size:''} · Android`);
    $$('.dlbtn').forEach(b=>{b.dataset.id=l.version;b.dataset.url=l.download_url});
    const n=notes(l);if(n){$('#latest-body').innerHTML=n;$('#clog').hidden=false;
      requestAnimationFrame(()=>{const cl=$('#clamp'),mb=$('#clmore');if(cl.scrollHeight>560){mb.hidden=false;mb.onclick=()=>{const o=cl.classList.toggle('open');mb.textContent=o?'সংক্ষেপে দেখুন':'পুরো নোট দেখুন';if(!o)$('#clog').scrollIntoView({block:'start'})}}else cl.classList.add('open')})}
    const o=rs.filter(r=>r!==l),LIM=5;
    $('#old').innerHTML=o.length?o.map((r,k)=>`<details class="orow"${k>=LIM?' hidden':''}><summary><span class="on"><b>Patheyo v${esc(r.version)}</b><small>Patheyo.v${esc(r.version)}.apk</small></span><time datetime="${esc(String(r.release_date).slice(0,10))}">${date(r.release_date)}</time>${r.file_size?`<span class="sz">${esc(bn(r.file_size))}</span>`:'<span class="sz"></span>'}<button class="dlo" type="button" data-id="${esc(r.version)}" data-url="${esc(r.download_url)}" aria-label="ডাউনলোড Patheyo v${esc(r.version)}"><svg class="i"><use href="#i-download"/></svg><span>ডাউনলোড</span></button></summary><div class="ob">${notes(r)||'<p class="gempty">এই ভার্সনের নোট নেই।</p>'}</div></details>`).join(''):'<p class="gempty">এখনো কোনো পুরোনো ভার্সন নেই</p>';
    const mb=$('#oldmore');if(o.length>LIM){mb.hidden=false;mb.textContent=`আরো দেখুন (${bn(o.length-LIM)})`;mb.onclick=()=>{$$('#old .orow[hidden]').forEach(x=>x.hidden=false);mb.hidden=true}}
    qr(l)
  }catch{$('#rv').textContent='তথ্য লোড হয়নি';$('#rmeta').innerHTML=`<a style="color:#fff" href="${RELPAGE}" target="_blank" rel="noopener">GitHub থেকে সরাসরি ডাউনলোড করুন</a>`;$('#old').innerHTML=''}}
// কম্পিউটার থেকে দেখলে QR কোড: ফোনে স্ক্যান করলেই ডাউনলোড
function qr(l){if(/Android|iPhone|iPad/i.test(navigator.userAgent)||!$('#qr'))return;
  const s=D.createElement('script');s.src=BASE+'assets/vendor/qrcode.min.js';s.onload=()=>{try{const q=W.qrcode(0,'M');q.addData(l.download_url);q.make();$('#qrc').innerHTML=q.createSvgTag({cellSize:3,margin:0,scalable:true});$('#qr').hidden=false}catch{}};D.head.appendChild(s)}

/* ================= ডাউনলোড (কখনো আটকে যাবে না) ================= */
$$('.dlbtn').forEach(b=>{b.dataset.url=b.dataset.url||RELPAGE});
const INAPP=/FBAN|FBAV|FB_IAB|Instagram|Messenger|\bLine\/|Snapchat|musical_ly|BytedanceWebview|TikTok|MicroMessenger|Twitter|LinkedInApp|Pinterest/i.test(navigator.userAgent);
const goUrl=u=>{const a=D.createElement('a');a.href=u;a.rel='noopener';a.setAttribute('download','');a.style.display='none';D.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500)};
function startDl(id,url,force){if(!url)url=RELPAGE;
  if(INAPP&&!force){snack('এই অ্যাপের ভেতরের ব্রাউজারে ডাউনলোড আটকে যেতে পারে। Chrome-এ খুলুন।',[
      {t:'Chrome-এ খুলুন',f:()=>{location.href='intent://'+location.host+location.pathname+'#Intent;scheme=https;package=com.android.chrome;end'}},
      {t:'লিংক কপি',f:()=>{const u=location.href.split('#')[0];(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>snack('লিংক কপি হয়েছে'),()=>prompt('লিংকটি কপি করুন',u))}},
      {t:'তবুও ডাউনলোড',f:()=>startDl(id,url,true)}],16000);return}
  try{if(SB_OK)fetch(C.SUPABASE_URL+'/rest/v1/rpc/track_download',{method:'POST',headers:H,body:JSON.stringify({p_version:id}),keepalive:true}).catch(()=>{})}catch{}
  if(id)try{localStorage.setItem('pat_inst',String(id))}catch{}
  goUrl(url);snack('ডাউনলোড শুরু হচ্ছে…',[{t:'শুরু না হলে এখানে চাপুন',href:url}],10000)}
D.addEventListener('click',e=>{const b=e.target.closest('[data-url]');if(!b)return;e.preventDefault();e.stopPropagation();startDl(b.dataset.id,b.dataset.url)});

/* ================= "অ্যাপ আপডেট করুন" ================= */
// ওয়েবসাইট ফোনের অ্যাপ-তালিকা পড়তে পারে না; তাই ইনস্টল করা ভার্সন জানা যায় (১) অ্যাপ নিজে ?app=1.0.0 পাঠালে, (২) এই ফোন থেকে আগে ডাউনলোড করা ভার্সন থেকে।
(function(){const um=$('#um'),card=$('#um-card');if(!um)return;
  const q=new URLSearchParams(location.search);try{if(q.get('app'))localStorage.setItem('pat_inst',q.get('app'))}catch{}
  const inst=()=>{try{return localStorage.getItem('pat_inst')}catch{return null}};
  const vcmp=(a,b)=>{const A=String(a).replace(/^v/i,'').split(/[.\-+]/).map(x=>parseInt(x)||0),B=String(b).replace(/^v/i,'').split(/[.\-+]/).map(x=>parseInt(x)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d>0?1:-1}return 0};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const IC={spin:'<svg class="um-spin" viewBox="0 0 48 48"><circle cx="24" cy="24" r="19"/></svg>',down:'<svg class="um-dn" viewBox="0 0 48 48"><path d="M24 8v24m0 0-9-9m9 9 9-9M10 41h28"/></svg>',info:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19"/><path d="M24 22v11M24 15.5v.5"/></svg>',ok:'<svg class="um-ok" viewBox="0 0 52 52"><circle class="o" cx="26" cy="26" r="23"/><path class="c" d="M15 27l8 8 14-17"/></svg>'};
  const confetti=()=>{const cols=['#2fb67d','#6fe3ae','#f4c542','#5cc8ff','#ff8aa0'];let o='<div class="um-cf">';for(let k=0;k<18;k++)o+=`<i style="--a:${Math.round(k*20+(k%2)*8)}deg;--d:${58+(k%3)*18}px;--c:${cols[k%cols.length]};--k:${k}"></i>`;return o+'</div>'};
  let openedBy=null,tmr;
  const render=o=>{card.className='um-card '+(o.tone||'');$('#um-ic').innerHTML=o.icon+(o.cf?confetti():'');$('#um-t').textContent=o.title;$('#um-d').textContent=o.desc||'';$('#um-v').innerHTML=o.ver||'';$('#um-s').innerHTML=(o.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    const a=$('#um-a');a.innerHTML='';(o.acts||[]).forEach(x=>{const b=D.createElement('button');b.type='button';b.className=x.cls;b.textContent=x.t;b.onclick=x.f;a.appendChild(b)})};
  const close=()=>{clearTimeout(tmr);um.hidden=true;root.classList.remove('um-open');openedBy&&openedBy.focus&&openedBy.focus()};
  um.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close()});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!um.hidden)close();if(e.key==='Tab'&&!um.hidden){const f=[...card.querySelectorAll('button')];if(!f.length)return;if(e.shiftKey&&D.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&D.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}}});
  const closeA={cls:'btn',t:'বন্ধ করুন',f:close},again=L=>({cls:'lk',t:'ডাউনলোড না হলে এখানে চাপুন',f:()=>startDl(L.version,L.download_url)});
  const chip=(a,b)=>`<span>v${esc(a)}</span><svg class="i"><use href="#i-arrow"/></svg><span class="n">v${esc(b)}</span>`;
  async function check(){render({icon:IC.spin,title:'যাচাই করা হচ্ছে…',desc:'আপনার ডিভাইসে পাথেয় অ্যাপ খোঁজা হচ্ছে'});
    await Promise.all([wait(1100),Promise.race([REL,wait(6000)])]);if(um.hidden)return;const L=LATEST;
    if(!L||!L.download_url){render({icon:IC.info,tone:'warn',title:'তথ্য পাওয়া যাচ্ছে না',desc:'এই মুহূর্তে রিলিজের তথ্য লোড করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।',acts:[closeA]});return}
    if(!/Android/i.test(navigator.userAgent)){render({icon:IC.info,title:'অ্যান্ড্রয়েড ফোনে খুলুন',desc:'পাথেয় একটি অ্যান্ড্রয়েড অ্যাপ। আপডেট বা ইনস্টল করতে ফোনে এই পেজটি খুলে আবার "অ্যাপ আপডেট করুন" চাপুন, অথবা ডাউনলোড অংশের QR কোড স্ক্যান করুন।',ver:`<span class="n">v${esc(L.version)}</span>`,acts:[{cls:'btn p',t:'APK ডাউনলোড করুন',f:()=>startDl(L.version,L.download_url)},closeA]});return}
    // অ্যাপ ইনস্টল থাকলে ডিপ-লিংকে অ্যাপের নিজের আপডেটার খোলে; না থাকলে Chrome browser_fallback_url দিয়ে APK নামায়
    const PK=C.APP_PACKAGE;let started=false;
    if(PK){render({icon:IC.spin,title:'অ্যাপ খোলা হচ্ছে…',desc:'আপনার ফোনের পাথেয় অ্যাপে আপডেট যাচাই হবে'});
      let hid=D.hidden;const vh=()=>{if(D.hidden)hid=true};D.addEventListener('visibilitychange',vh);
      location.href=`intent://update#Intent;scheme=${C.APP_SCHEME||'patheyo'};package=${PK};S.browser_fallback_url=${encodeURIComponent(L.download_url)};end`;
      await wait(2400);D.removeEventListener('visibilitychange',vh);if(hid||um.hidden){if(!um.hidden)close();return}started=true}
    const I=inst();
    if(I&&vcmp(I,L.version)>=0){render({icon:IC.ok,tone:'ok',cf:true,title:'আলহামদুলিল্লাহ! আপনার অ্যাপ আপ-টু-ডেট',desc:'আপনি পাথেয়-র সর্বশেষ ভার্সন ব্যবহার করছেন। নতুন আপডেট এলে অ্যাপেই জানতে পারবেন।',ver:`<span class="n">v${esc(L.version)}</span>`,acts:[{cls:'btn p',t:'ঠিক আছে',f:close},{cls:'lk',t:'তবুও আবার ডাউনলোড করুন',f:()=>startDl(L.version,L.download_url)}]});return}
    const up=!!I;
    render({icon:IC.down,title:up?'নতুন আপডেট পাওয়া গেছে':'পাথেয় ইনস্টল করুন',desc:up?`আপনার অ্যাপ v${I} থেকে সর্বশেষ ভার্সনে আপডেট হচ্ছে। ডাউনলোড শুরু হয়েছে।`:'আপনার ডিভাইসে অ্যাপটি পাওয়া যায়নি। সর্বশেষ ভার্সনের ডাউনলোড শুরু হয়েছে।',
      ver:up?chip(I,L.version):`<span class="n">v${esc(L.version)}</span>`,
      steps:[`ডাউনলোড শেষ হলে Patheyo v${L.version}.apk ফাইলটি খুলুন`,up?'"আপডেট" চাপুন — আগের অ্যাপের ওপরেই আপডেট হবে, কোনো তথ্য হারাবে না':'"ইনস্টল" চাপুন (প্রয়োজনে এই উৎস থেকে ইনস্টলের অনুমতি দিন)','শেষ হলে অ্যাপটি খুলুন'],acts:[again(L),closeA]});
    if(!started)tmr=setTimeout(()=>{if(!um.hidden)startDl(L.version,L.download_url)},900)}
  function open(by){openedBy=by;um.hidden=false;root.classList.add('um-open');card.focus();check()}
  D.addEventListener('click',e=>{const b=e.target.closest('#upd,[data-upd]');if(b)open(b)});
  if(q.has('update')||location.hash==='#update')setTimeout(()=>open($('#upd')),600)})();

/* ================= ব্যবহারকারীদের মতামত ================= */
async function reviews(){if(!SB_OK||!$('#reviews'))return;try{const d=await rpc('public_reviews',{p_limit:12});const rs=(d&&d.reviews)||[];if(!rs.length)return;
  const st=n=>'★'.repeat(n||0)+'☆'.repeat(5-(n||0));
  $('#rvtop').innerHTML=d.count>=3&&d.avg?`<span class="rv-avg">${bn(d.avg)}</span><div><div class="stars" aria-label="গড় রেটিং ${bn(d.avg)}">${st(Math.round(d.avg))}</div><span style="color:var(--ink-2);font-size:.92rem">${bn(d.count)} জনের রেটিংয়ের গড়</span></div>`:'';
  $('#rvs').innerHTML=rs.map(r=>`<figure class="rv">${r.rating?`<div class="stars" aria-label="${bn(r.rating)} তারা">${st(r.rating)}</div>`:''}<blockquote>${esc(r.message)}</blockquote><figcaption><span class="av" aria-hidden="true">${esc((r.name||'?').slice(0,1))}</span><span><b>${esc(r.name||'একজন ব্যবহারকারী')}</b>${r.app_version?` · v${esc(r.app_version)}`:''}<br>${new Date(r.created_at).toLocaleDateString('bn-BD',{month:'long',year:'numeric'})}</span></figcaption></figure>`).join('');
  $('#reviews').hidden=false}catch{}}

/* ================= প্রশ্নোত্তর: একটি খুললে বাকিগুলো বন্ধ ================= */
$$('#acc details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)$$('#acc details').forEach(o=>{if(o!==d)o.open=false})}));

prayerInit();
const REL=releases();stats();reviews();
})(window,document);
