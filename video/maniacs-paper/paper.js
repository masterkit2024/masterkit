// ===== paper material library =====
const K = require('./core');
const { mk, W, H, F, clamp, lerp, mulberry, hr, noise1, font, Path2D } = K;

const P = { // palettes
  cream: '#efe6d2', kraft: '#c49a64', kraft2: '#b8885a', yellow: '#f2c14e', coral: '#ee6c5a', teal: '#2a9d8f', teal2: '#5cc2b4', red: '#d1242c', ink: '#1d2433', white: '#fbf8f1', sky: '#8ecae6',
  inkblue: '#1d2b44', inkblue2: '#2c3e5c', charcoal: '#2c2e33', swamp: '#3d4d3c', swamp2: '#5a6b52', amber: '#e8a33d', dullred: '#9e2b2b', burnt: '#3b2a1d', fog: '#8d99a6', slate: '#4a5568', choco: '#4a3426',
};
const CACHE = new Map();
const cached = (key, fn) => { if (!CACHE.has(key)) CACHE.set(key, fn()); return CACHE.get(key); };
const G = { SA: 1 }; // global shadow alpha multiplier

// ---------- base detail texture (neutral gray, for overlay) ----------
let DETAIL = null;
function detail() {
  if (DETAIL) return DETAIL;
  const N = 2048, c = mk(N, N), x = c.getContext('2d'); const r = mulberry(11);
  x.fillStyle = '#808080'; x.fillRect(0, 0, N, N);
  for (const [n, a] of [[24, .55], [96, .35], [400, .18]]) {
    const s = mk(n, n), sx = s.getContext('2d'), d = sx.createImageData(n, n);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - .5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    sx.putImageData(d, 0, 0); x.globalAlpha = a; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, N, N);
  }
  x.globalAlpha = 1;
  // fibers
  for (let i = 0; i < 9000; i++) {
    const l = 6 + r() * 30, a0 = r() * 7, px = r() * N, py = r() * N;
    x.strokeStyle = r() < .55 ? `rgba(255,255,255,${.05 + r() * .12})` : `rgba(0,0,0,${.04 + r() * .09})`; x.lineWidth = .5 + r() * .9;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a0) * l * .5 + (r() - .5) * 6, py + Math.sin(a0) * l * .5 + (r() - .5) * 6, px + Math.cos(a0) * l, py + Math.sin(a0) * l); x.stroke();
  }
  // fine grain
  const d = x.getImageData(0, 0, N, N);
  for (let i = 0; i < d.data.length; i += 4) { const n = (r() - .5) * 22; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
  x.putImageData(d, 0, 0);
  DETAIL = c; return c;
}
function texturize(x, w, h, amt = .5, seed = 0) {
  const D = detail(); const ox = (hr(seed) * (2048 - Math.min(w, 2048))) | 0, oy = (hr(seed + 1) * (2048 - Math.min(h, 2048))) | 0;
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = amt;
  for (let yy = 0; yy < h; yy += 2048) for (let xx = 0; xx < w; xx += 2048) x.drawImage(D, ox, oy, Math.min(2048 - ox, w - xx), Math.min(2048 - oy, h - yy), xx, yy, Math.min(2048 - ox, w - xx), Math.min(2048 - oy, h - yy));
  x.restore();
}

// ---------- torn polygon ----------
function tornPoly(w, h, amp, seed, extra = 0) {
  // amp: [top,right,bottom,left] inward amplitude in px (0 = clean cut)
  const r = mulberry(seed * 7 + 3), pts = [];
  const side = (x0, y0, x1, y1, a, nx, ny, sd) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = a > 0 ? Math.max(2, Math.floor(len / 2.5)) : 1;
    for (let i = 0; i < n; i++) {
      const t = i / n; let off = 0;
      if (a > 0) off = extra + a * (.5 + .38 * noise1(t * len * .012 + sd) + .22 * noise1(t * len * .05 + sd * 3) + .1 * noise1(t * len * .22 + sd * 5) + (r() - .5) * .07);
      else off = extra * 0;
      pts.push([lerp(x0, x1, t) + nx * off, lerp(y0, y1, t) + ny * off]);
    }
  };
  side(0, 0, w, 0, amp[0], 0, 1, seed); side(w, 0, w, h, amp[1], -1, 0, seed + 10); side(w, h, 0, h, amp[2], 0, -1, seed + 20); side(0, h, 0, 0, amp[3], 1, 0, seed + 30);
  return pts;
}
function polyPath(pts, ox = 0, oy = 0) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0] + ox, q[1] + oy) : p.moveTo(q[0] + ox, q[1] + oy)); p.closePath(); return p; }

// ---------- sprite & shadows ----------
// sprite = { c: canvas, w, h (content size), ax, ay (anchor offset = pad) }
function shadowsOf(spr) {
  if (spr.sh) return spr.sh;
  const SP = 46, cw = spr.c.width + SP * 2, ch = spr.c.height + SP * 2;
  const m = mk(cw, ch), mx = m.getContext('2d'); mx.drawImage(spr.c, SP, SP); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = '#000'; mx.fillRect(0, 0, cw, ch);
  const blur = (b) => { const o = mk(cw, ch), ox = o.getContext('2d'); ox.filter = `blur(${b}px)`; ox.drawImage(m, 0, 0); ox.filter = 'none'; return o; };
  const a = blur(1.6), b = blur(9), c = blur(26);
  const bc = mk(cw + 40, ch + 40), bx = bc.getContext('2d'); bx.globalAlpha = .30; bx.drawImage(b, 5, 8); bx.globalAlpha = .20; bx.translate(14 + cw / 2, 22 + ch / 2); bx.scale(1.03, 1.03); bx.drawImage(c, -cw / 2, -ch / 2);
  spr.sh = { SP, a, b, c, bc }; return spr.sh;
}
// draw sprite centred at x,y with 3-layer shadow
function put(ctx, spr, x, y, o = {}) {
  if (!spr) return;
  const a = o.a === undefined ? 1 : o.a; if (a <= 0.003) return;
  const s = (o.s === undefined ? 1 : o.s), e = o.elev || 0, rot = o.rot || 0, sx = o.sx || 1, sy = o.sy || 1;
  const sc = s * (1 + e * .07);
  const cx = spr.c.width / 2 + (o.anchor ? o.anchor[0] : 0), cy = spr.c.height / 2 + (o.anchor ? o.anchor[1] : 0);
  const sa = (o.shadow === undefined ? 1 : o.shadow) * G.SA * a;
  if (sa > 0.01) {
    const sh = shadowsOf(spr);
    if (e < .02) { ctx.save(); ctx.globalAlpha = sa; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * sx, sc * sy); ctx.globalAlpha = .42 * sa; ctx.drawImage(sh.a, -cx - sh.SP + 1.2, -cy - sh.SP + 1.8); ctx.globalAlpha = sa; ctx.drawImage(sh.bc, -cx - sh.SP, -cy - sh.SP); ctx.restore(); }
    else { const layers = [[sh.a, 1.2 + e * 5, 1.8 + e * 7, .42 * (1 - e * .7), 1], [sh.b, 5 + e * 26, 8 + e * 36, .30, 1.0], [sh.c, 14 + e * 55, 22 + e * 75, .20 + e * .05, 1.03]];
    for (const [m, dx, dy, al, ss] of layers) {
      ctx.save(); ctx.globalAlpha = al * sa; ctx.translate(x + dx * sc, y + dy * sc); ctx.rotate(rot); ctx.scale(sc * sx * ss, sc * sy * ss);
      ctx.drawImage(m, -cx - sh.SP, -cy - sh.SP); ctx.restore();
    } }
  }
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * sx, sc * sy);
  if (o.blend) ctx.globalCompositeOperation = o.blend;
  ctx.drawImage(spr.c, -cx, -cy); ctx.restore();
}
function sprite(w, h, pad, draw) { const c = mk(w + pad * 2, h + pad * 2), x = c.getContext('2d'); x.translate(pad, pad); draw(x); return { c, w, h, pad }; }

// ---------- paper sheet ----------
function sheet(o) {
  const key = 'sheet|' + JSON.stringify(o);
  return cached(key, () => {
    const w = o.w, h = o.h, pad = 8, seed = o.seed || 1, torn = o.torn || [0, 0, 0, 0], col = o.color || P.cream;
    return sprite(w, h, pad, (x) => {
      const outer = tornPoly(w, h, torn, seed, 0);
      const anyT = torn.some(v => v > 0);
      if (anyT && o.rim !== false) { x.fillStyle = o.rimColor || '#f8f5ee'; x.fill(polyPath(outer)); }
      const inner = anyT && o.rim !== false ? tornPoly(w, h, torn.map(v => v ? v + 1.5 : 0), seed, 2.6) : outer;
      const ip = polyPath(inner);
      x.save(); x.clip(ip);
      x.fillStyle = col; x.fillRect(-2, -2, w + 4, h + 4);
      if (o.grad !== false) { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(0,0,0,.10)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      texturize(x, w, h, o.tex === undefined ? .55 : o.tex, seed);
      if (o.lines === 'ruled') { x.strokeStyle = 'rgba(70,120,190,.35)'; x.lineWidth = 1.4; for (let yy = o.lineTop || 70; yy < h; yy += o.lineGap || 34) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); } x.strokeStyle = 'rgba(200,50,60,.45)'; x.beginPath(); x.moveTo(o.margin || 60, 0); x.lineTo(o.margin || 60, h); x.stroke(); }
      if (o.lines === 'grid') { x.strokeStyle = 'rgba(70,110,150,.18)'; x.lineWidth = 1; for (let q = 0; q < Math.max(w, h); q += 28) { x.beginPath(); x.moveTo(q, 0); x.lineTo(q, h); x.moveTo(0, q); x.lineTo(w, q); x.stroke(); } }
      if (o.fold) { // crease
        const fy = h * (o.foldAt || .5); const g = x.createLinearGradient(0, fy - 40, 0, fy + 40); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.48, 'rgba(0,0,0,.10)'); g.addColorStop(.5, 'rgba(255,255,255,.28)'); g.addColorStop(.53, 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, fy - 40, w, 80);
      }
      if (o.vfold) { const fx = w * .5; const g = x.createLinearGradient(fx - 40, 0, fx + 40, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.47, 'rgba(0,0,0,.08)'); g.addColorStop(.5, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(fx - 40, 0, 80, h); }
      if (o.stain) { const r = mulberry(seed + 99); for (let k = 0; k < o.stain; k++) { const cx = r() * w, cy = r() * h, rr = 30 + r() * 60; x.strokeStyle = `rgba(110,70,30,${.10 + r() * .08})`; x.lineWidth = 3 + r() * 5; x.beginPath(); x.arc(cx, cy, rr, r() * 6, r() * 6 + 4.5); x.stroke(); x.fillStyle = 'rgba(110,70,30,.05)'; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); } }
      if (o.blots) { const r = mulberry(seed + 7); for (let k = 0; k < o.blots; k++) { const cx = r() * w, cy = r() * h; x.fillStyle = `rgba(10,15,30,${.25 + r() * .3})`; for (let j = 0; j < 7; j++) { x.beginPath(); x.arc(cx + (r() - .5) * 26, cy + (r() - .5) * 26, 2 + r() * 12, 0, 7); x.fill(); } } }
      if (o.burn) { // burnt / aged edges
        x.save(); x.shadowColor = `rgba(40,22,8,${o.burn})`; x.shadowBlur = 60; x.lineWidth = 50; x.strokeStyle = `rgba(40,22,8,${o.burn * .6})`; x.stroke(ip); x.restore();
        x.save(); x.lineWidth = 6; x.strokeStyle = `rgba(30,15,5,${o.burn * .7})`; x.filter = 'blur(3px)'; x.stroke(ip); x.filter = 'none'; x.restore();
      }
      if (o.age) { const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(90,60,20,${o.age})`); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      if (o.paint) o.paint(x, w, h);
      x.restore();
      // thickness edge
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
      x.strokeStyle = g; x.lineWidth = 1.6; x.stroke(polyPath(outer));
    });
  });
}

// ---------- images ----------
const IMG = {};
async function loadPhotos() {
  const fs = require('fs'), path = require('path'); const dir = path.join(K.createCanvas ? __dirname : '.', 'photos');
  for (const f of fs.readdirSync(dir)) IMG[f.replace(/\.(png|jpg)$/, '')] = await K.loadImage(path.join(dir, f));
}
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
// processed photo canvas: mode bw|duo|half|duohalf ; crop [x,y,w,h]
function photo(key, o = {}) {
  return cached('photo|' + key + JSON.stringify(o), () => {
    const im = IMG[key]; const cr = o.crop || [0, 0, im.width, im.height];
    const maxS = 1.5; let w = o.w || cr[2], h = Math.round(w * cr[3] / cr[2]); if (w > cr[2] * maxS) { w = Math.round(cr[2] * maxS); h = Math.round(w * cr[3] / cr[2]); }
    const c = mk(w, h), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, cr[0], cr[1], cr[2], cr[3], 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), D = d.data;
    const c0 = hex2rgb(o.dark || '#1d2433'), c1 = hex2rgb(o.light || '#f1e7d0'), con = o.contrast || 1.25, br = o.bright || 0;
    const lum = new Float32Array(w * h);
    for (let i = 0, j = 0; i < D.length; i += 4, j++) { let l = (D[i] * .3 + D[i + 1] * .59 + D[i + 2] * .11) / 255; l = clamp((l - .5) * con + .5 + br); lum[j] = l; D[i] = lerp(c0[0], c1[0], l); D[i + 1] = lerp(c0[1], c1[1], l); D[i + 2] = lerp(c0[2], c1[2], l); }
    x.putImageData(d, 0, 0);
    if (o.half) { // halftone dots overlay
      const cell = o.cell || 5, hc = mk(w, h), hx = hc.getContext('2d'); hx.fillStyle = o.light || '#f1e7d0'; hx.fillRect(0, 0, w, h); hx.fillStyle = o.dark || '#1d2433';
      const ang = Math.PI / 4, ca = Math.cos(ang), sa = Math.sin(ang);
      for (let gy = -h; gy < h * 2; gy += cell) for (let gx = -w; gx < w * 2; gx += cell) {
        const px = gx * ca - gy * sa + w / 2, py = gx * sa + gy * ca - h / 2; if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const l = lum[(py | 0) * w + (px | 0)]; const rr = Math.sqrt(1 - l) * cell * .62; if (rr < .3) continue; hx.beginPath(); hx.arc(px, py, rr, 0, 7); hx.fill();
      }
      x.globalAlpha = o.half; x.drawImage(hc, 0, 0); x.globalAlpha = 1;
    }
    texturize(x, w, h, .35, key.length);
    const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    return c;
  });
}
// framed photo sprite (polaroid / print / cutout)
function polaroid(key, o = {}) {
  return cached('pol|' + key + JSON.stringify(o), () => {
    const ph = photo(key, o); const pw = ph.width, phh = ph.height;
    const b = o.border === undefined ? Math.round(pw * .06 + 8) : o.border, bb = o.frame === 'print' ? b : Math.round(b * 3.2);
    const w = pw + b * 2, h = phh + b + bb;
    const base = sheet({ w, h, color: o.paper || '#f4f0e6', torn: o.torn || [0, 0, 0, 0], seed: key.length + 3, tex: .35, age: o.age || .12 });
    const s = sprite(w, h, 8, (x) => {
      x.drawImage(base.c, -8, -8);
      x.drawImage(ph, b, b);
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.5; x.strokeRect(b, b, pw, phh);
      const ig = x.createLinearGradient(b, b, b, b + 20); ig.addColorStop(0, 'rgba(0,0,0,.25)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = ig; x.fillRect(b, b, pw, 20);
      if (o.caption) { font(x, F.hand, o.capSize || Math.max(26, Math.round(bb * .55)), '700'); x.fillStyle = o.capColor || '#1d2433'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(o.caption, w / 2, phh + b + bb / 2 + 2); }
    });
    return s;
  });
}

// ---------- small props ----------
function pin(color = P.red) {
  return cached('pin' + color, () => sprite(44, 50, 6, (x) => {
    const [r, g, b] = hex2rgb(color);
    // needle hint
    x.strokeStyle = 'rgba(120,120,130,.9)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(24, 30); x.lineTo(30, 44); x.stroke();
    // body (cylinder)
    x.fillStyle = `rgb(${r * .6 | 0},${g * .6 | 0},${b * .6 | 0})`; x.beginPath(); x.ellipse(22, 26, 9, 6, 0, 0, 7); x.fill();
    x.fillRect(13, 18, 18, 8);
    // head
    const gr = x.createRadialGradient(17, 12, 1, 22, 17, 17); gr.addColorStop(0, `rgb(${Math.min(255, r + 120)},${Math.min(255, g + 110)},${Math.min(255, b + 110)})`); gr.addColorStop(.35, color); gr.addColorStop(1, `rgb(${r * .45 | 0},${g * .45 | 0},${b * .45 | 0})`);
    x.fillStyle = gr; x.beginPath(); x.ellipse(22, 17, 15, 12, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(16, 11, 4.5, 2.6, -.5, 0, 7); x.fill();
  }));
}
function tape(w = 150, h = 42, seed = 1, col = 'rgba(236,226,196,.62)') {
  return cached('tape' + w + h + seed + col, () => sprite(w, h, 4, (x) => {
    const r = mulberry(seed); const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([(r() - .5) * 5 + (i % 2 ? 4 : 0), i * h / 8]);
    const p = new Path2D(); p.moveTo(pts[0][0], 0); p.lineTo(w + (r() - .5) * 4, 0);
    for (let i = 0; i <= 8; i++) p.lineTo(w - (i % 2 ? 5 : 0) + (r() - .5) * 3, i * h / 8);
    p.lineTo(0, h); for (let i = 8; i >= 0; i--) p.lineTo(pts[i][0], pts[i][1]); p.closePath();
    x.fillStyle = col; x.fill(p);
    x.save(); x.clip(p); texturize(x, w, h, .25, seed); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, 3, w, 5); x.fillStyle = 'rgba(0,0,0,.05)'; x.fillRect(0, h - 6, w, 6); x.restore();
  }));
}
function clip(col = '#9aa3ad') {
  return cached('clip' + col, () => sprite(34, 96, 6, (x) => {
    x.strokeStyle = col; x.lineWidth = 4; x.lineCap = 'round';
    const p = new Path2D(); p.moveTo(9, 70); p.lineTo(9, 18); p.arc(17, 18, 8, Math.PI, 0); p.lineTo(25, 80); p.arc(15, 80, 10, 0, Math.PI); p.lineTo(5, 28); p.arc(13, 28, 8, Math.PI, 0); p.lineTo(21, 66);
    x.stroke(p); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1.3; x.stroke(p);
  }));
}
function waxSeal(col = '#a3161c', letter = '') {
  return cached('seal' + col + letter, () => sprite(96, 96, 6, (x) => {
    const r = mulberry(5); const p = new Path2D();
    for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr = 44 + (r() - .5) * 7 + Math.sin(a * 5) * 2; i ? p.lineTo(48 + Math.cos(a) * rr, 48 + Math.sin(a) * rr) : p.moveTo(48 + rr, 48); }
    const [cr, cg, cb] = hex2rgb(col);
    const g = x.createRadialGradient(36, 34, 4, 48, 48, 50); g.addColorStop(0, `rgb(${Math.min(255, cr + 80)},${cg + 30},${cb + 30})`); g.addColorStop(.6, col); g.addColorStop(1, `rgb(${cr * .5 | 0},${cg * .5 | 0},${cb * .5 | 0})`);
    x.fillStyle = g; x.fill(p);
    x.strokeStyle = `rgba(0,0,0,.35)`; x.lineWidth = 3; x.beginPath(); x.arc(48, 48, 28, 0, 7); x.stroke(); x.strokeStyle = 'rgba(255,200,200,.35)'; x.lineWidth = 2; x.beginPath(); x.arc(47, 47, 28, Math.PI * 1.1, Math.PI * 1.7); x.stroke();
    if (letter) { font(x, F.play, 34, '900'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(0,0,0,.35)'; x.fillText(letter, 49, 50); x.fillStyle = 'rgba(255,170,170,.5)'; x.fillText(letter, 47, 48); }
    x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.ellipse(34, 30, 10, 5, -.6, 0, 7); x.fill();
  }));
}

// ---------- ink stamp ----------
function stamp(text, o = {}) {
  return cached('stamp|' + text + JSON.stringify(o), () => {
    const size = o.size || 90, col = o.color || '#c4161c', sub = o.sub || '';
    const m = mk(10, 10).getContext('2d'); font(m, F.osw, size, '700'); m.letterSpacing = '5px';
    const tw = m.measureText(text).width; let sw = 0; if (sub) { font(m, F.mono, size * .3, '700'); sw = m.measureText(sub).width; }
    const w = Math.max(tw, sw) + size * 1.0, h = size * (sub ? 1.9 : 1.45);
    const s = sprite(w, h, 30, (x) => {
      const draw = (xx) => {
        xx.strokeStyle = col; xx.fillStyle = col; xx.lineJoin = 'round';
        if (o.round) { xx.lineWidth = size * .07; xx.beginPath(); xx.ellipse(w / 2, h / 2, w / 2 - 6, h / 2 - 6, 0, 0, 7); xx.stroke(); }
        else { xx.lineWidth = size * .075; xx.strokeRect(5, 5, w - 10, h - 10); xx.lineWidth = size * .028; xx.strokeRect(size * .15, size * .15, w - size * .3, h - size * .3); }
        font(xx, F.osw, size, '700'); xx.letterSpacing = '5px'; xx.textAlign = 'center'; xx.textBaseline = 'middle'; xx.fillText(text, w / 2 + 2.5, sub ? h * .4 : h / 2 + size * .03);
        if (sub) { font(xx, F.mono, size * .3, '700'); xx.letterSpacing = '2px'; xx.fillText(sub, w / 2, h * .76); }
      };
      // bleed
      x.save(); x.globalAlpha = .28; x.filter = 'blur(2.2px)'; draw(x); x.filter = 'none'; x.restore();
      draw(x);
      // ink texture: speckle erase + pressure gradient
      x.globalCompositeOperation = 'destination-out'; const r = mulberry(text.length * 31 + size);
      for (let i = 0; i < w * h / 45; i++) { x.fillStyle = `rgba(0,0,0,${r() * .8})`; const q = r() * 3.2; x.fillRect(r() * w, r() * h, q, q * (.5 + r())); }
      for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(0,0,0,${.15 + r() * .3})`; x.beginPath(); x.ellipse(r() * w, r() * h, 20 + r() * 70, 4 + r() * 10, r() * 3, 0, 7); x.fill(); }
      const g = x.createLinearGradient(0, 0, w, h * .3); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${o.fade || .35})`); x.fillStyle = g; x.fillRect(-30, -30, w + 60, h + 60);
    });
    return s;
  });
}
// animated stamp hit: drop from big scale, ink lands (multiply)
function stampHit(ctx, spr, x, y, t0, o = {}) {
  const lt = K.S.T - t0; if (lt < -0.3) return;
  const rot = o.rot === undefined ? -.07 : o.rot, s = o.s || 1;
  if (lt < 0) { // stamp block hovering (shadow approaching)
    return;
  }
  const p = clamp(lt / .12); const sc = lerp(1.9, 1, E3(p)) * s;
  ctx.save(); ctx.globalAlpha = clamp(p * 1.4) * (o.a === undefined ? .95 : o.a) * (o.out ? 1 - clamp((K.S.T - o.out) / .3) : 1);
  ctx.globalCompositeOperation = o.blend || 'source-over';
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.drawImage(spr.c, -spr.c.width / 2, -spr.c.height / 2); ctx.restore();
}
const E3 = t => t * t;

// ---------- sticky note ----------
function sticky(text, o = {}) {
  return cached('sticky|' + text + JSON.stringify(o), () => {
    const w = o.w || 300, h = o.h || w, col = o.color || P.yellow;
    return sprite(w, h, 10, (x) => {
      const p = new Path2D(); p.moveTo(0, 0); p.lineTo(w, 0); p.lineTo(w, h - 34); p.quadraticCurveTo(w - 6, h - 6, w - 40, h); p.lineTo(0, h); p.closePath();
      x.fillStyle = col; x.fill(p); x.save(); x.clip(p); texturize(x, w, h, .45, w);
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,.10)'); g.addColorStop(.12, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,255,255,.08)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.restore();
      // curl
      x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(w, h - 34); x.quadraticCurveTo(w - 16, h - 22, w - 40, h); x.quadraticCurveTo(w - 8, h - 8, w, h - 34); x.fill();
      const lines = String(text).split('\n'); let fs = o.size || w * .2; font(x, o.font || F.hand, fs, '700'); const mw = Math.max(...lines.map(l => x.measureText(l).width)); if (mw > w * .84) fs *= w * .84 / mw;
      font(x, o.font || F.hand, fs, '700'); x.fillStyle = o.ink || '#1d2433'; x.textAlign = 'center'; x.textBaseline = 'middle';
      lines.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.05));
    });
  });
}

// ---------- ransom-style cut-out letters ----------
const CUT_STYLES = [
  { bg: '#f6f1e4', fg: '#1d2433', f: F.osw, wt: '700' }, { bg: '#1d2433', fg: '#f6f1e4', f: F.play, wt: '900' },
  { bg: '#d1242c', fg: '#fbf8f1', f: F.osw, wt: '700' }, { bg: '#f2c14e', fg: '#1d2433', f: F.play, wt: '700' },
  { bg: '#e8e2d4', fg: '#111', f: F.mono, wt: '700', news: 1 }, { bg: '#2a9d8f', fg: '#fbf8f1', f: F.osw, wt: '600' }, { bg: '#fbf8f1', fg: '#d1242c', f: F.play, wt: '900' },
];
function cutLetter(ch, size, seed, styles) {
  return cached('cl|' + ch + size + seed + styles.join(','), () => {
    const r = mulberry(seed * 13 + ch.charCodeAt(0)); const st = CUT_STYLES[styles[Math.floor(r() * styles.length)]];
    const m = mk(10, 10).getContext('2d'); const fs = size * (.82 + r() * .3); font(m, st.f, fs, st.wt);
    const tw = m.measureText(ch).width; const w = tw + size * (.18 + r() * .2), h = size * (1.08 + r() * .22);
    const base = sheet({ w: Math.ceil(w), h: Math.ceil(h), color: st.bg, torn: [r() < .5 ? 2 : 0, r() < .5 ? 2 : 0, r() < .5 ? 2 : 0, r() < .5 ? 2 : 0], seed: seed + ch.charCodeAt(0), tex: .45, rim: true });
    return sprite(Math.ceil(w), Math.ceil(h), 8, (x) => {
      x.drawImage(base.c, -8, -8);
      if (st.news) { x.fillStyle = 'rgba(40,40,40,.25)'; for (let i = 0; i < 9; i++) x.fillRect(3, 3 + i * h / 9, w - 6, 1.2); }
      font(x, st.f, fs, st.wt); x.fillStyle = st.fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, w / 2, h / 2 + fs * .04);
    });
  });
}
// word layout -> array of letters {spr,x,y,rot}; total width
function cutWord(text, size, seed = 1, o = {}) {
  const styles = o.styles || [0, 1, 2, 3, 4, 6]; const r = mulberry(seed);
  const L = []; let x = 0;
  for (const ch of text) {
    if (ch === ' ') { x += size * .45; continue; }
    const spr = cutLetter(ch, size, seed + L.length * 7, styles);
    const w = spr.w; L.push({ spr, x: x + w / 2, y: (r() - .5) * size * .14, rot: (r() - .5) * .22, ch }); x += w * (o.kern || .93);
  }
  L.forEach(l => l.x -= x / 2);
  return { L, w: x };
}
function drawCutWord(ctx, cw, x, y, t0, o = {}) {
  cw.L.forEach((l, i) => {
    const tt = t0 + i * (o.stagger === undefined ? .045 : o.stagger);
    const p = o.instant ? 1 : clamp((K.twos() - tt) / (o.d || .25)); if (p <= 0) return;
    const e = 1 - p; const s = (o.s || 1);
    put(ctx, l.spr, x + l.x * s, y + l.y * s - e * 60 * s, { rot: l.rot + e * (hr(i) - .5) * 1.2, s: s * (1 + e * .35), elev: e * .9 + (o.elev || 0), a: clamp(p * 3) * (o.a === undefined ? 1 : o.a) });
  });
}

// ---------- folder / envelope / card ----------
function folder(o = {}) {
  return cached('folder|' + JSON.stringify(o), () => {
    const w = o.w || 520, h = o.h || 640, col = o.color || P.kraft;
    return sprite(w, h + 40, 10, (x) => {
      const back = sheet({ w: w * .42, h: 60, color: shade(col, -.12), seed: 3, tex: .6 }); x.drawImage(back.c, 20 - 8, -8);
      const front = sheet({ w, h, color: col, seed: 4, tex: .6, age: .25, stain: o.stain || 0 }); x.drawImage(front.c, -8, 40 - 8);
      x.strokeStyle = 'rgba(60,40,15,.35)'; x.lineWidth = 2; x.strokeRect(28, 80, w - 56, h - 80);
      // label sticker
      if (o.label !== undefined) {
        const lw = w * .7, lh = 120; const lab = sheet({ w: lw, h: lh, color: '#f3eee2', seed: 9, tex: .35 });
        x.save(); x.translate(w / 2, 40 + h * .32); x.rotate(-.015); x.drawImage(lab.c, -lw / 2 - 8, -lh / 2 - 8);
        font(x, F.osw, 34, '700'); x.fillStyle = '#2b2b2b'; x.textAlign = 'center'; x.letterSpacing = '6px'; x.fillText(o.head || 'ДЕЛО №', 0, -14);
        font(x, o.labelFont || F.hand, o.labelSize || 52, '700'); x.letterSpacing = '0px'; x.fillStyle = o.labelColor || '#1d2433'; x.fillText(o.label, 0, 40); x.restore();
      }
      if (o.lines) { x.fillStyle = 'rgba(60,40,15,.28)'; for (let i = 0; i < o.lines; i++) x.fillRect(60, 40 + h * .55 + i * 34, (w - 120) * (.5 + hr(i + w) * .5), 4); }
    });
  });
}
function shade(hex, k) { const [r, g, b] = hex2rgb(hex); const f = v => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function envelope(o = {}) {
  return cached('env|' + JSON.stringify(o), () => {
    const w = o.w || 520, h = o.h || 340, col = o.color || '#e9dcc0';
    const base = sheet({ w, h, color: col, seed: 21, tex: .5, age: .2 });
    return sprite(w, h, 8, (x) => {
      x.drawImage(base.c, -8, -8);
      x.strokeStyle = 'rgba(80,60,30,.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, h); x.lineTo(w * .42, h * .5); x.moveTo(w, h); x.lineTo(w * .58, h * .5); x.stroke();
      // flap with shadow
      x.save(); x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 8; x.shadowOffsetY = 4; x.fillStyle = shade(col, -.06); x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w / 2, h * .56); x.closePath(); x.fill(); x.restore();
      x.save(); x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w / 2, h * .56); x.closePath(); x.clip(); texturize(x, w, h, .4, 3); x.restore();
      if (o.seal !== false) { const s = waxSeal(o.sealColor || '#a3161c', o.letter || ''); x.drawImage(s.c, w / 2 - s.c.width / 2, h * .56 - s.c.height / 2); }
      if (o.text) { font(x, F.hand, 46, '700'); x.fillStyle = '#2a2a33'; x.textAlign = 'left'; x.fillText(o.text, w * .1, h * .85); }
    });
  });
}
function indexCard(o = {}) {
  return cached('card|' + JSON.stringify(o), () => {
    const w = o.w || 480, h = o.h || 300;
    return sheet({ w, h, color: o.color || '#f6f1e3', seed: o.seed || 31, tex: .4, paint: (x) => {
      x.strokeStyle = 'rgba(200,50,60,.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 54); x.lineTo(w, 54); x.stroke();
      x.strokeStyle = 'rgba(80,130,200,.35)'; x.lineWidth = 1.2; for (let yy = 92; yy < h; yy += 34) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); }
      if (o.title) { font(x, F.osw, o.tsize || 34, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'left'; x.letterSpacing = '3px'; x.fillText(o.title, 22, 42); }
      if (o.body) { font(x, F.hand, o.bsize || 40, '700'); x.fillStyle = o.ink || '#24305e'; x.letterSpacing = '0px'; String(o.body).split('\n').forEach((l, i) => x.fillText(l, 26, 86 + i * 34)); }
    } });
  });
}

// ---------- cut-out drawing helper (layered paper parts) ----------
// fn(x, part) where part(path, color, opt) fills a paper piece with inner shadow onto previous layers
function cutout(key, w, h, fn, o = {}) {
  return cached('cut|' + key, () => {
    const pad = (o.border || 0) + 10;
    const c = mk(w + pad * 2, h + pad * 2), x = c.getContext('2d'); x.translate(pad, pad);
    const part = (p, col, op = {}) => {
      x.save(); if (op.shadow !== false) { x.shadowColor = `rgba(0,0,0,${op.sa || .38})`; x.shadowBlur = op.sb || 7; x.shadowOffsetX = op.sx || 2; x.shadowOffsetY = op.sy || 3.5; }
      x.fillStyle = col; x.fill(p); x.restore();
      if (op.tex !== false) { x.save(); x.clip(p); texturize(x, w, h, op.tex || .5, hr(col.length + w) * 99 | 0); if (op.grad !== false) { const g = x.createLinearGradient(0, 0, w * .6, h); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.14)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } x.restore(); }
      if (op.edge !== false) { x.save(); x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1.2; x.stroke(p); x.restore(); }
    };
    fn(x, part, w, h);
    let out = { c, w, h, pad };
    if (o.border) out = stickerize(out, o.border, o.borderColor || '#fbf8f1');
    return out;
  });
}
// white sticker border via dilation
function stickerize(spr, b, col) {
  const c = mk(spr.c.width + b * 2, spr.c.height + b * 2), x = c.getContext('2d');
  const m = mk(spr.c.width, spr.c.height), mx = m.getContext('2d'); mx.drawImage(spr.c, 0, 0); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = col; mx.fillRect(0, 0, m.width, m.height);
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; x.drawImage(m, b + Math.cos(a) * b, b + Math.sin(a) * b); }
  { const tc = mk(c.width, c.height), tx = tc.getContext('2d'); tx.drawImage(c, 0, 0); texturize(tx, c.width, c.height, .3, 4); tx.globalCompositeOperation = 'destination-in'; tx.drawImage(c, 0, 0); x.clearRect(0, 0, c.width, c.height); x.drawImage(tc, 0, 0); }
  x.drawImage(spr.c, b, b);
  return { c, w: spr.w + b * 2, h: spr.h + b * 2, pad: spr.pad };
}

// ---------- silhouettes (paper cut-out people) ----------
function personPath(kind = 'man', pose = 0) {
  // 100 units tall, feet at y=0, centred x=0. pose 0..3 walk phase (0 = stand)
  const p = new Path2D(); const child = kind === 'child'; const sc = child ? .78 : 1;
  const sw = pose === 0 ? 0 : [0, .45, 0, -.45][pose];
  const headR = child ? 8.6 : 6.9, headY = child ? -71 : -89;
  // head
  p.ellipse(0, headY, headR * .9, headR * 1.08, 0, 0, Math.PI * 2);
  const shY = child ? -60 : -76, hipY = child ? -36 : -45, shW = child ? 10 : 13.5;
  // torso + arms as one outline
  const armSw = sw * 6;
  p.moveTo(-3, shY - 3); p.lineTo(3, shY - 3);
  p.bezierCurveTo(shW - 2, shY - 2, shW + 1, shY, shW + 1.5, shY + 5);           // right shoulder
  p.lineTo(shW + 3 + armSw * .5, shY + 20); p.lineTo(shW + 3.5 + armSw, shY + 36); // right arm outer
  p.quadraticCurveTo(shW + 2 + armSw, shY + 40, shW - .5 + armSw, shY + 36);      // hand
  p.lineTo(shW - 1.5 + armSw * .5, shY + 19); p.lineTo(shW - 2.5, shY + 10);
  if (kind === 'coat' || kind === 'cop') { p.lineTo(shW - 1, hipY + 14); p.lineTo(-shW + 1, hipY + 14); }
  else if (kind === 'woman') { p.lineTo(shW - 4, hipY - 6); p.lineTo(shW + 3, hipY + 18); p.lineTo(-shW - 3, hipY + 18); p.lineTo(-shW + 4, hipY - 6); }
  else { p.lineTo(shW - 3.5, hipY + 2); p.lineTo(-shW + 3.5, hipY + 2); }
  p.lineTo(-shW + 2.5, shY + 10); p.lineTo(-shW + 1.5 - armSw * .5, shY + 19); p.lineTo(-shW + .5 - armSw, shY + 36);
  p.quadraticCurveTo(-shW - 2 - armSw, shY + 40, -shW - 3.5 - armSw, shY + 36);
  p.lineTo(-shW - 3 - armSw * .5, shY + 20); p.lineTo(-shW - 1.5, shY + 5);
  p.bezierCurveTo(-shW - 1, shY, -shW + 2, shY - 2, -3, shY - 3); p.closePath();
  // neck
  p.rect(-2.6, headY + headR * .8, 5.2, shY - headY - headR * .5);
  // legs
  const leg = (dir, a) => { const lw = child ? 4.4 : 5.2, x0 = dir * (child ? 3.6 : 4.6), kx = x0 + a * 8, fx = x0 + a * 15; p.moveTo(x0 - lw / 2 - dir * .3, hipY); p.lineTo(kx - lw / 2, hipY * .45); p.lineTo(fx - lw / 2, -1.5); p.lineTo(fx + lw / 2 + 2.5 * (a >= 0 ? 1 : .4), -1.5); p.quadraticCurveTo(fx + lw / 2 + 3, 0.5, fx + lw / 2 - .5, 0); p.lineTo(fx + lw / 2, -1.5); p.lineTo(kx + lw / 2, hipY * .45); p.lineTo(x0 + lw / 2, hipY); p.closePath(); };
  leg(-1, sw); leg(1, -sw);
  // hair / hats
  if (kind === 'woman') { p.moveTo(-headR * .95, headY - 3); p.quadraticCurveTo(-headR * 1.35, headY + 8, -headR * 1.05, headY + 13); p.lineTo(-headR * .55, headY + 12); p.lineTo(-headR * .6, headY); p.closePath(); p.moveTo(headR * .95, headY - 3); p.quadraticCurveTo(headR * 1.35, headY + 8, headR * 1.05, headY + 13); p.lineTo(headR * .55, headY + 12); p.lineTo(headR * .6, headY); p.closePath(); p.moveTo(-headR * .95, headY - 2); p.quadraticCurveTo(0, headY - headR * 1.6, headR * .95, headY - 2); p.closePath(); }
  if (kind === 'cop') { p.rect(-headR * 1.12, headY - headR * 1.25, headR * 2.24, headR * .75); p.rect(-headR * 1.55, headY - headR * .6, headR * 3.1, 2.2); }
  if (kind === 'coat') { p.moveTo(-headR * 1.05, headY - headR * .45); p.lineTo(headR * 1.05, headY - headR * .45); p.lineTo(headR * .8, headY - headR * 1.3); p.lineTo(-headR * .8, headY - headR * 1.3); p.closePath(); p.rect(-headR * 1.6, headY - headR * .55, headR * 3.2, 1.8); }
  return p;
}
function person(kind, o = {}) {
  const pose = o.pose || 0, h = o.h || 300, col = o.color || P.charcoal, key = 'person|' + kind + pose + h + col + (o.border || 0) + (o.rim || '');
  return cached(key, () => {
    const w = h * .5, pad = 14 + (o.border || 0);
    const c = mk(w + pad * 2, h + pad * 2 + 10), x = c.getContext('2d'); x.translate(pad + w / 2, pad + h + 4); x.scale(h / 100, h / 100);
    const p = personPath(kind, pose);
    if (o.border) { x.save(); x.strokeStyle = o.borderColor || '#fbf8f1'; x.lineJoin = 'round'; x.lineWidth = o.border * 2 * 100 / h; x.stroke(p); x.fillStyle = o.borderColor || '#fbf8f1'; x.fill(p); x.restore(); }
    x.fillStyle = col; x.fill(p);
    x.save(); x.clip(p); x.setTransform(1, 0, 0, 1, 0, 0); texturize(x, c.width, c.height, .55, h); const g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); x.restore();
    if (o.rim) { x.save(); x.strokeStyle = o.rim; x.lineWidth = 2.2 * 100 / h; x.clip(p); x.translate(-1.2, -1.2); x.stroke(p); x.restore(); }
    return { c, w, h, pad };
  });
}
// draw a person standing with feet at (x,y)
function putPerson(ctx, kind, x, y, h, o = {}) {
  const spr = person(kind, Object.assign({ h: Math.round(h / 10) * 10 }, o));
  put(ctx, spr, x, y - spr.c.height / 2 + spr.pad + 4, Object.assign({ s: h / (Math.round(h / 10) * 10) }, o, { anchor: [0, 0], sx: o.flip ? -1 : 1 }));
}

module.exports = { P, G, CACHE, cached, detail, texturize, tornPoly, polyPath, shadowsOf, put, sprite, sheet, IMG, loadPhotos, photo, polaroid, pin, tape, clip, waxSeal, stamp, stampHit, sticky, cutLetter, cutWord, drawCutWord, folder, envelope, indexCard, cutout, stickerize, personPath, person, putPerson, shade, hex2rgb };
