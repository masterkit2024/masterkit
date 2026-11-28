// ===== Composition, overlays, post, frame renderer =====
'use strict';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const BUF = { acc: mkCanvas(W, H), sub: mkCanvas(W, H), tmp: mkCanvas(W, H), b2: mkCanvas(W, H) };
for (const k in BUF) BUF[k].g = BUF[k].getContext('2d');

// ---------- subtitles ----------
const SUB_STYLE = {
  '': { size: 92, col: '#ffffff', glow: 'rgba(255,255,255,.45)' },
  big: { size: 124, col: '#ffffff', glow: 'rgba(255,255,255,.6)' },
  hot: { size: 104, col: '#ffbf5e', glow: 'rgba(255,160,60,.7)' },
  steel: { size: 120, col: '#d6e7ff', glow: 'rgba(170,205,255,.8)' },
  gpt: { size: 120, col: '#2ee59d', glow: 'rgba(25,195,125,.85)' },
  cold: { size: 98, col: '#b8cbe6', glow: 'rgba(160,190,230,.5)' },
  drop: { size: 150, col: '#ffffff', glow: 'rgba(255,200,140,.9)' },
  blood: { size: 112, col: '#ff4a3d', glow: 'rgba(255,40,30,.85)' },
  gold: { size: 112, col: '#ffd98a', glow: 'rgba(255,190,90,.85)' },
  last: { size: 110, col: '#ffffff', glow: 'rgba(255,220,200,.7)' },
};
const SCENE_WORDS = new Set(['800', 'МЕТРОВ']);
function drawSubs(c, t) {
  const cx = panelK(t) > .5 ? 636 : 540, cy = 1250;
  let cur = null;
  for (const w of TL.words) if (t >= w.t) cur = w;
  for (const w of cur ? [cur] : []) {
    if (SCENE_WORDS.has(w.text)) continue;
    const endFade = w.style === 'last' ? Math.max(.1, 43.25 - w.end) : .07;
    if (t > w.end + endFade) continue;
    const st = SUB_STYLE[w.style] || SUB_STYLE[''];
    const d = t - w.t;
    let a = clamp(d / .05) * (1 - clamp((t - w.end) / endFade));
    let s = lerp(w.style === 'drop' ? 1.6 : 1.22, 1, E.outExpo(clamp(d / .16)));
    let spacing = 2;
    if (w.style === 'last') { spacing = lerp(2, 26, E.out(clamp((t - w.t) / 1.6))); }
    c.save(); c.translate(cx, cy); c.scale(s, s);
    c.font = `900 ${st.size}px Montserrat`; c.letterSpacing = spacing + 'px'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const mw = c.measureText(w.text).width, maxW = cx > 560 ? 760 : 960;
    if (mw > maxW) c.scale(maxW / mw, maxW / mw);
    c.globalAlpha = a;
    c.shadowColor = 'rgba(0,0,0,.75)'; c.shadowBlur = 30; c.shadowOffsetY = 6;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillText(w.text, 0, 4);
    c.shadowOffsetY = 0; c.shadowColor = st.glow; c.shadowBlur = 34;
    c.fillStyle = st.col; c.fillText(w.text, 0, 0);
    c.shadowBlur = 0; c.restore();
  }
  c.letterSpacing = '0px';
}

// ---------- AI panel with marker circle ----------
const PANEL = [['chatgpt', 'ChatGPT', '#10a37f'], ['grok', 'Grok', '#111111'], ['claude', 'Claude', '#d97757'], ['gemini', 'Gemini', '#3b7cf6'], ['deepseek', 'DeepSeek', '#4d6bfe']];
function panelK(t) { return E.outExpo(inv(.35, .85, t)) * (1 - E.in(inv(43.0, 43.3, t))); }
function drawPanel(c, t) {
  const k = panelK(t); if (k <= 0) return;
  const x = lerp(-230, 24, k), y = 470, w = 184, rowH = 176, h = rowH * 5 + 20;
  c.save();
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 40; c.shadowOffsetY = 10;
  c.fillStyle = 'rgba(250,251,253,.97)'; c.beginPath(); rrect(c, x, y, w, h, 30); c.fill();
  c.shadowBlur = 0; c.shadowOffsetY = 0;
  const active = t < 22.85 ? 0 : 1;
  PANEL.forEach(([img, name, col], i) => {
    const cy = y + 18 + i * rowH;
    const act = (i === active) ? (i === 0 ? sstep(12.72, 12.95, t) * (1 - sstep(22.7, 22.9, t)) : sstep(23.0, 23.25, t)) : 0;
    const sc = 1 + act * .08 + act * .03 * Math.sin(t * 6);
    c.save(); c.translate(x + w / 2, cy + 70); c.scale(sc, sc);
    c.drawImage(IMG[img], -54, -54, 108, 108); c.restore();
    c.fillStyle = col; c.font = `800 ${name.length > 7 ? 25 : 30}px Montserrat`; c.textAlign = 'center';
    c.fillText(name, x + w / 2, cy + 156);
  });
  // hand-drawn red marker circle
  const circ = (i, p, at) => {
    if (p <= 0) return;
    const cx = x + w / 2, cy = y + 18 + i * rowH + 84;
    c.save(); c.strokeStyle = '#e3262b'; c.lineWidth = 8; c.lineCap = 'round';
    c.shadowColor = 'rgba(227,38,43,.5)'; c.shadowBlur = 10;
    c.beginPath();
    const a0 = -2.2, sweep = TAU * 1.08 * p;
    for (let j = 0; j <= 80; j++) {
      const a = a0 + sweep * j / 80, wob = 1 + .045 * Math.sin(a * 3 + at) + .02 * j / 80;
      const px = cx + Math.cos(a) * 104 * wob, py = cy + Math.sin(a) * 98 * wob;
      j ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke(); c.restore();
  };
  circ(0, E.out(inv(12.72, 13.05, t)) * (1 - E.in(inv(22.7, 22.9, t))), 1);
  circ(1, E.out(inv(23.0, 23.33, t)), 4);
  c.restore();
}

// ---------- scene dispatcher ----------
function scene(c, t, tPrevCam) {
  if (t < 9.9) {
    const S = introState(t), Sp = introState(t - 1 / 60);
    drawLedge(c, t, S, { mid: cc => draw800(cc, t, S.cam), descent: 1 - sstep(1.3, 1.9, t), camPrev: Sp.cam, snow: lerp(.4, .95, sstep(1.4, 2, t)) });
  } else if (t < 12.62) {
    drawKnifeMacro(c, t);
  } else if (t < 22.6) {
    const S = gptState(t), Sp = gptState(t - 1 / 60);
    drawLedge(c, t, S, { camPrev: Sp.cam, snow: .7 });
  } else if (t < 23.2) {
    const tr = rewindT(t);
    const S = gptState(tr), Sp = gptState(rewindT(t - 1 / 60));
    drawLedge(c, tr, S, { camPrev: Sp.cam, snow: .7 });
  } else if (t < 32.44 || (t >= 37.73 && t < 40.75)) {
    const S = grokState(t), Sp = grokState(t - 1 / 60);
    drawLedge(c, t, S, { camPrev: Sp.cam, snow: t > 38.6 ? .5 : .9, ropeGlow: t > 29 && t < 37.7 ? 'rgba(255,170,90,1)' : null });
  } else if (t < 34.95) {
    drawHandsMacro(c, t);
  } else if (t < 37.73) {
    drawFlashback(c, t);
  } else if (t < 43.4) {
    drawSummit(c, t);
  } else {
    drawEndCard(c, t);
  }
}
function rewindT(t) { const u = inv(22.6, 23.2, t); return lerp(22.6, 12.7, E.ioSine(u)); }

// ---------- motion blur windows [from, to, samples, shutter(s)] ----------
const MB = [[0, 1.9, 4, 1 / 60], [3.88, 4.5, 6, 1 / 45], [6.78, 7.15, 4, 1 / 60], [15.3, 16.5, 4, 1 / 60], [17.6, 18.75, 3, 1 / 60], [19.88, 20.35, 4, 1 / 60],
[28.99, 29.3, 4, 1 / 60], [32.44, 34.95, 3, 1 / 70]];
function mbFor(t) { for (const m of MB) if (t >= m[0] && t < m[1]) return m; return null; }

function renderScene(t) {
  const out = BUF.acc.g;
  const m = mbFor(t);
  const dissolve = t >= 40.45 && t < 40.75;
  if (!m) { out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; scene(out, t); }
  else {
    const n = m[2];
    for (let i = 0; i < n; i++) {
      const ts = t + (i / (n - 1) - .5) * m[3];
      const g = BUF.sub.g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
      scene(g, ts);
      out.globalAlpha = 1 / (i + 1); out.drawImage(BUF.sub, 0, 0);
    }
    out.globalAlpha = 1;
  }
  if (dissolve) { // ledge -> summit
    const g = BUF.b2.g; g.setTransform(1, 0, 0, 1, 0, 0); drawSummit(g, t);
    out.globalAlpha = E.io(inv(40.45, 40.75, t)); out.drawImage(BUF.b2, 0, 0); out.globalAlpha = 1;
  }
}

// ---------- post effects ----------
function zoomBlur(c, k, cx = W / 2, cy = H / 2) {
  if (k <= 0) return;
  const g = BUF.tmp.g; g.globalAlpha = 1; g.drawImage(cv, 0, 0);
  for (let i = 1; i <= 4; i++) {
    const s = 1 + .025 * i * k;
    c.globalAlpha = .22 * k; c.drawImage(BUF.tmp, cx - cx * s, cy - cy * s, W * s, H * s);
  }
  c.globalAlpha = 1;
}
function glitch(c, t, k, seed) {
  if (k <= 0) return;
  const g = BUF.tmp.g; g.drawImage(cv, 0, 0);
  const r = rng(Math.floor(t * 30) + seed);
  for (let i = 0; i < 14; i++) {
    const y = r() * H, h = 10 + r() * 90, dx = (r() - .5) * 160 * k;
    c.drawImage(BUF.tmp, 0, y, W, h, dx, y, W, h);
  }
  c.globalCompositeOperation = 'screen'; c.globalAlpha = .45 * k;
  c.drawImage(BUF.tmp, 10 * k, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function vhs(c, t, k) {
  if (k <= 0) return;
  glitch(c, t, k * .6, 7);
  c.fillStyle = `rgba(0,0,0,${.18 * k})`; for (let y = 0; y < H; y += 6) c.fillRect(0, y, W, 2);
  const by = (t * 2400) % (H + 200) - 100; c.fillStyle = `rgba(255,255,255,${.12 * k})`; c.fillRect(0, by, W, 60);
  c.globalAlpha = k; c.fillStyle = '#ffffff'; c.font = '900 64px Montserrat'; c.textAlign = 'left';
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 10;
  c.beginPath(); for (let j = 0; j < 2; j++) { const ox = 820 + j * 46; c.moveTo(ox + 40, 180); c.lineTo(ox, 205); c.lineTo(ox + 40, 230); c.closePath(); } c.fill();
  c.font = '700 34px Montserrat'; c.fillText('REW', 820, 280); c.shadowBlur = 0; c.globalAlpha = 1;
}
function satDown(c, amount) { // desaturate whole frame by amount 0..1
  if (amount <= 0) return;
  const g = BUF.tmp.g; g.filter = `saturate(${1 - amount}) brightness(${1 - amount * .15})`; g.drawImage(cv, 0, 0); g.filter = 'none';
  c.drawImage(BUF.tmp, 0, 0);
}

function renderAt(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  renderScene(t);
  ctx.drawImage(BUF.acc, 0, 0);
  // GPT HUD (on top of the motion-blurred plate)
  if (t >= 12.62 && t < 22.6) { const S = gptState(t); drawHUD(ctx, t, S); }
  // transitions & accents
  zoomBlur(ctx, sstep(9.72, 9.9, t) * (t < 9.9 ? 1 : 0) + (1 - sstep(9.9, 10.05, t)) * (t >= 9.9 ? 1 : 0));
  glitch(ctx, t, (t >= 12.62 && t < 12.85 ? 1 - inv(12.62, 12.85, t) : 0) + (t >= 23.2 && t < 23.4 ? 1 - inv(23.2, 23.4, t) : 0), 3);
  if (t >= 22.6 && t < 23.2) { satDown(ctx, .45); vhs(ctx, t, Math.sin(inv(22.6, 23.2, t) * Math.PI) * .55 + .15); }
  if (t >= 12.62 && t < 22.6) satDown(ctx, .35 + .45 * sstep(20.3, 21.5, t));
  if (t >= 28.0 && t < 29.0) { // freeze: drain colour, heartbeat
    satDown(ctx, sstep(28.05, 28.4, t) * .7);
    const hb = Math.max(pulse(t, 28.22, .2), pulse(t, 28.58, .2));
    vignette(ctx, .45 + .35 * hb + .2 * sstep(28.05, 28.9, t));
  }
  if (t >= TL.drop && t < TL.drop + .45) { // drop: radial punch + one exposure lift
    const k = 1 - E.out(inv(TL.drop, TL.drop + .45, t));
    zoomBlur(ctx, k * .9, W * .45, H * .45);
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba('#ffd6a8', .35 * k); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  }
  if (t >= 32.38 && t < 32.56) zoomBlur(ctx, Math.sin(inv(32.38, 32.56, t) * Math.PI) * 1.3);
  if (t >= 43.4 && t < 43.7) { const k = 1 - inv(43.4, 43.7, t); ctx.fillStyle = rgba('#ffffff', .5 * k * k); ctx.fillRect(0, 0, W, H); }
  // overlays
  drawPanel(ctx, t);
  drawSubs(ctx, t);
  // global finishing
  if (t < 34.95 || t >= 37.73) grain(ctx, t, .06);
  vignette(ctx, .28);
  const fadeIn = 1 - sstep(0, .3, t), fadeOut = sstep(46.6, 47.5, t);
  if (fadeIn + fadeOut > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.max(fadeIn, fadeOut)})`; ctx.fillRect(0, 0, W, H); }
}

window.READY = (async () => {
  await Promise.all([['Montserrat', 900], ['Montserrat', 800], ['Montserrat', 700], ['Montserrat', 600], ['Unbounded', 900], ['Unbounded', 700]]
    .map(([f, w]) => document.fonts.load(`${w} 64px ${f}`, 'АБВабв0123ABC')));
  await loadImages();
  buildTextures();
  window.renderAt = renderAt;
  window.DURATION = TL.duration;
  return true;
})();
