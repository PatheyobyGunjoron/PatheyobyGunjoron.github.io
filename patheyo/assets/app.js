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
function loadLoc(){try{const j=JSON.parse(localStorage.getItem('pat_loc')||'null');if(j&&isFinite(j.lat)&&isFinite(j.lng))return j}catch{}
  try{const a=JSON.parse(sessionStorage.getItem('pat_auto')||'null');if(a&&isFinite(a.lat))return a}catch{}
  try{const a=JSON.parse(localStorage.getItem('pat_auto_ls')||'null');if(a&&isFinite(a.lat)&&Date.now()-a.t<12*3600e3)return a.l}catch{}const c=CITIES[0];return{name:c[0],lat:c[1],lng:c[2],i:0,def:1}}
// নিজে থেকে এলাকা: আগে অনুমতি দেওয়া থাকলে সরাসরি ফোনের/ডিভাইসের লোকেশন (সবচেয়ে নির্ভুল);
// না থাকলে আপাতত ইন্টারনেট সংযোগের আনুমানিক শহর দেখায় আর নিজস্ব পপআপে কারণ বলে লোকেশন চায় (অনুমতি আগে "না" বললে ৭ দিন পর্যন্ত আর চায় না)
async function detectLoc(){if(!LOC||(!LOC.def&&LOC.i!=='auto'))return;
  const use=(lat,lng,name,gps)=>{if(!(LOC.def||(gps&&LOC.i==='auto')))return;LOC={name:name||'আপনার এলাকা',lat,lng,i:'auto'};
    try{sessionStorage.setItem('pat_auto',JSON.stringify(LOC))}catch{}try{localStorage.setItem('pat_auto_ls',JSON.stringify({t:Date.now(),l:LOC}))}catch{}
    locSelect();tick(true);weather()};
  const ip=async()=>{try{const c=new AbortController();setTimeout(()=>c.abort(),6000);const r=await fetch('https://get.geojs.io/v1/ip/geo.json',{signal:c.signal});const j=await r.json();
    const lat=parseFloat(j.latitude),lng=parseFloat(j.longitude);if(isFinite(lat)&&isFinite(lng))use(lat,lng,j.city||j.region||'আপনার এলাকা',false)}catch{}};
  const gps=(onFail,opt)=>navigator.geolocation.getCurrentPosition(p=>use(p.coords.latitude,p.coords.longitude,'আপনার অবস্থান',true),onFail,opt||{timeout:12000,maximumAge:600e3});
  if(!navigator.geolocation){if(LOC.def)ip();return}
  let state='prompt';try{if(navigator.permissions){state=(await navigator.permissions.query({name:'geolocation'})).state}}catch{}
  if(state==='granted'){gps(()=>{if(LOC.def)ip()});return}
  if(LOC.def)ip();
  if(state==='denied')return;
  askLoc(()=>gps(e=>{if(e&&e.code===1)snack('লোকেশনের অনুমতি দেওয়া হয়নি। এলাকার তালিকা থেকে নিজের এলাকা বেছে নিন।')},{timeout:15000,maximumAge:0}))}
// লোকেশন চাওয়ার আগে নিজস্ব পপআপ — কেন চাই তা বলা হয়
function askLoc(go){if(!W.PTDialog)return;let last=0;try{last=+localStorage.getItem('pat_locask')||0}catch{}
  if(Date.now()-last<7*864e5)return;
  const show=()=>{if(waiting()){setTimeout(show,400);return}
    W.PTDialog.ask({tone:'loc',title:'আপনার লোকেশন দিন',message:'আপনার এলাকার সঠিক আবহাওয়া, সঠিক নামাজের সময় ও সঠিক হিজরি তারিখ দেখানোর জন্য আমরা আপনার বর্তমান অবস্থান জানতে চাই। অবস্থান আমাদের সার্ভারে জমা রাখা হয় না।',ok:'অনুমতি দিন',cancel:'এখন নয়'})
      .then(ok=>{try{localStorage.setItem('pat_locask',String(Date.now()))}catch{}if(ok)go()})};
  setTimeout(show,1500)}
// এলাকা বাছাই — নিজস্ব ড্রপডাউন (আসল ভেক্টর আইকনসহ, কিবোর্ড দিয়েও চলে)
const BNC={dhaka:'ঢাকা',chittagong:'চট্টগ্রাম',chattogram:'চট্টগ্রাম',sylhet:'সিলেট',rajshahi:'রাজশাহী',khulna:'খুলনা',barisal:'বরিশাল',barishal:'বরিশাল',rangpur:'রংপুর',mymensingh:'ময়মনসিংহ',comilla:'কুমিল্লা',cumilla:'কুমিল্লা',gazipur:'গাজীপুর',narayanganj:'নারায়ণগঞ্জ',savar:'সাভার',bogra:'বগুড়া',bogura:'বগুড়া',jessore:'যশোর',jashore:'যশোর',"cox's bazar":'কক্সবাজার',dinajpur:'দিনাজপুর',tangail:'টাঙ্গাইল',narsingdi:'নরসিংদী',feni:'ফেনী',noakhali:'নোয়াখালী',pabna:'পাবনা',kushtia:'কুষ্টিয়া',faridpur:'ফরিদপুর',brahmanbaria:'ব্রাহ্মণবাড়িয়া'};
const bnCity=n=>BNC[String(n||'').trim().toLowerCase()]||n;
const IPIN='<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.5s-7-6.1-7-11.8A7 7 0 0 1 19 9.7c0 5.7-7 11.8-7 11.8z"/><circle cx="12" cy="9.6" r="2.6"/></svg>';
const ILOC='<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/></svg>';
const ICHK='<svg class="i ck" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
function locSelect(){const box=$('.tc-place');if(!box)return;
  const opts=[];if(LOC.i==='auto')opts.push({v:'auto',t:bnCity(LOC.name),ic:IPIN,sub:'আপনার এলাকা'});
  CITIES.forEach((c,i)=>opts.push({v:String(i),t:c[0],ic:IPIN}));
  if(LOC.i==='geo')opts.push({v:'geo',t:'আমার অবস্থান',ic:ILOC,sub:`${bn(LOC.lat.toFixed(2))}°, ${bn(LOC.lng.toFixed(2))}°`});
  opts.push({v:'me',t:'আমার অবস্থান নিন',ic:ILOC,sub:'ফোনের জিপিএস দিয়ে',act:1});
  const cur=String(LOC.i),label=LOC.i==='auto'?bnCity(LOC.name):LOC.i==='geo'?'আমার অবস্থান':LOC.name;
  box.innerHTML=`<div class="lsel"><button type="button" class="ls-b" id="loc" aria-haspopup="listbox" aria-expanded="false" aria-label="এলাকা: ${esc(label)} — বদলাতে চাপুন">${LOC.i==='geo'?ILOC:IPIN}<span>${esc(label)}</span><svg class="i cv" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>
    <ul class="ls-l" role="listbox" aria-label="এলাকা বেছে নিন" tabindex="-1" hidden>${opts.map(o=>`<li role="option" data-v="${o.v}" tabindex="-1" aria-selected="${o.v===cur}" class="${o.act?'act':''}">${o.ic}<span class="lt"><b>${esc(o.t)}</b>${o.sub?`<small>${esc(o.sub)}</small>`:''}</span>${o.v===cur?ICHK:''}</li>`).join('')}</ul></div>`;
  const btn=box.querySelector('.ls-b'),list=box.querySelector('.ls-l'),items=[...list.children];
  const open=o=>{list.hidden=!o;btn.setAttribute('aria-expanded',o);box.classList.toggle('open',o);if(o){(items.find(x=>x.getAttribute('aria-selected')==='true')||items[0]).focus()}};
  btn.onclick=()=>open(list.hidden);
  btn.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open(true)}};
  list.onkeydown=e=>{const i=items.indexOf(D.activeElement);
    if(e.key==='ArrowDown'){e.preventDefault();items[Math.min(i+1,items.length-1)].focus()}else if(e.key==='ArrowUp'){e.preventDefault();items[Math.max(i-1,0)].focus()}
    else if(e.key==='Home'){e.preventDefault();items[0].focus()}else if(e.key==='End'){e.preventDefault();items[items.length-1].focus()}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();D.activeElement.click()}else if(e.key==='Escape'||e.key==='Tab'){open(false);if(e.key==='Escape')btn.focus()}};
  list.onclick=e=>{const li=e.target.closest('li');if(!li)return;open(false);btn.focus();pick(li.dataset.v)};
  D.addEventListener('pointerdown',function f(e){if(!box.isConnected){D.removeEventListener('pointerdown',f);return}if(!box.contains(e.target))open(false)});
  function pick(v){
    if(v==='me'){if(!navigator.geolocation){snack('এই ব্রাউজারে লোকেশন পাওয়া যায় না।');return}
      btn.classList.add('busy');navigator.geolocation.getCurrentPosition(p=>{btn.classList.remove('busy');
        LOC={name:'আমার অবস্থান',lat:p.coords.latitude,lng:p.coords.longitude,i:'geo'};save()},
        ()=>{btn.classList.remove('busy');snack('লোকেশন পাওয়া যায়নি। তালিকা থেকে শহর বেছে নিন।')},{timeout:12000,maximumAge:3600e3});return}
    if(v==='geo'||v==='auto'||v===String(LOC.i))return;const c=CITIES[+v];LOC={name:c[0],lat:c[1],lng:c[2],i:+v};save()}
  function save(){try{localStorage.setItem('pat_loc',JSON.stringify(LOC))}catch{}try{localStorage.removeItem('pat_sky')}catch{}locSelect();syncApp(true);tick(true);weather()}}
let TT=null,TDAY='',lastWaqt='';
// অ্যাপের মতোই: পদ্ধতি "স্বয়ংক্রিয়" (বাংলাদেশে ইসলামিক ফাউন্ডেশন = ১০০, বাইরে করাচি = ১), মাযহাব হানাফি ("1")
const methodNow=()=>W.PtPrayer.effectiveMethod('0','1',LOC.lat,LOC.lng);
function times(d){const P=W.PtPrayer;if(!P)return null;const m=methodNow();
  const live=W.PtSync&&W.PtSync.times(d,LOC.lat,LOC.lng,m);if(live)return live;     // বাংলাদেশের বাইরে অনলাইনে: aladhan (+৩ মিনিট মাগরিব), অ্যাপের মতো
  return P.times(d,{lat:LOC.lat,lng:LOC.lng,method:m,school:'1'})}
// অ্যাপের উৎস থেকে হিজরি ভিত্তি, Firebase সমন্বয় ও (বাইরে হলে) aladhan-এর সময় আনা; এলে সব আবার হিসাব
let syncKey='';
function syncApp(force){if(!W.PtSync||!LOC)return;const k=new Date().toDateString()+'|'+(+LOC.lat).toFixed(3)+','+(+LOC.lng).toFixed(3);if(!force&&k===syncKey)return;syncKey=k;
  W.PtSync.load(LOC.lat,LOC.lng,methodNow(),'1').then(()=>{TDAY='';tick._d=null;tick(true)})}
function state(now,T){
  const t=now.getHours()*60+now.getMinutes()+now.getSeconds()/60,F=toM(T.Fajr),SR=toM(T.Sunrise),Dh=toM(T.Dhuhr),A=toM(T.Asr),M=toM(T.Maghrib),I=toM(T.Isha);
  const nextDay=times(new Date(now.getTime()+864e5)),F2=toM(nextDay&&nextDay.Fajr)+1440;
  let w,ends,sky,forbid=null,next,nextAt,st;
  if(t<F){st=I-1440;w='Isha';ends=F;sky='isha';next='Fajr';nextAt=F}
  else if(t<SR){st=F;w='Fajr';ends=SR;sky='fajr';next='Dhuhr';nextAt=Dh}
  else if(t<SR+15){st=SR;w=null;forbid='সূর্যোদয়';ends=SR+15;sky='sunrise';next='Dhuhr';nextAt=Dh}
  else if(t<Dh-12){st=SR+15;w=null;ends=Dh-12;sky=t<SR+60?'sunrise':'duha';next='Dhuhr';nextAt=Dh}
  else if(t<Dh){st=Dh-12;w=null;forbid='দুপুর (জাওয়াল)';ends=Dh;sky='dhuhr';next='Dhuhr';nextAt=Dh}
  else if(t<A){st=Dh;w='Dhuhr';ends=A;sky='dhuhr';next='Asr';nextAt=A}
  else if(t<M-15){st=A;w='Asr';ends=M;sky=t<M-35?'asr':'maghrib';next='Maghrib';nextAt=M}
  else if(t<M){st=M-15;w='Asr';forbid='সূর্যাস্ত';ends=M;sky='maghrib';next='Maghrib';nextAt=M}
  else if(t<I){st=M;w='Maghrib';ends=I;sky=t<M+30?'maghrib':'isha';next='Isha';nextAt=I}
  else{st=I;w='Isha';ends=F2;sky='isha';next='Fajr';nextAt=F2}
  // সূর্য/চাঁদের অবস্থান
  let p,moon;if(t>=SR&&t<M){p=(t-SR)/(M-SR);moon=false}else{p=((t<M?t+1440:t)-M)/(F+1440-M);moon=true}
  p=Math.min(Math.max(p,0),1);
  return{w,ends,sky,forbid,next,nextAt,t,p,moon,st,T:[F,SR,Dh,A,M,I]}}
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
  // অবস্থা, অগ্রগতি ও কাউন্টডাউন
  const left=(S.ends-S.t)*60,nl=(S.nextAt-S.t)*60;let head,sub;
  if(S.forbid){head=`<span class="forbid">নিষিদ্ধ সময় · ${S.forbid}</span>`;sub=`শেষ হতে <b class="cd">${cd(left)}</b>`}
  else if(S.w){head=`এখন <b>${WN[S.w]}</b>-এর ওয়াক্ত`;sub=`শেষ হতে <b class="cd">${cd(left)}</b>`}
  else{head=`এখন <b>চাশতের</b> সময়`;sub=`যোহর শুরু হতে <b class="cd">${cd(nl)}</b>`}
  if(S.next&&S.next!==S.w)sub+=`<span class="nx">পরবর্তী ${WN[S.next]} · ${h12(S.nextAt)}</span>`;
  const wn=$('#wnow');if(wn&&wn._h!==head){wn.innerHTML=head;wn._h=head}
  const wc=$('#wcd');if(wc)wc.innerHTML=sub;
  const pr=$('#wprog');if(pr){const f=Math.min(Math.max((S.t-S.st)/Math.max(S.ends-S.st,1),0),1);pr.style.setProperty('--f',f.toFixed(4));pr.classList.toggle('fb',!!S.forbid)}
  // দিনের টাইমলাইনে "এখন" চিহ্ন: ফজর থেকে এশা পর্যন্ত
  const tl=$('#tl');if(tl){const T=S.T;let pos;if(S.t<T[0])pos=0;else if(S.t>=T[5])pos=1;else{let k=0;while(k<4&&S.t>=T[k+1])k++;pos=(k+(S.t-T[k])/(T[k+1]-T[k]))/5}
    tl.style.setProperty('--pos',pos.toFixed(4));$$('#waqts li').forEach((li,k)=>li.classList.toggle('past',S.t>=S.T[k]))}
  // তারিখ (মাগরিবের পর হিজরি তারিখ পরের দিনে যায়)
  const dk=now.getDate()+'-'+(S.t>=toM(TT.Maghrib))+'-'+now.getMinutes();if(force||!tick._d||tick._d!==dk){tick._d=dk;syncApp();
    const P=W.PtPrayer,hd=S.t>=toM(TT.Maghrib)?new Date(now.getTime()+864e5):now;
    const hj=W.PtSync?W.PtSync.hijri(now,TT.Maghrib):P.hijri(hd,0),bg=P.bangla(now);
    $('#dates').innerHTML=`<span class="dp"><small>${DAYS[now.getDay()]}</small>${bn(now.getDate())} ${GM[now.getMonth()]} ${bn(now.getFullYear())}</span>${hj?`<span class="dp"><small>হিজরি</small>${bn(hj).replace(/\s*হিজরি$/,'')}</span>`:''}<span class="dp"><small>বঙ্গাব্দ</small>${bn(bg)}</span>`}}
function renderWaqts(){const ol=$('#waqts');if(!ol||!TT)return;lastWaqt='';
  ol.innerHTML=['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'].map(k=>`<li data-k="${k}" class="${k==='Sunrise'?'srw':''}"><i class="dot" aria-hidden="true"></i><span class="wn">${WN[k]}</span><span class="wt">${h12(toM(TT[k]))}</span></li>`).join('')}
function prayerInit(){if(!W.PtPrayer||!$('#tcard'))return;LOC=loadLoc();locSelect();tick(true);wxInit();detectLoc();setInterval(()=>{if(!D.hidden)tick()},1000);D.addEventListener('visibilitychange',()=>{if(!D.hidden)tick(true)})}


/* ================= আসল সূর্য, চাঁদ ও আবহাওয়া =================
   সূর্য ও চাঁদের উচ্চতা ও ঘণ্টা-কোণ (hour angle) এই মুহূর্তে, নির্বাচিত এলাকা থেকে হিসাব হয়।
   পর্দায়: উদয়ের মুহূর্তে বাঁ দিকের নিচে, মধ্যাহ্নে সবচেয়ে উঁচুতে, অস্তের মুহূর্তে ডান দিকের নিচে।
   আবহাওয়া Open-Meteo (ফ্রী, কোনো key লাগে না) থেকে — মেঘলা/বৃষ্টিতে আকাশ ধূসর, সূর্য মেঘে ঢাকা, বৃষ্টি পড়ে। */
const SKY=(function(){
  const R=Math.PI/180,jd=d=>d.getTime()/864e5+2440587.5,mod=(a,m)=>((a%m)+m)%m;
  function sunEq(d){const n=jd(d)-2451545,L=mod(280.46+.9856474*n,360),g=mod(357.528+.9856003*n,360)*R,lam=(L+1.915*Math.sin(g)+.02*Math.sin(2*g))*R,e=(23.439-4e-7*n)*R;
    return{ra:Math.atan2(Math.cos(e)*Math.sin(lam),Math.cos(lam)),dec:Math.asin(Math.sin(e)*Math.sin(lam)),lon:lam}}
  function moonEq(d){const n=jd(d)-2451545,L=(218.316+13.176396*n)*R,M=(134.963+13.064993*n)*R,F=(93.272+13.22935*n)*R,l=L+6.289*R*Math.sin(M),b=5.128*R*Math.sin(F),e=23.4397*R;
    return{ra:Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l)),dec:Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l)),lon:l,lat:b}}
  // ঘণ্টা-কোণ H (রেডিয়ান, -π..π), উচ্চতা, দিগন্ত পেরোনোর ঘণ্টা-কোণ H0, সর্বোচ্চ উচ্চতা
  function pos(q,d,lat,lng,h0deg){const n=jd(d)-2451545,lst=(mod(280.46061837+360.98564736629*n,360)+lng)*R,p=lat*R;
    let H=mod(lst-q.ra+Math.PI,2*Math.PI)-Math.PI;
    const alt=Math.asin(Math.sin(p)*Math.sin(q.dec)+Math.cos(p)*Math.cos(q.dec)*Math.cos(H))/R;
    const c=(Math.sin(h0deg*R)-Math.sin(p)*Math.sin(q.dec))/(Math.cos(p)*Math.cos(q.dec));
    const H0=c<=-1?Math.PI:c>=1?0:Math.acos(c),top=90-Math.abs(lat-q.dec/R);
    const az=mod(Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(p)-Math.tan(q.dec)*Math.cos(p))/R+180,360);
    return{H,alt,H0,top,az,dec:q.dec,p}}
  let HZ=90,TOP=9,GK='',SW=1000,SH=1000;
  // মোবাইলে ফোনগুলো আকাশের মাঝখান জুড়ে থাকে, তাই সূর্যের পথ ফোনের ওপরের খোলা আকাশে: বাঁ দিকে একটু নিচে উঠে, মাঝে ওপরে, ডান দিকে একটু নিচে অস্ত
  function geom(){const sky=$('#sky'),st=$('.stagewrap');if(!sky)return;const H=sky.offsetHeight||1;SW=sky.offsetWidth||1000;SH=H;
    if(matchMedia('(max-width:760px)').matches&&st){const hdr=parseFloat(getComputedStyle(root).getPropertyValue('--hdr'))||68;
      // মোবাইলে সূর্যের পথ "পাথেয়" লেখার চারপাশে একটি চ্যাপ্টা বাঁক: বাঁ দিকে লেখার মাঝামাঝি উচ্চতায় ওঠে, লেখার ঠিক ওপর দিয়ে যায়, ডান দিকে একই উচ্চতায় ডোবে
      const h1=$('.hero h1'),sr=sky.getBoundingClientRect(),hr=h1?h1.getBoundingClientRect():null;
      if(hr){HZ=(hr.top+hr.height*.18-sr.top)/H*100;TOP=Math.min((hdr+8-sr.top)/H*100,HZ-2.5)}else{HZ=14;TOP=8}
      if(HZ-TOP<2.5)HZ=TOP+2.5}else{
      // পিসিতে: পুরো চওড়া জুড়ে বড় খিলান — বাঁ কিনারে ডাউনলোড-সারির উচ্চতায় ওঠে, হেডারের ঠিক নিচ দিয়ে যায়, ডান কিনারে একই উচ্চতায় ডোবে
      const hdr=parseFloat(getComputedStyle(root).getPropertyValue('--hdr'))||68,sr=sky.getBoundingClientRect(),m=$('.hero .cta')||$('.hero-meta');
      if(m){const r=m.getBoundingClientRect();HZ=(r.top+r.height*.1-sr.top)/H*100;TOP=(hdr+24)/H*100;if(HZ-TOP<20){HZ=62;TOP=11}}else{HZ=62;TOP=11}}GK=HZ.toFixed(1)+'/'+TOP.toFixed(1)+'/'+SW}
  addEventListener('resize',()=>{clearTimeout(geom._t);geom._t=setTimeout(()=>{geom();last&&update(last)},250)});
  // সূর্য/চাঁদের পথ = একটি বৃত্তের ওপরের অংশ (পিক্সেলে সত্যিকারের বৃত্ত): বাঁ দিগন্ত → মাথার ওপরের চূড়া → ডান দিগন্ত, মাঝে কোনো ভাঁজ বা উঁচু-নিচু নেই।
  // কোথায় আছে তা ঠিক হয় সূর্যের ঘণ্টা-কোণ দিয়ে (উদয় −১ … দুপুর ০ … অস্ত +১); দিগন্তের নিচে গেলে একই বৃত্ত ধরে একটু নিচে নামে।
  const place=b=>{const f=b.H0>0?b.H/b.H0:2,mob=matchMedia('(max-width:760px)').matches,
      a=(mob?46:47)/100*SW,s=Math.min(Math.max((HZ-TOP)/100*SH,1),a),Rr=(a*a+s*s)/(2*s),cx=SW/2,cy=TOP/100*SH+Rr,
      th=Math.max(-1.5,Math.min(1.5,f))*Math.asin(Math.min(a/Rr,1)),px=cx+Rr*Math.sin(th),py=cy-Rr*Math.cos(th);
    return{x:px/SW*100,y:py/SH*100,up:Math.abs(f)<=1}};
  // আকাশের রং: সূর্যের উচ্চতা → উপর/মাঝ/নিচ ও দিগন্তের আভা
  const ST=[[-90,'#020817','#071634','#0f2856',[0,0,0,0]],[-14,'#030c22','#0c1f49','#1d3a72',[70,80,170,.18]],[-8,'#0f1a45','#2f3a78','#7d5f95',[255,130,120,.32]],
    [-3,'#1e2c66','#5d5491','#e08f86',[255,150,110,.55]],[0,'#2c4a90','#9a7aa3','#ffb98a',[255,175,115,.7]],[4,'#4a84cc','#a7c5e6','#ffd7ab',[255,205,150,.55]],
    [10,'#6fbdf0','#a4dbfb','#f2f6f4',[255,236,200,.32]],[25,'#86d4ff','#a2defe','#f2faff',[255,250,235,.18]],[90,'#82d2ff','#9fdcff','#f4fbff',[255,255,255,.14]]];
  const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const rgb=c=>`rgb(${c.slice(0,3).map(v=>Math.round(v)).join(',')})`,rgba=c=>`rgba(${c.slice(0,3).map(v=>Math.round(v)).join(',')},${(+c[3]).toFixed(3)})`;
  function palette(alt){let i=0;while(i<ST.length-2&&alt>ST[i+1][0])i++;const A=ST[i],B=ST[i+1],t=Math.min(Math.max((alt-A[0])/(B[0]-A[0]),0),1),e=t*t*(3-2*t);
    return{s1:mix(hx(A[1]),hx(B[1]),e),s2:mix(hx(A[2]),hx(B[2]),e),s3:mix(hx(A[3]),hx(B[3]),e),g:mix(A[4],B[4],e)}}
  const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
  const grey=c=>{const l=.3*c[0]+.59*c[1]+.11*c[2];return[l*.96,l*.99,l*1.06]};      // মেঘলা আকাশের ধূসর-নীল
  const DIR=['উত্তর','উত্তর-পূর্ব','পূর্ব','দক্ষিণ-পূর্ব','দক্ষিণ','দক্ষিণ-পশ্চিম','পশ্চিম','উত্তর-পশ্চিম'],dir=az=>DIR[Math.round(az/45)%8];
  let pathKey='';
  function sunPath(b,key){if(key===pathKey)return;pathKey=key;const el=$('#sp-arc');if(!el)return;if(!(b.H0>0)){el.setAttribute('d','');return}
    const pts=[];for(let i=0;i<=60;i++){const H=-b.H0+2*b.H0*i/60,alt=Math.asin(Math.sin(b.p)*Math.sin(b.dec)+Math.cos(b.p)*Math.cos(b.dec)*Math.cos(H))/R,q=place({H,H0:b.H0,alt,top:b.top});pts.push([q.x*10,q.y*10])}
    el.setAttribute('d','M'+pts.map(p=>p.map(v=>v.toFixed(1)).join(' ')).join(' L'))}
  function moonPath(k,waxing){const r=48,c=50,rx=Math.abs(1-2*k)*r,big=k>.5;
    if(waxing)return`M${c} ${c-r} A${r} ${r} 0 0 1 ${c} ${c+r} A${rx} ${r} 0 0 ${big?1:0} ${c} ${c-r}Z`;
    return`M${c} ${c-r} A${r} ${r} 0 0 0 ${c} ${c+r} A${rx} ${r} 0 0 ${big?0:1} ${c} ${c-r}Z`}
  // পেজ খুললে সূর্য/চাঁদ উদয়ের জায়গা (বাঁ দিকের দিগন্ত) থেকে নিজের আসল পথ ধরে এখনকার জায়গায় আসে
  let intro=true;const easeO=t=>1-Math.pow(1-t,3);
  function rise(el,b,dur,opac){if(!el||!(b.H0>0))return false;const H1=Math.min(b.H,b.H0),H0s=-b.H0;el.classList.add('nt');
    const q0=place({H:H0s,H0:b.H0,alt:-.8,top:b.top});el.style.setProperty('--x',q0.x.toFixed(2)+'%');el.style.setProperty('--y',q0.y.toFixed(2)+'%');el.style.setProperty('--o','0');
    const go=()=>{if(waiting()){setTimeout(go,120);return}setTimeout(()=>{const t0=performance.now();requestAnimationFrame(function f(now){const k=Math.min((now-t0)/dur,1),e=easeO(k),H=H0s+(H1-H0s)*e;
      const alt=Math.asin(Math.sin(b.p)*Math.sin(b.dec)+Math.cos(b.p)*Math.cos(b.dec)*Math.cos(H))/R,q=place({H,H0:b.H0,alt,top:b.top});
      el.style.setProperty('--x',q.x.toFixed(2)+'%');el.style.setProperty('--y',q.y.toFixed(2)+'%');el.style.setProperty('--o',opac(alt).toFixed(2));
      if(k<1)requestAnimationFrame(f);else el.classList.remove('nt')})},350)};go();return true}
  let WX=null,last=null;
  function update(now){now=now||new Date();last=now;const sky=$('#sky');if(!sky||!LOC)return;if(!GK)geom();const lat=+LOC.lat,lng=+LOC.lng;
    const se=sunEq(now),sb=pos(se,now,lat,lng,-.833),me=moonEq(now),mb=pos(me,now,lat,lng,.125);
    const ov=WX?WX.over:0;                               // ০ = পরিষ্কার … ১ = ঘন মেঘ/বৃষ্টি
    // মেঘলা/বৃষ্টির আকাশ: দিনে স্লেট-ধূসর, বৃষ্টিতে আরও গাঢ়, রাতে প্রায় কালচে ধূসর
    const P=palette(sb.alt),rainy=WX&&WX.rain,dayw=Math.min(Math.max((sb.alt+6)/12,0),1);
    const SL=rainy?[[84,96,112],[110,121,136],[150,160,172]]:[[124,137,154],[152,163,177],[194,201,211]],SN=[[14,18,26],[24,30,40],[40,48,60]];
    const slate=k=>mix(SN[k],SL[k],dayw);
    const s1=mix(P.s1,slate(0),ov),s2=mix(P.s2,slate(1),ov),s3=mix(P.s3,slate(2),ov),st=sky.style;
    st.setProperty('--s1',rgb(s1));st.setProperty('--s2',rgb(s2));st.setProperty('--s3',rgb(s3));
    const sp=place(sb);st.setProperty('--gc',rgba([...P.g.slice(0,3),P.g[3]*(1-ov*.85)]));st.setProperty('--gx',Math.min(Math.max(sp.x,0),100).toFixed(1)+'%');
    const light=lum(s2)>.34;st.setProperty('--sfg',light?'#061a40':'#ffffff');st.setProperty('--sfg2',light?'rgba(6,26,64,.82)':'rgba(255,255,255,.86)');
    st.setProperty('--star',(Math.min(Math.max((-sb.alt-3)/9,0),1)*(1-ov)).toFixed(2));
    try{const v={};['--s1','--s2','--s3','--gc','--gx','--sfg','--sfg2','--star'].forEach(k=>v[k]=st.getPropertyValue(k));localStorage.setItem('pat_sky',JSON.stringify({t:Date.now(),v,lt:light,la:lat.toFixed(2),lo:lng.toFixed(2)}))}catch{}
    const h=$('#hdr');h&&h.style.setProperty('--sky-fg',light?'#061a40':'#ffffff');sky.classList.toggle('lt',light);
    // সূর্য: মেঘ ঘন হলে ঢাকা পড়ে
    const sunO=alt=>Math.min(Math.max((alt+2.5)/3.5,0),1)*Math.max(0,1-ov*1.15),first=intro;
    const sun=$('#sun');if(sun){if(!(first&&sb.alt>-1&&rise(sun,sb,2800,sunO))){if(!sun.classList.contains('nt')){sun.style.setProperty('--x',sp.x.toFixed(2)+'%');sun.style.setProperty('--y',sp.y.toFixed(2)+'%');sun.style.setProperty('--o',sunO(sb.alt).toFixed(2))}}
      const warm=Math.min(Math.max(1-sb.alt/16,0),1);sun.style.setProperty('--sc',rgb(mix([255,240,200],[255,150,80],warm)))}
    // চাঁদ
    const el=Math.acos(Math.cos(me.lat)*Math.cos(me.lon-se.lon)),k=(1-Math.cos(el))/2,waxing=mod(me.lon-se.lon,2*Math.PI)<Math.PI,mp=place(mb);
    const moon=$('#moon');if(moon){const mo=alt=>(alt>-1.5?Math.min(Math.max((alt+1.5)/3,0),1):0)*(sb.alt>6?.5:1)*(k<.03?0:1)*Math.max(0,1-ov*1.1);
      if(!(first&&mb.alt>-1&&rise(moon,mb,2800,mo))&&!moon.classList.contains('nt')){moon.style.setProperty('--x',mp.x.toFixed(2)+'%');moon.style.setProperty('--y',mp.y.toFixed(2)+'%');moon.style.setProperty('--o',(mp.up?mo(mb.alt):0).toFixed(2))}
      const ml=$('#mlit');ml&&ml.setAttribute('d',moonPath(k,waxing))}
    intro=false;sunPath(sb,now.toDateString()+lat.toFixed(2)+lng.toFixed(2)+GK);STARS.set&&STARS.set();CLOUDS.tint(sb.alt,ov);
    const si=$('#suninfo');if(si){const up=sb.alt>=-.83;
      const s1t=up?`<span><i></i>সূর্য <b>${dir(sb.az)}</b> আকাশে · <b>${bn(Math.round(sb.alt))}°</b> উঁচুতে</span>`:`<span><i></i>সূর্য দিগন্তের <b>${bn(Math.round(-sb.alt))}°</b> নিচে</span>`;
      const s2t=(mb.alt>0&&k>=.03)?`<span><i class="m"></i>চাঁদ <b>${bn(Math.round(k*100))}%</b> আলোকিত</span>`:'';
      si.innerHTML=s1t+s2t}}
  function setWeather(w){WX=w;if(last)update(last)}
  return{update,setWeather,get:()=>WX}})();

/* ================= মেঘ =================
   আসল আকাশের ছবি থেকে কেটে নেওয়া স্বচ্ছ মেঘের স্তর (assets/clouds.webp) — জোড়াহীনভাবে একটানা ডান দিকে ভেসে যায়।
   আবহাওয়া অনুযায়ী স্তর বাড়ে-কমে: পরিষ্কার = ১টি হালকা স্তর, আংশিক মেঘলা = ২টি, মেঘলা/বৃষ্টি = ৩টি ঘন ও ধূসর স্তর। */
const CLOUDS=(function(){const box=$('#clouds');if(!box)return{set(){},tint(){}};
  const SRC=BASE+'assets/clouds.webp',AR=1800/1005;let level=-1,heavy=false,anims=[];
  // [উচ্চতা (আকাশের %), স্বচ্ছতা, সময় (সেকেন্ড), উল্টানো, ওপর থেকে দূরত্ব %]
  const L=[[62,.95,170,false,-2],[44,.6,260,true,6],[88,.85,120,false,-6]];
  function build(){anims.forEach(a=>a.cancel());anims=[];box.innerHTML='';if(level<1)return;
    const W=box.clientWidth||innerWidth,H=box.clientHeight||700,mob=W<700;
    for(let i=0;i<Math.min(level,3);i++){const [hp,op,dur,flip,top]=L[i],h=Math.round(H*(mob?hp*.62:hp)/100),tw=Math.round(h*AR),n=Math.ceil(W/tw)+1;
      const d=D.createElement('div');d.className='cl';d.style.cssText=`top:${top}%;height:${h}px;width:${tw*n}px;background-size:${tw}px ${h}px;opacity:${(heavy?Math.min(1,op+.15):op).toFixed(2)};${flip?'transform:scaleX(-1)':''}`;
      d.style.backgroundImage=`url(${SRC})`;const w=D.createElement('div');w.className='clw';w.appendChild(d);box.appendChild(w);
      const a=w.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(${flip?'':'-'}${tw}px,0,0)`}],{duration:dur*1000*(mob?.8:1),iterations:Infinity,easing:'linear'});
      a.currentTime=Math.random()*dur*1000;anims.push(a)}}
  function set(n,h){const lv=n>=10?3:n>=6?2:1;if(lv===level&&!!h===heavy)return;level=lv;heavy=!!h;box.classList.toggle('heavy',heavy);build()}
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(build,400)});
  // দিনের আলো অনুযায়ী রং: রাতে চাঁদের আলোয় গাঢ় নীল-ধূসর, গোধূলিতে উষ্ণ, বৃষ্টিতে ধূসর
  function tint(alt,ov){const night=Math.min(Math.max((-alt+2)/10,0),1),dusk=Math.max(0,1-Math.abs(alt-1)/7);
    box.style.setProperty('--cf',`brightness(${(1-night*.62-ov*.42).toFixed(2)}) saturate(${Math.max(0,1-ov*.95+dusk*.5).toFixed(2)}) contrast(${(1+ov*.12).toFixed(2)}) sepia(${(dusk*.4).toFixed(2)})`);
    box.style.setProperty('--co',(.95-night*.3).toFixed(2))}
  D.addEventListener('visibilitychange',()=>anims.forEach(a=>D.hidden?a.pause():a.play()));
  return{set,tint}})();

/* ================= বৃষ্টি ও বজ্রপাত ================= */
const RAIN=(function(){const cv=$('#rain');if(!cv)return{set(){}};let x;try{x=cv.getContext('2d')}catch{}if(!x)return{set(){}};
  let on=false,drops=[],w=0,h=0,raf=0,lf=0,storm=false,ft=0,snow=false;
  const size=()=>{const r=cv.getBoundingClientRect();w=r.width;h=r.height;cv.width=Math.round(w);cv.height=Math.round(h)};
  const mk=()=>({x:Math.random()*(w+200)-100,y:Math.random()*h,l:snow?2+Math.random()*2.5:16+Math.random()*20,v:snow?40+Math.random()*50:620+Math.random()*420,a:snow?.5+Math.random()*.4:.28+Math.random()*.35});
  function loop(t){raf=requestAnimationFrame(loop);if(D.hidden||t-lf<30)return;const dt=Math.min((t-lf)/1000,.05);lf=t;x.clearRect(0,0,w,h);
    x.lineCap='round';for(const d of drops){d.y+=d.v*dt;d.x+=(snow?Math.sin(t/900+d.l)*12:-d.v*.18)*dt;if(d.y>h+20){d.y=-20;d.x=Math.random()*(w+200)-100}
      if(snow){x.fillStyle=`rgba(255,255,255,${d.a})`;x.beginPath();x.arc(d.x,d.y,d.l,0,6.2832);x.fill()}else{x.strokeStyle=`rgba(232,238,248,${d.a})`;x.lineWidth=1.3;x.beginPath();x.moveTo(d.x,d.y);x.lineTo(d.x-d.l*.18,d.y-d.l);x.stroke()}}
    if(storm&&t>ft){ft=t+6000+Math.random()*12000;const f=$('#flash');if(f){f.classList.remove('go');void f.offsetWidth;f.classList.add('go')}}}
  function set(intensity,isStorm,isSnow){storm=!!isStorm;snow=!!isSnow;if(intensity<=0){on=false;cv.classList.remove('on');setTimeout(()=>{if(!on){cancelAnimationFrame(raf);raf=0;x.clearRect(0,0,w,h)}},1600);return}
    on=true;size();const n=Math.round(Math.min(520,(snow?60:140)+intensity*130)*(w<700?.6:1));drops=Array.from({length:n},mk);cv.classList.add('on');if(!raf){lf=performance.now();raf=requestAnimationFrame(loop)}}
  addEventListener('resize',()=>{if(on)size()});return{set}})();

/* ================= আবহাওয়া (Open-Meteo, ফ্রী) ================= */
const WXN={0:['পরিষ্কার আকাশ','☀️'],1:['প্রায় পরিষ্কার','🌤️'],2:['আংশিক মেঘলা','⛅'],3:['মেঘলা','☁️'],45:['কুয়াশা','🌫️'],48:['কুয়াশা','🌫️'],51:['হালকা গুঁড়ি বৃষ্টি','🌦️'],53:['গুঁড়ি বৃষ্টি','🌦️'],55:['ঘন গুঁড়ি বৃষ্টি','🌧️'],56:['ঠান্ডা গুঁড়ি বৃষ্টি','🌧️'],57:['ঠান্ডা গুঁড়ি বৃষ্টি','🌧️'],61:['হালকা বৃষ্টি','🌦️'],63:['বৃষ্টি','🌧️'],65:['ভারী বৃষ্টি','🌧️'],66:['ঠান্ডা বৃষ্টি','🌧️'],67:['ঠান্ডা ভারী বৃষ্টি','🌧️'],71:['হালকা তুষার','🌨️'],73:['তুষারপাত','🌨️'],75:['ভারী তুষার','❄️'],77:['তুষারকণা','🌨️'],80:['হালকা ঝরো বৃষ্টি','🌦️'],81:['ঝরো বৃষ্টি','🌧️'],82:['প্রবল ঝরো বৃষ্টি','⛈️'],85:['তুষার ঝড়','🌨️'],86:['প্রবল তুষার ঝড়','❄️'],95:['বজ্রসহ বৃষ্টি','⛈️'],96:['বজ্র ও শিলাবৃষ্টি','⛈️'],99:['প্রবল বজ্র ও শিলাবৃষ্টি','⛈️']};
function applyWx(c){if(!c)return;let code=+c.weather_code;const cc=+c.cloud_cover||0,pr=Math.max(+c.precipitation||0,(+c.rain||0)+(+c.showers||0)),sf=+c.snowfall||0,tp=+c.temperature_2m;
  // মডেলের কোডে "পরিষ্কার/মেঘলা" থাকলেও এই মুহূর্তে বৃষ্টি/তুষার পড়ার পরিমাণ থাকলে সেটাই ধরা হয়
  if(code<51&&(pr>=.1||sf>0)){if(sf>0||tp<=.5)code=(sf>=.5||pr>=2)?75:(pr>=.5?73:71);else code=pr>=4?65:pr>=1?63:61}
  c=Object.assign({},c,{weather_code:code});
  const rainy=(code>=51&&code<=67)||(code>=80&&code<=82)||code>=95,snowy=(code>=71&&code<=77)||code===85||code===86,fog=code===45||code===48;
  const over=Math.min(1,Math.max(rainy||snowy?.9:code===3?.75:fog?.6:0,cc>=85?.7:cc>=60?.35:cc>=35?.15:0));
  SKY.setWeather({over,code,rain:rainy||snowy||code>=95});
  CLOUDS.set(rainy||snowy?12:code===3||cc>=85?10:code===2||cc>=40?6:fog?8:3,over>=.6);
  RAIN.set(rainy?(code===65||code===82||code>=95?3:code===63||code===81?2:1):snowy?1:0,code>=95,snowy);
  const n=WXN[code]||['—',''],el=$('#wxp');if(el){el.hidden=false;el.innerHTML=`<span class="we" aria-hidden="true">${n[1]}</span><span class="wv"><b>${bn(Math.round(c.temperature_2m))}°</b><small>${n[0]}</small></span>`}
  const m=$('#wxmeta');if(m)m.innerHTML=`<span>আর্দ্রতা <b>${bn(Math.round(c.relative_humidity_2m))}%</b></span><span>মেঘ <b>${bn(Math.round(cc))}%</b></span><span class="src">আবহাওয়া: Open-Meteo</span>`}
let wxT=0;
async function weather(){if(!LOC)return;const key='pat_wx_'+(+LOC.lat).toFixed(2)+','+(+LOC.lng).toFixed(2);
  try{const c=JSON.parse(sessionStorage.getItem(key)||'null');if(c&&Date.now()-c.t<10*60e3){applyWx(c.d);return}}catch{}
  try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${(+LOC.lat).toFixed(3)}&longitude=${(+LOC.lng).toFixed(3)}&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,precipitation,rain,showers,snowfall,is_day&timezone=auto`;
    const r=await fetch(u);if(!r.ok)throw 0;const j=await r.json();applyWx(j.current);try{sessionStorage.setItem(key,JSON.stringify({t:Date.now(),d:j.current}))}catch{}}
  catch{CLOUDS.set(3,false)}}
function wxInit(){CLOUDS.set(3,false);weather();clearInterval(wxT);wxT=setInterval(()=>{if(!D.hidden)weather()},10*60e3)}

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
  // CSS-এর [data-pos] অবস্থানের সাথে হুবহু মিল — অ্যানিমেশন শেষে কোনো লাফ/কাঁপুনি হয় না
  const MOB=matchMedia('(max-width:760px)');
  const PP=()=>MOB.matches?['translate3d(0,0,0) rotate(0deg) scale(1)','translate3d(56%,-2%,0) rotate(6deg) scale(.82)','translate3d(-56%,-2%,0) rotate(-6deg) scale(.82)']
                        :['translate3d(0,0,0) rotate(0deg) scale(1)','translate3d(62%,-3%,0) rotate(6deg) scale(.84)','translate3d(-62%,-3%,0) rotate(-6deg) scale(.84)'];
  const Dm=1500,FL=.3,out=()=>MOB.matches?92:108;
  const fly=(p,from,to)=>{if(!p.animate)return;const P=PP();let kf;
    if(from===1&&to===0){const O=`translate3d(${out()}%,-3%,0) rotate(8deg) scale(.86)`;kf=[{transform:P[1],zIndex:1,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:O,zIndex:1,offset:FL},{transform:O,zIndex:4,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[0],zIndex:4,offset:1}]}
    else if(from===0&&to===2){const M='translate3d(-14%,0,0) rotate(-2deg) scale(.95)';kf=[{transform:P[0],zIndex:3,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:M,zIndex:3,offset:FL},{transform:M,zIndex:2,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[2],zIndex:2,offset:1}]}
    else kf=[{transform:P[2],zIndex:1,offset:0,easing:'cubic-bezier(.55,0,.25,1)'},{transform:P[1],zIndex:1,offset:1}];
    try{p.animate(kf,{duration:Dm})}catch{}};
  let t=0;const set=()=>ps.forEach((p,i)=>{const to=((i-t)%3+3)%3,from=p.dataset.pos==null?to:+p.dataset.pos;p.dataset.pos=to;if(from!==to)fly(p,from,to)});set();
  const bar=$('#hbar'),CYC=3400,GRN=220;let acc=0,lt=performance.now(),mv=0,ps_='',ss_='';
  const setBar=(p,s='')=>{if(!bar)return;const v=p.toFixed(3);if(v!==ps_){bar.style.setProperty('--p',v);ps_=v}if(s!==ss_){if(s)bar.dataset.s=s;else delete bar.dataset.s;ss_=s}};
  const tk=()=>{const now=performance.now(),raw=now-lt;if(raw<4)return;lt=now;const dt=raw>600?16:raw;
    if(!D.hidden&&!waiting()){acc+=dt;if(acc>=CYC){acc-=CYC;mv=Dm;t++;set()}const w=CYC-mv-GRN,d=acc-mv;if(d<=0)setBar(0);else if(d>=w)setBar(1,'done');else setBar(d/w)}};
  requestAnimationFrame(function f(){tk();requestAnimationFrame(f)});setInterval(tk,250)})();

/* ================= ফিচার এক্সপ্লোরার =================
   কম্পিউটারে: বাঁয়ে তালিকা, মাঝে ফোন, ডানে বিস্তারিত।  মোবাইলে: অ্যাপের মতো কার্ড — চাপলে খুলে স্ক্রিনশট ও সুবিধাগুলো দেখায়। */
(function(){const box=$('#fx');if(!box)return;
  const li=i=>`<li>${esc(i.t)}${i.sub&&i.sub.length?`<ul>${i.sub.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}</li>`;
  const shotsOf=c=>c.shots||(c.shot?[c.shot]:[]);
  let cleanup=()=>{};
  function desktop(list){cleanup();
    box.classList.remove('m');box.innerHTML=`<div class="fx-list" role="tablist" aria-label="ফিচারের অংশ" aria-orientation="vertical">${list.map((c,k)=>`<button role="tab" id="fxt${k}" aria-controls="fxp" aria-selected="${k===0}" tabindex="${k===0?0:-1}" data-k="${k}"><span class="gi" aria-hidden="true"><svg class="i"><use href="#i-${esc(c.svg||'ic'+Math.min(k,14))}"/></svg></span><span>${esc(c.title)}</span><span class="ct">${bn(c.items.length)}</span></button>`).join('')}</div>
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
    cleanup=()=>{clearInterval(timer);const k=REFRESH.indexOf(showShot);if(k>=0)REFRESH.splice(k,1)}}
  function mobile(list){cleanup();box.classList.add('m');
    box.innerHTML=`<p class="fxm-hint"><svg class="i" aria-hidden="true"><use href="#i-chev"/></svg>যে ফিচার দেখতে চান, সেটিতে চাপুন</p><div class="fxm">${list.map((c,k)=>`<div class="fxm-c" data-k="${k}">
      <button class="fxm-h" type="button" aria-expanded="false" aria-controls="fxmb${k}"><span class="gi" aria-hidden="true"><svg class="i"><use href="#i-${esc(c.svg||'ic'+Math.min(k,14))}"/></svg></span>
      <span class="fxm-t"><b>${esc(c.title)}</b>${c.desc?`<small>${esc(c.desc)}</small>`:''}</span><span class="fxm-x" aria-hidden="true"><svg class="i"><use href="#i-plus"/></svg></span></button>
      <div class="fxm-b" id="fxmb${k}" hidden><div class="fxm-in">${shotsOf(c).length?`<div class="fxm-shots">${shotsOf(c).map(n=>`<div class="phone"><div class="scr" data-n="${n}"></div></div>`).join('')}</div>`:''}
      <p class="fxm-n">${bn(c.items.length)}টি সুবিধা</p><ul class="ticks">${c.items.map(li).join('')}</ul></div></div></div>`).join('')}</div>`;
    const fill=card=>card.querySelectorAll('.scr[data-n]').forEach(s=>anyShot(+s.dataset.n).then(u=>{s.innerHTML=u?img(u,+s.dataset.n,true):emptyScr()}));
    const toggle=(card,open,instant)=>{const h=card.querySelector('.fxm-h'),b=card.querySelector('.fxm-b');if(open===(h.getAttribute('aria-expanded')==='true'))return;
      h.setAttribute('aria-expanded',open);card.classList.toggle('open',open);
      if(open){b.hidden=false;fill(card);if(!instant&&b.animate){const H=b.scrollHeight;b.animate([{height:'0px',opacity:0},{height:H+'px',opacity:1}],{duration:420,easing:'cubic-bezier(.22,.8,.24,1)'})}}
      else{if(instant||!b.animate){b.hidden=true;return}const H=b.offsetHeight;const a=b.animate([{height:H+'px',opacity:1},{height:'0px',opacity:0}],{duration:300,easing:'ease'});a.onfinish=()=>{if(!card.classList.contains('open'))b.hidden=true}}};
    const cards=[...box.querySelectorAll('.fxm-c')];
    box.querySelector('.fxm').addEventListener('click',e=>{const h=e.target.closest('.fxm-h');if(!h)return;const card=h.parentElement,open=h.getAttribute('aria-expanded')!=='true';
      cards.forEach(c=>c!==card&&toggle(c,false,true));toggle(card,open);
      if(open)setTimeout(()=>{const y=card.getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(root).getPropertyValue('--hdr'))||68)-12;scrollTo({top:y,behavior:'smooth'})},60)});
    toggle(cards[0],true,true);
    const re=()=>cards.forEach(c=>{if(c.classList.contains('open'))fill(c)});REFRESH.push(re);
    cleanup=()=>{const k=REFRESH.indexOf(re);if(k>=0)REFRESH.splice(k,1)}}
  fetch(BASE+'data/features.json?v='+Math.floor(Date.now()/36e5)).then(r=>r.json()).then(list=>{
    const mq=matchMedia('(max-width:760px)'),render=()=>mq.matches?mobile(list):desktop(list);render();
    mq.addEventListener?mq.addEventListener('change',render):mq.addListener(render);
  }).catch(()=>{box.innerHTML='<p class="gempty">ফিচার তালিকা লোড করা যায়নি। পেজটি রিফ্রেশ করুন।</p>'})})();

/* ================= স্ক্রিনশট স্লাইডার (আগের মতো) =================
   অসীম লুপ: প্রতিটি ফোন ১ সেকেন্ডে সরে আসে, তারপর ~৩ সেকেন্ডের লোডিং-বার (সাদা → সবুজ) পূর্ণ হলে পরেরটি।
   টেনে/সোয়াইপ/চাকা/তীরচিহ্নে সরানো যায়; মাউস রাখলে বড় হয়ে থামে; চাপ দিলে ধরে রাখে (আবার চাপলে ছাড়ে)। */
(function(){const trk=$('#trk');if(!trk)return;const vp=trk.parentElement,barEl=$('#sbar'),cap=$('#scap');
  const bar={ps:'',ss:'',set(p,st=''){if(!barEl)return;const v=p.toFixed(3);if(v!==this.ps){barEl.style.setProperty('--p',v);this.ps=v}if(st!==this.ss){if(st)barEl.dataset.s=st;else delete barEl.dataset.s;this.ss=st}}};
  let th=null,n=0,items=[],i=0,fetched=false,gen=0,curK=null;
  const segs=$$('#screenshots .seg button'),setSeg=()=>segs.forEach(b=>b.setAttribute('aria-pressed',b.dataset.th===(th||curTheme())));
  const build=list=>{n=list.length;const h=list.map(([k,u])=>`<div class="sp" data-n="${k}">${img(u,k)}</div>`).join('');trk.innerHTML=h+h+h;items=[...trk.children];i=n};
  let tx=0,down=null,nt,wheeling=false,wt;const MVT=1000,FILL=2800,GRN=200;let mvLeft=0,p=0,grn=0;
  const cxl=el=>el.offsetLeft+el.offsetWidth/2,mid=()=>vp.clientWidth/2;
  const showCap=k=>{if(!cap||k===curK)return;curK=k;cap.classList.add('chg');setTimeout(()=>{const c=CAP[k]||['স্ক্রিনশট '+bn(k),''];cap.querySelector('b').textContent=c[0];cap.querySelector('small').textContent=c[1]||'';cap.classList.remove('chg')},180)};
  const mark=()=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+tx-mid());if(d<bd){bd=d;b=k}});items.forEach((el,k)=>el.classList.toggle('on',k===b));if(items[b])showCap(+items[b].dataset.n);return b};
  const apply=()=>{trk.style.transform=`translate3d(${tx}px,0,0)`};
  const place=()=>{if(!n)return;tx=mid()-cxl(items[i]);apply();mark()};
  const norm=()=>{if(!n)return;if(i<n||i>=2*n){const i1=n+(((i-n)%n)+n)%n;tx+=cxl(items[i])-cxl(items[i1]);i=i1;trk.classList.add('still');apply();void trk.offsetWidth;trk.classList.remove('still');mark()}};
  const sched=()=>{clearTimeout(nt);nt=setTimeout(norm,1100)};
  const readX=el=>{const t=getComputedStyle(el).transform;if(!t||t==='none')return 0;const M=W.DOMMatrix||W.WebKitCSSMatrix;if(M)return new M(t).m41;const m=/matrix\(([^)]+)\)/.exec(t);return m?parseFloat(m[1].split(',')[4])||0:0};
  const freeze=()=>{clearTimeout(nt);tx=readX(trk);trk.classList.add('still');apply();norm();trk.classList.add('still')};
  const restart=()=>{mvLeft=MVT;p=0;grn=0};
  const settle=proj=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+proj-mid());if(d<bd){bd=d;b=k}});i=b;trk.classList.remove('still');place();sched();restart()};
  addEventListener('resize',()=>{trk.classList.add('still');place();void trk.offsetWidth;trk.classList.remove('still')});
  const held=()=>!!trk.querySelector('.hold,.hv'),clearHold=()=>items.forEach(x=>x.classList.remove('hold','hv'));
  trk.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||down)return;const el=e.target.closest('.sp');if(el&&!el.sup)el.classList.add('hv')});
  trk.addEventListener('pointerout',e=>{if(e.pointerType!=='mouse')return;const el=e.target.closest('.sp');if(!el||(e.relatedTarget&&el.contains(e.relatedTarget)))return;el.classList.remove('hv');el.sup=false});
  vp.addEventListener('pointerdown',e=>{if(!n)return;if(e.button!==0&&e.pointerType==='mouse')return;down={x:e.clientX,x0:e.clientX,tx:0,id:e.pointerId,el:e.target.closest('.sp'),moved:false,h:[]}});
  vp.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id)return;
    if(!down.moved&&Math.abs(e.clientX-down.x0)>8){down.moved=true;freeze();down.tx=tx;down.x=e.clientX;down.h=[[performance.now(),e.clientX]];vp.setPointerCapture(e.pointerId);vp.classList.add('dr');clearHold()}
    if(down.moved){tx=down.tx+(e.clientX-down.x);apply();mark();const now=performance.now();down.h.push([now,e.clientX]);while(down.h.length>2&&now-down.h[0][0]>120)down.h.shift()}});
  const up=e=>{if(!down||e.pointerId!==down.id)return;const d=down;down=null;vp.classList.remove('dr');
    if(d.moved){const a=d.h[0],b=d.h[d.h.length-1],v=b[0]>a[0]?(b[1]-a[1])/(b[0]-a[0]):0;settle(tx+Math.max(-450,Math.min(450,v*260)))}
    else if(d.el&&e.type==='pointerup'){if(d.el.classList.contains('hold')){d.el.classList.remove('hold','hv');d.el.sup=true}else{clearHold();d.el.classList.add('hold')}}};
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);
  let ts=null;vp.addEventListener('touchstart',e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY,l:null}},{passive:true});
  vp.addEventListener('touchmove',e=>{if(!ts)return;const t=e.touches[0],dx=t.clientX-ts.x,dy=t.clientY-ts.y;if(ts.l===null&&(Math.abs(dx)>3||Math.abs(dy)>3))ts.l=Math.abs(dx)>=Math.abs(dy)?'x':'y';if(ts.l==='x'&&e.cancelable)e.preventDefault()},{passive:false});
  vp.addEventListener('touchend',()=>{ts=null});vp.addEventListener('touchcancel',()=>{ts=null});
  vp.addEventListener('contextmenu',e=>e.preventDefault());vp.addEventListener('dragstart',e=>e.preventDefault());
  D.addEventListener('pointerdown',e=>{if(!e.target.closest('#trk')&&held())clearHold()});
  vp.addEventListener('wheel',e=>{if(!n)return;if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();if(!wheeling){wheeling=true;freeze();clearHold()}tx-=e.deltaX;apply();mark();clearTimeout(wt);wt=setTimeout(()=>{wheeling=false;settle(tx)},140)},{passive:false});
  vp.addEventListener('keydown',e=>{if(!n)return;if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();freeze();clearHold();i+=e.key==='ArrowRight'?1:-1;trk.classList.remove('still');place();sched();restart()});
  const load=()=>{const g=++gen,t=th||curTheme(),ks=[];for(let k=1;k<=SHOT_MAX;k++)ks.push(k);setSeg();
    Promise.all(ks.map(k=>shotFor(t,k).then(u=>u?[k,u]:null))).then(r=>{if(g!==gen)return;const list=r.filter(Boolean);curK=null;build(list);vp.hidden=!list.length;if(list.length){trk.classList.add('still');place();void trk.offsetWidth;trk.classList.remove('still');restart()}})};
  segs.forEach(b=>b.onclick=()=>{th=b.dataset.th;load()});
  REFRESH.push(()=>{if(fetched&&!th)load()});
  if('IntersectionObserver' in W)new IntersectionObserver((e,o)=>{if(e.some(z=>z.isIntersecting)){fetched=true;o.disconnect();load()}},{rootMargin:'900px 0px'}).observe(vp);else{fetched=true;load()}
  let vis=true;if('IntersectionObserver' in W)new IntersectionObserver(e=>{vis=e[0].isIntersecting}).observe(vp);
  let lt=performance.now();
  requestAnimationFrame(function f(now){const dt=Math.min(now-lt,100);lt=now;
    if(n&&!D.hidden&&vis){
      if((down&&down.moved)||wheeling){bar.set(0,'dim');restart()}
      else if(held()||(down&&!down.moved)){bar.set(p,'pause')}
      else if(mvLeft>0){mvLeft-=dt;bar.set(0)}
      else if(grn>0){grn-=dt;bar.set(1,'done');if(grn<=0){i++;place();sched();restart()}}
      else{p+=dt/FILL;if(p>=1){p=1;grn=GRN;bar.set(1,'done')}else bar.set(p)}}
    requestAnimationFrame(f)})})();

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
      {t:'লিংক কপি',f:()=>{const u=location.href.split('#')[0];(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>snack('লিংক কপি হয়েছে'),()=>PTDialog.copy({title:'লিংক কপি করুন',message:'নিচের লিংকটি কপি করে Chrome-এ খুলুন।',value:u}))}},
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

/* ================= প্রবেশ ও স্ক্রল-অ্যানিমেশন ================= */
(function(){const sky=$('#sky');if(sky){const go=()=>{if(waiting()){setTimeout(go,120);return}requestAnimationFrame(()=>sky.classList.add('in'))};go()}
  const els=$$('.sec .sh,.fx,.shots,.dl>*,.clog,.faq-grid>*,.band,#reviews .rvs');
  if(!('IntersectionObserver' in W)){return}
  els.forEach((el,k)=>{el.setAttribute('data-rv','');el.style.transitionDelay=(k%2)*.08+'s'});
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('shown');io.unobserve(en.target)}}),{threshold:.08,rootMargin:'0px 0px -6% 0px'});
  els.forEach(el=>io.observe(el))})();

prayerInit();
const REL=releases();stats();reviews();
})(window,document);
