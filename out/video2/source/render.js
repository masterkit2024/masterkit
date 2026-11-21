// node render.js W H FPS mode(png times outdir | raw f0 f1)
const { createCanvas } = require('@napi-rs/canvas');
const C = require('../viz/core'); const G = require('./gfx'); const { S, hudState } = require('./scenes'); const TL = require('./timeline.json');
const [W, H, FPS] = [+process.argv[2], +process.argv[3], +process.argv[4]]; const mode = process.argv[5]; const SC = W / 1080, DUR = 113.0;
const main = createCanvas(W, H), mc = main.getContext('2d');
const A = createCanvas(W, H), B = createCanvas(W, H), Gc = createCanvas(W, H);
function hash(n) { const x = Math.sin(n * 127.1) * 43758.5; return x - Math.floor(x); }
function drawScene(i, t, cv) {
  const sc = S[i], c = cv.getContext('2d'); c.save(); c.setTransform(SC, 0, 0, SC, 0, 0);
  let z = 1; for (const p of sc.punch) { const d = t - p; if (d >= 0 && d < 0.25) z = Math.max(z, 1 + 0.1 * Math.exp(-d * 14)); }
  const lt = t - sc.t0; if (lt < 0.3) z *= 1 + 0.06 * (1 - C.easeOut(lt / 0.3));
  let sx = 0, sy = 0; for (const h of sc.shake) { const d = t - h; if (d >= 0 && d < 0.25) { const f = Math.floor(d * 30); sx += (hash(f + h) - 0.5) * 40; sy += (hash(f * 3.1 + h) - 0.5) * 40; } }
  c.translate(540 + sx, 960 + sy); c.scale(z, z); c.translate(-540, -960);
  G.sunburst(c, t, sc.pal, { rayA: sc.music === 'piano' ? 0.25 : 0.5, speed: sc.music === 'piano' ? 0.05 : 0.18 });
  sc.draw(c, t, lt);
  c.restore();
}
function frame(t) {
  let i = S.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = S.length - 1; const sc = S[i], lt = t - sc.t0;
  drawScene(i, t, A);
  mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, W, H);
  const WD = 0.22;
  if (i > 0 && sc.tr === 'whip' && lt < WD) {
    drawScene(i - 1, t, B); const k = C.easeIO(lt / WD);
    for (let j = -2; j <= 2; j++) { mc.globalAlpha = j === 0 ? 1 : 0.25; mc.drawImage(B, (-k * 1080 + j * 30) * SC, 0); mc.drawImage(A, ((1 - k) * 1080 + j * 30) * SC, 0); }
    mc.globalAlpha = 1;
  } else mc.drawImage(A, 0, 0);
  // glitch / RGB shift (Tinder)
  if (sc.glitch && t > sc.glitch[0] && t < sc.glitch[1]) {
    const gctx = Gc.getContext('2d'); gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.clearRect(0, 0, W, H); gctx.drawImage(main, 0, 0);
    const f = Math.floor(t * 30), off = (6 + hash(f) * 14) * SC;
    mc.globalCompositeOperation = 'screen'; mc.globalAlpha = 0.55;
    mc.filter = 'sepia(1) saturate(8) hue-rotate(-50deg)'; mc.drawImage(Gc, off, 0);
    mc.filter = 'sepia(1) saturate(8) hue-rotate(150deg)'; mc.drawImage(Gc, -off, 0); mc.filter = 'none';
    mc.globalCompositeOperation = 'source-over'; mc.globalAlpha = 1;
    for (let s = 0; s < 5; s++) { const y = hash(f * 7 + s) * H, h = (20 + hash(f + s) * 70) * SC, dx = (hash(f * 3 + s) - 0.5) * 120 * SC; mc.drawImage(Gc, 0, y, W, h, dx, y, W, h); }
  }
  // flash on cut
  if (sc.tr === 'flash' && lt < 0.25 && i > 0) { mc.fillStyle = sc.flashGreen ? `rgba(160,255,140,${1 - lt / 0.25})` : `rgba(255,255,255,${1 - lt / 0.25})`; mc.fillRect(0, 0, W, H); }
  if (sc.flashGreen) { const d = t - require('./scenes').W('закончилось'); if (d > 0 && d < 0.4) { mc.fillStyle = `rgba(125,255,106,${0.8 * (1 - d / 0.4)})`; mc.fillRect(0, 0, W, H); } }
  if (i === 0) { const d = t - require('./scenes').W('полночь'); if (d > 0 && d < 0.3) { mc.fillStyle = `rgba(255,255,255,${1 - d / 0.3})`; mc.fillRect(0, 0, W, H); } }
  mc.setTransform(SC, 0, 0, SC, 0, 0);
  G.vignette(mc, 1080, 1920);
  const hs = hudState(t); G.hud(mc, hs.timer, hs.count, hs.pT, hs.pC);
  G.subs(mc, TL.chunks, t);
  // end: last 0.4 s fade
  if (t > DUR - 0.4) { mc.fillStyle = `rgba(0,0,0,${(t - (DUR - 0.4)) / 0.4})`; mc.fillRect(0, 0, 1080, 1920); }
}
if (mode === 'png') { const fs = require('fs'); for (const t of process.argv[6].split(',').map(Number)) { frame(t); fs.writeFileSync(`${process.argv[7]}/f_${t.toFixed(2)}.png`, main.toBuffer('image/png')); } }
else { const fs = require('fs'); for (let f = +process.argv[6]; f < +process.argv[7]; f++) { frame(f / FPS); const img = mc.getImageData(0, 0, W, H); fs.writeSync(1, Buffer.from(img.data.buffer)); } }
