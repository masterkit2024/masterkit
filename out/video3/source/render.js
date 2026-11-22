const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const C = require('../viz/core'); const { S, W, FONTS } = require('./shots'); const TL = require('./timeline.json');
const FD = __dirname + '/../viz/node_modules/@fontsource/';
GlobalFonts.registerFromPath(FD + 'playfair-display/files/playfair-display-cyrillic-700-normal.woff2', 'Playfair');
GlobalFonts.registerFromPath(FD + 'lora/files/lora-cyrillic-600-normal.woff2', 'LoraS');
GlobalFonts.registerFromPath(FD + 'lora/files/lora-cyrillic-400-italic.woff2', 'LoraI');
GlobalFonts.registerFromPath(FD + 'lora/files/lora-cyrillic-600-italic.woff2', 'LoraSI');
GlobalFonts.registerFromPath(FD + 'caveat/files/caveat-cyrillic-700-normal.woff2', 'Caveat');
const [Wd, Hd, FPS] = [+process.argv[2], +process.argv[3], +process.argv[4]]; const mode = process.argv[5]; const DUR = 97.6;
const F = new C.Frame(Wd, Hd); const main = F.canvas; const B = C.getCanvas('xf', Wd, Hd);
// paper texture
const tex = createCanvas(Wd, Hd); { const x = tex.getContext('2d'); const img = x.createImageData(Wd, Hd); const R = C.rng(11); for (let i = 0; i < img.data.length; i += 4) { const v = 225 + (R() - 0.5) * 50; img.data[i] = v; img.data[i + 1] = v * 0.97; img.data[i + 2] = v * 0.92; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); x.strokeStyle = 'rgba(150,120,90,0.25)'; x.lineWidth = 1; for (let i = 0; i < 1600; i++) { const px = R() * Wd, py = R() * Hd, a = R() * 6.28, l = 6 + R() * 22; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } }
const HIDE = new Set(['Мама.', 'Но ты вырос.']);
const chunks = TL.chunks.filter(ch => !HIDE.has(ch.words.map(w => w.w).join(' ')));
function subs(c, t) {
  for (let i = 0; i < chunks.length; i++) {
    const ch = chunks[i], ws = ch.words, s = ws[0].s - 0.1, nx = chunks[i + 1], e = Math.min(ws[ws.length - 1].e + 0.6, nx ? nx.words[0].s - 0.12 : 1e9);
    if (t < s || t > e) continue; const fo = C.clamp((e - t) / 0.25);
    const parts = ws.map(w => { const f = w.hl ? `56px LoraSI` : `600 54px LoraS`; c.font = f; return { txt: w.w, f, w: c.measureText(w.w).width, hl: w.hl, s: w.s }; });
    const lines = [[]]; let lw = 0; const sp = 16; for (const p of parts) { if (lw + p.w > 880 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(p); lw += p.w + sp; }
    const y0 = 1640 - (lines.length - 1) * 74;
    lines.forEach((ln, li) => { const tw = ln.reduce((a, p) => a + p.w, 0) + sp * (ln.length - 1); let x = 540 - tw / 2; const y = y0 + li * 74;
      for (const p of ln) { const k = C.easeOut(C.clamp((t - p.s + 0.08) / 0.35)); if (k > 0) { c.save(); c.globalAlpha = k * fo; c.font = p.f; c.textBaseline = 'middle'; c.textAlign = 'left'; c.shadowColor = 'rgba(20,10,5,0.75)'; c.shadowBlur = 18; c.shadowOffsetY = 3; c.fillStyle = p.hl ? '#ffc98a' : '#fff4e2'; c.fillText(p.txt, x, y + (1 - k) * 14); c.restore(); } x += p.w + sp; } });
  }
}
function drawShot(sh, t, cv) { F.canvas = cv; F.ctx = cv.getContext('2d'); F.ctx.save(); F.ctx.setTransform(1, 0, 0, 1, 0, 0); F.ctx.fillStyle = '#000'; F.ctx.fillRect(0, 0, Wd, Hd); F.ctx.restore(); sh.draw(F, t); C.post(F, t, sh.grade); }
function frame(t) {
  const i = Math.max(0, S.findIndex(s => t >= s.t0 && t < s.t1)); const idx = S.findIndex(s => t >= s.t0 && t < s.t1) < 0 ? S.length - 1 : i; const sh = S[idx];
  drawShot(sh, t, main);
  if (idx > 0 && sh.xin > 0 && t < sh.t0 + sh.xin) { drawShot(S[idx - 1], t, B); const m = main.getContext('2d'); m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1 - C.easeIO((t - sh.t0) / sh.xin); m.drawImage(B, 0, 0); m.restore(); }
  F.canvas = main; F.ctx = main.getContext('2d'); const c = F.ctx;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.16; c.drawImage(tex, 0, 0); c.restore();
  c.save(); c.setTransform(F.S, 0, 0, F.S, 0, 0); subs(c, t); c.restore();
  const fi = C.clamp(1 - t / 0.3), fo = C.clamp((t - (DUR - 0.6)) / 0.6); const a = Math.max(fi, fo); if (a > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, Wd, Hd); c.restore(); }
}
if (mode === 'png') { const fs = require('fs'); for (const t of process.argv[6].split(',').map(Number)) { frame(t); fs.writeFileSync(`${process.argv[7]}/f_${t.toFixed(2)}.png`, main.toBuffer('image/png')); } }
else { const fs = require('fs'); for (let f = +process.argv[6]; f < +process.argv[7]; f++) { frame(f / FPS); const img = main.getContext('2d').getImageData(0, 0, Wd, Hd); fs.writeSync(1, Buffer.from(img.data.buffer)); } }
