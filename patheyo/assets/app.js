const C=window.PATHEYO||{},$=s=>document.querySelector(s),bn=n=>Number(n).toLocaleString('bn-BD');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ok=C.SUPABASE_URL&&C.SUPABASE_ANON_KEY;
const H={apikey:C.SUPABASE_ANON_KEY,Authorization:'Bearer '+C.SUPABASE_ANON_KEY,'Content-Type':'application/json'};
const api=(p,o={})=>fetch(C.SUPABASE_URL+'/rest/v1/'+p,{headers:H,...o}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
const _s=document.currentScript||[...document.scripts].find(x=>/assets\/app\.js/.test(x.src));
const BASE=_s&&_s.src?new URL('../',_s.src).href:location.href.replace(/[^/]*$/,'');
// theme
const root=document.documentElement;
$('#theme').onclick=()=>{const t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;try{localStorage.setItem('theme',t)}catch{}};
$('#menu').onclick=e=>{const o=$('nav').classList.toggle('o');e.currentTarget.setAttribute('aria-expanded',o)};
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('o');$('#menu').setAttribute('aria-expanded','false')}));
addEventListener('scroll',()=>$('header').classList.toggle('s',scrollY>8),{passive:true});
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
// footer: year (Bengali digits, always current) + social links
$('#y').textContent=new Date().getFullYear().toLocaleString('bn-BD',{useGrouping:false});
const SOC=C.SOCIAL||{};$('#soc').innerHTML=[['facebook','i-fb','ফেসবুক'],['instagram','i-ig','ইন্সটাগ্রাম'],['youtube','i-yt','ইউটিউব']].map(([k,ic,n])=>`<a href="${esc(SOC[k]||'#')}" aria-label="${n}" ${SOC[k]?'target="_blank" rel="noopener"':''}><svg class="i"><use href="#${ic}"/></svg></a>`).join('');
// features (text verbatim from data/features.json, icons are inline SVG: use "svg":"icN" in the json to override)
const li=i=>`<li>${esc(i.t)}${i.sub.length?`<ul>${i.sub.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}</li>`;
const plusI='<span class="pl" aria-hidden="true"><svg class="i"><use href="#i-plus"/></svg></span>';
function featUI(){
  const all=[...document.querySelectorAll('#feat details')];
  const anim=(d,open,instant)=>{const b=d.querySelector('.fb');d._a&&d._a.cancel();
    if(open){d.open=true;if(instant||RM)return;const h=b.scrollHeight;d._a=b.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:380,easing:'cubic-bezier(.3,.7,.3,1)'});d._a.onfinish=()=>d._a=null}
    else{if(instant||RM||!d.open){d.open=false;return}const h=b.offsetHeight;d._a=b.animate([{height:h+'px',opacity:1},{height:'0px',opacity:0}],{duration:300,easing:'ease'});d._a.onfinish=()=>{d.open=false;d._a=null}}};
  all.forEach(d=>d.querySelector('summary').addEventListener('click',e=>{e.preventDefault();
    if(d.open&&!d._closing){anim(d,false)}else{all.forEach(o=>o!==d&&o.open&&anim(o,false));anim(d,true)}}));
  // শুধু পুরোপুরি দৃষ্টির বাইরে চলে গেলেই বন্ধ; স্ক্রিনে থাকলে ইউজার নিজে বন্ধ না করলে খোলা থাকে
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting&&en.target.open)anim(en.target,false,true)}),{threshold:0});
  const rv=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');rv.unobserve(en.target)}}),{threshold:.08});
  all.forEach((d,k)=>{d.style.setProperty('--d',(k%2)*.08+'s');io.observe(d);rv.observe(d)});
}
fetch(BASE+'data/features.json').then(r=>r.json()).then(d=>{$('#feat').innerHTML=d.map((c,k)=>`<details><summary><span class="gi" style="--d:${(k*.35).toFixed(2)}s" aria-hidden="true"><svg class="i"><use href="#${esc(c.svg||'ic'+Math.min(k,12))}"/></svg></span>${esc(c.title)}${plusI}</summary><div class="fb"><ul>${c.items.map(li).join('')}</ul></div></details>`).join('');featUI()}).catch(()=>$('#feat').innerHTML='<p class="empty">ফিচার তালিকা লোড করা যায়নি। পেজটি রিফ্রেশ করুন।</p>');
// total downloads only
const count=(el,v)=>{if(RM){el.textContent=bn(v);return}const t0=performance.now();(function f(t){const p=Math.min((t-t0)/900,1);el.textContent=bn(Math.round(v*(1-Math.pow(1-p,3))));p<1&&requestAnimationFrame(f)})(t0)};
async function stats(){if(!ok)return;try{const s=await api('rpc/get_public_stats',{method:'POST',body:'{}'});const d=Array.isArray(s)?s[0]:s;count($('#sd'),d.downloads)}catch{}}
// screenshots: files named 1..8 in /screenshots, any of png/jpg/jpeg/webp/gif
const EXT=['webp','png','jpg','jpeg','gif','WEBP','PNG','JPG','JPEG','GIF'];
const probe=u=>new Promise(r=>{const m=new Image();m.onload=()=>r(u);m.onerror=()=>r(null);m.src=u});
async function shot(n){const base=BASE+(C.SHOTS_DIR||'screenshots')+'/'+n,key='psh'+n;
  try{const c=sessionStorage.getItem(key);if(c&&await probe(c))return c}catch{}
  for(const e of EXT){const u=base+'.'+e;if(await probe(u)){try{sessionStorage.setItem(key,u)}catch{}return u}}return null}
const im=(u,i)=>`<img src="${esc(u)}" alt="Patheyo অ্যাপ স্ক্রিনশট ${bn(i)}" decoding="async" draggable="false">`;
const dark=()=>root.dataset.theme==='dark';
// hero: 3 phones, every 3s. The incoming phone first swings OUT to the right (clear of the centre phone),
// only then rises to the front, and glides into the centre. The old centre slides left and goes behind.
(function(){const ps=[...document.querySelectorAll('.hp')];
  ps.forEach((p,i)=>shot(i+1).then(u=>{if(u)p.querySelector('.ph').innerHTML=im(u,i+1)}));
  const P=['translate3d(0%,0,0) rotate(0deg) scale(1)','translate3d(64%,0,0) rotate(5deg) scale(.86)','translate3d(-64%,0,0) rotate(-5deg) scale(.86)'];
  const D=1500,FL=.3,out=()=>matchMedia('(max-width:480px)').matches?100:110;
  const fly=(p,from,to)=>{if(RM||!p.animate)return;let kf;
    if(from===1&&to===0){const O=`translate3d(${out()}%,-2%,0) rotate(7deg) scale(.9)`;
      kf=[{transform:P[1],zIndex:1,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:O,zIndex:1,offset:FL},{transform:O,zIndex:4,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[0],zIndex:4,offset:1}]}
    else if(from===0&&to===2){const M='translate3d(-14%,0,0) rotate(-2deg) scale(.95)';
      kf=[{transform:P[0],zIndex:3,offset:0,easing:'cubic-bezier(.3,.7,.4,1)'},{transform:M,zIndex:3,offset:FL},{transform:M,zIndex:2,offset:FL,easing:'cubic-bezier(.5,0,.2,1)'},{transform:P[2],zIndex:2,offset:1}]}
    else{kf=[{transform:P[2],zIndex:1,offset:0,easing:'cubic-bezier(.55,0,.25,1)'},{transform:P[1],zIndex:1,offset:1}]}
    p.animate(kf,{duration:D})};
  let t=0;const set=()=>ps.forEach((p,i)=>{const to=((i-t)%3+3)%3,from=p.dataset.pos==null?to:+p.dataset.pos;p.dataset.pos=to;if(from!==to)fly(p,from,to)});set();
  if(!RM)setInterval(()=>{if(!document.hidden){t++;set()}},3000)})();
// dust: lots of tiny motes that fade in, wander and fade out anywhere (no fixed start/end line), like old-film overlay
(function(){const cv=$('#dust');if(!cv)return;const x=cv.getContext('2d');let w=0,h=0,P=[],on=true,last=performance.now();
  const R=Math.random,spawn=(p,init)=>{p.x=R()*w;p.y=R()*h;const a=R()*6.2832,s=3+R()*9;p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s-1.5;p.r=.45+R()*.75+(R()<.07?.5:0);p.life=7+R()*13;p.age=init?R()*p.life:0;p.a=.3+R()*.5;p.ph=R()*6.28;p.f=.3+R()*.9;p.warm=R()<.08;return p};
  const size=()=>{const d=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();w=r.width;h=r.height;cv.width=Math.max(1,Math.round(w*d));cv.height=Math.max(1,Math.round(h*d));x.setTransform(d,0,0,d,0,0);
    P=Array.from({length:Math.round(Math.min(380,Math.max(120,w*h/1500)))},()=>spawn({},true))};
  const draw=(now,mv)=>{const dt=Math.min((now-last)/1000,.1);last=now;x.clearRect(0,0,w,h);const dk=dark();
    for(const p of P){if(mv){p.age+=dt;if(p.age>=p.life)spawn(p,false);
        p.vx+=(R()-.5)*14*dt;p.vy+=(R()-.5)*14*dt;const m=Math.hypot(p.vx,p.vy);if(m>13){p.vx*=13/m;p.vy*=13/m}
        p.x+=(p.vx+Math.sin(now/1000*p.f+p.ph)*3)*dt;p.y+=(p.vy+Math.cos(now/1000*p.f*.8+p.ph)*3)*dt}
      const k=Math.sin(Math.PI*Math.min(p.age/p.life,1)),al=p.a*k*k*(.7+.3*Math.sin(now/1000*p.f*2+p.ph))*(dk?1:.95);
      if(al<.01)continue;x.fillStyle=dk?(p.warm?`rgba(255,255,255,${al*.9})`:`rgba(214,232,255,${al*.8})`):(p.warm?`rgba(70,160,215,${al*.8})`:`rgba(0,93,146,${al*.75})`);
      x.beginPath();x.arc(p.x,p.y,p.r,0,6.2832);x.fill()}};
  const loop=now=>{if(on&&!document.hidden)draw(now,true);else last=now;requestAnimationFrame(loop)};
  size();addEventListener('resize',size);new IntersectionObserver(e=>{on=e[0].isIntersecting}).observe(cv);
  RM?draw(performance.now(),false):requestAnimationFrame(loop)})();
// screenshot strip: endless loop, 3s per phone, hover/tap = hold + enlarge, drag/swipe/wheel/keys to scroll
(function(){const trk=$('#trk'),vp=trk.parentElement;
  const NS=[4,5,6,7,8],n=NS.length;
  const base=NS.map(k=>`<div class="ph" data-n="${k}">স্ক্রিনশট ${bn(k)}</div>`);
  trk.innerHTML=base.concat(base,base).join('');const items=[...trk.children];
  NS.forEach((k,j)=>shot(k).then(u=>{if(u)[0,1,2].forEach(c=>items[c*n+j].innerHTML=im(u,k))}));
  let i=n,tx=0,paused=false,down=null,last=0,nt;
  const cxl=el=>el.offsetLeft+el.offsetWidth/2,mid=()=>vp.clientWidth/2;
  const mark=()=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+tx-mid());if(d<bd){bd=d;b=k}});items.forEach((el,k)=>el.classList.toggle('on',k===b));return b};
  const apply=()=>{trk.style.transform=`translate3d(${tx}px,0,0)`};
  const place=()=>{tx=mid()-cxl(items[i]);apply();mark()};
  const norm=()=>{if(i<n||i>=2*n){const i1=n+(((i-n)%n)+n)%n;tx+=cxl(items[i])-cxl(items[i1]);i=i1;trk.classList.add('nt');apply();void trk.offsetWidth;trk.classList.remove('nt')}};
  const sched=()=>{clearTimeout(nt);nt=setTimeout(norm,1100)};
  const freeze=()=>{clearTimeout(nt);tx=new DOMMatrix(getComputedStyle(trk).transform).m41;trk.classList.add('nt');apply();norm();trk.classList.add('nt')};
  const settle=proj=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+proj-mid());if(d<bd){bd=d;b=k}});i=b;trk.classList.remove('nt');place();sched();last=Date.now()};
  place();addEventListener('resize',()=>{trk.classList.add('nt');place();void trk.offsetWidth;trk.classList.remove('nt')});
  // hold / pause
  const clearHold=()=>{items.forEach(x=>x.classList.remove('hold'));paused=false};
  vp.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')paused=true});
  vp.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!trk.querySelector('.hold')&&!down)paused=false});
  // drag (mouse + touch + pen)
  vp.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;freeze();
    down={x:e.clientX,tx,id:e.pointerId,el:e.target.closest('.ph'),moved:false,h:[[performance.now(),e.clientX]]};});
  vp.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id)return;const dx=e.clientX-down.x;
    if(!down.moved&&Math.abs(dx)>6){down.moved=true;vp.setPointerCapture(e.pointerId);vp.classList.add('dr');items.forEach(x=>x.classList.remove('hold'))}
    if(down.moved){tx=down.tx+dx;apply();mark();const now=performance.now();down.h.push([now,e.clientX]);while(down.h.length>2&&now-down.h[0][0]>120)down.h.shift()}});
  const up=e=>{if(!down||e.pointerId!==down.id)return;const d=down;down=null;vp.classList.remove('dr');
    if(d.moved){const a=d.h[0],b=d.h[d.h.length-1],v=b[0]>a[0]?(b[1]-a[1])/(b[0]-a[0]):0;settle(tx+Math.max(-450,Math.min(450,v*260)))}
    else{trk.classList.remove('nt');place();sched();if(d.el&&e.type==='pointerup'){const h=d.el.classList.contains('hold');items.forEach(x=>x.classList.remove('hold'));if(!h){d.el.classList.add('hold');paused=true}else paused=false}last=Date.now()}};
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#trk')&&trk.querySelector('.hold'))clearHold()});
  // trackpad / shift+wheel sideways
  let wt,wheeling=false;vp.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();if(!wheeling){wheeling=true;freeze()}tx-=e.deltaX;apply();mark();clearTimeout(wt);wt=setTimeout(()=>{wheeling=false;settle(tx)},140)},{passive:false});
  // keyboard
  vp.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();freeze();i+=e.key==='ArrowRight'?1:-1;trk.classList.remove('nt');place();sched();last=Date.now()});
  // auto advance: every 3s, never while held/hovered/dragged
  if(!RM)setInterval(()=>{if(paused||down||wheeling||document.hidden||Date.now()-last<2500)return;i++;place();sched()},3000)})();
// releases
// Supabase ছাড়া: GitHub Releases থেকে ভার্সন, APK লিংক, সাইজ ও ডাউনলোড সংখ্যা
const gh=async()=>{const r=await fetch(`https://api.github.com/repos/${C.GITHUB_REPO}/releases`);if(!r.ok)throw 0;const a=(await r.json()).filter(x=>!x.draft);
 count($('#sd'),a.reduce((n,x)=>n+x.assets.reduce((m,f)=>m+f.download_count,0),0));
 return a.map((x,i)=>{const f=x.assets.find(f=>/\.apk$/i.test(f.name))||x.assets[0];return{version:x.tag_name.replace(/^v/i,''),release_date:x.published_at,download_url:f?f.browser_download_url:x.html_url,file_size:f?(f.size/1048576).toFixed(1)+' MB':null,is_latest:i===0&&!x.prerelease,other_changes:(x.body||'').split(/\r?\n/).map(l=>l.replace(/^\s*[-*•#]+\s*/,'').trim()).filter(Boolean)}})};
const list=(t,a)=>a&&a.length?`<div><h4>${t}</h4><ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
const notes=r=>`<div class="cols">${list('নতুন যা এসেছে',r.new_features)}${list('Improvements',r.improvements)}${list('Bug Fixes',r.bug_fixes)}${list('অন্যান্য',r.other_changes)}</div>`;
const date=d=>new Date(d).toLocaleDateString('bn-BD',{year:'numeric',month:'long',day:'numeric'});
const meta=r=>`<div class="meta"><span>রিলিজ: ${date(r.release_date)}</span>${r.file_size?`<span>সাইজ: ${esc(r.file_size)}</span>`:''}</div>`;
const dl=r=>`<button class="btn p" data-id="${esc(r.version)}" data-url="${esc(r.download_url)}">ডাউনলোড v${esc(r.version)}</button>`;
async function releases(){
  try{const rs=ok?await api('releases?status=eq.published&select=*&order=release_date.desc'):await gh();
    const l=rs.find(r=>r.is_latest)||rs[0];
    if(!l){$('#latest-body').innerHTML='<p class="empty">এখনো কোনো ভার্সন প্রকাশ হয়নি।</p>';$('#old').innerHTML='<p class="empty">পুরোনো ভার্সন নেই।</p>';return}
    $('#latest-body').innerHTML=`<div class="rel l"><div class="top"><span class="tag">সর্বশেষ</span><h3>Patheyo v${esc(l.version)}</h3>${dl(l)}</div>${meta(l)}${notes(l)}</div>`;
    document.querySelectorAll('.dlbtn').forEach(b=>{b.dataset.id=l.version;b.dataset.url=l.download_url});
    const o=rs.filter(r=>r!==l);
    $('#old').innerHTML=o.length?o.map(r=>`<details class="rel"><summary><b>v${esc(r.version)}</b><span class="meta" style="margin:0">${date(r.release_date)}</span>${dl(r)}</summary>${meta(r)}${notes(r)}</details>`).join(''):'<p class="empty">এখনো কোনো পুরোনো ভার্সন নেই।</p>';
  }catch{$('#latest-body').innerHTML='<p class="empty">রিলিজ তথ্য এই মুহূর্তে লোড করা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>';$('#old').innerHTML=''}}
// download flow with tracking + fallback
document.addEventListener('click',async e=>{const b=e.target.closest('[data-url]');if(!b)return;
  if(!b.dataset.url){e.preventDefault();alert('ডাউনলোড লিংক এখনো প্রস্তুত নয়।');return}
  e.preventDefault();const txt=b.classList.contains('btn')&&!b.classList.contains('big'),t=b.textContent;if(txt){b.textContent='ডাউনলোড শুরু হচ্ছে…'}b.style.pointerEvents='none';
  try{if(ok)await fetch(C.SUPABASE_URL+'/rest/v1/rpc/track_download',{method:'POST',headers:H,body:JSON.stringify({p_version:b.dataset.id}),keepalive:true})}catch{}
  location.href=b.dataset.url;setTimeout(()=>{if(txt)b.textContent=t;b.style.pointerEvents=''},2500)});
stats();releases();
