/* পাথেয় — সুন্দর ডায়ালগ (ব্রাউজারের ডিফল্ট confirm/prompt-এর বদলে)
   PTDialog.ask({title,message,quote,ok,cancel,tone})  → Promise<true|false>   tone: 'danger' | 'send' | 'info'
   PTDialog.copy({title,message,value})                → লিংক দেখিয়ে কপি করার ডায়ালগ */
(function(W,D){'use strict';
if(W.PTDialog)return;
var css='.ptd-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(3,10,24,.52);-webkit-backdrop-filter:blur(7px) saturate(1.1);backdrop-filter:blur(7px) saturate(1.1);opacity:0;transition:opacity .18s ease}'
+'.ptd-ov.in{opacity:1}'
+'.ptd{--b:#235FFE;--bg:rgba(255,255,255,.92);--fg:#0b1a33;--mut:#4a586c;--ln:rgba(0,40,100,.14);--soft:rgba(0,70,160,.07);--sh:0 30px 80px rgba(0,20,60,.35);'
+'width:min(92vw,25rem);box-sizing:border-box;padding:1.5rem 1.4rem 1.2rem;border-radius:22px;text-align:center;color:var(--fg);background:var(--bg);border:1px solid var(--ln);box-shadow:var(--sh),inset 0 1px 0 rgba(255,255,255,.6);'
+'-webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4);font-family:"Plus Jakarta Sans",Gunjoron,system-ui,sans-serif;line-height:1.55;transform:translateY(14px) scale(.96);transition:transform .22s cubic-bezier(.2,.9,.3,1.2)}'
+'.ptd-ov.in .ptd{transform:none}'
+':root[data-theme=dark] .ptd,.ptd.dk{--bg:rgba(14,28,54,.9);--fg:#f3f7fc;--mut:#a9bad0;--ln:rgba(255,255,255,.14);--soft:rgba(255,255,255,.07);--sh:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08)}'
+'.ptd.danger{--b:#E5252E}.ptd.send{--b:#235FFE}.ptd.info{--b:#0E8F6A}'
+'.ptd-ic{width:3.6rem;height:3.6rem;margin:0 auto .85rem;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--b) 14%,transparent);color:var(--b);box-shadow:0 0 0 6px color-mix(in srgb,var(--b) 7%,transparent)}'
+'.ptd-ic svg{width:1.7rem;height:1.7rem;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
+'.ptd h2{margin:0 0 .35rem;font-size:1.18rem;font-weight:800;line-height:1.35}'
+'.ptd p{margin:0;color:var(--mut);font-size:.95rem;overflow-wrap:anywhere}'
+'.ptd-q{margin:.85rem 0 0;padding:.6rem .8rem;border-radius:12px;background:var(--soft);border:1px solid var(--ln);font-weight:700;font-size:.92rem;overflow-wrap:anywhere;max-height:7.5rem;overflow:auto}'
+'.ptd-in{display:block;width:100%;box-sizing:border-box;margin:.85rem 0 0;padding:.65rem .8rem;border-radius:12px;border:1px solid var(--ln);background:var(--soft);color:var(--fg);font:600 .88rem/1.4 "Plus Jakarta Sans",Gunjoron,system-ui,sans-serif;text-align:left;direction:ltr}'
+'.ptd-in:focus{outline:2px solid var(--b);outline-offset:1px}'
+'.ptd-bt{display:flex;gap:.6rem;margin-top:1.25rem}'
+'.ptd-bt button{flex:1;min-height:2.8rem;border-radius:13px;border:1px solid var(--ln);background:var(--soft);color:var(--fg);font:700 .95rem/1 "Plus Jakarta Sans",Gunjoron,system-ui,sans-serif;cursor:pointer;transition:transform .12s,filter .12s}'
+'.ptd-bt button:hover{filter:brightness(1.06)}.ptd-bt button:active{transform:scale(.97)}'
+'.ptd-bt button:focus-visible{outline:2px solid var(--b);outline-offset:2px}'
+'.ptd-bt .ptd-ok{background:var(--b);border-color:transparent;color:#fff;box-shadow:0 8px 20px color-mix(in srgb,var(--b) 38%,transparent)}'
+'@media(max-width:420px){.ptd-bt{flex-direction:column-reverse}}'
+'@media(prefers-reduced-motion:reduce){.ptd-ov,.ptd{transition:none}}';
var ICON={
danger:'<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v5M14 11v5"/></svg>',
send:'<svg viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>',
info:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>'};
function inject(){if(D.getElementById('ptd-css'))return;var s=D.createElement('style');s.id='ptd-css';s.textContent=css;D.head.appendChild(s)}
function el(t,c,x){var e=D.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function open(o,mode){
  inject();
  return new Promise(function(done){
    var prev=D.activeElement,tone=o.tone||'info',ov=el('div','ptd-ov'),bx=el('div','ptd '+tone),uid='ptd'+Date.now();
    bx.setAttribute('role',mode==='ask'&&tone==='danger'?'alertdialog':'dialog');bx.setAttribute('aria-modal','true');bx.setAttribute('aria-labelledby',uid+'t');
    var ic=el('div','ptd-ic');ic.innerHTML=ICON[tone]||ICON.info;ic.setAttribute('aria-hidden','true');
    var h=el('h2',null,o.title||'নিশ্চিত?');h.id=uid+'t';
    bx.appendChild(ic);bx.appendChild(h);
    if(o.message){var p=el('p',null,o.message);p.id=uid+'d';bx.setAttribute('aria-describedby',uid+'d');bx.appendChild(p)}
    if(o.quote)bx.appendChild(el('div','ptd-q',o.quote));
    var inp=null;if(mode==='copy'){inp=el('input','ptd-in');inp.readOnly=true;inp.value=o.value||'';inp.setAttribute('aria-label','লিংক');bx.appendChild(inp)}
    var bt=el('div','ptd-bt'),no=el('button',null,o.cancel||(mode==='copy'?'বন্ধ করুন':'বাতিল')),yes=el('button','ptd-ok',o.ok||(mode==='copy'?'কপি করুন':'নিশ্চিত'));
    no.type=yes.type='button';bt.appendChild(no);bt.appendChild(yes);bx.appendChild(bt);ov.appendChild(bx);
    var root=D.documentElement;if(root.dataset.theme!=='dark'&&!root.dataset.theme&&W.matchMedia&&W.matchMedia('(prefers-color-scheme:dark)').matches)bx.classList.add('dk');
    var fin=false;
    function close(v){if(fin)return;fin=true;D.removeEventListener('keydown',key,true);ov.classList.remove('in');
      setTimeout(function(){if(ov.parentNode)ov.parentNode.removeChild(ov);try{prev&&prev.focus&&prev.focus()}catch(e){}},170);done(v)}
    function copyNow(){var v=inp.value;inp.focus();inp.select();var ok=false;try{ok=D.execCommand('copy')}catch(e){}
      if(!ok&&navigator.clipboard)navigator.clipboard.writeText(v).then(function(){yes.textContent='কপি হয়েছে ✓'},function(){});else if(ok)yes.textContent='কপি হয়েছে ✓'}
    function key(e){
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(false)}
      else if(e.key==='Enter'&&D.activeElement!==no){e.preventDefault();if(mode==='copy')copyNow();else close(true)}
      else if(e.key==='Tab'){var f=[no,yes];if(inp)f.unshift(inp);var i=f.indexOf(D.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus()}}
    no.onclick=function(){close(false)};
    yes.onclick=function(){mode==='copy'?copyNow():close(true)};
    ov.addEventListener('mousedown',function(e){if(e.target===ov)close(false)});
    D.addEventListener('keydown',key,true);
    D.body.appendChild(ov);
    W.requestAnimationFrame(function(){ov.classList.add('in');
      // বিপজ্জনক কাজে ভুলে Enter চাপলে যেন মুছে না যায়: ফোকাস থাকে "বাতিল"-এ
      (mode==='copy'?(inp.select(),inp):(tone==='danger'?no:yes)).focus()});
  });
}
W.PTDialog={
  ask:function(o){return open(typeof o==='string'?{message:o}:o,'ask')},
  copy:function(o){return open(o,'copy')}
};
})(window,document);
