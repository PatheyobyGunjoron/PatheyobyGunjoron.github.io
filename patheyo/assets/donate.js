/* পাথেয় ওয়েবসাইট — দান (ডোনেশন) পপআপ
   খোলে: হেডারের "দান করুন", হোমের #donate অংশ, ফুটারের লিংক — যেকোনো [data-donate]
   সার্ভার: config.js → PAY_API_URL (অ্যাপের পেমেন্ট সার্ভার, server/payments) → POST /donate/create
            → পেমেন্ট পেজ (বিকাশ · নগদ · রকেট · ব্যাংক/কার্ড) → শেষে এই পেজেই ?donate=success ফিরে আসে
   গোপনীয়তা: নাম, নম্বর, ইমেইল কিছুই নেওয়া হয় না — শুধু অঙ্ক ও পছন্দের পদ্ধতি। */
(function (W, D) {
  'use strict';
  var C = W.PATHEYO || {}, API = String(C.PAY_API_URL || '').replace(/\/$/, '');
  var BN = '০১২৩৪৫৬৭৮৯';
  function bn(x) { return String(x).replace(/\d/g, function (d) { return BN[d]; }); }
  function money(v) { return '৳' + bn(Number(v).toLocaleString('en-IN')); }
  var ICON = function (k) { return '<svg class="i" aria-hidden="true"><use href="#i-' + k + '"/></svg>'; };
  var MIN = 10, MAX = 100000, PRESETS = [50, 100, 200, 500, 1000];
  var METHODS = [
    { k: 'bkash', t: 'বিকাশ', s: 'bKash', c: '#E2136E', i: 'phonepay' },
    { k: 'nagad', t: 'নগদ', s: 'Nagad', c: '#F26A21', i: 'phonepay' },
    { k: 'rocket', t: 'রকেট', s: 'Rocket', c: '#8C3494', i: 'phonepay' },
    { k: 'bank', t: 'ব্যাংক', s: 'কার্ড · নেট ব্যাংকিং', c: '#1F6FD1', i: 'bank' }];
  var st = { amt: 100, other: '', m: 'bkash', busy: false, cfg: null };
  try { var l = JSON.parse(localStorage.getItem('pat_dn') || '{}'); if (l.m) st.m = l.m; if (l.a) { if (PRESETS.indexOf(l.a) >= 0) st.amt = l.a; else { st.amt = 'other'; st.other = String(l.a); } } } catch (e) {}

  var box, card, prev;
  function build() {
    if (box) return;
    box = D.createElement('div'); box.className = 'dnm'; box.hidden = true;
    box.innerHTML = '<div class="dnm-bd" data-x></div>' +
      '<div class="dnm-c" role="dialog" aria-modal="true" aria-labelledby="dnm-t" tabindex="-1">' +
      '<button class="dnm-x" type="button" data-x aria-label="বন্ধ করুন">' + ICON('x') + '</button>' +
      '<div class="dnm-give">' +
        '<div class="dnm-hero"><span class="dnm-medal">' + ICON('donate') + '</span>' +
        '<h3 id="dnm-t">পাথেয়কে সহযোগিতা করুন</h3><p>আপনার ডোনেশন হয়ে থাকুক সদকায়ে জারিয়া — কুরআন, হাদিস, নামাজ ও দোয়া থাকবে সবার জন্য বিনামূল্যে।</p>' +
        '<span class="dnm-test" hidden>পরীক্ষামূলক সংস্করণ — এখন কোনো টাকা কাটা হবে না</span></div>' +
        '<div class="dnm-lbl">ডোনেশনের পরিমাণ</div><div class="dnm-amts" role="radiogroup" aria-label="ডোনেশনের পরিমাণ">' +
          PRESETS.map(function (a) { return '<button type="button" role="radio" data-a="' + a + '">' + money(a) + '</button>'; }).join('') +
          '<button type="button" role="radio" data-a="other" class="o">অন্য</button></div>' +
        '<label class="dnm-other" hidden><span>৳</span><input type="number" inputmode="numeric" min="10" max="100000" placeholder="পরিমাণ লিখুন (৳১০ বা বেশি)" aria-label="ডোনেশনের পরিমাণ"></label>' +
        '<div class="dnm-lbl">পেমেন্ট পদ্ধতি</div><div class="dnm-ms" role="radiogroup" aria-label="পেমেন্ট পদ্ধতি">' +
          METHODS.map(function (m) { return '<button type="button" role="radio" data-m="' + m.k + '" style="--m:' + m.c + '"><span class="mi">' + ICON(m.i) + '</span><b>' + m.t + '</b><small>' + m.s + '</small></button>'; }).join('') +
        '</div>' +
        '<button class="dnm-go" type="button"></button>' +
        '<p class="dnm-sm">' + ICON('lock') + 'নিরাপদ পেমেন্ট · নাম, নম্বর বা কোনো ব্যক্তিগত তথ্য সংরক্ষণ করা হয় না</p>' +
      '</div>' +
      '<div class="dnm-thx"><span class="dnm-burst">' + ICON('donate') + '</span><h3>জাযাকাল্লাহু খাইরান!</h3><p class="dnm-thx-p"></p>' +
        '<button class="dnm-go" type="button" data-x>আলহামদুলিল্লাহ</button><button class="dnm-again" type="button">আবার ডোনেট করুন</button></div>' +
      '</div>';
    D.body.appendChild(box);
    card = box.querySelector('.dnm-c');
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) { close(); return; }
      if (e.target.closest('.dnm-again')) { view('give'); return; }
      var a = e.target.closest('[data-a]');
      if (a) { var v = a.getAttribute('data-a'); st.amt = v === 'other' ? 'other' : Number(v); paint(); if (st.amt === 'other') setTimeout(function () { inp().focus(); }, 40); return; }
      var m = e.target.closest('[data-m]'); if (m) { st.m = m.getAttribute('data-m'); paint(); return; }
      if (e.target.closest('.dnm-give .dnm-go')) go();
    });
    inp().addEventListener('input', function () { st.other = this.value; paint(); });
    inp().addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        var f = [].filter.call(card.querySelectorAll('button,input'), function (x) { return x.offsetParent !== null && !x.disabled; });
        if (!f.length) return; var i = f.indexOf(D.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function inp() { return box.querySelector('.dnm-other input'); }
  function cur() { return st.amt === 'other' ? Math.round(Number(st.other) || 0) : st.amt; }
  function view(v) { card.setAttribute('data-v', v); }
  function paint() {
    [].forEach.call(box.querySelectorAll('[data-a]'), function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-a') === String(st.amt))); });
    box.querySelector('.dnm-other').hidden = st.amt !== 'other'; if (inp().value !== st.other) inp().value = st.other;
    [].forEach.call(box.querySelectorAll('[data-m]'), function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-m') === st.m)); });
    var v = cur(), g = box.querySelector('.dnm-give .dnm-go');
    var ok = v >= MIN && v <= MAX;
    g.innerHTML = API ? (ok ? ICON('donate') + money(v) + ' ডোনেট করুন' : 'পরিমাণ লিখুন (৳১০ – ৳১,০০,০০০)') : 'শীঘ্রই চালু হচ্ছে';
    g.disabled = !API || !ok || st.busy;
    g.classList.toggle('busy', st.busy);
  }
  function open(v) {
    build(); prev = D.activeElement; view(v || 'give'); paint();
    box.hidden = false; D.documentElement.classList.add('dnm-on');
    requestAnimationFrame(function () { box.classList.add('in'); (v === 'thx' ? box.querySelector('.dnm-thx .dnm-go') : box.querySelector('[data-a][aria-checked=true]') || card).focus(); });
    if (!st.cfg && API) fetch(API + '/donate/config').then(function (r) { return r.json(); }).then(function (c) {
      st.cfg = c; if (c && c.ok) { MIN = c.min || MIN; MAX = c.max || MAX; box.querySelector('.dnm-test').hidden = !c.sandbox; paint(); }
    }).catch(function () {});
  }
  function close() {
    if (!box || box.hidden) return; box.classList.remove('in'); D.documentElement.classList.remove('dnm-on');
    setTimeout(function () { box.hidden = true; try { prev && prev.focus && prev.focus(); } catch (e) {} }, 180);
  }
  function note(t) { if (W.PT && W.PT.snack) W.PT.snack(t); else if (W.PTDialog) W.PTDialog.ask({ tone: 'info', title: 'ডোনেশন', message: t, ok: 'ঠিক আছে', cancel: 'বন্ধ' }); }
  function go() {
    var v = cur(); if (st.busy || !API || v < MIN || v > MAX) return;
    st.busy = true; paint();
    try { localStorage.setItem('pat_dn', JSON.stringify({ a: v, m: st.m })); } catch (e) {}
    var back = location.origin + location.pathname + location.search;
    fetch(API + '/donate/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: v, method: st.m, src: 'web', back: back }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok && /^https:\/\//.test(j.url)) { location.href = j.url; return; }
        st.busy = false; paint(); note((j && j.msg) || 'পেমেন্ট পেজ খোলা যায়নি। একটু পরে চেষ্টা করুন।');
      })
      .catch(function () { st.busy = false; paint(); note('সার্ভারে পৌঁছানো যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।'); });
  }

  W.ptOpenDonate = function () { open('give'); };
  D.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-donate]'); if (!b) return;
    e.preventDefault(); open('give');
  });

  /* পেমেন্ট থেকে ফেরত: ?donate=success|failed|cancelled&ref=<অঙ্ক>#donate */
  function onReturn() {
    var q = new URLSearchParams(location.search), r = q.get('donate'); if (!r) return;
    var amt = Number(q.get('ref')) || 0;
    q.delete('donate'); q.delete('ref');
    try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } catch (e) {}
    if (r === 'success') {
      build(); box.querySelector('.dnm-thx-p').textContent = (amt ? money(amt) + ' ডোনেশন সফলভাবে পৌঁছেছে। ' : 'আপনার ডোনেশন সফলভাবে পৌঁছেছে। ') + 'আল্লাহ কবুল করুন এবং আপনাকে উত্তম প্রতিদান দিন।';
      open('thx');
    } else note(r === 'cancelled' ? 'ডোনেশন বাতিল করা হয়েছে।' : 'ডোনেশন সম্পন্ন হয়নি। টাকা কেটে থাকলে কিছুক্ষণের মধ্যে স্বয়ংক্রিয়ভাবে ঠিক হয়ে যাবে।');
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', onReturn); else onReturn();
})(window, document);
