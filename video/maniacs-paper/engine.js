// ===== engine: shots, transitions, subframe motion blur, film post =====
const K = require('./core'); const Pp = require('./paper');
const { W, H, FPS, mk, clamp, lerp, E, mulberry, hr, noise1, S, ev, TL } = K;

const SHOTS = [];
const MOODS = {
  bright: { grain: 9, vig: .32, ca: .5, flick: .008, dust: .4, sa: .85 },
  dark: { grain: 17, vig: .62, ca: 1.3, flick: .025, dust: 1, sa: 1.1 },
  twist: { grain: 13, vig: .5, ca: 1, flick: .015, dust: .7, sa: 1 },
};
const HITS = [];             // times of heavy hits -> CA/flash boost
function hit(t, k = 1) { HITS.push([t, k]); }
function shot(t0, draw, o = {}) { SHOTS.push(Object.assign({ t0, draw, tr: 'cut', td: .6, mood: 'bright' }, o)); }
const TR_SFX = { flash: 'flash', slide: 'whoosh', page: 'pageturn', plane: 'plane', tear: 'tear', crumple: 'crumple', flip: 'folderflip', zoom: 'zoomwhoosh', accordion: 'mapunfold', stamp: 'stampbig', dip: 'boom', fade: null, cut: null };
function finalize() {
  SHOTS.sort((a, b) => a.t0 - b.t0);
  for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : TL.dur + 5;
  for (let i = 1; i < SHOTS.length; i++) {
    const s = SHOTS[i]; if (TR_SFX[s.tr]) ev(s.t0 - (s.tr === 'stamp' ? 0 : s.td * .3), TR_SFX[s.tr]);
    if (s.tr === s.prevTr) console.warn('repeat transition', s.t0);
    if (s.tr !== 'cut' && SHOTS[i - 1].tr === s.tr) console.warn('WARN repeated transition', s.tr, s.t0.toFixed(2));
    if (s.tr === 'stamp' || s.tr === 'flash') hit(s.t0, .8);
  }
}
const bufA = mk(W, H), bufB = mk(W, H), bufC = mk(W, H);
const cA = bufA.getContext('2d'), cB = bufB.getContext('2d'), cC = bufC.getContext('2d');
function drawShot(c, s, t) {
  S.T = t; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, W, H);
  Pp.G.SA = (MOODS[s.mood] || MOODS.bright).sa;
  try { s.draw(c, t - s.t0, s.t1 - s.t0); } catch (e) { console.error('shot error @', s.t0, e); }
  c.restore();
}
function shotIndex(t) { let lo = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].t0 <= t) lo = i; return lo; }
function activeAt(t) {
  const i = shotIndex(t), s = SHOTS[i], nx = SHOTS[i + 1];
  if (nx && nx.tr !== 'cut' && t > nx.t0 - nx.td / 2) return { A: s, B: nx, p: (t - (nx.t0 - nx.td / 2)) / nx.td };
  if (s.tr !== 'cut' && i > 0 && t < s.t0 + s.td / 2) return { A: SHOTS[i - 1], B: s, p: (t - (s.t0 - s.td / 2)) / s.td };
  return { A: s, B: null, p: 0 };
}

// ---- transition helpers ----
function jagLine(seed, n, amp) { const r = mulberry(seed); const a = []; for (let i = 0; i <= n; i++) a.push((noise1(i * .35 + seed) * .7 + (r() - .5) * .5) * amp); return a; }
const TEAR = jagLine(7, 60, 26), ACC = 8;
function composite(ctx, t) {
  const { A, B, p: p0 } = activeAt(t); const p = clamp(p0);
  if (!B) { drawShot(cA, A, t); ctx.drawImage(bufA, 0, 0); return A; }
  const ty = B.tr;
  const needA = !((ty === 'flash' || ty === 'dip' || ty === 'stamp') && p >= .5) && !(ty === 'crumple' && p >= .5);
  const needB = !((ty === 'flash' || ty === 'dip' || ty === 'stamp') && p < .5) && !(ty === 'crumple' && p < .5);
  if (needA) drawShot(cA, A, t); if (needB) drawShot(cB, B, t);
  S.T = t;
  ctx.save(); ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, W, H);
  switch (ty) {
    case 'fade': ctx.drawImage(bufA, 0, 0); ctx.globalAlpha = E.sine(p); ctx.drawImage(bufB, 0, 0); break;
    case 'flash': {
      ctx.drawImage(p < .5 ? bufA : bufB, 0, 0); const f = Math.pow(1 - Math.min(1, Math.abs(p - .5) * 2.3), 1.5);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f * .8; ctx.drawImage(p < .5 ? bufA : bufB, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = f; ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H); break;
    }
    case 'dip': { const f = 1 - Math.abs(p - .5) * 2; ctx.drawImage(p < .5 ? bufA : bufB, 0, 0); ctx.globalAlpha = clamp(f * 1.4); ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H); break; }
    case 'slide': { // desk slides, camera whip
      const e = E.io(p), dir = B.dir || 1; ctx.drawImage(bufA, -e * W * dir, 0); ctx.drawImage(bufB, (1 - e) * W * dir, 0); break;
    }
    case 'page': case 'flip': { // A lifts from right edge and folds onto the left spine, revealing B
      ctx.drawImage(bufB, 0, 0); const ang = E.io(p) * Math.PI / 2; const sx = Math.cos(ang);
      const shx = W * sx; const g = ctx.createLinearGradient(shx, 0, shx + 300, 0); g.addColorStop(0, `rgba(0,0,0,${.5 * Math.sin(ang * 2) + .1})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(shx, 0, 300, H);
      if (sx > .002) { ctx.save(); ctx.scale(sx, 1); ctx.drawImage(bufA, 0, 0);
        const gg = ctx.createLinearGradient(0, 0, W, 0); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(.85, `rgba(0,0,0,${.35 * (1 - sx)})`); gg.addColorStop(.97, `rgba(255,250,235,${.5 * (1 - sx)})`); gg.addColorStop(1, `rgba(0,0,0,${.4 * (1 - sx)})`); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
        if (ty === 'flip') { ctx.fillStyle = `rgba(150,110,60,${.25 * (1 - sx)})`; ctx.fillRect(0, 0, W, H); }
        ctx.restore(); }
      break;
    }
    case 'plane': { // paper plane crosses, B revealed behind its wake
      const e = E.io(p); const px = lerp(-300, W + 300, e), py = lerp(H * .8, H * .15, e) + Math.sin(e * Math.PI) * -80;
      ctx.drawImage(bufA, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.moveTo(-50, H + 50); const n = 30;
      for (let i = 0; i <= n; i++) { const yy = H + 50 - (H + 100) * i / n; ctx.lineTo(px - 260 + (yy - py) * .55 + Math.sin(i * 1.7 + 3) * 14, yy); }
      ctx.lineTo(-50, -50); ctx.closePath(); ctx.clip(); ctx.drawImage(bufB, 0, 0); ctx.restore();
      planeDraw(ctx, px, py, -.45 + Math.cos(e * Math.PI) * .25, 1.4); break;
    }
    case 'tear': { // A rips along jagged vertical line, halves pull apart
      ctx.drawImage(bufB, 0, 0); const e = E.in(clamp(p * 1.1)); const cx = W * .5;
      for (const side of [-1, 1]) {
        ctx.save(); ctx.translate(side * e * W * .62, (side < 0 ? -1 : 1) * e * 60); ctx.rotate(side * e * .1);
        const path = new K.Path2D(); path.moveTo(side < 0 ? -10 : W + 10, -10);
        TEAR.forEach((d, i) => path.lineTo(cx + d, -10 + (H + 20) * i / (TEAR.length - 1))); path.lineTo(side < 0 ? -10 : W + 10, H + 10); path.closePath();
        ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = side * 18; ctx.fillStyle = '#f5f1e8'; ctx.fill(path); ctx.shadowColor = 'transparent';
        ctx.clip(path);
        // white fiber rim then image inset
        ctx.save(); ctx.translate(side * -5, 0); ctx.drawImage(bufA, 0, 0); ctx.restore();
        ctx.restore();
      }
      break;
    }
    case 'crumple': { // A crushes into ball, B unfolds from ball
      const q = p < .5 ? E.in(p * 2) : 1 - E.out((p - .5) * 2); const src = p < .5 ? bufA : bufB;
      const s = lerp(1, .14, q), rot = (p < .5 ? 1 : -1) * q * 1.2;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(s, s);
      const poly = new K.Path2D(); const r = mulberry(5); const n = 22;
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; const rr = lerp(Math.hypot(W, H) * .7, Math.min(W, H) * .5 * (.85 + r() * .3), q); i ? poly.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : poly.moveTo(rr, 0); }
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50; ctx.fillStyle = '#ddd'; ctx.fill(poly); ctx.shadowColor = 'transparent'; ctx.clip(poly);
      ctx.drawImage(src, -W / 2, -H / 2);
      // creases
      const cr = mulberry(9); ctx.globalAlpha = q * .9;
      for (let k = 0; k < 18; k++) { const a = cr() * 6.3, d = cr() * 600; ctx.strokeStyle = cr() < .5 ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)'; ctx.lineWidth = 3 + cr() * 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * d - 900, Math.sin(a) * d - 400 + cr() * 800); ctx.lineTo(Math.cos(a) * d + 900, Math.sin(a) * d + 400 - cr() * 800); ctx.stroke(); }
      ctx.fillStyle = `rgba(0,0,0,${q * .35})`; ctx.fillRect(-W, -H, 2 * W, 2 * H);
      ctx.restore(); break;
    }
    case 'zoom': {
      const fx = A.focus || [W / 2, H / 2];
      if (p < .55) { const q = E.in(p / .55), z = 1 + q * 6; ctx.setTransform(z, 0, 0, z, fx[0] - fx[0] * z, fx[1] - fx[1] * z); ctx.drawImage(bufA, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = q; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
      if (p >= .45) { const q = E.out((p - .45) / .55), z = .6 + .4 * q; ctx.globalAlpha = clamp((p - .45) / .3); ctx.setTransform(z, 0, 0, z, W / 2 - W / 2 * z, H / 2 - H / 2 * z); ctx.drawImage(bufB, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0); }
      break;
    }
    case 'accordion': { // B unfolds as a folded map: strips open with alternating shading
      ctx.drawImage(bufA, 0, 0); ctx.fillStyle = `rgba(0,0,0,${p * .6})`; ctx.fillRect(0, 0, W, H);
      const e = E.io(p), sw = W / ACC, total = W * e, x0 = W / 2 - total / 2;
      for (let i = 0; i < ACC; i++) { const w = sw * e; const dx = x0 + i * w; ctx.save(); ctx.beginPath(); ctx.rect(dx, 0, w + .5, H); ctx.clip(); ctx.translate(dx, 0); ctx.scale(e, 1); ctx.drawImage(bufB, i * sw, 0, sw, H, 0, 0, sw, H); ctx.restore(); ctx.fillStyle = i % 2 ? `rgba(0,0,0,${.35 * (1 - e)})` : `rgba(255,255,255,${.18 * (1 - e)})`; ctx.fillRect(dx, 0, w, H); }
      break;
    }
    case 'stamp': { // giant stamp slams over screen
      const src = p < .5 ? bufA : bufB; ctx.drawImage(src, 0, 0);
      const sp = Pp.stamp(B.stampText || 'ДЕЛО', { size: 300, color: '#c4161c' });
      if (p < .5) { const q = E.in(p * 2); ctx.globalAlpha = q * .55; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.06); ctx.scale(lerp(2.8, 1.05, q), lerp(2.8, 1.05, q)); ctx.globalAlpha = q; ctx.drawImage(sp.c, -sp.c.width / 2, -sp.c.height / 2); ctx.restore(); }
      else { const q = (p - .5) * 2; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1 - E.in(q); ctx.translate(W / 2, H / 2); ctx.rotate(-.06); ctx.scale(1.05, 1.05); ctx.drawImage(sp.c, -sp.c.width / 2, -sp.c.height / 2); ctx.restore(); }
      break;
    }
    default: ctx.drawImage(t < B.t0 ? bufA : bufB, 0, 0);
  }
  ctx.restore();
  return t < B.t0 ? A : B;
}
// paper plane sprite drawn directly
function planeDraw(ctx, x, y, rot, s = 1) {
  ctx.save(); ctx.translate(x + 30 * s, y + 46 * s); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = .3; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(-70, -40); ctx.lineTo(-40, 0); ctx.lineTo(-70, 40); ctx.closePath(); ctx.filter = 'blur(10px)'; ctx.fill(); ctx.filter = 'none'; ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#f7f3ea'; ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(-70, -42); ctx.lineTo(-38, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9d2c2'; ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(-70, 42); ctx.lineTo(-38, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#bdb4a2'; ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(-38, 0); ctx.lineTo(-56, 10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(-38, 0); ctx.stroke();
  ctx.restore();
}

// ---- film post (on raw pixels) ----
const N_SUB = 4;
let VIG = {}, NOISE = null;
function vigMap() { if (VIG.m) return VIG.m; const m = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2); const r = Math.sqrt(dx * dx * .8 + dy * dy * 1.1); m[y * W + x] = clamp((r - .45) / .9) ** 1.6; } VIG.m = m; return m; }
function noiseTab() { if (NOISE) return NOISE; const r = mulberry(3); NOISE = new Int8Array(W * H + 70000); for (let i = 0; i < NOISE.length; i++) NOISE[i] = Math.round((r() + r() + r() - 1.5) * 60); return NOISE; }
function moodAt(t) { const s = SHOTS[shotIndex(t)], prev = SHOTS[Math.max(0, shotIndex(t) - 1)]; const a = MOODS[prev.mood] || MOODS.bright, b = MOODS[s.mood] || MOODS.bright, q = E.sine(clamp((t - s.t0) / 1.2)); const o = {}; for (const k in b) o[k] = lerp(a[k], b[k], q); return o; }
function dust(ctx, t, m) {
  const r = mulberry(S.F * 31 + 7); const nd = Math.floor(r() * 7 * m.dust);
  for (let k = 0; k < nd; k++) { ctx.fillStyle = r() < .7 ? `rgba(20,15,10,${.3 + r() * .4})` : `rgba(255,250,240,${.25 + r() * .3})`; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, .8 + r() * 3, .8 + r() * 2, r() * 3, 0, 7); ctx.fill(); }
  if (r() < .05 * m.dust) { ctx.strokeStyle = `rgba(20,15,10,${.25 + r() * .3})`; ctx.lineWidth = 1.1; ctx.beginPath(); const x = r() * W, y = r() * H; ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30 * r(), y + 20, x - 20, y + 40 * r(), x + 10, y + 60); ctx.stroke(); }
  const sc = Math.floor(t * 1.4); if (hr(sc * 3) < .25 * m.dust) { const x = hr(sc) * W + Math.sin(t * 9) * 3; ctx.fillStyle = `rgba(240,235,225,${.05 + hr(S.F) * .05})`; ctx.fillRect(x, 0, 1.4, H); }
}
const MAIN = mk(W, H), MC = MAIN.getContext('2d');
const NPX = W * H;
const ACC_RB = new Uint32Array(NPX), ACC_G = new Uint32Array(NPX);
const OUT = Buffer.alloc(NPX * 4); const OUT32 = new Uint32Array(OUT.buffer, OUT.byteOffset, NPX);
const AVR = new Uint8Array(NPX), AVG8 = new Uint8Array(NPX), AVB = new Uint8Array(NPX);
function renderFrame(f, nsub = N_SUB) {
  if (f % 120 === 0 && process.memoryUsage().rss > 2.4e9) { Pp.CACHE.clear(); if (global.gc) global.gc(); }
  S.F = f; const tc = f / FPS; ACC_RB.fill(0); ACC_G.fill(0);
  const m = moodAt(tc);
  for (let k = 0; k < nsub; k++) {
    const t = tc + ((k + .5) / nsub - .5) * (.5 / FPS); S.sub = k;
    composite(MC, t); S.T = t; dust(MC, tc, m);
    const d = MC.getImageData(0, 0, W, H).data; const d32 = new Uint32Array(d.buffer, d.byteOffset, NPX);
    for (let i = 0; i < NPX; i++) { const v = d32[i]; ACC_RB[i] += v & 0x00FF00FF; ACC_G[i] += (v >>> 8) & 0xFF; }
  }
  S.T = tc;
  const sh = nsub === 4 ? 2 : nsub === 2 ? 1 : 0, div = 1 / nsub, pow2 = (nsub & (nsub - 1)) === 0;
  for (let i = 0; i < NPX; i++) { const rb = ACC_RB[i]; if (pow2) { AVR[i] = (rb & 0xFFFF) >>> sh; AVB[i] = (rb >>> 16) >>> sh; AVG8[i] = ACC_G[i] >>> sh; } else { AVR[i] = (rb & 0xFFFF) * div; AVB[i] = (rb >>> 16) * div; AVG8[i] = ACC_G[i] * div; } }
  let hk = 0; for (const [ht, k] of HITS) { const q = (tc - ht) / .45; if (q >= 0 && q < 1) hk = Math.max(hk, (1 - q) * k); }
  const ca = m.ca + hk * 5, V = vigMap(), Nz = noiseTab(), off = ((hr(f) * 65000) | 0), g = m.grain / 60, vg = m.vig;
  const fl = 1 - (m.flick * (.5 + noise1(tc * 11) * .5) + (hr(f * 13) < .02 ? m.flick * 2 : 0));
  const fin = clamp(tc / .6), fout = clamp((TL.dur - tc) / .8); const ff = Math.min(fin, fout) * fl;
  const cx = W / 2, cy = H / 2, kca = ca / (W / 2) / (cx * cx);
  for (let y = 0; y < H; y++) {
    const dy = y - cy, dy2 = dy * dy, row = y * W;
    for (let x = 0; x < W; x++) {
      const j = row + x; const v = (1 - vg * V[j]) * ff; const n = Nz[j + off] * g;
      let r = AVR[j], gg = AVG8[j], b = AVB[j];
      const dx = x - cx; const kk = kca * (dx * dx + dy2);
      if (kk > .00035) { const sxo = (dx * kk + .5) | 0, syo = (dy * kk + .5) | 0;
        if (sxo !== 0 || syo !== 0) { const xr = x + sxo, yr = y + syo, xb = x - sxo, yb = y - syo;
          if (xr >= 0 && xr < W && yr >= 0 && yr < H) r = AVR[yr * W + xr];
          if (xb >= 0 && xb < W && yb >= 0 && yb < H) b = AVB[yb * W + xb]; } }
      let R2 = r * v + n, G2 = gg * v + n, B2 = b * v + n;
      R2 = R2 < 0 ? 0 : R2 > 255 ? 255 : R2; G2 = G2 < 0 ? 0 : G2 > 255 ? 255 : G2; B2 = B2 < 0 ? 0 : B2 > 255 ? 255 : B2;
      OUT32[j] = 0xFF000000 | (B2 << 16) | (G2 << 8) | R2;
    }
  }
  return OUT;
}
module.exports = { SHOTS, shot, finalize, renderFrame, hit, HITS, MOODS, planeDraw, composite, MC, MAIN };
