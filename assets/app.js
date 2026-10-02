const C=window.PATHEYO||{},$=s=>document.querySelector(s),bn=n=>Number(n).toLocaleString('bn-BD');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ok=C.SUPABASE_URL&&C.SUPABASE_ANON_KEY;
const H={apikey:C.SUPABASE_ANON_KEY,Authorization:'Bearer '+C.SUPABASE_ANON_KEY,'Content-Type':'application/json'};
const api=(p,o={})=>fetch(C.SUPABASE_URL+'/rest/v1/'+p,{headers:H,...o}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
// theme
const root=document.documentElement,sv=localStorage.getItem('theme');
root.dataset.theme=sv||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
$('#theme').onclick=()=>{const t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;localStorage.setItem('theme',t)};
$('#menu').onclick=e=>{const o=$('nav').classList.toggle('o');e.currentTarget.setAttribute('aria-expanded',o)};
addEventListener('scroll',()=>$('header').classList.toggle('s',scrollY>8),{passive:true});
// features (verbatim from data/features.json)
const li=i=>`<li>${esc(i.t)}${i.sub.length?`<ul>${i.sub.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}</li>`;
fetch('data/features.json').then(r=>r.json()).then(d=>{$('#feat').innerHTML=d.map((c,k)=>`<details ${k<2?'open':''}><summary><span aria-hidden="true">${c.icon}</span>${esc(c.title)}</summary><ul>${c.items.map(li).join('')}</ul></details>`).join('')}).catch(()=>$('#feat').innerHTML='<p class="empty">ফিচার তালিকা লোড করা যায়নি। পেজটি রিফ্রেশ করুন।</p>');
// stats
const count=(el,v)=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=bn(v);return}const t0=performance.now();(function f(t){const p=Math.min((t-t0)/900,1);el.textContent=bn(Math.round(v*(1-Math.pow(1-p,3))));p<1&&requestAnimationFrame(f)})(t0)};
async function stats(){if(!ok)return;try{const s=await api('rpc/get_public_stats',{method:'POST',body:'{}'});const d=Array.isArray(s)?s[0]:s;count($('#sd'),d.downloads);count($('#su'),d.updates);count($('#sa'),d.active_users)}catch{}}
// releases
// Supabase ছাড়া: GitHub Releases থেকে ভার্সন, APK লিংক, সাইজ ও ডাউনলোড সংখ্যা
const gh=async()=>{const r=await fetch(`https://api.github.com/repos/${C.GITHUB_REPO}/releases`);if(!r.ok)throw 0;const a=(await r.json()).filter(x=>!x.draft);
 count($('#sd'),a.reduce((n,x)=>n+x.assets.reduce((m,f)=>m+f.download_count,0),0));
 return a.map((x,i)=>{const f=x.assets.find(f=>/\.apk$/i.test(f.name))||x.assets[0];return{version:x.tag_name.replace(/^v/i,''),release_date:x.published_at,download_url:f?f.browser_download_url:x.html_url,file_size:f?(f.size/1048576).toFixed(1)+' MB':null,is_latest:i===0&&!x.prerelease,other_changes:(x.body||'').split(/\r?\n/).map(l=>l.replace(/^\s*[-*•#]+\s*/,'').trim()).filter(Boolean)}})};
// স্ক্রিনশট: config.js এর SCREENSHOTS তালিকা থেকে
const S=C.SCREENSHOTS||[];if(S.length){const im=(u,i)=>`<img src="${esc(u)}" alt="Patheyo অ্যাপ স্ক্রিনশট ${i+1}" loading="lazy" decoding="async">`;
 document.querySelectorAll('.phones .ph').forEach((p,i)=>S[i]&&(p.innerHTML=im(S[i],i)));
 $('.shots').innerHTML=S.map((u,i)=>`<div class="ph">${im(u,i)}</div>`).join('')}
const list=(t,a)=>a&&a.length?`<div><h4>${t}</h4><ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
const notes=r=>`<div class="cols">${list('নতুন যা এসেছে',r.new_features)}${list('Improvements',r.improvements)}${list('Bug Fixes',r.bug_fixes)}${list('অন্যান্য',r.other_changes)}</div>`;
const date=d=>new Date(d).toLocaleDateString('bn-BD',{year:'numeric',month:'long',day:'numeric'});
const meta=r=>`<div class="meta"><span>রিলিজ: ${date(r.release_date)}</span>${r.file_size?`<span>সাইজ: ${esc(r.file_size)}</span>`:''}</div>`;
const dl=r=>`<button class="btn p" data-id="${esc(r.version)}" data-url="${esc(r.download_url)}">ডাউনলোড v${esc(r.version)}</button>`;
async function releases(){
  try{const rs=ok?await api('releases?status=eq.published&select=*&order=release_date.desc'):await gh();
    const l=rs.find(r=>r.is_latest)||rs[0];
    if(!l){$('#latest').innerHTML='<p class="empty">এখনো কোনো ভার্সন প্রকাশ হয়নি।</p>';$('#old').innerHTML='<p class="empty">পুরোনো ভার্সন নেই।</p>';return}
    $('#latest').innerHTML=`<div class="rel l"><span class="tag">Latest Release</span><h3>Patheyo v${esc(l.version)}</h3>${meta(l)}${dl(l)}<div style="margin-top:1.4rem">${notes(l)}</div></div>`;
    document.querySelectorAll('.dlbtn').forEach(b=>{b.dataset.id=l.version;b.dataset.url=l.download_url});
    const o=rs.filter(r=>r!==l);
    $('#old').innerHTML=o.length?o.map(r=>`<details class="rel"><summary><b>v${esc(r.version)}</b><span class="meta" style="margin:0">${date(r.release_date)}</span>${dl(r)}</summary>${meta(r)}${notes(r)}</details>`).join(''):'<p class="empty">এখনো কোনো পুরোনো ভার্সন নেই।</p>';
  }catch{$('#latest').innerHTML='<p class="empty">রিলিজ তথ্য এই মুহূর্তে লোড করা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>';$('#old').innerHTML=''}}
// download flow with tracking + fallback
document.addEventListener('click',async e=>{const b=e.target.closest('[data-url]');if(!b)return;
  if(!b.dataset.url){e.preventDefault();alert('ডাউনলোড লিংক এখনো প্রস্তুত নয়।');return}
  e.preventDefault();const t=b.textContent;b.textContent='ডাউনলোড শুরু হচ্ছে…';b.disabled=true;
  try{if(ok)await fetch(C.SUPABASE_URL+'/rest/v1/rpc/track_download',{method:'POST',headers:H,body:JSON.stringify({p_version:b.dataset.id}),keepalive:true})}catch{}
  location.href=b.dataset.url;setTimeout(()=>{b.textContent=t;b.disabled=false},2500)});
stats();releases();
