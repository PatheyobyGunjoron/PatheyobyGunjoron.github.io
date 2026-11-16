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
        embed: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1' + (t ? '&start=' + t : ''),
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
      if (id) return { kind: 'vimeo', label: 'Vimeo', id: id, embed: 'https://player.vimeo.com/video/' + id + '?autoplay=1', thumb: '', open: 'https://vimeo.com/' + id };
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

  W.PTVideo = { parse: parse };
})(window);
