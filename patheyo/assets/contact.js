/* পাথেয় — যোগাযোগ পেজ: বার্তা/মতামত/সমস্যা জমা, অ্যাপ থেকে আসা তথ্য, নিজের পাঠানো বার্তার উত্তর দেখা
   অ্যাপ থেকে খুলতে: /patheyo/contact/?from=app&app=3.0.0&device=Samsung%20A15&android=14&iid=<ইনস্টল-আইডি>&type=bug */
(function(W,D){'use strict';
const{C,$,$$,esc,bn,SB_OK,rpc,snack}=W.PT;const f=$('#cform');if(!f)return;
const q=new URLSearchParams(location.search);
const APP={from:q.get('from')==='app'||!!(q.get('app')||q.get('v')),v:(q.get('app')||q.get('v')||'').slice(0,32),device:(q.get('device')||'').slice(0,80),android:(q.get('android')||'').slice(0,16),iid:(q.get('iid')||'').slice(0,64)};
// অ্যাপের তথ্য একবার পেলে এই ব্রাউজারে মনে রাখা (পরের বার লিংক ছাড়াই আসলে কাজে লাগে)
try{if(APP.from)sessionStorage.setItem('pat_app',JSON.stringify(APP));else{const s=JSON.parse(sessionStorage.getItem('pat_app')||'null');if(s)Object.assign(APP,s)}}catch{}
if(APP.from&&(APP.v||APP.device)){const ai=$('#appinfo');ai.hidden=false;
  ai.innerHTML=`<svg class="i" aria-hidden="true"><use href="#i-android"/></svg><span>অ্যাপ থেকে এসেছেন — বার্তার সাথে যুক্ত হবে:</span>${APP.v?`<b>v${esc(APP.v)}</b>`:''}${APP.device?`<b>${esc(APP.device)}</b>`:''}${APP.android?`<b>Android ${esc(APP.android)}</b>`:''}`}

const K={
 message:{l:'আপনার বার্তা',p:'যা জানতে বা বলতে চান, লিখুন…',h:'যত বিস্তারিত লিখবেন, তত দ্রুত সাহায্য করা যাবে।',b:'বার্তা পাঠান'},
 feedback:{l:'আপনার অভিজ্ঞতা',p:'কী ভালো লাগছে, কী আরও ভালো হতে পারে…',h:'আপনার মতামত পাথেয়কে প্রতিনিয়ত উন্নত করে।',b:'মতামত পাঠান'},
 bug:{l:'কী সমস্যা হচ্ছে?',p:'কী করছিলেন, কী হওয়ার কথা ছিল, আর আসলে কী হলো…',h:'অ্যাপের ভার্সন ও ফোনের মডেল লিখলে দ্রুত সমাধান করা যায়।',b:'সমস্যা জানান'},
 feature:{l:'আপনার প্রস্তাব',p:'কোন সুবিধাটি চান, আর সেটি কীভাবে কাজে লাগবে…',h:'ভালো প্রস্তাবগুলো পরের আপডেটের তালিকায় যায়।',b:'প্রস্তাব পাঠান'},
 content:{l:'কোথায় ভুল?',p:'সূরা ও আয়াত নম্বর, বা কিতাব ও হাদিস নম্বর — আর কী ভুল আছে, সঠিকটা কী…',h:'উৎস (বইয়ের নাম/পৃষ্ঠা) দিলে যাচাই করা সহজ হয়।',b:'সংশোধন পাঠান'},
 deletion:{l:'অনুরোধের বিবরণ',p:'যে ইমেইল দিয়ে সাইন-ইন করেছিলেন সেটি ওপরে লিখুন। চাইলে কারণও জানাতে পারেন।',h:'পরিচয় যাচাইয়ের পর যুক্তিসংগত সময়ের মধ্যে ডেটা মুছে ফেলা হবে।',b:'মুছে ফেলার অনুরোধ পাঠান'}};
const kind=()=>(f.querySelector('input[name=kind]:checked')||{}).value||'message';
function applyKind(){const k=kind(),c=K[k];
  $$('[data-for]').forEach(el=>el.hidden=!el.dataset.for.split(' ').includes(k));
  $('#mlabel').textContent=c.l;$('#message').placeholder=c.p;$('#mhint').textContent=c.h;
  $('#send').lastChild.textContent=c.b;
  $('#cmh').textContent=k==='deletion'?'(অ্যাকাউন্টের ইমেইল — আবশ্যক)':'(উত্তর পেতে চাইলে)';
  $('#contact').required=k==='deletion'}
f.addEventListener('change',e=>{if(e.target.name==='kind'){applyKind();saveDraft()}if(e.target.name==='rating')rateT()});
const RT=['','ভালো লাগেনি','চলনসই','ভালো','খুব ভালো','অসাধারণ — জাযাকাল্লাহু খাইরান!'];
const rateT=()=>{const r=f.querySelector('input[name=rating]:checked');$('#ratet').textContent=r?RT[+r.value]:''};
const T=q.get('type');if(T&&K[T]){const r=f.querySelector(`input[name=kind][value="${T}"]`);r&&(r.checked=true)}
// খসড়া সংরক্ষণ — ভুলে পেজ বন্ধ হলেও লেখা হারাবে না
const DK='pat_draft';
function saveDraft(){try{localStorage.setItem(DK,JSON.stringify({k:kind(),n:$('#name').value,c:$('#contact').value,s:$('#subject').value,m:$('#message').value,f:$('#feature').value}))}catch{}}
try{const d=JSON.parse(localStorage.getItem(DK)||'null');if(d){$('#name').value=d.n||'';$('#contact').value=d.c||'';$('#subject').value=d.s||'';$('#message').value=d.m||'';$('#feature').value=d.f||'';if(!T&&d.k&&K[d.k]){const r=f.querySelector(`input[name=kind][value="${d.k}"]`);r&&(r.checked=true)}}}catch{}
let st;f.addEventListener('input',()=>{clearTimeout(st);st=setTimeout(saveDraft,400);cnt()});
const cnt=()=>{$('#mcount').textContent=bn($('#message').value.length)+' / '+bn(4000)};
applyKind();cnt();

const err=(id,msg)=>{const fl=$('#'+id).closest('.fld');fl.classList.add('err');let m=fl.querySelector('.em');if(!m){m=D.createElement('div');m.className='em';m.id=id+'-err';fl.appendChild(m)}m.textContent=msg;$('#'+id).setAttribute('aria-describedby',id+'-err');$('#'+id).setAttribute('aria-invalid','true')};
const clr=()=>$$('.fld.err').forEach(fl=>{fl.classList.remove('err');const m=fl.querySelector('.em');m&&m.remove();const i=fl.querySelector('input,textarea');i&&i.removeAttribute('aria-invalid')});
function validate(){clr();const k=kind(),m=$('#message').value.trim(),c=$('#contact').value.trim();let bad=null;
  if(m.length<5){err('message',k==='feedback'?'অল্প কথায় হলেও অভিজ্ঞতাটা লিখুন।':'বার্তাটি লিখুন (অন্তত কয়েকটি শব্দ)।');bad=bad||'message'}
  if(c&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)&&!/^\+?[\d\s-]{10,16}$/.test(c)){err('contact','সঠিক ইমেইল বা ফোন নম্বর লিখুন, অথবা ঘরটি খালি রাখুন।');bad=bad||'contact'}
  if(k==='deletion'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)){err('contact','যে ইমেইল দিয়ে সাইন-ইন করেছিলেন, সেটি লিখুন।');bad=bad||'contact'}
  if(bad)$('#'+bad).focus();return!bad}

// টিকিট: এই ব্রাউজারে সংরক্ষিত, এগুলো দিয়েই উত্তর দেখা যায়
const TK='pat_tickets';const tickets=()=>{try{return JSON.parse(localStorage.getItem(TK)||'[]')}catch{return[]}};
const KN={message:'বার্তা',feedback:'মতামত',bug:'সমস্যা',feature:'প্রস্তাব',content:'কনটেন্ট সংশোধন',deletion:'ডেটা মোছার অনুরোধ'};
const SN={new:['new','পৌঁছেছে'],read:['','পড়া হয়েছে'],replied:['replied','উত্তর এসেছে'],closed:['','সমাধান হয়েছে']};
async function mine(){const t=tickets();if(!t.length||!SB_OK)return;
  try{const rows=await rpc('my_messages',{p_tokens:t.map(x=>x.token).slice(0,30)});if(!rows||!rows.length)return;
    $('#mymsgs').innerHTML=rows.map(r=>{const[c,l]=SN[r.status]||['',r.status];return`<div class="mm"><div class="mm-h"><b>${esc(r.subject||KN[r.kind]||'বার্তা')}</b><span class="st ${c}">${l}</span><span class="num">#${bn(r.id)}</span><span>${new Date(r.created_at).toLocaleDateString('bn-BD',{day:'numeric',month:'short'})}</span></div><p>${esc(r.message)}</p>${r.reply?`<div class="rp"><small>পাথেয় টিমের উত্তর${r.replied_at?' · '+new Date(r.replied_at).toLocaleDateString('bn-BD',{day:'numeric',month:'long'}):''}</small>${esc(r.reply)}</div>`:''}</div>`}).join('');
    $('#mine').hidden=false;
    if(location.hash==='#mine')$('#mine').scrollIntoView()}catch{}}

f.addEventListener('submit',async e=>{e.preventDefault();if(!validate())return;
  const b=$('#send');if(b.disabled)return;
  const k=kind(),r=f.querySelector('input[name=rating]:checked');
  if($('#website').value){done({id:0});return}            // স্প্যাম-বট: চুপচাপ "সফল" দেখাই
  const p={kind:k,name:$('#name').value.trim(),contact:$('#contact').value.trim(),subject:$('#subject').value.trim(),message:$('#message').value.trim(),
    rating:k==='feedback'&&r?r.value:null,allow_public:k==='feedback'&&$('#allow').checked?'true':'false',feature:['bug','feature','content'].includes(k)?$('#feature').value:'',
    source:APP.from?'app':'web',app_version:APP.v,device:APP.device,android:APP.android,installation_id:APP.iid,page:location.pathname+location.search.slice(0,120),user_agent:navigator.userAgent.slice(0,400)};
  if(!SB_OK){fallback(p);return}
  b.disabled=true;const old=b.lastChild.textContent;b.lastChild.textContent='পাঠানো হচ্ছে…';
  try{const res=await rpc('submit_contact',{p});const t=tickets();t.unshift({id:res.id,token:res.token,kind:k,at:Date.now()});try{localStorage.setItem(TK,JSON.stringify(t.slice(0,30)));localStorage.removeItem(DK)}catch{}done(res);mine()}
  catch(x){const m=String(x.message||'');
    if(/rate_limited/.test(m))snack('অল্প সময়ে অনেক বার্তা পাঠানো হয়েছে। কয়েক মিনিট পরে আবার চেষ্টা করুন।',[],9000,true);
    else if(/message_too_short/.test(m))err('message','বার্তাটি একটু বিস্তারিত লিখুন।');
    else if(x.status===404||/submit_contact/.test(m))fallback(p);
    else snack('বার্তা পাঠানো যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন। আপনার লেখা সংরক্ষিত আছে।',[{t:'আবার চেষ্টা',f:()=>f.requestSubmit()}],12000,true)}
  finally{b.disabled=false;b.lastChild.textContent=old}});
function done(res){f.hidden=true;const d=$('#done');d.hidden=false;
  $('#ticket').innerHTML=res.id?`টিকিট নম্বর <span class="num">#${bn(res.id)}</span>`:'';$('#ticket').hidden=!res.id;
  $('#donep').textContent=kind()==='feedback'?'আপনার মতামতের জন্য জাযাকাল্লাহু খাইরান। এটি আমাদের কাছে অত্যন্ত মূল্যবান।':'জাযাকাল্লাহু খাইরান। আমরা যত দ্রুত সম্ভব দেখব।';
  d.focus();d.scrollIntoView({block:'center'})}
$('#again').onclick=()=>{f.reset();applyKind();rateT();cnt();$('#done').hidden=true;f.hidden=false;$('#message').focus()};
// ডাটাবেস না থাকলে: লেখা কপি করে সোশ্যাল মিডিয়ায় পাঠানোর সুযোগ
function fallback(p){const txt=`[${KN[p.kind]}] ${p.subject||''}\n${p.message}\n— ${p.name||''} ${p.contact||''}${p.app_version?'\nঅ্যাপ: v'+p.app_version:''}${p.device?' · '+p.device:''}`;
  const fb=(C.SOCIAL||{}).facebook,mail=C.CONTACT_EMAIL;
  const acts=[{t:'লেখা কপি করুন',f:()=>navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>snack('কপি হয়েছে — এখন পেস্ট করে পাঠান'))}];
  if(mail)acts.push({t:'ইমেইলে পাঠান',href:`mailto:${mail}?subject=${encodeURIComponent('পাথেয় — '+KN[p.kind])}&body=${encodeURIComponent(txt)}`});
  if(fb)acts.push({t:'ফেসবুকে পাঠান',href:fb});
  snack('এই মুহূর্তে সরাসরি পাঠানো যাচ্ছে না। লেখাটি কপি করে নিচের যেকোনো মাধ্যমে পাঠান:',acts,20000,true)}
// অন্যান্য যোগাযোগ
(function(){const S=C.SOCIAL||{},real=u=>u&&/^https:\/\/[^/]+\/[^/]/.test(u),L=[];
  if(C.CONTACT_EMAIL)L.push(`<a href="mailto:${esc(C.CONTACT_EMAIL)}"><svg class="i"><use href="#i-mail"/></svg>${esc(C.CONTACT_EMAIL)}</a>`);
  if(real(S.facebook))L.push(`<a href="${esc(S.facebook)}" target="_blank" rel="noopener"><svg class="si"><use href="#b-fb"/></svg>ফেসবুক পেজ</a>`);
  if(real(S.youtube))L.push(`<a href="${esc(S.youtube)}" target="_blank" rel="noopener"><svg class="si"><use href="#b-yt"/></svg>ইউটিউব চ্যানেল</a>`);
  if(real(S.instagram))L.push(`<a href="${esc(S.instagram)}" target="_blank" rel="noopener"><svg class="si"><use href="#b-ig"/></svg>ইনস্টাগ্রাম</a>`);
  const el=$('#altc');if(L.length)el.innerHTML=L.join('');else el.closest('.acard').hidden=true})();
mine();
})(window,document);
