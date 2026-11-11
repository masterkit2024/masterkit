// ===== shot engine, transitions, post =====
const SHOTS = [];
let GRAIN, VIG, CORK, PAPER, PAPER2, BRICK, DESK;
// shot(t0, drawFn, opts) ; opts: tr (transition into this shot), td, lb (letterbox 0..1), warm, focus [x,y] for zoom transitions
function shot(t0, draw, o = {}) { SHOTS.push(Object.assign({ t0, draw, tr: 'cut', td: .5, lb: 0 }, o)); }

function finalize() {
  SHOTS.sort((a, b) => a.t0 - b.t0);
  for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : TL.dur + 20;
  // sound events for transitions
  for (let i = 1; i < SHOTS.length; i++) {
    const s = SHOTS[i]; const map = { flash: 'flash', smear: 'whoosh', paper: 'paper', zoom: 'zoomwhoosh', glitch: 'glitch', dip: 'boom', fade: null, cut: null };
    if (map[s.tr]) ev(s.t0, map[s.tr]);
  }
}
const bufA = mk(W, H), bufB = mk(W, H), bufT = mk(W, H);
const cA = bufA.getContext('2d'), cB = bufB.getContext('2d'), cT = bufT.getContext('2d');

function drawShot(c, s, t) {
  NOW = t; CAM = { x: 0, y: 0, z: 1, r: 0 };
  c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  try { s.draw(c, t - s.t0, s.t1 - s.t0); } catch (e) { console.error(e); }
  c.restore();
}
function shotIndex(t) { let lo = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].t0 <= t) lo = i; return lo; }

function composite(ctx, t) {
  const i = shotIndex(t), s = SHOTS[i];
  let A = null, B = null, p = 0, ty = 'cut';
  const nx = SHOTS[i + 1];
  if (nx && nx.tr !== 'cut' && t > nx.t0 - nx.td / 2) { A = s; B = nx; ty = nx.tr; p = (t - (nx.t0 - nx.td / 2)) / nx.td; }
  else if (s.tr !== 'cut' && i > 0 && t < s.t0 + s.td / 2) { A = SHOTS[i - 1]; B = s; ty = s.tr; p = (t - (s.t0 - s.td / 2)) / s.td; }
  if (!A) { drawShot(cA, s, t); ctx.drawImage(bufA, 0, 0); return s; }
  p = clamp(p);
  const needA = !(ty === 'flash' && p >= .5) && !(ty === 'dip' && p >= .5) && !(ty === 'glitch' && p > .85);
  const needB = !(ty === 'flash' && p < .5) && !(ty === 'dip' && p < .5) && !(ty === 'glitch' && p < .15);
  if (needA) drawShot(cA, A, t);
  if (needB) drawShot(cB, B, t);
  NOW = t;
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  switch (ty) {
    case 'fade': ctx.drawImage(bufA, 0, 0); ctx.globalAlpha = E.sine(p); ctx.drawImage(bufB, 0, 0); break;
    case 'flash': {
      ctx.drawImage(p < .5 ? bufA : bufB, 0, 0);
      const f = Math.pow(1 - Math.min(1, Math.abs(p - .5) * 2.2), 1.6);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f; ctx.drawImage(p < .5 ? bufA : bufB, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = f * .95; ctx.fillStyle = '#f4f7fb'; ctx.fillRect(0, 0, W, H); break;
    }
    case 'dip': {
      const f = 1 - Math.abs(p - .5) * 2; ctx.drawImage(p < .5 ? bufA : bufB, 0, 0); ctx.globalAlpha = clamp(f * 1.3); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); break;
    }
    case 'smear': {
      const dir = B.dir || 1; const e = E.io(p);
      const offA = -e * W * 1.1 * dir, offB = (1 - e) * W * 1.1 * dir;
      const vel = Math.sin(p * Math.PI) * 140 * dir;
      for (let k = 0; k < 6; k++) { ctx.globalAlpha = k === 0 ? 1 : .22; ctx.drawImage(bufA, offA + k * vel * .25, 0); }
      for (let k = 0; k < 6; k++) { ctx.globalAlpha = k === 0 ? 1 : .22; ctx.drawImage(bufB, offB - k * vel * .25, 0); }
      break;
    }
    case 'paper': {
      const Lx = W + 60 - E.io(p) * (W * 2.35), Tx = Lx + W * 1.15, sk = 140;
      ctx.drawImage(bufA, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.moveTo(Tx + sk, 0); ctx.lineTo(W + 400, 0); ctx.lineTo(W + 400, H); ctx.lineTo(Tx - sk, H); ctx.closePath(); ctx.clip(); ctx.drawImage(bufB, 0, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.moveTo(Lx + sk, 0); ctx.lineTo(Tx + sk, 0); ctx.lineTo(Tx - sk, H); ctx.lineTo(Lx - sk, H); ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 60; ctx.shadowOffsetX = 30; ctx.fillStyle = '#bdb8ad'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip();
      ctx.drawImage(PAPER, Lx - sk, 0, W * 1.15 + 2 * sk, H);
      ctx.globalAlpha = .55; ctx.fillStyle = '#2a2d33'; font(ctx, F.mono, 34); ctx.textAlign = 'left';
      for (let k = 0; k < 14; k++) ctx.fillRect(Lx + 200 - k * 18, 120 + k * 64, 400 + hr(k) * 600, 10);
      ctx.restore(); break;
    }
    case 'zoom': {
      const fx = (A.focus || [W / 2, H / 2]);
      if (p < .55) {
        const q = E.in(p / .55), z = 1 + q * 5;
        for (let k = 0; k < 5; k++) { const zz = z * (1 - k * .04 * q); ctx.globalAlpha = k ? .18 : 1; ctx.setTransform(zz, 0, 0, zz, fx[0] - fx[0] * zz, fx[1] - fx[1] * zz); ctx.drawImage(bufA, 0, 0); }
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = q; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      }
      if (p >= .45) {
        const q = E.out((p - .45) / .55), z = .55 + .45 * q;
        ctx.globalAlpha = clamp((p - .45) / .3); ctx.setTransform(z, 0, 0, z, W / 2 - W / 2 * z, H / 2 - H / 2 * z); ctx.drawImage(bufB, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      break;
    }
    case 'glitch': {
      const src = p < .5 ? bufA : bufB; ctx.drawImage(src, 0, 0);
      const r = mulberry(FRAME * 7 + 1), n = 18, inten = 1 - Math.abs(p - .5) * 2;
      for (let k = 0; k < n; k++) {
        const y = r() * H, h = 8 + r() * 90, dx = (r() - .5) * 260 * inten; const s2 = r() < .5 ? bufA : bufB;
        ctx.drawImage(s2, 0, y, W, h, dx, y, W, h);
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35 * inten;
      ctx.drawImage(src, 14 * inten, 0); ctx.fillStyle = 'rgba(255,0,0,.0)';
      ctx.globalCompositeOperation = 'source-over';
      for (let k = 0; k < 6; k++) { ctx.globalAlpha = .5 * inten; ctx.fillStyle = r() < .5 ? '#e2443c' : '#8ea2b5'; ctx.fillRect(0, r() * H, W, 1 + r() * 4); }
      break;
    }
    default: ctx.drawImage(t < B.t0 ? bufA : bufB, 0, 0);
  }
  ctx.restore();
  return t < B.t0 ? A : B;
}

function lbAt(t) {
  // smooth letterbox amount
  const i = shotIndex(t); const s = SHOTS[i];
  const prev = i > 0 ? SHOTS[i - 1].lb : s.lb;
  const pIn = clamp((t - s.t0) / .7); let v = lerp(prev, s.lb, E.io(pIn));
  return v;
}
function warmAt(t) { const i = shotIndex(t); const s = SHOTS[i]; const prev = i > 0 ? (SHOTS[i - 1].warm || 0) : 0; return lerp(prev, s.warm || 0, E.io(clamp((t - s.t0) / 1.5))); }

function post(ctx, t, s) {
  // grade
  ctx.save();
  const wm = warmAt(t);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .45;
  ctx.fillStyle = `rgb(${lerp(60, 150, wm)},${lerp(85, 112, wm)},${lerp(118, 80, wm)})`; ctx.fillRect(0, 0, W, H);
  // grain
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .2;
  const tile = GRAIN[FRAME % GRAIN.length]; const pat = ctx.createPattern(tile, 'repeat');
  const ox = (hr(FRAME) * 512) | 0, oy = (hr(FRAME + 1) * 512) | 0;
  ctx.translate(-ox, -oy); ctx.fillStyle = pat; ctx.fillRect(0, 0, W + 512, H + 512); ctx.translate(ox, oy);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // dust & scratches
  const r = mulberry(FRAME * 31 + 7);
  const nd = Math.floor(r() * 6);
  for (let k = 0; k < nd; k++) { ctx.fillStyle = r() < .7 ? `rgba(0,0,0,${.35 + r() * .4})` : `rgba(230,235,240,${.25 + r() * .3})`; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 1 + r() * 3.5, 1 + r() * 2.5, r() * 3, 0, 7); ctx.fill(); }
  if (r() < .06) { ctx.strokeStyle = `rgba(0,0,0,${.3 + r() * .3})`; ctx.lineWidth = 1.2; ctx.beginPath(); const x = r() * W, y = r() * H; ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30 * r(), y + 20, x - 20, y + 40 * r(), x + 10, y + 60); ctx.stroke(); }
  const sc = Math.floor(NOW * 1.3); if (hr(sc * 3) < .35) { const x = hr(sc) * W + Math.sin(NOW * 9) * 4; ctx.fillStyle = `rgba(220,225,230,${.06 + hr(FRAME) * .06})`; ctx.fillRect(x, 0, 1.5, H); }
  // flicker
  const fl = .025 + noise1(NOW * 12) * .02 + (hr(FRAME * 13) < .02 ? .06 : 0);
  ctx.fillStyle = `rgba(0,0,0,${Math.max(0, fl)})`; ctx.fillRect(0, 0, W, H);
  // vignette
  ctx.drawImage(VIG, 0, 0);
  // letterbox
  const lb = lbAt(t); if (lb > 0) { const bh = 138.5 * lb; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
  // global fades
  const fin = clamp(t / 1.0), fout = clamp((TL.dur + END_EXTRA - t) / 1.2);
  const f = Math.min(fin, fout); if (f < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - f})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
let END_EXTRA = 0;
const MAIN = document.getElementById('c'); const MC = MAIN.getContext('2d');
function renderFrame(f) {
  FRAME = f; const t = f / FPS;
  const s = composite(MC, t); NOW = t; post(MC, t, s);
}
async function boot() {
  const fonts = [['Osw', 'Oswald.ttf', '200 700'], ['Mono', 'PTMono.ttf'], ['Serif', 'PTSerif.ttf'], ['SerifB', 'PTSerifBold.ttf'], ['Sans', 'PTSans.ttf'], ['Narrow', 'PTSansNarrowBold.ttf'], ['Rubik', 'RubikMono.ttf'], ['Play', 'Playfair.ttf', '400 900']];
  for (const [n, f, wt] of fonts) { const ff = new FontFace(n, `url(assets/${f})`, wt ? { weight: wt } : {}); await ff.load(); document.fonts.add(ff); }
  const imgs = ['deangelo_court', 'fbi_poster', 'green_map', 'ridgway', 'rostov_map', 'verdict', 'dahmer', 'chikatilo', 'bundy'];
  await Promise.all(imgs.map(k => new Promise(res => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.src = `assets/${k}.png`; })));
  imgs.forEach(k => processImg(k));
  processImg('rostov_map', { c: 1.4, b: .55, tint: '#9fb2c6' }); processImg('green_map', { c: 1.3, b: .6, tint: '#9fb2c6' });
  processImg('verdict', { c: 1.25, b: .95, tint: '#d8d4c8' }); processImg('fbi_poster', { c: 1.1, b: .9, tint: '#d0d6dc' });
  GRAIN = grainTiles(); VIG = vignette(); CORK = corkTex(); PAPER = paperTex(); PAPER2 = paperTex(1000, 1300, 9); BRICK = brickTex();
  DESK = texNoise(2400, 1400, 33, '#15181c', .06, 2);
  buildScenes(); finalize();
  window.READY = true;
}
window.R = (f) => { renderFrame(f); return MAIN.toDataURL('image/jpeg', .93); };
window.RN = (f) => { renderFrame(f); return 1; };
boot();
