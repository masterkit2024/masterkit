// usage: node render.js W H mode(args)  mode: png t1,t2,... outdir | raw f0 f1  (writes RGBA to stdout)
const C = require('./core'); const { S } = require('./shots'); const { drawSubs } = require('./subs');
const [W, H] = [+process.argv[2], +process.argv[3]]; const mode = process.argv[4];
const FPS = 30, DUR = 89;
const F = new C.Frame(W, H);
const shotCanvas = C.getCanvas('xfade', W, H);
function drawShot(sh, t, target) {
  F.ctx = target.getContext('2d'); F.canvas = target;
  F.ctx.save(); F.ctx.setTransform(1, 0, 0, 1, 0, 0); F.ctx.fillStyle = '#000'; F.ctx.fillRect(0, 0, W, H); F.ctx.restore();
  sh.draw(F, t); C.post(F, t, sh.grade);
}
const main = F.canvas;
function frame(t) {
  const i = S.findIndex(s => t >= s.t0 && t < s.t1); const sh = S[i >= 0 ? i : S.length - 1];
  drawShot(sh, t, main);
  if (sh.xin > 0 && t < sh.t0 + sh.xin && i > 0) {
    const prev = S[i - 1]; drawShot(prev, t, shotCanvas);
    const k = (t - sh.t0) / sh.xin; const m = main.getContext('2d'); m.save(); m.globalAlpha = 1 - C.ease(k); m.drawImage(shotCanvas, 0, 0); m.restore();
  }
  F.ctx = main.getContext('2d'); F.canvas = main;
  const ctx = F.ctx;
  // white flash into memory (25.05)
  const fl = Math.max(0, 1 - Math.abs(t - 25.0) / 0.35);
  if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,236,200,${C.ease(fl)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  drawSubs(F, t);
  // fade in / fade to black last second
  const fo = Math.max(C.clamp(1 - t / 0.25), C.ease(C.clamp((t - 88.0) / 1.0)));
  if (fo > 0) { ctx.save(); ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
if (mode === 'png') {
  const ts = process.argv[5].split(',').map(Number), out = process.argv[6]; const fs = require('fs');
  for (const t of ts) { frame(t); fs.writeFileSync(`${out}/f_${t.toFixed(2)}.png`, main.toBuffer('image/png')); }
} else {
  const f0 = +process.argv[5], f1 = +process.argv[6];
  const fs = require('fs');
  for (let f = f0; f < f1; f++) { frame(f / FPS); const buf = main.data ? main.data() : null; const img = main.getContext('2d').getImageData(0, 0, W, H); fs.writeSync(1, Buffer.from(img.data.buffer)); if (f % 60 === 0) process.stderr.write(`f${f} `); }
}
