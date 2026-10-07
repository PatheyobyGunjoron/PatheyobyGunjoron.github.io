const C=window.PATHEYO||{},$=s=>document.querySelector(s),bn=n=>Number(n).toLocaleString('bn-BD');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ok=C.SUPABASE_URL&&C.SUPABASE_ANON_KEY;
const H={apikey:C.SUPABASE_ANON_KEY,Authorization:'Bearer '+C.SUPABASE_ANON_KEY,'Content-Type':'application/json'};
const api=(p,o={})=>fetch(C.SUPABASE_URL+'/rest/v1/'+p,{headers:H,...o}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
const _s=document.currentScript||[...document.scripts].find(x=>/assets\/app(?:\.min)?\.js/.test(x.src));
const BASE=_s&&_s.src?new URL('../',_s.src).href:location.href.replace(/[^/]*$/,'');
// theme
const root=document.documentElement;
$('#theme').onclick=()=>{const t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;try{localStorage.setItem('theme',t)}catch{}};
$('#menu').onclick=e=>{const o=$('nav').classList.toggle('o');e.currentTarget.setAttribute('aria-expanded',o)};
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('o');$('#menu').setAttribute('aria-expanded','false')}));
addEventListener('scroll',()=>$('header').classList.toggle('s',scrollY>8),{passive:true});
const RM=false;   // by request: every animation runs on every device, whatever the OS motion setting says
// footer: year (Bengali digits, always current) + social links
$('#y').textContent=new Date().getFullYear().toLocaleString('bn-BD',{useGrouping:false});
const SOC=C.SOCIAL||{};$('#soc').innerHTML=[['facebook','b-fb','ফেসবুক'],['instagram','b-ig','ইন্সটাগ্রাম'],['youtube','b-yt','ইউটিউব']].map(([k,ic,n])=>`<a href="${esc(SOC[k]||'#')}" aria-label="${n}" ${SOC[k]?'target="_blank" rel="noopener"':''}><svg class="si"><use href="#${ic}"/></svg></a>`).join('');
// features (text verbatim from data/features.json, icons are inline SVG: use "svg":"icN" in the json to override)
const li=i=>`<li>${esc(i.t)}${i.sub.length?`<ul>${i.sub.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}</li>`;
const plusI='<span class="pl" aria-hidden="true"><svg class="i"><use href="#i-plus"/></svg></span>';
function featUI(){
  const all=[...document.querySelectorAll('#feat details, #faq details')];
  const anim=(d,open,instant)=>{const b=d.querySelector('.fb');d._a&&d._a.cancel();
    if(open){d.open=true;if(instant||RM)return;const h=b.scrollHeight;d._a=b.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:380,easing:'cubic-bezier(.3,.7,.3,1)'});d._a.onfinish=()=>d._a=null}
    else{if(instant||RM||!d.open){d.open=false;return}const h=b.offsetHeight;d._a=b.animate([{height:h+'px',opacity:1},{height:'0px',opacity:0}],{duration:300,easing:'ease'});d._a.onfinish=()=>{d.open=false;d._a=null}}};
  all.forEach(d=>d.querySelector('summary').addEventListener('click',e=>{e.preventDefault();
    if(d.open&&!d._closing){anim(d,false)}else{all.forEach(o=>o!==d&&o.open&&anim(o,false));anim(d,true)}}));
  // শুধু পুরোপুরি দৃষ্টির বাইরে চলে গেলেই বন্ধ; স্ক্রিনে থাকলে ইউজার নিজে বন্ধ না করলে খোলা থাকে
  if(!('IntersectionObserver' in window)){all.forEach(d=>d.classList.add('in'));return}
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting&&en.target.open)anim(en.target,false,true)}),{threshold:0});
  const rv=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');rv.unobserve(en.target)}}),{threshold:.08});
  all.forEach((d,k)=>{d.style.setProperty('--d',(k%2)*.08+'s');io.observe(d);rv.observe(d)});
}
fetch(BASE+'data/features.json').then(r=>r.json()).then(d=>{$('#feat').innerHTML=d.map((c,k)=>`<details><summary><span class="gi" style="--d:${(k*.35).toFixed(2)}s" aria-hidden="true"><svg class="i"><use href="#${esc(c.svg||'ic'+Math.min(k,12))}"/></svg></span>${esc(c.title)}${plusI}</summary><div class="fb"><ul>${c.items.map(li).join('')}</ul></div></details>`).join('');featUI()}).catch(()=>$('#feat').innerHTML='<p class="empty">ফিচার তালিকা লোড করা যায়নি। পেজটি রিফ্রেশ করুন।</p>');
// total downloads only
const en=n=>Number(n).toLocaleString('en-US');
const count=(el,v)=>{v=Math.max(0,Math.round(+v||0));const t0=performance.now();(function f(t){const p=Math.min((t-t0)/900,1);el.textContent=en(Math.round(v*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(f);else el.textContent=en(v)})(t0)};
// মোট ডাউনলোড = GitHub ও (চালু থাকলে) ডাটাবেসের সংখ্যার মধ্যে যেটা বেশি; একটা আরেকটাকে কমিয়ে দেয় না
const DL={gh:0,sb:0},showDl=()=>count($('#sd'),Math.max(DL.gh,DL.sb));
async function stats(){if(!ok)return;try{const s=await api('rpc/get_public_stats',{method:'POST',body:'{}'});const d=Array.isArray(s)?s[0]:s;DL.sb=+d.downloads||0;showDl()}catch{}}
// screenshots: files named 1..8 in /screenshots, any of png/jpg/jpeg/webp/gif
const EXT=['webp','png','jpg','jpeg','gif','WEBP','PNG','JPG','JPEG','GIF'];
const probe=u=>new Promise(r=>{const m=new Image();m.onload=()=>r(u);m.onerror=()=>r(null);m.src=u});
async function shot(n){const base=BASE+(C.SHOTS_DIR||'screenshots')+'/'+n,key='psh'+n;
  try{const c=sessionStorage.getItem(key);if(c&&await probe(c))return c}catch{}
  for(const e of EXT){const u=base+'.'+e;if(await probe(u)){try{sessionStorage.setItem(key,u)}catch{}return u}}return null}
const im=(u,i)=>`<img src="${esc(u)}" alt="Patheyo অ্যাপ স্ক্রিনশট ${bn(i)}" decoding="async" draggable="false">`;
const dark=()=>root.dataset.theme==='dark';

// shared: progress bar + "splash still showing" gate
const waiting=()=>document.documentElement.classList.contains('ld');
const mkBar=id=>{const el=document.getElementById(id);let ps='',ss='';return{set(p,st=''){if(!el)return;const v=p.toFixed(3);if(v!==ps){el.style.setProperty('--p',v);ps=v}if(st!==ss){if(st)el.dataset.s=st;else delete el.dataset.s;ss=st}}}};
// hero: 3 phones, every 3s. The incoming phone first swings OUT to the right (clear of the centre phone),
// only then rises to the front, and glides into the centre. The old centre slides left and goes behind.
(function(){const ps=[...document.querySelectorAll('.hp')];
  ps.forEach((p,i)=>{const g=p.querySelector('img'),fall=()=>shot(i+1).then(u=>{if(u)p.querySelector('.ph').innerHTML=im(u,i+1)});
    if(!g)fall();else if(g.complete&&!g.naturalWidth)fall();else g.addEventListener('error',fall,{once:true})});
  const P=['translate3d(0%,0,0) rotate(0deg) scale(1)','translate3d(64%,0,0) rotate(5deg) scale(.86)','translate3d(-64%,0,0) rotate(-5deg) scale(.86)'];
  const D=1500,FL=.3,out=()=>matchMedia('(max-width:480px)').matches?100:110;
  const fly=(p,from,to)=>{if(!p.animate){p.classList.add('nw');return}let kf;
    if(from===1&&to===0){const O=`translate3d(${out()}%,-2%,0) rotate(7deg) scale(.9)`;
      kf=[{transform:P[1],zIndex:1,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:O,zIndex:1,offset:FL},{transform:O,zIndex:4,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[0],zIndex:4,offset:1}]}
    else if(from===0&&to===2){const M='translate3d(-14%,0,0) rotate(-2deg) scale(.95)';
      kf=[{transform:P[0],zIndex:3,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:M,zIndex:3,offset:FL},{transform:M,zIndex:2,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[2],zIndex:2,offset:1}]}
    else{kf=[{transform:P[2],zIndex:1,offset:0,easing:'cubic-bezier(.55,0,.25,1)'},{transform:P[1],zIndex:1,offset:1}]}
    try{p.animate(kf,{duration:D})}catch(e){p.classList.add('nw')}};
  let t=0;const set=()=>ps.forEach((p,i)=>{const to=((i-t)%3+3)%3,from=p.dataset.pos==null?to:+p.dataset.pos;p.dataset.pos=to;if(from!==to)fly(p,from,to)});set();
  // 3s cycle: 1.5s movement (bar empty) -> bar fills during the 1.5s the centre phone stays -> green -> next move
  const bar=mkBar('hbar'),CYC=3000,MV=D,GRN=200;let acc=0,lt=performance.now(),mv=0;
  const tick=()=>{const now=performance.now(),raw=now-lt;if(raw<4)return;lt=now;const dt=raw>600?16:raw;
    if(!document.hidden&&!waiting()){acc+=dt;if(acc>=CYC){acc-=CYC;mv=MV;t++;set()}
      const w=CYC-mv-GRN,d=acc-mv;if(d<=0)bar.set(0);else if(d>=w)bar.set(1,'done');else bar.set(d/w)}};
  // rAF drives it smoothly; a slow timer keeps the phones moving even if a browser throttles/starves rAF
  requestAnimationFrame(function f(){tick();requestAnimationFrame(f)});setInterval(tick,250)})();
// dust: lots of tiny crisp motes that fade in, wander and fade out anywhere (no fixed start/end line), like old-film overlay.
// Fades toward its own edges inside the canvas (no CSS mask = cheap), and lowers its quality by itself on slow PCs.
(function(){const cv=$('#dust');if(!cv)return;let x=null;try{x=cv.getContext('2d')}catch(e){}if(!x){cv.style.display='none';return}let w=0,h=0,P=[],on=true,last=performance.now(),LOW=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=3,lf=0,fr=0,acc=0;
  const R=Math.random,spawn=(p,init)=>{p.x=R()*w;p.y=R()*h;const a=R()*6.2832,s=3+R()*9;p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s-1.5;p.r=.6+R()*.7+(R()<.06?.5:0);p.life=7+R()*13;p.age=init?R()*p.life:0;p.a=.55+R()*.4;p.ph=R()*6.28;p.f=.3+R()*.9;p.b=R()<.25;return p};
  const size=()=>{const r=cv.getBoundingClientRect();w=r.width;h=r.height;if(!w||!h)return;const d=Math.max(.75,Math.min(devicePixelRatio||1,1.25,Math.sqrt(1100000/(w*h))));cv.width=Math.max(1,Math.round(w*d));cv.height=Math.max(1,Math.round(h*d));x.setTransform(d,0,0,d,0,0);
    P=Array.from({length:Math.round(Math.min(LOW?240:520,Math.max(140,w*h/(LOW?3600:1800))))},()=>spawn({},true))};
  const edge=(px,py)=>{const nx=(px/w-.5)*2,ny=(py/h-.5)*2,r=Math.sqrt(nx*nx+ny*ny);if(r<.5)return 1;if(r>=1)return 0;const t=(r-.5)/.5;return 1-t*t*(3-2*t)};
  const draw=(now,mv)=>{const dt=Math.min((now-last)/1000,.1);last=now;x.clearRect(0,0,w,h);const dk=dark();
    for(const p of P){if(mv){p.age+=dt;if(p.age>=p.life)spawn(p,false);
        p.vx+=(R()-.5)*14*dt;p.vy+=(R()-.5)*14*dt;const m=Math.hypot(p.vx,p.vy);if(m>13){p.vx*=13/m;p.vy*=13/m}
        p.x+=(p.vx+Math.sin(now/1000*p.f+p.ph)*3)*dt;p.y+=(p.vy+Math.cos(now/1000*p.f*.8+p.ph)*3)*dt}
      const k=Math.sin(Math.PI*Math.min(p.age/p.life,1)),al=p.a*Math.sqrt(k)*(.8+.2*Math.sin(now/1000*p.f*2+p.ph))*edge(p.x,p.y);
      if(al<.04)continue;x.fillStyle=dk?(p.b?`rgba(255,255,255,${al})`:`rgba(222,238,255,${al*.9})`):(p.b?`rgba(0,93,146,${al})`:`rgba(0,38,87,${al})`);
      x.beginPath();x.arc(p.x,p.y,p.r,0,6.2832);x.fill()}
    // self-tuning: if frames are slow, halve the motes (and cap at 30fps); never touches the phones' animation
    acc+=dt;fr++;if(fr>=90){const avg=acc/fr;fr=0;acc=0;if(avg>.07){if(!LOW)LOW=true;P.length=Math.max(60,P.length>>1)}}};
  const loop=now=>{if(on&&!document.hidden&&!waiting()&&now-lf>=(LOW?50:32)){lf=now;draw(now,true)}else if(!on||document.hidden)last=now;requestAnimationFrame(loop)};
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(size,150)});if('IntersectionObserver' in window)new IntersectionObserver(e=>{on=e[0].isIntersecting}).observe(cv);
  (window.requestIdleCallback||setTimeout)(()=>{size();requestAnimationFrame(loop)},{timeout:1200});})();
// screenshot strip: endless loop. Each phone: 1s move, then a 3s loading bar (white -> green) before the next one.
// drag/swipe/wheel/keys scroll it (bar dims while dragging, restarts after release); click holds a phone = bar pauses.
(function(){const trk=$('#trk'),vp=trk.parentElement,bar=mkBar('sbar');
  const NS=[4,5,6,7,8],n=NS.length;
  const base=NS.map(k=>`<div class="ph" data-n="${k}">স্ক্রিনশট ${bn(k)}</div>`);
  trk.innerHTML=base.concat(base,base).join('');const items=[...trk.children];
  let fetched=false;const loadImgs=()=>{if(fetched)return;fetched=true;NS.forEach((k,j)=>shot(k).then(u=>{if(u)[0,1,2].forEach(c=>items[c*n+j].innerHTML=im(u,k))}))};
  if('IntersectionObserver' in window)new IntersectionObserver((e,o)=>{if(e.some(z=>z.isIntersecting)){loadImgs();o.disconnect()}},{rootMargin:'1000px 0px'}).observe(vp);else loadImgs();
  let i=n,tx=0,down=null,nt,wheeling=false,wt;
  const MVT=1000,FILL=2800,GRN=200;let mvLeft=0,p=0,grn=0;
  const cxl=el=>el.offsetLeft+el.offsetWidth/2,mid=()=>vp.clientWidth/2;
  const mark=()=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+tx-mid());if(d<bd){bd=d;b=k}});items.forEach((el,k)=>el.classList.toggle('on',k===b));return b};
  const apply=()=>{trk.style.transform=`translate3d(${tx}px,0,0)`};
  const place=()=>{tx=mid()-cxl(items[i]);apply();mark()};
  const norm=()=>{if(i<n||i>=2*n){const i1=n+(((i-n)%n)+n)%n;tx+=cxl(items[i])-cxl(items[i1]);i=i1;trk.classList.add('still');apply();void trk.offsetWidth;trk.classList.remove('still');mark()}};
  const sched=()=>{clearTimeout(nt);nt=setTimeout(norm,1100)};
  const readX=el=>{const t=getComputedStyle(el).transform;if(!t||t==='none')return 0;const M=window.DOMMatrix||window.WebKitCSSMatrix;if(M)return new M(t).m41;const m=/matrix\(([^)]+)\)/.exec(t);return m?parseFloat(m[1].split(',')[4])||0:0};
  const freeze=()=>{clearTimeout(nt);tx=readX(trk);trk.classList.add('still');apply();norm();trk.classList.add('still')};
  const restart=()=>{mvLeft=MVT;p=0;grn=0};
  const settle=proj=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+proj-mid());if(d<bd){bd=d;b=k}});i=b;trk.classList.remove('still');place();sched();restart()};
  place();addEventListener('resize',()=>{trk.classList.add('still');place();void trk.offsetWidth;trk.classList.remove('still')});
  const held=()=>!!trk.querySelector('.hold,.hv');
  const clearHold=()=>items.forEach(x=>x.classList.remove('hold','hv'));
  // mouse hover = temporary enlarge + pause; click = pin it (enlarged, bar paused); click again = back to normal, bar continues
  trk.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||down)return;const el=e.target.closest('.ph');if(el&&!el.sup)el.classList.add('hv')});
  trk.addEventListener('pointerout',e=>{if(e.pointerType!=='mouse')return;const el=e.target.closest('.ph');if(!el||(e.relatedTarget&&el.contains(e.relatedTarget)))return;el.classList.remove('hv');el.sup=false});
  // drag (mouse + touch + pen)
  vp.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;
    down={x:e.clientX,x0:e.clientX,tx:0,id:e.pointerId,el:e.target.closest('.ph'),moved:false,h:[]}});
  vp.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id)return;const dx=e.clientX-down.x;
    if(!down.moved&&Math.abs(e.clientX-down.x0)>8){down.moved=true;freeze();down.tx=tx;down.x=e.clientX;down.h=[[performance.now(),e.clientX]];vp.setPointerCapture(e.pointerId);vp.classList.add('dr');clearHold()}
    if(down.moved){const dx=e.clientX-down.x;tx=down.tx+dx;apply();mark();const now=performance.now();down.h.push([now,e.clientX]);while(down.h.length>2&&now-down.h[0][0]>120)down.h.shift()}});
  const up=e=>{if(!down||e.pointerId!==down.id)return;const d=down;down=null;vp.classList.remove('dr');
    if(d.moved){const a=d.h[0],b=d.h[d.h.length-1],v=b[0]>a[0]?(b[1]-a[1])/(b[0]-a[0]):0;settle(tx+Math.max(-450,Math.min(450,v*260)))}
    else{if(d.el&&e.type==='pointerup'){if(d.el.classList.contains('hold')){d.el.classList.remove('hold','hv');d.el.sup=true}else{clearHold();d.el.classList.add('hold')}}}};
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);
  // touch: once the gesture is horizontal, block ALL vertical page movement for it (no jitter, no page drift)
  let ts=null;
  vp.addEventListener('touchstart',e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY,l:null}},{passive:true});
  vp.addEventListener('touchmove',e=>{if(!ts)return;const t=e.touches[0],dx=t.clientX-ts.x,dy=t.clientY-ts.y;
    if(ts.l===null&&(Math.abs(dx)>3||Math.abs(dy)>3))ts.l=Math.abs(dx)>=Math.abs(dy)?'x':'y';
    if(ts.l==='x'&&e.cancelable)e.preventDefault()},{passive:false});
  vp.addEventListener('touchend',()=>{ts=null});vp.addEventListener('touchcancel',()=>{ts=null});
  vp.addEventListener('contextmenu',e=>e.preventDefault());vp.addEventListener('dragstart',e=>e.preventDefault());
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#trk')&&held())clearHold()});
  vp.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();if(!wheeling){wheeling=true;freeze();clearHold()}tx-=e.deltaX;apply();mark();clearTimeout(wt);wt=setTimeout(()=>{wheeling=false;settle(tx)},140)},{passive:false});
  vp.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();freeze();clearHold();i+=e.key==='ArrowRight'?1:-1;trk.classList.remove('still');place();sched();restart()});
  let lt=performance.now();
  requestAnimationFrame(function f(now){const dt=Math.min(now-lt,100);lt=now;
    if(!document.hidden&&!waiting()){
      if((down&&down.moved)||wheeling){bar.set(0,'dim');restart()}                       // being dragged: dim idle line, no loading
      else if(held()||(down&&!down.moved)){bar.set(p,'pause')}                     // clicked / hovered: freeze where it is
      else if(mvLeft>0){mvLeft-=dt;bar.set(0)}                                            // phone is sliding in
      else if(grn>0){grn-=dt;bar.set(1,'done');if(grn<=0){i++;place();sched();restart()}} // full + green, then next phone
      else{p+=dt/FILL;if(p>=1){p=1;grn=GRN;bar.set(1,'done')}else bar.set(p)}}
    requestAnimationFrame(f)})})();
// releases
// Supabase ছাড়া: GitHub Releases থেকে ভার্সন, APK লিংক, সাইজ ও ডাউনলোড সংখ্যা
const RELPAGE=`https://github.com/${C.GITHUB_REPO}/releases/latest`;
// 1) data/releases.json (same site, no rate limit; kept fresh by the GitHub Action)  2) GitHub API  3) copy saved on this phone
const mapRel=raw=>{const a=raw.filter(x=>!x.draft);
  D._gh=a.reduce((m,x)=>m+(x.assets||[]).reduce((m,f)=>m+(f.download_count||0),0),0);showDl();
  return a.map((x,i)=>{const f=(x.assets||[]).find(f=>/\.apk$/i.test(f.name))||(x.assets||[])[0];return{version:String(x.tag_name).replace(/^v/i,''),release_date:x.published_at,download_url:f?f.browser_download_url:(x.html_url||RELPAGE),file_size:f?(f.size/1048576).toFixed(1)+' MB':null,is_latest:i===0&&!x.prerelease,body:x.body||''}})};
const getJson=async(u,ms)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t)}};
const gh=async()=>{let raw=null;
  try{const a=await getJson(BASE+'data/releases.json?v='+Math.floor(Date.now()/600000),6000);if(Array.isArray(a)&&a.length)raw=a}catch{}
  if(!raw){try{const a=await getJson(`https://api.github.com/repos/${C.GITHUB_REPO}/releases`,8000);if(Array.isArray(a)&&a.length)raw=a}catch{}}
  if(raw){try{localStorage.setItem('pat_rel',JSON.stringify(raw))}catch{}}
  else{try{raw=JSON.parse(localStorage.getItem('pat_rel')||'null')}catch{}}
  if(!raw)throw 0;return mapRel(raw)};
// release notes: read the text, work out what is a new feature and what is a fix, titles (emoji-led lines) get big
const FIXRE=/ফিক্স|সমাধান|সংশোধন|বাগ|ক্র্যাশ|ক্রাশ|ত্রুটি|ভুল|সমস্যা|ঠিক (?:করা|হয়েছে|হয়)|\b(?:fix(?:e[sd]|es)?|bugs?|crash(?:es)?|errors?|resolved?|patch(?:ed)?|hotfix|issues?)\b/i;
const FEATRE=/ফিচার|feature|নতুন|new\b|উন্নত|improve|added?\b|enhance/i;
let EMO;try{EMO=new RegExp('^(?:\\p{Extended_Pictographic}|[\\u{1F1E6}-\\u{1F1FF}])','u')}catch{EMO=/^[\u2190-\u2BFF\uD83C-\uD83E]/}
const clean=t=>t.replace(/\*\*|__|`/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\s+by\s+@\S+(\s+in\s+\S+)?\s*$/i,'').replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
function parseBody(body){
  const bl=[];let cur=null,sec=null;
  for(const raw of String(body||'').split(/\r?\n/)){
    const l=raw.trim();if(!l||/^[-*_=]{3,}$/.test(l)||/^\**full changelog/i.test(l))continue;
    const hm=/^#{1,6}\s+(.*)$/.exec(l);let t=clean(hm?hm[1]:l.replace(/^(?:[-*•+]|\d+[.)])\s+/,''));
    if(!t||/^what['’]?s changed:?$/i.test(t))continue;
    if(EMO.test(t)){cur={title:t,hint:FIXRE.test(t)?'fix':(FEATRE.test(t)?'feat':sec),items:[]};bl.push(cur);continue}
    if(hm){sec=FIXRE.test(t)?'fix':(FEATRE.test(t)?'feat':null);cur=null;continue}
    if(!cur){cur={title:null,hint:sec,items:[]};bl.push(cur)}
    cur.items.push(t)}
  return bl}
function noteData(r){
  const out={feat:[],fix:[]},add=(k,title,items)=>{if(title||items.length)out[k].push({title,items})};
  const bl=parseBody(r.body||(r.other_changes||[]).join('\n'));
  [...(r.new_features||[]),...(r.improvements||[])].length&&add('feat',null,[...(r.new_features||[]),...(r.improvements||[])]);
  (r.bug_fixes||[]).length&&add('fix',null,r.bug_fixes);
  for(const b of bl){
    if(b.hint){add(b.hint==='fix'?'fix':'feat',b.title,b.items);continue}
    if(b.title){const fx=b.items.length?b.items.every(x=>FIXRE.test(x)):FIXRE.test(b.title);add(fx?'fix':'feat',b.title,b.items);continue}
    add('feat',null,b.items.filter(x=>!FIXRE.test(x)));add('fix',null,b.items.filter(x=>FIXRE.test(x)))}
  return out}
const blk=(b,c)=>`${b.title?`<h5 class="nt">${esc(b.title)}</h5>`:''}${b.items.length?`<ul class="nl ${c}">${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}`;
const panel=(t,c,bs)=>bs.length?`<div class="np ${c}"><h4 class="nh">${t}</h4>${bs.map(b=>blk(b,c)).join('')}</div>`:'';
const notes=r=>{const d=noteData(r),h=panel('নতুন ফিচার','ft',d.feat)+panel('সমস্যা সমাধান','fx',d.fix);return h?`<div class="notes">${h}</div>`:''};
const date=d=>new Date(d).toLocaleDateString('bn-BD',{year:'numeric',month:'long',day:'numeric'});
const meta=r=>`<div class="meta"><span>রিলিজ: ${date(r.release_date)}</span>${r.file_size?`<span>সাইজ: ${esc(r.file_size)}</span>`:''}</div>`;
const dl=r=>`<button class="btn p" data-id="${esc(r.version)}" data-url="${esc(r.download_url)}">ডাউনলোড v${esc(r.version)}</button>`;
let LATEST=null;
async function releases(){
  try{const rs=ok?await api('releases?status=eq.published&select=*&order=release_date.desc'):await gh();
    const l=rs.find(r=>r.is_latest)||rs[0];
    if(!l){$('#latest-body').innerHTML='<p class="empty">এখনো কোনো ভার্সন প্রকাশ হয়নি</p>';$('#old').innerHTML='';return}
    $('#latest-body').innerHTML=`<div class="rel l"><div class="rtop"><span class="tag">সর্বশেষ</span><h3>Patheyo v${esc(l.version)}</h3>${dl(l)}</div>${meta(l)}${notes(l)}</div>`;
    LATEST=l;$('#uv').textContent='v'+l.version;
    document.querySelectorAll('.dlbtn').forEach(b=>{b.dataset.id=l.version;b.dataset.url=l.download_url});
    const o=rs.filter(r=>r!==l),LIM=5;
    $('#old').innerHTML=o.length?o.map((r,k)=>`<details class="orow"${k>=LIM?' hidden':''}><summary><span class="on"><b>Patheyo v${esc(r.version)}.apk</b></span><time datetime="${esc(String(r.release_date).slice(0,10))}">${date(r.release_date)}</time>${r.file_size?`<span class="sz">${esc(r.file_size)}</span>`:''}<button class="dlo" type="button" data-id="${esc(r.version)}" data-url="${esc(r.download_url)}" aria-label="ডাউনলোড Patheyo v${esc(r.version)}.apk"><svg class="i"><use href="#i-download"/></svg><span>ডাউনলোড</span></button></summary>${notes(r)}</details>`).join(''):'<p class="empty">এখনো কোনো পুরোনো ভার্সন নেই</p>';
    const mb=$('#oldmore');if(mb){if(o.length>LIM){mb.hidden=false;mb.textContent=`আরো দেখুন (${bn(o.length-LIM)})`;mb.onclick=()=>{document.querySelectorAll('#old .orow[hidden]').forEach(x=>x.hidden=false);mb.hidden=true}}else mb.hidden=true}
  }catch{$('#latest-body').innerHTML=`<p class="empty">রিলিজ তথ্য এই মুহূর্তে লোড করা যাচ্ছে না। <a href="${RELPAGE}" target="_blank" rel="noopener">GitHub থেকে সরাসরি ডাউনলোড করুন</a></p>`;$('#old').innerHTML=''}}
// ---- downloads: never dead, never blocked by tracking ----
document.querySelectorAll('.dlbtn').forEach(b=>{b.dataset.url=b.dataset.url||RELPAGE});   // until the real APK link is known, the releases page is the safe fallback
const INAPP=/FBAN|FBAV|FB_IAB|Instagram|Messenger|\bLine\/|Snapchat|musical_ly|BytedanceWebview|TikTok|MicroMessenger|Twitter|LinkedInApp|Pinterest/i.test(navigator.userAgent);
let snT;function snack(msg,acts=[],ms=9000){let s=$('#snk');if(!s){s=document.createElement('div');s.id='snk';s.className='snk';s.setAttribute('role','status');document.body.appendChild(s)}
  s.innerHTML='';const m=document.createElement('span');m.textContent=msg;s.appendChild(m);
  acts.forEach(a=>{const e=document.createElement(a.href?'a':'button');e.textContent=a.t;if(a.href){e.href=a.href;e.target='_blank';e.rel='noopener'}else{e.type='button';e.onclick=a.f}s.appendChild(e)});
  requestAnimationFrame(()=>s.classList.add('show'));clearTimeout(snT);snT=setTimeout(()=>s.classList.remove('show'),ms)}
const goUrl=u=>{const a=document.createElement('a');a.href=u;a.rel='noopener';a.setAttribute('download','');a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500)};
function startDl(id,url,force){
  if(!url)url=RELPAGE;
  if(INAPP&&!force){snack('এই ব্রাউজারে ডাউনলোড আটকে যেতে পারে। Chrome-এ খুলুন।',[
      {t:'Chrome-এ খুলুন',f:()=>{location.href='intent://'+location.host+location.pathname+'#Intent;scheme=https;package=com.android.chrome;end'}},
      {t:'লিংক কপি',f:()=>{const u=location.href.split('#')[0];(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>snack('লিংক কপি হয়েছে'),()=>prompt('লিংকটি কপি করুন',u))}},
      {t:'তবুও ডাউনলোড',f:()=>startDl(id,url,true)}],16000);return}
  try{if(ok)fetch(C.SUPABASE_URL+'/rest/v1/rpc/track_download',{method:'POST',headers:H,body:JSON.stringify({p_version:id}),keepalive:true}).catch(()=>{})}catch{}   // fire-and-forget: never delays the download
  if(id)try{localStorage.setItem('pat_inst',String(id))}catch{}
  goUrl(url);
  snack('ডাউনলোড শুরু হচ্ছে…',[{t:'শুরু না হলে এখানে চাপুন',href:url},{t:'GitHub পেজ',href:RELPAGE}],10000)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-url]');if(!b)return;e.preventDefault();startDl(b.dataset.id,b.dataset.url)});
// scroll-to-top with progress ring
(function(){const b=$('#top');if(!b)return;let q=0;
  const upd=()=>{q=0;const m=document.documentElement.scrollHeight-innerHeight,p=m>0?Math.min(Math.max(scrollY/m,0),1):0;b.style.setProperty('--p',p.toFixed(4));b.classList.toggle('show',scrollY>320);b.classList.toggle('z',p<.01)};
  addEventListener('scroll',()=>{if(!q)q=requestAnimationFrame(upd)},{passive:true});addEventListener('resize',upd);upd();
  b.addEventListener('click',()=>{b.classList.add('go');scrollTo({top:0,behavior:RM?'auto':'smooth'});setTimeout(()=>b.classList.remove('go'),900)})})();

// ---- "অ্যাপ আপডেট করুন": new install / update / already up to date ----
// A website cannot read the phone's app list, so the installed version comes from (1) ?app=1.0.0 sent by the app itself,
// (2) the version this phone downloaded from this site earlier. Nothing known = treated as "not installed" (Android installs over an old copy as an update).
(function(){const um=$('#um'),card=$('#um-card'),btn=$('#upd');if(!um||!btn)return;
  const q=new URLSearchParams(location.search);try{if(q.get('app'))localStorage.setItem('pat_inst',q.get('app'))}catch{}
  const inst=()=>{try{return localStorage.getItem('pat_inst')}catch{return null}};
  const vcmp=(a,b)=>{const A=String(a).replace(/^v/i,'').split(/[.\-+]/).map(x=>parseInt(x)||0),B=String(b).replace(/^v/i,'').split(/[.\-+]/).map(x=>parseInt(x)||0);
    for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d>0?1:-1}return 0};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const IC={
    spin:'<svg class="um-spin" viewBox="0 0 48 48"><circle cx="24" cy="24" r="19"/></svg>',
    down:'<svg class="um-dn" viewBox="0 0 48 48"><path d="M24 8v24m0 0-9-9m9 9 9-9M10 41h28"/></svg>',
    info:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19"/><path d="M24 22v11M24 15.5v.5"/></svg>',
    ok:'<svg class="um-ok" viewBox="0 0 52 52"><circle class="o" cx="26" cy="26" r="23"/><path class="c" d="M15 27l8 8 14-17"/></svg>'};
  const confetti=()=>{const cols=['#2fb67d','#6fe3ae','#f4c542','#5cc8ff','#ff8aa0'];let o='<div class="um-cf">';
    for(let k=0;k<18;k++)o+=`<i style="--a:${Math.round(k*20+(k%2)*8)}deg;--d:${58+(k%3)*18}px;--c:${cols[k%cols.length]};--k:${k}"></i>`;return o+'</div>'};
  let last=null,openedBy=null,tmr;
  const render=o=>{card.className='um-card '+(o.tone||'');$('#um-ic').innerHTML=o.icon+(o.cf?confetti():'');$('#um-t').textContent=o.title;$('#um-d').textContent=o.desc||'';
    $('#um-v').innerHTML=o.ver||'';$('#um-s').innerHTML=(o.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    const a=$('#um-a');a.innerHTML='';(o.acts||[]).forEach(x=>{const b=document.createElement('button');b.type='button';b.className=x.cls;b.textContent=x.t;b.onclick=x.f;a.appendChild(b)})};
  const close=()=>{clearTimeout(tmr);um.hidden=true;document.documentElement.classList.remove('um-open');(openedBy||btn).focus&&(openedBy||btn).focus()};
  um.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close()});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!um.hidden)close()});
  const closeA={cls:'btn',t:'বন্ধ করুন',f:close};
  const again=(L)=>({cls:'lk',t:'ডাউনলোড না হলে এখানে চাপুন',f:()=>startDl(L.version,L.download_url)});
  const chip=(a,b)=>`<span>v${esc(a)}</span><svg class="i"><use href="#i-arrow"/></svg><span class="n">v${esc(b)}</span>`;
  const apk=L=>`Patheyo v${L.version}.apk`;
  async function check(){
    render({icon:IC.spin,title:'যাচাই করা হচ্ছে…',desc:'আপনার ডিভাইসে Patheyo অ্যাপ খোঁজা হচ্ছে',acts:[]});
    await Promise.all([wait(1100),Promise.race([REL,wait(6000)])]);
    if(um.hidden)return;const L=LATEST;
    if(!L||!L.download_url){render({icon:IC.info,tone:'warn',title:'তথ্য পাওয়া যাচ্ছে না',desc:'এই মুহূর্তে রিলিজ তথ্য লোড করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।',acts:[closeA]});return}
    if(!/Android/i.test(navigator.userAgent)){
      render({icon:IC.info,title:'অ্যান্ড্রয়েড ফোনে খুলুন',desc:'Patheyo অ্যান্ড্রয়েড অ্যাপ। আপডেট বা ইনস্টল করতে আপনার অ্যান্ড্রয়েড ফোনে এই পেজটি খুলে আবার "অ্যাপ আপডেট করুন" চাপুন।',ver:`<span class="n">v${esc(L.version)}</span>`,
        acts:[{cls:'btn p',t:'APK ডাউনলোড করুন',f:()=>startDl(L.version,L.download_url)},closeA]});return}
    // App-side updater (optional): if APP_PACKAGE is set in config.js, open the installed app's own GitHub updater via deep link.
    // Not installed -> Chrome follows browser_fallback_url, i.e. the APK download.
    const PK=C.APP_PACKAGE;let started=false;
    if(PK){render({icon:IC.spin,title:'অ্যাপ খোলা হচ্ছে…',desc:'আপনার ফোনের Patheyo অ্যাপে আপডেট যাচাই হবে',acts:[]});
      let hid=document.hidden;const vh=()=>{if(document.hidden)hid=true};document.addEventListener('visibilitychange',vh);
      location.href=`intent://update#Intent;scheme=${C.APP_SCHEME||'patheyo'};package=${PK};S.browser_fallback_url=${encodeURIComponent(L.download_url)};end`;
      await wait(2400);document.removeEventListener('visibilitychange',vh);
      if(hid||um.hidden){if(!um.hidden)close();return}   // the app opened
      started=true}                                       // app missing: browser already started the APK download
    const I=inst();
    if(I&&vcmp(I,L.version)>=0){
      render({icon:IC.ok,tone:'ok',cf:true,title:'অভিনন্দন! আপনার অ্যাপ আপ-টু-ডেট',desc:'আপনি Patheyo-র সর্বশেষ ভার্সন ব্যবহার করছেন। নতুন আপডেট এলে এখানেই জানতে পারবেন।',ver:`<span class="n">v${esc(L.version)}</span>`,
        acts:[{cls:'btn p',t:'চমৎকার',f:close},{cls:'lk',t:'তবুও আবার ডাউনলোড করুন',f:()=>startDl(L.version,L.download_url)}]});return}
    const upd=!!I;
    render({icon:IC.down,title:upd?'নতুন আপডেট পাওয়া গেছে':'Patheyo ইনস্টল করুন',
      desc:upd?`আপনার অ্যাপ v${I} থেকে সর্বশেষ ভার্সনে আপডেট করা হচ্ছে। ডাউনলোড শুরু হয়েছে।`:'আপনার ডিভাইসে অ্যাপটি পাওয়া যায়নি। সর্বশেষ ভার্সন ডাউনলোড শুরু হয়েছে।',
      ver:upd?chip(I,L.version):`<span class="n">v${esc(L.version)}</span>`,
      steps:['ডাউনলোড শেষ হলে '+apk(L)+' ফাইলটি খুলুন',upd?'"আপডেট" চাপুন, আগের ইনস্টলের ওপরেই আপডেট হবে':'"ইনস্টল" চাপুন (প্রয়োজনে এই উৎস থেকে ইনস্টলের অনুমতি দিন)','শেষ হলে অ্যাপটি খুলুন'],
      acts:[again(L),closeA]});
    if(!started)tmr=setTimeout(()=>{if(!um.hidden)startDl(L.version,L.download_url)},900)}
  function open(by){openedBy=by||btn;um.hidden=false;document.documentElement.classList.add('um-open');card.focus();check()}
  btn.addEventListener('click',()=>open(btn));
  if(q.has('update')||location.hash==='#update')setTimeout(()=>open(btn),600);
})();
const REL=releases();
stats();
