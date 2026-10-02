const C=window.PATHEYO||{},$=s=>document.querySelector(s),bn=n=>Number(n).toLocaleString('bn-BD');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ok=C.SUPABASE_URL&&C.SUPABASE_ANON_KEY;
const H={apikey:C.SUPABASE_ANON_KEY,Authorization:'Bearer '+C.SUPABASE_ANON_KEY,'Content-Type':'application/json'};
const api=(p,o={})=>fetch(C.SUPABASE_URL+'/rest/v1/'+p,{headers:H,...o}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
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
fetch('data/features.json').then(r=>r.json()).then(d=>{$('#feat').innerHTML=d.map((c,k)=>`<details><summary><span class="gi" style="--d:${(k*.35).toFixed(2)}s" aria-hidden="true"><svg class="i"><use href="#${esc(c.svg||'ic'+Math.min(k,12))}"/></svg></span>${esc(c.title)}${plusI}</summary><div class="fb"><ul>${c.items.map(li).join('')}</ul></div></details>`).join('');featUI()}).catch(()=>$('#feat').innerHTML='<p class="empty">ফিচার তালিকা লোড করা যায়নি। পেজটি রিফ্রেশ করুন।</p>');
// total downloads only
const count=(el,v)=>{if(RM){el.textContent=bn(v);return}const t0=performance.now();(function f(t){const p=Math.min((t-t0)/900,1);el.textContent=bn(Math.round(v*(1-Math.pow(1-p,3))));p<1&&requestAnimationFrame(f)})(t0)};
async function stats(){if(!ok)return;try{const s=await api('rpc/get_public_stats',{method:'POST',body:'{}'});const d=Array.isArray(s)?s[0]:s;count($('#sd'),d.downloads)}catch{}}
// screenshots source
const S=C.SCREENSHOTS||[];
const im=(u,i)=>`<img src="${esc(u)}" alt="Patheyo অ্যাপ স্ক্রিনশট ${i+1}" loading="lazy" decoding="async">`;
// hero: 3 phones rotate every 3s (right -> centre -> left -> right)
(function(){const ps=[...document.querySelectorAll('.hp')];ps.forEach((p,i)=>{if(S[i])p.querySelector('.ph').innerHTML=im(S[i],i)});
  let t=0;const set=()=>ps.forEach((p,i)=>p.dataset.pos=((i-t)%3+3)%3);set();
  if(!RM)setInterval(()=>{if(!document.hidden){t++;set()}},3000)})();
// screenshot strip: endless right->left, 3s pause per phone, hover/tap = hold + enlarge
(function(){const trk=$('#trk'),vp=trk.parentElement;
  const base=S.length?S.map((u,i)=>`<div class="ph">${im(u,i)}</div>`):[1,2,3,4,5].map(n=>`<div class="ph">স্ক্রিনশট ${bn(n)}</div>`);
  const n=base.length;trk.innerHTML=base.concat(base,base).join('');const items=[...trk.children];
  let i=n,paused=false;
  const place=(instant)=>{if(instant)trk.classList.add('nt');items.forEach((el,k)=>el.classList.toggle('on',k===i));
    const el=items[i];trk.style.transform=`translateX(${vp.clientWidth/2-(el.offsetLeft+el.offsetWidth/2)}px)`;
    if(instant){void trk.offsetWidth;trk.classList.remove('nt')}};
  place(true);addEventListener('resize',()=>place(true));
  vp.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')paused=true});
  vp.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!trk.querySelector('.hold'))paused=false});
  items.forEach(el=>el.addEventListener('click',()=>{const h=el.classList.contains('hold');items.forEach(x=>x.classList.remove('hold'));if(!h){el.classList.add('hold');paused=true}else paused=false}));
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#trk')&&trk.querySelector('.hold')){items.forEach(x=>x.classList.remove('hold'));paused=false}});
  if(!RM)setInterval(()=>{if(paused||document.hidden)return;i++;place(false);
    if(i>=2*n)setTimeout(()=>{i-=n;place(true)},1000)},3000)})();
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
