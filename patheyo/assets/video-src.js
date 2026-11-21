/* Patheyo — ভিডিও লিংক চেনা (ওয়েবসাইট ও অ্যাডমিন প্যানেল দুই জায়গাতেই এই একই ফাইল)
   যেকোনো লিংক দিলে বুঝে নেয় সেটা কোন ধরনের, আর কীভাবে চালাতে হবে:
     • YouTube (watch / youtu.be / shorts / live / embed)   → YouTube প্লেয়ার, থাম্বনেইল নিজে থেকে
     • Google Drive (file/d/…/view, open?id=…)              → Drive প্লেয়ার, থাম্বনেইল নিজে থেকে
     • Facebook ভিডিও / রিল (facebook.com, fb.watch)        → Facebook প্লেয়ার
     • Vimeo                                                → Vimeo প্লেয়ার
     • Dropbox শেয়ার লিংক                                   → সরাসরি ফাইল হিসেবে
     • GitHub রিলিজ / যেকোনো .mp4 .webm .m4v .mov লিংক      → ওয়েবসাইটের নিজস্ব প্লেয়ার
*/
(function (W) {
  'use strict';
  var FILE_RE = /\.(mp4|m4v|webm|mov|ogv|ogg)(\?|#|$)/i;

  function yt(u) {
    var h = u.hostname.replace(/^www\.|^m\./, ''), id = '', m;
    if (h === 'youtu.be') id = u.pathname.split('/')[1] || '';
    else if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) {
      if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
      else if ((m = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/))) id = m[2];
    }
    return /^[\w-]{6,20}$/.test(id) ? id : '';
  }

  function parse(raw) {
    var s = String(raw || '').trim(), u;
    if (!s) return { kind: 'none' };
    try { u = new URL(s); } catch (e) { return { kind: 'bad', reason: 'লিংকটি ঠিক নেই' }; }
    if (u.protocol !== 'https:') return { kind: 'bad', reason: 'লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে' };
    var h = u.hostname.replace(/^www\.|^m\./, ''), id, m;

    if ((id = yt(u))) {
      var shorts = /^\/shorts\//.test(u.pathname), t = parseInt(u.searchParams.get('t') || u.searchParams.get('start') || '0', 10) || 0;
      return { kind: 'youtube', label: 'YouTube', id: id, vertical: shorts,
        embed: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin) + (t ? '&start=' + t : ''),
        seekable: true,
        thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg', open: 'https://www.youtube.com/watch?v=' + id };
    }
    if (h === 'drive.google.com' || h === 'docs.google.com') {
      id = (u.pathname.match(/\/d\/([\w-]{10,})/) || [])[1] || u.searchParams.get('id') || '';
      if (id) return { kind: 'drive', label: 'Google Drive', id: id,
        embed: 'https://drive.google.com/file/d/' + id + '/preview',
        thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w800', open: 'https://drive.google.com/file/d/' + id + '/view' };
    }
    if (h === 'vimeo.com' || h === 'player.vimeo.com') {
      id = (u.pathname.match(/(\d{5,})/) || [])[1];
      if (id) return { kind: 'vimeo', label: 'Vimeo', id: id, embed: 'https://player.vimeo.com/video/' + id + '?autoplay=1', thumb: '', open: 'https://vimeo.com/' + id, seekable: true };
    }
    if (/(^|\.)facebook\.com$/.test(h) || h === 'fb.watch') {
      var reel = /\/reel\//.test(u.pathname);
      return { kind: 'facebook', label: 'Facebook', vertical: reel,
        embed: 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(s) + '&show_text=false&autoplay=true&allowfullscreen=true',
        thumb: '', open: s };
    }
    if (/(^|\.)dropbox\.com$/.test(h)) {
      u.searchParams.delete('dl'); u.searchParams.set('raw', '1');
      return { kind: 'file', label: 'Dropbox', src: u.toString(), thumb: '', open: s, type: typeOf(u.pathname) };
    }
    var gh = h === 'github.com' && /\/releases\/download\//.test(u.pathname);
    if (gh || FILE_RE.test(u.pathname) || /(^|\.)githubusercontent\.com$/.test(h) || /supabase\.co$/.test(h))
      return { kind: 'file', label: gh ? 'GitHub রিলিজ' : 'সরাসরি ফাইল', src: s, thumb: '', open: s, type: typeOf(u.pathname) };
    // অচেনা লিংক — ভিডিও ফাইল ধরে নিয়ে চালানোর চেষ্টা; না চললে প্লেয়ারে "সরাসরি খুলে দেখুন" আসে
    return { kind: 'file', label: 'অন্যান্য লিংক', src: s, thumb: '', open: s, type: typeOf(u.pathname), unsure: true };
  }

  function typeOf(p) {
    var e = (String(p).toLowerCase().match(/\.(\w+)$/) || [])[1];
    return e === 'webm' ? 'video/webm' : (e === 'ogv' || e === 'ogg') ? 'video/ogg' : 'video/mp4';
  }

  /* ---------- টাইমকোড (অধ্যায়) ----------
     প্রতি লাইনে একটা সময় আর তার নাম — YouTube-এর বিবরণের মতোই। যেকোনো ধরনে লিখলে চলে:
       0:00 শুরু            ১:২৫ Samsung ফোনে ইনস্টল        (2:10) Xiaomi / Redmi
       Realme ও Oppo - 3:05      1:02:30 শেষ কথা
     সময় ছাড়া লাইন (যেমন YouTube বিবরণের অন্য লেখা) নিজে থেকে বাদ যায়। */
  var BN = '০১২৩৪৫৬৭৮৯';
  function en(s) { return String(s).replace(/[০-৯]/g, function (d) { return BN.indexOf(d); }); }
  function toSec(t) {
    var p = en(t).split(':').map(Number);
    if (p.some(isNaN)) return -1;
    if (p.length === 2) return p[1] < 60 ? p[0] * 60 + p[1] : -1;
    if (p.length === 3) return p[1] < 60 && p[2] < 60 ? p[0] * 3600 + p[1] * 60 + p[2] : -1;
    return -1;
  }
  var TS = '((?:[0-9০-৯]{1,2}:)?[0-9০-৯]{1,3}:[0-9০-৯]{2})';
  var RE_START = new RegExp('^[\\s\\-•*▶►·>]*[\\[(]?' + TS + '[\\])]?\\s*(?:[-–—:|.)]\\s*)?(.*)$');
  var RE_END = new RegExp('^[\\s\\-•*▶►·>]*(.+?)\\s*[-–—:|]?\\s*[\\[(]?' + TS + '[\\])]?\\s*$');
  function chapters(text) {
    var out = [], seen = {};
    String(text || '').split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      var m = line.match(RE_START), t, label;
      if (m) { t = m[1]; label = m[2]; } else if ((m = line.match(RE_END))) { t = m[2]; label = m[1]; } else return;
      var sec = toSec(t); label = String(label || '').replace(/^[\s\-–—:|.]+/, '').trim();
      if (sec < 0 || seen[sec]) return;
      seen[sec] = 1; out.push({ sec: sec, label: label || fmt(sec) });
    });
    return out.sort(function (a, b) { return a.sec - b.sec; });
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }

  /* ---------- এমবেড প্লেয়ার নিয়ন্ত্রণ (পেজ রিলোড ছাড়াই নির্দিষ্ট সময়ে যাওয়া + এখন কোন সময় চলছে জানা) ----------
     YouTube ও Vimeo-র অফিসিয়াল postMessage ব্যবস্থা ব্যবহার করে — বাইরের কোনো লাইব্রেরি লাগে না। */
  function control(iframe, kind, onTime) {
    var win = function () { return iframe && iframe.contentWindow; }, alive = true, timer = 0;
    var post = function (o, origin) { try { win() && win().postMessage(JSON.stringify(o), origin || '*'); } catch (e) {} };
    var onMsg = function (e) {
      if (!alive || !iframe || e.source !== win()) return;
      var d = e.data; try { if (typeof d === 'string') d = JSON.parse(d); } catch (x) { return; }
      if (!d) return;
      if (kind === 'youtube' && d.event === 'infoDelivery' && d.info && typeof d.info.currentTime === 'number') onTime && onTime(d.info.currentTime);
      if (kind === 'vimeo' && (d.event === 'timeupdate' || d.event === 'playProgress') && d.data) onTime && onTime(+d.data.seconds || 0);
      if (kind === 'vimeo' && d.event === 'ready') post({ method: 'addEventListener', value: 'timeupdate' });
    };
    addEventListener('message', onMsg);
    var hello = function () {
      if (kind === 'youtube') post({ event: 'listening', id: 'pt', channel: 'widget' });
      if (kind === 'vimeo') post({ method: 'addEventListener', value: 'timeupdate' });
    };
    iframe.addEventListener('load', function () { hello(); var n = 0; clearInterval(timer); timer = setInterval(function () { hello(); if (++n > 6) clearInterval(timer); }, 700); });
    return {
      seek: function (sec) {
        if (kind === 'youtube') { post({ event: 'command', func: 'seekTo', args: [sec, true], id: 'pt', channel: 'widget' }); post({ event: 'command', func: 'playVideo', args: [], id: 'pt', channel: 'widget' }); }
        if (kind === 'vimeo') { post({ method: 'setCurrentTime', value: sec }); post({ method: 'play' }); }
      },
      destroy: function () { alive = false; clearInterval(timer); removeEventListener('message', onMsg); }
    };
  }

  W.PTVideo = { parse: parse, chapters: chapters, fmt: fmt, toSec: toSec, control: control };
})(window);
