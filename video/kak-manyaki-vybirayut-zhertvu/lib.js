// ===== core library: math, camera, post, primitives =====
const W = 1920, H = 1080, FPS = 30;
const C = {
  bg: '#07090c', bg2: '#0e1217', cold: '#8ea2b5', cold2: '#4b5b6b', cold3: '#26313c',
  red: '#b3262c', red2: '#e2443c', white: '#eef1f4', paper: '#cdc9bf', ink: '#17191d', dim: '#5d6b78'
};
const F = { osw: 'Osw', mono: 'Mono', serif: 'Serif', serifb: 'SerifB', sans: 'Sans', nar: 'Narrow', rub: 'Rubik', play: 'Play' };
let NOW = 0;           // absolute time (s)
let FRAME = 0;
const IMG = {}, PROC = {}, CACHE = {};

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, d) => clamp((t - a) / d);
const E = {
  lin: t => t,
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  expo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
};
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hr = (i) => { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hr(i), hr(i + 1), u) * 2 - 1; };

// ---------- events for sound ----------
const EVENTS = [];
function ev(t, type, extra = {}) { EVENTS.push(Object.assign({ t: +t.toFixed(3), type }, extra)); return t; }

// ---------- cues ----------
const norm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');
let _wn = null;
function cue(s, phrase, n = 0, end = false) {
  if (!_wn) _wn = TL.words.map(w => Object.assign({ n: norm(w.w) }, w)).filter(w => w.n);
  const toks = phrase.split(/\s+/).map(norm).filter(x => x);
  const ws = _wn.filter(w => w.s === s);
  let k = 0;
  for (let i = 0; i + toks.length <= ws.length; i++) {
    let ok = true;
    for (let j = 0; j < toks.length; j++) if (!ws[i + j].n.startsWith(toks[j])) { ok = false; break; }
    if (ok) { if (k === n) return end ? ws[i + toks.length - 1].t1 : ws[i].t0; k++; }
  }
  throw new Error('cue not found: ' + s + ' ' + phrase);
}
const cueE = (s, p, n = 0) => cue(s, p, n, true);
const since = t => NOW - t;
const ap = (t, d = 0.5, e = E.out) => e(clamp((NOW - t) / d));   // appear progress

// ---------- camera ----------
let CAM = { x: 0, y: 0, z: 1, r: 0 };
function camera(lt, D, c = {}) {
  const e = c.ease || E.sine;
  const p = e(clamp(lt / Math.max(D, .01)));
  const g = (k, d) => c[k] ? lerp(c[k][0], c[k][1], p) : d;
  const hh = c.hand === undefined ? 1 : c.hand;
  CAM = {
    x: g('x', 0) + (noise1(NOW * .6) * 6 + noise1(NOW * 1.7 + 9) * 2) * hh,
    y: g('y', 0) + (noise1(NOW * .5 + 3) * 5 + noise1(NOW * 1.9 + 5) * 2) * hh,
    z: g('z', 1), r: g('r', 0) + noise1(NOW * .4 + 7) * .002 * hh
  };
}
// draw within parallax layer: depth 0 = static to screen, 1 = full camera
function L(ctx, depth, fn) {
  ctx.save();
  const z = Math.pow(CAM.z, depth);
  ctx.translate(W / 2, H / 2); ctx.rotate(CAM.r * depth); ctx.scale(z, z);
  ctx.translate(-W / 2 - CAM.x * depth, -H / 2 - CAM.y * depth);
  fn(); ctx.restore();
}

// ---------- canvases ----------
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function grainTiles() {
  const out = [];
  for (let k = 0; k < 8; k++) {
    const c = mk(512, 512), x = c.getContext('2d'), d = x.createImageData(512, 512), r = mulberry(k * 99 + 1);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); out.push(c);
  }
  return out;
}
function vignette() {
  const c = mk(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.6, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,.92)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
}
function texNoise(w, h, seed, base, amp, scale = 1, warm = 0) {
  const c = mk(w, h), x = c.getContext('2d'), r = mulberry(seed);
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  // blotches
  x.filter = 'blur(18px)';
  for (let i = 0; i < w * h / 4000 * scale; i++) {
    const rr = 20 + r() * 90 * scale, a = r() * amp * .7;
    x.fillStyle = r() < .5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * .6})`;
    x.beginPath(); x.arc(r() * w, r() * h, rr, 0, 7); x.fill();
  }
  x.filter = 'none';
  const d = x.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) { const n = (r() - .5) * 40 * amp * 4; d.data[i] += n + warm; d.data[i + 1] += n; d.data[i + 2] += n - warm; }
  x.putImageData(d, 0, 0); return c;
}
function corkTex() {
  const c = mk(2600, 1600), x = c.getContext('2d'), r = mulberry(7);
  x.fillStyle = '#2a221c'; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 90000; i++) {
    const v = r(); x.fillStyle = v < .5 ? `rgba(15,10,8,${.25 + r() * .4})` : `rgba(${110 + r() * 40},${85 + r() * 30},${60 + r() * 20},${.12 + r() * .25})`;
    const s = .8 + r() * 3.4; x.fillRect(r() * c.width, r() * c.height, s, s * (0.6 + r()));
  }
  return c;
}
function paperTex(w = 1400, h = 1800, seed = 3) {
  const c = texNoise(w, h, seed, '#c9c4b8', .05, 1.4, 4), x = c.getContext('2d');
  const g = x.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w * .9);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,45,25,.35)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  // fibers
  const r = mulberry(seed + 5); x.strokeStyle = 'rgba(80,70,50,.08)';
  for (let i = 0; i < 400; i++) { x.beginPath(); const a = r() * w, b = r() * h; x.moveTo(a, b); x.lineTo(a + (r() - .5) * 40, b + (r() - .5) * 40); x.stroke(); }
  return c;
}
function brickTex() {
  const c = mk(2400, 1400), x = c.getContext('2d'), r = mulberry(21);
  x.fillStyle = '#111419'; x.fillRect(0, 0, c.width, c.height);
  const bw = 120, bh = 44;
  for (let row = 0; row * bh < c.height; row++) for (let col = -1; col * bw < c.width; col++) {
    const ox = (row % 2) * bw / 2, v = 22 + r() * 16;
    x.fillStyle = `rgb(${v + 4},${v + 3},${v + 6})`; x.fillRect(col * bw + ox + 3, row * bh + 3, bw - 6, bh - 6);
    for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(0,0,0,${r() * .25})`; x.fillRect(col * bw + ox + r() * bw, row * bh + r() * bh, 4 + r() * 10, 2 + r() * 5); }
  }
  return c;
}

// ---------- images ----------
function processImg(key, opt = {}) {
  const im = IMG[key]; const c = mk(im.width, im.height), x = c.getContext('2d');
  x.filter = `grayscale(1) contrast(${opt.c || 1.18}) brightness(${opt.b || .88})`; x.drawImage(im, 0, 0); x.filter = 'none';
  x.globalCompositeOperation = 'multiply'; x.fillStyle = opt.tint || '#c4d0dc'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-over';
  PROC[key] = c; return c;
}
// draw image cover-fit into rect
function cover(ctx, img, x, y, w, h, fx = .5, fy = .5) {
  const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih);
}
function contain(ctx, img, x, y, w, h) {
  const s = Math.min(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); return [x + (w - iw) / 2, y + (h - ih) / 2, iw, ih];
}
// printed photo with white border, shadow, tape, rotation
function print(ctx, key, cx, cy, w, h, o = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); const s = o.s === undefined ? 1 : o.s; ctx.scale(s, s);
  ctx.globalAlpha *= o.a === undefined ? 1 : o.a;
  const b = o.border === undefined ? 14 : o.border;
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = o.bcol || '#d8d5cc'; ctx.fillRect(-w / 2 - b, -h / 2 - b, w + 2 * b, h + 2 * b + (o.pol ? 50 : 0));
  ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
  const img = PROC[key] || IMG[key];
  const kz = o.kz || 1; ctx.translate(o.kx || 0, o.ky || 0); ctx.scale(kz, kz);
  cover(ctx, img, -w / 2, -h / 2, w, h, o.fx === undefined ? .5 : o.fx, o.fy === undefined ? .3 : o.fy);
  ctx.restore();
  if (o.caption) { ctx.fillStyle = '#26282c'; ctx.font = `28px ${F.mono}`; ctx.textAlign = 'center'; ctx.fillText(o.caption, 0, h / 2 + 42); }
  if (o.tape) tape(ctx, 0, -h / 2 - b, 0.04);
  if (o.pin) pin(ctx, 0, -h / 2 + 4);
  ctx.restore();
}
function tape(ctx, x, y, r = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = 'rgba(210,205,190,.55)'; ctx.fillRect(-70, -18, 140, 36);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-70, -18, 140, 6); ctx.restore();
}
function pin(ctx, x, y, col = C.red) {
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(x + 6, y + 8, 11, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, 13); g.addColorStop(0, '#ff8a80'); g.addColorStop(.4, col); g.addColorStop(1, '#3a0808');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); ctx.restore();
}
// red thread with sag; p = draw progress
function thread(ctx, a, b, p = 1, sag = 60, col = C.red) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]);
  const N = 30;
  for (let i = 1; i <= N * p; i++) { const t = i / N; const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0]; const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1]; ctx.lineTo(x, y); }
  ctx.stroke(); ctx.restore();
}

// ---------- text ----------
function font(ctx, fam, size, wt = '') { ctx.font = `${wt} ${size}px ${fam}`.trim(); }
function txt(ctx, s, x, y, o = {}) {
  ctx.save(); font(ctx, o.f || F.osw, o.size || 60, o.wt || '');
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'alphabetic';
  if (o.ls !== undefined) ctx.letterSpacing = o.ls + 'px';
  ctx.globalAlpha *= o.a === undefined ? 1 : o.a;
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.gb || 30; }
  ctx.fillStyle = o.col || C.white; ctx.fillText(s, x, y); ctx.restore();
}
// per-letter rise reveal
function riseText(ctx, s, x, y, t0, o = {}) {
  const lt = NOW - t0; if (lt < 0) return;
  ctx.save(); const GA = ctx.globalAlpha; font(ctx, o.f || F.osw, o.size || 80, o.wt || '');
  const ls = o.ls || 0; ctx.letterSpacing = '0px';
  const chars = [...s]; const ws = chars.map(ch => ctx.measureText(ch).width + ls);
  const tw = ws.reduce((a, b) => a + b, 0) - ls;
  let cx = o.align === 'left' ? x : o.align === 'right' ? x - tw : x - tw / 2;
  const st = o.stagger === undefined ? .028 : o.stagger, d = o.d || .5;
  const out = o.out ? clamp((NOW - o.out) / .4) : 0;
  ctx.textBaseline = 'alphabetic';
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.gb || 25; }
  chars.forEach((ch, i) => {
    const p = E.out(clamp((lt - i * st) / d));
    const a = p * (1 - out) * (o.a === undefined ? 1 : o.a);
    if (a > 0) { ctx.globalAlpha = GA * a; ctx.fillStyle = o.col || C.white; ctx.fillText(ch, cx, y + (1 - p) * (o.dy === undefined ? 40 : o.dy) - out * 20); }
    cx += ws[i];
  });
  ctx.restore(); return tw;
}
// tracking-in text (letterspacing collapses)
function trackText(ctx, s, x, y, t0, o = {}) {
  const lt = NOW - t0; if (lt < 0) return;
  const p = E.expo(clamp(lt / (o.d || 1.2)));
  const out = o.out ? clamp((NOW - o.out) / .5) : 0;
  txt(ctx, s, x, y, Object.assign({}, o, { ls: lerp(o.ls0 === undefined ? 40 : o.ls0, o.ls || 6, p), a: clamp(lt / .4) * (1 - out) * (o.a || 1) }));
}
// slam: big -> settle with motion ghosts
function slamText(ctx, s, x, y, t0, o = {}) {
  const lt = NOW - t0; if (lt < 0) return;
  const d = o.d || .22; const p = clamp(lt / d);
  const out = o.out ? clamp((NOW - o.out) / .35) : 0;
  const sc = lerp(o.from || 2.4, 1, E.out(p));
  const sh = lt < d + .25 && lt > d ? (1 - (lt - d) / .25) * 10 : 0;
  ctx.save(); ctx.translate(x + (Math.random() - .5) * sh, y + (Math.random() - .5) * sh);
  ctx.rotate(o.rot || 0);
  if (p < 1) for (let g = 3; g >= 1; g--) { ctx.save(); const s2 = sc * (1 + g * .08 * (1 - p)); ctx.scale(s2, s2); txt(ctx, s, 0, 0, Object.assign({}, o, { a: .12 * (1 - p) })); ctx.restore(); }
  ctx.scale(sc, sc); txt(ctx, s, 0, 0, Object.assign({}, o, { a: clamp(p * 2) * (1 - out) * (o.a || 1) }));
  ctx.restore();
}
// typewriter
function typeText(ctx, s, x, y, t0, o = {}) {
  const lt = NOW - t0; if (lt < 0) return 0;
  const cps = o.cps || 22; const n = Math.min(s.length, Math.floor(lt * cps));
  ctx.save(); font(ctx, o.f || F.mono, o.size || 44, o.wt || ''); ctx.textAlign = 'left'; ctx.fillStyle = o.col || C.white;
  ctx.globalAlpha *= (o.a === undefined ? 1 : o.a) * (o.out ? 1 - clamp((NOW - o.out) / .4) : 1);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 18; }
  const str = s.slice(0, n);
  let ox = x; if (o.align === 'center') ox = x - ctx.measureText(s).width / 2;
  ctx.fillText(str, ox, y);
  if (o.cursor !== false && (n < s.length || Math.floor(NOW * 2) % 2 === 0) && lt < (s.length / cps + (o.hold || 1.5))) {
    const cw = ctx.measureText(str).width; ctx.fillRect(ox + cw + 4, y - (o.size || 44) * .8, (o.size || 44) * .5, (o.size || 44) * .9);
  }
  ctx.restore(); return n / s.length;
}
function wrapLines(ctx, s, maxW) {
  const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
// stamp (cached render)
function stampCanvas(text, col = C.red, size = 90, sub = '') {
  const key = 'st|' + text + col + size + sub;
  if (CACHE[key]) return CACHE[key];
  const m = mk(10, 10).getContext('2d'); font(m, F.osw, size, '700'); m.letterSpacing = '6px';
  const tw = m.measureText(text).width; const w = tw + size * 1.1, h = size * (sub ? 1.95 : 1.55);
  const c = mk(w + 20, h + 20), x = c.getContext('2d'); x.translate(10, 10);
  x.strokeStyle = col; x.lineWidth = size * .07; x.strokeRect(4, 4, w - 8, h - 8);
  x.lineWidth = size * .03; x.strokeRect(size * .14, size * .14, w - size * .28, h - size * .28);
  x.fillStyle = col; font(x, F.osw, size, '700'); x.letterSpacing = '6px'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2 + 3, sub ? h * .4 : h / 2 + size * .04);
  if (sub) { font(x, F.mono, size * .32); x.letterSpacing = '2px'; x.fillText(sub, w / 2, h * .76); }
  // grunge
  x.globalCompositeOperation = 'destination-out'; const r = mulberry(text.length * 13 + size);
  for (let i = 0; i < w * h / 60; i++) { x.fillStyle = `rgba(0,0,0,${r() * .7})`; const s = r() * 3.5; x.fillRect(r() * w, r() * h, s, s); }
  for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(0,0,0,${.2 + r() * .3})`; x.beginPath(); x.ellipse(r() * w, r() * h, 10 + r() * 50, 3 + r() * 8, r() * 3, 0, 7); x.fill(); }
  CACHE[key] = c; return c;
}
function stamp(ctx, text, x, y, t0, o = {}) {
  const lt = NOW - t0; if (lt < 0) return;
  const c = stampCanvas(text, o.col || C.red, o.size || 90, o.sub || '');
  const p = clamp(lt / .16); const sc = lerp(2.6, 1, E.in(p)) * (o.s || 1);
  const out = o.out ? clamp((NOW - o.out) / .3) : 0;
  const shake = lt > .16 && lt < .4 ? (1 - (lt - .16) / .24) * 8 : 0;
  ctx.save(); ctx.translate(x + (hr(FRAME) - .5) * shake, y + (hr(FRAME + 3) - .5) * shake); ctx.rotate(o.rot === undefined ? -.08 : o.rot); ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(p * 1.5) * (o.a === undefined ? .92 : o.a) * (1 - out);
  if (p < 1) { ctx.filter = `blur(${(1 - p) * 6}px)`; }
  ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.filter = 'none';
  ctx.restore();
}
// hand-drawn strike line
function strike(ctx, x0, x1, y, t0, o = {}) {
  const p = E.out(clamp((NOW - t0) / (o.d || .3))); if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = o.col || C.red2; ctx.lineWidth = o.w || 10; ctx.lineCap = 'round';
  if (o.glow) { ctx.shadowColor = C.red; ctx.shadowBlur = 20; }
  ctx.beginPath(); ctx.moveTo(x0 - 10, y + 6);
  const N = 20; for (let i = 1; i <= N * p; i++) { const t = i / N; ctx.lineTo(lerp(x0 - 10, x1 + 10, t), y + 6 - t * 12 + Math.sin(t * 9 + x0) * 3); }
  ctx.stroke(); ctx.restore();
}
// redaction bar
function redact(ctx, x, y, w, h, o = {}) {
  const off = o.off || 0; if (off >= 1) return;
  ctx.save(); ctx.fillStyle = '#050506';
  const ww = w * (1 - E.io(off));
  const sx = o.dir === 'left' ? x : x + w - ww;
  ctx.fillRect(sx, y, ww, h);
  ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 6; i++) ctx.fillRect(sx + hr(i + x) * ww, y + 2, 2, h - 4);
  ctx.restore();
}
// odometer counter
function odometer(ctx, v, x, y, size, o = {}) {
  ctx.save(); font(ctx, o.f || F.osw, size, o.wt || '700'); ctx.textBaseline = 'middle';
  const digits = o.digits || String(Math.round(o.max || v)).length;
  const dw = ctx.measureText('0').width * 1.02; const tw = dw * digits;
  let x0 = o.align === 'left' ? x : x - tw / 2;
  ctx.beginPath(); ctx.rect(x0 - 10, y - size * .56, tw + 20, size * 1.12); ctx.clip();
  ctx.fillStyle = o.col || C.white; if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; }
  ctx.textAlign = 'center';
  for (let k = digits - 1; k >= 0; k--) {
    const pk = Math.pow(10, k);
    const base = Math.floor(v / pk) % 10;
    const fr = k === 0 ? v - Math.floor(v) : clamp((v % pk) - (pk - 1));
    if (k > 0 && v < pk && o.pad !== true) { x0 += dw; continue; }
    const cx = x0 + dw / 2, sh = size * 1.1;
    ctx.fillText(String(base), cx, y - fr * sh); if (fr > .001) ctx.fillText(String((base + 1) % 10), cx, y - fr * sh + sh);
    x0 += dw;
  }
  ctx.restore();
}
function counter(ctx, n, x, y, t0, o = {}) {
  const lt = NOW - t0; if (lt < 0) return;
  const d = o.d || 1.6; const p = clamp(lt / d);
  const v = n * E.out(p); const sc = 1 + (p >= 1 ? Math.max(0, .12 - (lt - d) * .6) : 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(lt / .2) * (o.out ? 1 - clamp((NOW - o.out) / .4) : 1);
  odometer(ctx, p >= 1 ? n : v, 0, 0, o.size || 300, Object.assign({ max: n }, o));
  ctx.restore();
}

// ---------- figures ----------
function figure(ctx, x, y, h, o = {}) {
  // y = feet. kind: man, woman, child, cop
  const k = o.kind || 'man';
  const ph = o.walk ? o.phase || 0 : 0, sw = o.walk ? Math.sin(ph) : 0;
  const s = h / 100;
  ctx.save(); ctx.translate(x, y); ctx.scale((o.flip ? -1 : 1) * s, s);
  ctx.globalAlpha *= o.a === undefined ? 1 : o.a;
  const col = o.col || '#0b0e12';
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (o.rim) { ctx.shadowColor = o.rim; ctx.shadowBlur = 14; }
  const child = k === 'child';
  const headR = child ? 8.5 : 6.8, headY = child ? -76 : -89;
  const bob = o.walk ? Math.abs(Math.cos(ph)) * 1.2 : 0;
  ctx.translate(0, -bob);
  // legs
  const hipY = child ? -40 : -47, legL = -hipY;
  ctx.lineWidth = child ? 9 : 9.5;
  const lg = (a) => { ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(Math.sin(a) * legL * .5, hipY + legL * .5 * Math.cos(a) + 2); ctx.lineTo(Math.sin(a) * legL * .95, -2 + Math.abs(Math.sin(a)) * 2); ctx.stroke(); };
  if (k === 'woman') { ctx.lineWidth = 7; lg(sw * .35 + .04); lg(-sw * .35 - .04); }
  else { lg(sw * .4 + .06); lg(-sw * .4 - .06); }
  // torso
  const shY = child ? -64 : -76;
  ctx.beginPath();
  if (k === 'woman') {
    ctx.moveTo(-10, shY); ctx.quadraticCurveTo(-13, shY + 4, -9, hipY - 8); ctx.lineTo(-16, hipY + 16); ctx.lineTo(16, hipY + 16); ctx.lineTo(9, hipY - 8); ctx.quadraticCurveTo(13, shY + 4, 10, shY);
  } else {
    const sw2 = child ? 9 : 13;
    ctx.moveTo(-sw2, shY + 1); ctx.quadraticCurveTo(-sw2 - 2, shY + 3, -sw2 + 2, hipY + 4); ctx.lineTo(sw2 - 2, hipY + 4); ctx.quadraticCurveTo(sw2 + 2, shY + 3, sw2, shY + 1);
    if (k === 'coat' || k === 'cop') { ctx.lineTo(sw2 + 1, hipY + 14); ctx.lineTo(-sw2 - 1, hipY + 14); ctx.lineTo(-sw2, shY + 1); }
  }
  ctx.closePath(); ctx.fill();
  // arms
  ctx.lineWidth = child ? 6 : 6.5;
  const arm = (side, a) => { ctx.beginPath(); ctx.moveTo(side * (child ? 7 : 10), shY + 4); ctx.lineTo(side * (child ? 8.5 : 12) + Math.sin(a) * 8, shY + 22); ctx.lineTo(side * (child ? 8.5 : 12) + Math.sin(a) * 14, shY + 38); ctx.stroke(); };
  if (o.armUp) { ctx.beginPath(); ctx.moveTo(11, shY + 3); ctx.lineTo(24, shY - 6); ctx.lineTo(30, shY - 20); ctx.stroke(); arm(-1, -sw * .5); }
  else { arm(-1, -sw * .5); arm(1, sw * .5); }
  // neck + head
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, shY); ctx.lineTo(0, headY + headR); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, headY, headR * .92, headR * 1.08, 0, 0, 7); ctx.fill();
  if (k === 'woman') { ctx.beginPath(); ctx.moveTo(-headR * 1.05, headY - 2); ctx.quadraticCurveTo(-headR * 1.4, headY + 14, -headR * .8, headY + 17); ctx.lineTo(headR * .8, headY + 17); ctx.quadraticCurveTo(headR * 1.4, headY + 14, headR * 1.05, headY - 2); ctx.closePath(); ctx.fill(); }
  if (k === 'cop') { ctx.fillRect(-headR * 1.15, headY - headR * 1.15, headR * 2.3, headR * .7); ctx.fillRect(-headR * 1.5, headY - headR * .55, headR * 3, 2.2); }
  if (o.glasses) { ctx.shadowBlur = 0; ctx.strokeStyle = o.glasses; ctx.lineWidth = 1.2; ctx.strokeRect(-6, headY - 2, 5, 3.5); ctx.strokeRect(1, headY - 2, 5, 3.5); }
  ctx.restore();
}
function bust(ctx, x, y, h, o = {}) {
  // y = bottom of shoulders; h total height
  ctx.save(); ctx.translate(x, y); const s = h / 100; ctx.scale(s, s); ctx.fillStyle = o.col || '#0a0c0f';
  ctx.globalAlpha *= o.a === undefined ? 1 : o.a;
  if (o.rim) { ctx.shadowColor = o.rim; ctx.shadowBlur = 20; }
  ctx.beginPath(); ctx.moveTo(-48, 0); ctx.bezierCurveTo(-48, -26, -40, -34, -16, -38); ctx.lineTo(-9, -46); ctx.lineTo(9, -46); ctx.lineTo(16, -38); ctx.bezierCurveTo(40, -34, 48, -26, 48, 0); ctx.closePath(); ctx.fill();
  if (o.kind === 'woman') { ctx.beginPath(); ctx.moveTo(-21, -66); ctx.bezierCurveTo(-28, -40, -24, -30, -14, -30); ctx.lineTo(14, -30); ctx.bezierCurveTo(24, -30, 28, -40, 21, -66); ctx.closePath(); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, -66, 18, 23, 0, 0, 7); ctx.fill();
  if (o.glasses) { ctx.shadowBlur = 0; ctx.strokeStyle = o.glasses; ctx.lineWidth = 1.6; ctx.strokeRect(-14, -70, 11, 7); ctx.strokeRect(3, -70, 11, 7); ctx.beginPath(); ctx.moveTo(-3, -67); ctx.lineTo(3, -67); ctx.stroke(); }
  ctx.restore();
}
// circle of light
function spot(ctx, x, y, r, a = .5, col = '200,215,230') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.5, `rgba(${col},${a * .35})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function cone(ctx, x, y, w0, w1, h, a = .25, col = '210,220,235') {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w0 / 2, y); ctx.lineTo(x + w0 / 2, y); ctx.lineTo(x + w1 / 2, y + h); ctx.lineTo(x - w1 / 2, y + h); ctx.fill();
}
function pulse(ctx, x, y, t0, o = {}) {
  const lt = NOW - t0; if (lt < 0) return;
  const col = o.col || '226,68,60', r0 = o.r || 10;
  ctx.save();
  for (let k = 0; k < 3; k++) { const ph = ((lt * .8 + k / 3) % 1); ctx.strokeStyle = `rgba(${col},${(1 - ph) * .8})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r0 + ph * (o.R || 70), 0, 7); ctx.stroke(); }
  const pp = E.back(clamp(lt / .35)); ctx.fillStyle = `rgb(${col})`; ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.arc(x, y, r0 * pp, 0, 7); ctx.fill(); ctx.restore();
}

// ---------- icons (line) ----------
function icon(ctx, name, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
  ctx.strokeStyle = o.col || C.white; ctx.fillStyle = o.col || C.white; ctx.lineWidth = o.lw || 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha *= o.a === undefined ? 1 : o.a;
  const P = new Path2D();
  switch (name) {
    case 'finger': for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(0, 6, 8 + i * 6, 12 + i * 7, 0, Math.PI * (1.05 + i * .01), Math.PI * (1.95 - i * .02) + (i % 2) * .3); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-40, 10); ctx.quadraticCurveTo(-40, 50, -10, 56); ctx.moveTo(40, 10); ctx.quadraticCurveTo(38, 48, 12, 56); ctx.stroke(); break;
    case 'eye': ctx.beginPath(); ctx.moveTo(-48, 0); ctx.quadraticCurveTo(0, -42, 48, 0); ctx.quadraticCurveTo(0, 42, -48, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill(); break;
    case 'phone': ctx.beginPath(); ctx.roundRect(-26, -46, 52, 92, 10); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 36, 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, -38); ctx.lineTo(8, -38); ctx.stroke(); break;
    case 'handset': ctx.beginPath(); ctx.moveTo(-34, -30); ctx.quadraticCurveTo(-50, 10, -10, 40); ctx.quadraticCurveTo(20, 56, 36, 34); ctx.lineTo(22, 18); ctx.lineTo(8, 28); ctx.quadraticCurveTo(-14, 14, -16, -4); ctx.lineTo(-4, -16); ctx.lineTo(-18, -38); ctx.closePath(); ctx.stroke(); break;
    case 'car': ctx.beginPath(); ctx.moveTo(-50, 14); ctx.lineTo(-50, -2); ctx.lineTo(-32, -6); ctx.lineTo(-18, -26); ctx.lineTo(22, -26); ctx.lineTo(36, -6); ctx.lineTo(50, -2); ctx.lineTo(50, 14); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(-28, 16, 10, 0, 7); ctx.arc(28, 16, 10, 0, 7); ctx.fill(); break;
    case 'pin': ctx.beginPath(); ctx.moveTo(0, 46); ctx.bezierCurveTo(-10, 30, -34, 6, -34, -14); ctx.arc(0, -14, 34, Math.PI, 0); ctx.bezierCurveTo(34, 6, 10, 30, 0, 46); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -14, 14, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -22); ctx.moveTo(0, -14); ctx.lineTo(6, -10); ctx.stroke(); break;
    case 'crutch': ctx.beginPath(); ctx.moveTo(-14, -48); ctx.lineTo(14, -48); ctx.moveTo(-10, -48); ctx.lineTo(-2, 30); ctx.moveTo(10, -48); ctx.lineTo(2, 30); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.moveTo(0, 30); ctx.lineTo(0, 50); ctx.stroke(); break;
    case 'house': ctx.beginPath(); ctx.moveTo(-44, -4); ctx.lineTo(0, -42); ctx.lineTo(44, -4); ctx.moveTo(-34, -12); ctx.lineTo(-34, 40); ctx.lineTo(34, 40); ctx.lineTo(34, -12); ctx.stroke(); ctx.fillRect(-10, 6, 20, 20); break;
    case 'truck': ctx.beginPath(); ctx.rect(-50, -26, 62, 42); ctx.moveTo(12, -10); ctx.lineTo(34, -10); ctx.lineTo(48, 6); ctx.lineTo(48, 16); ctx.lineTo(12, 16); ctx.stroke(); ctx.beginPath(); ctx.arc(-32, 22, 9, 0, 7); ctx.arc(30, 22, 9, 0, 7); ctx.fill(); break;
    case 'envelope': ctx.beginPath(); ctx.rect(-48, -32, 96, 64); ctx.moveTo(-48, -32); ctx.lineTo(0, 6); ctx.lineTo(48, -32); ctx.stroke(); break;
    case 'magnifier': ctx.beginPath(); ctx.arc(-8, -8, 30, 0, 7); ctx.stroke(); ctx.lineWidth *= 1.8; ctx.beginPath(); ctx.moveTo(14, 14); ctx.lineTo(42, 42); ctx.stroke(); break;
    case 'badge': ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 - Math.PI / 2, r = i % 2 ? 22 : 48; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.stroke(); break;
    case 'rings': ctx.beginPath(); ctx.arc(-16, 6, 24, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(16, 6, 24, 0, 7); ctx.stroke(); break;
    case 'clock': ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.moveTo(0, 0); ctx.lineTo(18, 8); ctx.stroke(); break;
    case 'person': ctx.beginPath(); ctx.arc(0, -26, 16, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-30, 44); ctx.quadraticCurveTo(-30, 0, 0, 0); ctx.quadraticCurveTo(30, 0, 30, 44); ctx.closePath(); ctx.fill(); break;
    case 'trash': ctx.beginPath(); ctx.moveTo(-34, -30); ctx.lineTo(34, -30); ctx.moveTo(-10, -30); ctx.lineTo(-8, -40); ctx.lineTo(8, -40); ctx.lineTo(10, -30); ctx.moveTo(-28, -22); ctx.lineTo(-22, 44); ctx.lineTo(22, 44); ctx.lineTo(28, -22); ctx.stroke(); break;
    case 'cup': ctx.beginPath(); ctx.moveTo(-26, -36); ctx.lineTo(-20, 40); ctx.lineTo(20, 40); ctx.lineTo(26, -36); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-30, -36); ctx.lineTo(30, -36); ctx.moveTo(6, -36); ctx.lineTo(14, -56); ctx.stroke(); break;
    case 'search': ctx.beginPath(); ctx.roundRect(-60, -40, 120, 80, 8); ctx.moveTo(-60, -22); ctx.lineTo(60, -22); ctx.stroke(); ctx.beginPath(); ctx.arc(-50, -31, 3, 0, 7); ctx.arc(-40, -31, 3, 0, 7); ctx.fill(); break;
    case 'q': font(ctx, F.osw, 120, '700'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 0); break;
  }
  ctx.restore();
}
function cross(ctx, x, y, s, t0, col = C.red2) {
  const p = E.out(clamp((NOW - t0) / .25)); if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * .08; ctx.lineCap = 'round'; ctx.shadowColor = C.red; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x - s / 2 + s * Math.min(1, p * 2), y - s / 2 + s * Math.min(1, p * 2)); ctx.stroke();
  if (p > .5) { const q = (p - .5) * 2; ctx.beginPath(); ctx.moveTo(x + s / 2, y - s / 2); ctx.lineTo(x + s / 2 - s * q, y - s / 2 + s * q); ctx.stroke(); }
  ctx.restore();
}

// DNA helix
function helix(ctx, x, y, len, amp, t, o = {}) {
  ctx.save(); const GA = ctx.globalAlpha; ctx.translate(x, y); ctx.rotate(o.rot || 0);
  const n = o.n || 26, ph = t * (o.speed || 1.5);
  const col = o.col || C.cold, col2 = o.col2 || C.red2;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), xx = (u - .5) * len, a = u * Math.PI * 4 + ph;
    const y1 = Math.sin(a) * amp, y2 = Math.sin(a + Math.PI) * amp, z = Math.cos(a);
    const rev = o.reveal === undefined ? 1 : clamp(o.reveal * n - i);
    if (rev <= 0) continue;
    ctx.globalAlpha = GA * rev * (o.a === undefined ? 1 : o.a);
    ctx.strokeStyle = 'rgba(200,210,225,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx, y1); ctx.lineTo(xx, y2); ctx.stroke();
    ctx.fillStyle = z > 0 ? col : col2; ctx.beginPath(); ctx.arc(xx, y1, 7 + z * 3, 0, 7); ctx.fill();
    ctx.fillStyle = z > 0 ? col2 : col; ctx.beginPath(); ctx.arc(xx, y2, 7 - z * 3, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ---------- maps ----------
function proj(lon0, lat0, scale, cx = W / 2, cy = H / 2) {
  const my = l => Math.log(Math.tan(Math.PI / 4 + l * Math.PI / 360)) * 180 / Math.PI;
  const y0 = my(lat0);
  return (lon, lat) => [cx + (lon - lon0) * scale, cy - (my(lat) - y0) * scale];
}
function geoPath(g, P) {
  const path = new Path2D();
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly) { ring.forEach((c, i) => { const [x, y] = P(c[0], c[1]); i ? path.lineTo(x, y) : path.moveTo(x, y); }); path.closePath(); }
  return path;
}
function drawGeo(ctx, feats, P, styleFn) {
  for (const f of feats) { const st = styleFn(f); if (!st) continue; const p = geoPath(f.g, P); if (st.fill) { ctx.fillStyle = st.fill; ctx.fill(p); } if (st.stroke) { ctx.strokeStyle = st.stroke; ctx.lineWidth = st.lw || 1.5; ctx.stroke(p); } }
}
function gridLines(ctx, a = .05) {
  ctx.save(); ctx.strokeStyle = `rgba(142,162,181,${a})`; ctx.lineWidth = 1;
  for (let x = -400; x < W + 400; x += 80) { ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, H + 400); ctx.stroke(); }
  for (let y = -400; y < H + 400; y += 80) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); ctx.stroke(); }
  ctx.restore();
}

// ---------- backgrounds ----------
function bgDark(ctx, tint = '18,24,32') {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * .45, 50, W / 2, H / 2, W * .7); g.addColorStop(0, `rgba(${tint},1)`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// floating dust motes in light (foreground parallax)
function motes(ctx, n = 40, seed = 1, a = .35) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const r = hr(i * 7 + seed), x = (hr(i * 3 + seed) * W * 1.2 + NOW * (10 + r * 20)) % (W * 1.2) - W * .1;
    const y = (hr(i * 5 + seed) * H + Math.sin(NOW * .5 + i) * 20 - NOW * (5 + r * 8)) % H; const yy = y < 0 ? y + H : y;
    ctx.globalAlpha = a * (.3 + .7 * hr(i + 11)) * (.6 + .4 * Math.sin(NOW * 2 + i));
    ctx.fillStyle = '#dfe7ef'; ctx.beginPath(); ctx.arc(x, yy, .8 + r * 2.4, 0, 7); ctx.fill();
  }
  ctx.restore();
}
