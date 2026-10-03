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
const SOC=C.SOCIAL||{};$('#soc').innerHTML=[['facebook','b-fb','ফেসবুক'],['instagram','b-ig','ইন্সটাগ্রাম'],['youtube','b-yt','ইউটিউব']].map(([k,ic,n])=>`<a href="${esc(SOC[k]||'#')}" aria-label="${n}" ${SOC[k]?'target="_blank" rel="noopener"':''}><svg class="si"><use href="#${ic}"/></svg></a>`).join('');
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

// shared: progress bar + "splash still showing" gate
const waiting=()=>document.documentElement.classList.contains('ld');
const mkBar=id=>{const el=document.getElementById(id);let ps='',ss='';return{set(p,st=''){if(!el)return;const v=p.toFixed(3);if(v!==ps){el.style.setProperty('--p',v);ps=v}if(st!==ss){if(st)el.dataset.s=st;else delete el.dataset.s;ss=st}}}};
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
  // 3s cycle: 1.5s movement (bar empty) -> bar fills during the 1.5s the centre phone stays -> green -> next move
  const bar=mkBar('hbar'),CYC=3000,MV=D,GRN=200;let acc=0,lt=performance.now(),mv=0;
  if(!RM)requestAnimationFrame(function f(now){const dt=Math.min(now-lt,100);lt=now;
    if(!document.hidden&&!waiting()){acc+=dt;if(acc>=CYC){acc-=CYC;mv=MV;t++;set()}
      const w=CYC-mv-GRN,d=acc-mv;if(d<=0)bar.set(0);else if(d>=w)bar.set(1,'done');else bar.set(d/w)}
    requestAnimationFrame(f)})})();
// dust: lots of tiny crisp motes that fade in, wander and fade out anywhere (no fixed start/end line), like old-film overlay
(function(){const cv=$('#dust');if(!cv)return;const x=cv.getContext('2d');let w=0,h=0,P=[],on=true,last=performance.now();
  const R=Math.random,spawn=(p,init)=>{p.x=R()*w;p.y=R()*h;const a=R()*6.2832,s=3+R()*9;p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s-1.5;p.r=.6+R()*.7+(R()<.06?.5:0);p.life=7+R()*13;p.age=init?R()*p.life:0;p.a=.55+R()*.4;p.ph=R()*6.28;p.f=.3+R()*.9;p.b=R()<.25;return p};
  const size=()=>{const d=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();w=r.width;h=r.height;cv.width=Math.max(1,Math.round(w*d));cv.height=Math.max(1,Math.round(h*d));x.setTransform(d,0,0,d,0,0);
    P=Array.from({length:Math.round(Math.min(560,Math.max(160,w*h/1700)))},()=>spawn({},true))};
  // dark mode -> light motes, light mode -> dark (navy) motes
  const draw=(now,mv)=>{const dt=Math.min((now-last)/1000,.1);last=now;x.clearRect(0,0,w,h);const dk=dark();
    for(const p of P){if(mv){p.age+=dt;if(p.age>=p.life)spawn(p,false);
        p.vx+=(R()-.5)*14*dt;p.vy+=(R()-.5)*14*dt;const m=Math.hypot(p.vx,p.vy);if(m>13){p.vx*=13/m;p.vy*=13/m}
        p.x+=(p.vx+Math.sin(now/1000*p.f+p.ph)*3)*dt;p.y+=(p.vy+Math.cos(now/1000*p.f*.8+p.ph)*3)*dt}
      const k=Math.sin(Math.PI*Math.min(p.age/p.life,1)),al=p.a*Math.sqrt(k)*(.8+.2*Math.sin(now/1000*p.f*2+p.ph));
      if(al<.04)continue;x.fillStyle=dk?(p.b?`rgba(255,255,255,${al})`:`rgba(222,238,255,${al*.9})`):(p.b?`rgba(0,93,146,${al})`:`rgba(0,38,87,${al})`);
      x.beginPath();x.arc(p.x,p.y,p.r,0,6.2832);x.fill()}};
  const loop=now=>{if(on&&!document.hidden)draw(now,true);else last=now;requestAnimationFrame(loop)};
  size();addEventListener('resize',size);new IntersectionObserver(e=>{on=e[0].isIntersecting}).observe(cv);
  RM?draw(performance.now(),false):requestAnimationFrame(loop)})();
// screenshot strip: endless loop. Each phone: 1s move, then a 3s loading bar (white -> green) before the next one.
// drag/swipe/wheel/keys scroll it (bar dims while dragging, restarts after release); click holds a phone = bar pauses.
(function(){const trk=$('#trk'),vp=trk.parentElement,bar=mkBar('sbar');
  const NS=[4,5,6,7,8],n=NS.length;
  const base=NS.map(k=>`<div class="ph" data-n="${k}">স্ক্রিনশট ${bn(k)}</div>`);
  trk.innerHTML=base.concat(base,base).join('');const items=[...trk.children];
  NS.forEach((k,j)=>shot(k).then(u=>{if(u)[0,1,2].forEach(c=>items[c*n+j].innerHTML=im(u,k))}));
  let i=n,tx=0,down=null,nt,wheeling=false,wt;
  const MVT=1000,FILL=2800,GRN=200;let mvLeft=0,p=0,grn=0;
  const cxl=el=>el.offsetLeft+el.offsetWidth/2,mid=()=>vp.clientWidth/2;
  const mark=()=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+tx-mid());if(d<bd){bd=d;b=k}});items.forEach((el,k)=>el.classList.toggle('on',k===b));return b};
  const apply=()=>{trk.style.transform=`translate3d(${tx}px,0,0)`};
  const place=()=>{tx=mid()-cxl(items[i]);apply();mark()};
  const norm=()=>{if(i<n||i>=2*n){const i1=n+(((i-n)%n)+n)%n;tx+=cxl(items[i])-cxl(items[i1]);i=i1;trk.classList.add('nt');apply();void trk.offsetWidth;trk.classList.remove('nt')}};
  const sched=()=>{clearTimeout(nt);nt=setTimeout(norm,1100)};
  const freeze=()=>{clearTimeout(nt);tx=new DOMMatrix(getComputedStyle(trk).transform).m41;trk.classList.add('nt');apply();norm();trk.classList.add('nt')};
  const restart=()=>{mvLeft=MVT;p=0;grn=0};
  const settle=proj=>{let b=0,bd=1e9;items.forEach((el,k)=>{const d=Math.abs(cxl(el)+proj-mid());if(d<bd){bd=d;b=k}});i=b;trk.classList.remove('nt');place();sched();restart()};
  place();addEventListener('resize',()=>{trk.classList.add('nt');place();void trk.offsetWidth;trk.classList.remove('nt')});
  const held=()=>!!trk.querySelector('.hold,.hv');
  const clearHold=()=>items.forEach(x=>x.classList.remove('hold','hv'));
  // mouse hover = temporary enlarge + pause; click = pin it (enlarged, bar paused); click again = back to normal, bar continues
  trk.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||down)return;const el=e.target.closest('.ph');if(el&&!el.sup)el.classList.add('hv')});
  trk.addEventListener('pointerout',e=>{if(e.pointerType!=='mouse')return;const el=e.target.closest('.ph');if(!el||(e.relatedTarget&&el.contains(e.relatedTarget)))return;el.classList.remove('hv');el.sup=false});
  // drag (mouse + touch + pen)
  vp.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;freeze();
    down={x:e.clientX,tx,id:e.pointerId,el:e.target.closest('.ph'),moved:false,h:[[performance.now(),e.clientX]]}});
  vp.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id)return;const dx=e.clientX-down.x;
    if(!down.moved&&Math.abs(dx)>6){down.moved=true;vp.setPointerCapture(e.pointerId);vp.classList.add('dr');clearHold()}
    if(down.moved){tx=down.tx+dx;apply();mark();const now=performance.now();down.h.push([now,e.clientX]);while(down.h.length>2&&now-down.h[0][0]>120)down.h.shift()}});
  const up=e=>{if(!down||e.pointerId!==down.id)return;const d=down;down=null;vp.classList.remove('dr');
    if(d.moved){const a=d.h[0],b=d.h[d.h.length-1],v=b[0]>a[0]?(b[1]-a[1])/(b[0]-a[0]):0;settle(tx+Math.max(-450,Math.min(450,v*260)))}
    else{trk.classList.remove('nt');place();sched();if(d.el&&e.type==='pointerup'){if(d.el.classList.contains('hold')){d.el.classList.remove('hold','hv');d.el.sup=true}else{clearHold();d.el.classList.add('hold')}}}};
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#trk')&&held())clearHold()});
  vp.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();if(!wheeling){wheeling=true;freeze();clearHold()}tx-=e.deltaX;apply();mark();clearTimeout(wt);wt=setTimeout(()=>{wheeling=false;settle(tx)},140)},{passive:false});
  vp.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();freeze();clearHold();i+=e.key==='ArrowRight'?1:-1;trk.classList.remove('nt');place();sched();restart()});
  if(RM)return;let lt=performance.now();
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
const gh=async()=>{const r=await fetch(`https://api.github.com/repos/${C.GITHUB_REPO}/releases`);if(!r.ok)throw 0;const a=(await r.json()).filter(x=>!x.draft);
 count($('#sd'),a.reduce((n,x)=>n+x.assets.reduce((m,f)=>m+f.download_count,0),0));
 return a.map((x,i)=>{const f=x.assets.find(f=>/\.apk$/i.test(f.name))||x.assets[0];return{version:x.tag_name.replace(/^v/i,''),release_date:x.published_at,download_url:f?f.browser_download_url:x.html_url,file_size:f?(f.size/1048576).toFixed(1)+' MB':null,is_latest:i===0&&!x.prerelease,body:x.body||''}})};
// release notes: read the text, work out what is a new feature and what is a fix, titles (emoji-led lines) get big
const FIXRE=/ফিক্স|সমাধান|সংশোধন|বাগ|ক্র্যাশ|ক্রাশ|ত্রুটি|ভুল|সমস্যা|ঠিক (?:করা|হয়েছে|হয়)|\b(?:fix(?:e[sd]|es)?|bugs?|crash(?:es)?|errors?|resolved?|patch(?:ed)?|hotfix|issues?)\b/i;
const FEATRE=/ফিচার|feature|নতুন|new\b|উন্নত|improve|added?\b|enhance/i;
const EMO=/^(?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}])/u;
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
async function releases(){
  try{const rs=ok?await api('releases?status=eq.published&select=*&order=release_date.desc'):await gh();
    const l=rs.find(r=>r.is_latest)||rs[0];
    if(!l){$('#latest-body').innerHTML='<p class="empty">এখনো কোনো ভার্সন প্রকাশ হয়নি।</p>';$('#old').innerHTML='<p class="empty">পুরোনো ভার্সন নেই।</p>';return}
    $('#latest-body').innerHTML=`<div class="rel l"><div class="top"><span class="tag">সর্বশেষ</span><h3>Patheyo v${esc(l.version)}</h3>${dl(l)}</div>${meta(l)}${notes(l)}</div>`;
    document.querySelectorAll('.dlbtn').forEach(b=>{b.dataset.id=l.version;b.dataset.url=l.download_url});
    const o=rs.filter(r=>r!==l);
    $('#old').innerHTML=o.length?o.map(r=>`<details class="rel"><summary><b>Patheyo v${esc(r.version)}.apk</b><span class="meta" style="margin:0">${date(r.release_date)}</span>${dl(r)}</summary>${meta(r)}${notes(r)}</details>`).join(''):'<p class="empty">এখনো কোনো পুরোনো ভার্সন নেই।</p>';
  }catch{$('#latest-body').innerHTML='<p class="empty">রিলিজ তথ্য এই মুহূর্তে লোড করা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>';$('#old').innerHTML=''}}
// download flow with tracking + fallback
document.addEventListener('click',async e=>{const b=e.target.closest('[data-url]');if(!b)return;
  if(!b.dataset.url){e.preventDefault();alert('ডাউনলোড লিংক এখনো প্রস্তুত নয়।');return}
  e.preventDefault();const txt=b.classList.contains('btn')&&!b.classList.contains('big'),t=b.textContent;if(txt){b.textContent='ডাউনলোড শুরু হচ্ছে…'}b.style.pointerEvents='none';
  try{if(ok)await fetch(C.SUPABASE_URL+'/rest/v1/rpc/track_download',{method:'POST',headers:H,body:JSON.stringify({p_version:b.dataset.id}),keepalive:true})}catch{}
  location.href=b.dataset.url;setTimeout(()=>{if(txt)b.textContent=t;b.style.pointerEvents=''},2500)});
// scroll-to-top with progress ring
(function(){const b=$('#top');if(!b)return;let q=0;
  const upd=()=>{q=0;const m=document.documentElement.scrollHeight-innerHeight,p=m>0?Math.min(Math.max(scrollY/m,0),1):0;b.style.setProperty('--p',p.toFixed(4));b.classList.toggle('show',scrollY>320);b.classList.toggle('z',p<.01)};
  addEventListener('scroll',()=>{if(!q)q=requestAnimationFrame(upd)},{passive:true});addEventListener('resize',upd);upd();
  b.addEventListener('click',()=>{b.classList.add('go');scrollTo({top:0,behavior:RM?'auto':'smooth'});setTimeout(()=>b.classList.remove('go'),900)})})();
stats();releases();
