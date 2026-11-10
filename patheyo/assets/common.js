/* পাথেয় — সব পেজের সাধারণ অংশ: থিম, মেনু, হেডার, ফুটার, স্ন্যাকবার, উপরে যাওয়া, Supabase সহায়ক */
(function(W,D){'use strict';
const C=W.PATHEYO||{},$=s=>D.querySelector(s),$$=s=>[...D.querySelectorAll(s)],root=D.documentElement;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const SB_OK=!!(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY);
const H={apikey:C.SUPABASE_ANON_KEY,Authorization:'Bearer '+C.SUPABASE_ANON_KEY,'Content-Type':'application/json'};
const rpc=(fn,body)=>fetch(C.SUPABASE_URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:H,body:JSON.stringify(body||{})}).then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok){const e=new Error((j&&(j.message||j.hint))||r.status);e.status=r.status;throw e}return j});

// থিম
const tb=$('#theme');if(tb)tb.onclick=()=>{const t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;try{localStorage.setItem('theme',t)}catch{}};
// মোবাইল মেনু
const mb=$('#menu'),nav=$('#nav');
const setNav=o=>{root.classList.toggle('nav-open',o);if(mb){mb.setAttribute('aria-expanded',o);mb.innerHTML=`<svg class="i" aria-hidden="true"><use href="#i-${o?'x':'menu'}"/></svg>`}};
if(mb)mb.onclick=()=>setNav(!root.classList.contains('nav-open'));
if(nav)nav.addEventListener('click',e=>{if(e.target.closest('a'))setNav(false)});
addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('nav-open')){setNav(false);mb&&mb.focus()}});
D.addEventListener('click',e=>{if(root.classList.contains('nav-open')&&!e.target.closest('#nav,#menu'))setNav(false)});
// হেডার: স্ক্রল করলে কাচের পটভূমি
const hdr=$('#hdr');const hs=()=>hdr&&hdr.classList.toggle('s',scrollY>12);addEventListener('scroll',hs,{passive:true});hs();
// ফুটার: সাল ও সোশ্যাল
const y=$('#y');if(y)y.textContent=bn(new Date().getFullYear());
const SOC=C.SOCIAL||{},NAMES=[['facebook','b-fb','ফেসবুক'],['instagram','b-ig','ইনস্টাগ্রাম'],['youtube','b-yt','ইউটিউব']];
const real=u=>u&&/^https:\/\/[^/]+\/[^/]/.test(u);   // শুধু আসল প্রোফাইল লিংক (খালি ডোমেইন বাদ)
const soc=$('#soc');if(soc)soc.innerHTML=NAMES.filter(([k])=>real(SOC[k])).map(([k,ic,n])=>`<a href="${esc(SOC[k])}" target="_blank" rel="noopener" aria-label="${n}"><svg class="si"><use href="#${ic}"/></svg></a>`).join('');
// স্ন্যাকবার
let snT;function snack(msg,acts=[],ms=9000,err){let s=$('#snk');if(!s){s=D.createElement('div');s.id='snk';s.className='snk';s.setAttribute('role','status');D.body.appendChild(s)}
  s.className='snk'+(err?' err':'');s.innerHTML='';const m=D.createElement('span');m.textContent=msg;s.appendChild(m);
  acts.forEach(a=>{const x=D.createElement(a.href?'a':'button');x.textContent=a.t;if(a.href){x.href=a.href;x.target='_blank';x.rel='noopener'}else{x.type='button';x.onclick=a.f}s.appendChild(x)});
  requestAnimationFrame(()=>s.classList.add('show'));clearTimeout(snT);snT=setTimeout(()=>s.classList.remove('show'),ms)}
// উপরে যাওয়ার বাটন — অগ্রগতির রিং, ঘুরন্ত বিন্দু, ওঠা-নামা তীর (আগের অ্যানিমেশন)
(function(){const b=$('#top');if(!b)return;let q=0;
  const upd=()=>{q=0;const m=D.documentElement.scrollHeight-innerHeight,p=m>0?Math.min(Math.max(scrollY/m,0),1):0;b.style.setProperty('--p',p.toFixed(4));b.classList.toggle('show',scrollY>320);b.classList.toggle('z',p<.01)};
  addEventListener('scroll',()=>{if(!q)q=requestAnimationFrame(upd)},{passive:true});addEventListener('resize',upd);upd();
  b.addEventListener('click',()=>{b.classList.add('go');scrollTo({top:0,behavior:'smooth'});setTimeout(()=>b.classList.remove('go'),900)})})();
// সূচিপত্র: এখন কোন অংশ পড়া হচ্ছে
(function(){const links=$$('.toc a');if(!links.length||!('IntersectionObserver' in W))return;
  const map=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){links.forEach(a=>a.classList.remove('on'));const a=map.get(en.target.id);a&&a.classList.add('on')}}),{rootMargin:'-20% 0px -70% 0px'});
  map.forEach((a,id)=>{const el=D.getElementById(id);el&&io.observe(el)})})();

// মোবাইল ডক: হোমে কোন অংশ দেখা হচ্ছে সেটি চিহ্নিত
(function(){const d=$('#dock');if(!d||!$('#sky')||!('IntersectionObserver' in W))return;const map={features:'features',screenshots:'features',download:'dl'};
  const set=k=>$$('#dock a').forEach(a=>a.classList.toggle('on',a.dataset.k===k&&k!=='dl'));set('home');
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)set(map[en.target.id]||'home')}),{rootMargin:'-45% 0px -50% 0px'});
  ['sky','features','screenshots','download','faq'].forEach(id=>{const el=D.getElementById(id);el&&io.observe(el)})})();

W.PT={C,$,$$,esc,bn,SB_OK,H,rpc,snack};
})(window,document);
