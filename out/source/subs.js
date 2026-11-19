const C = require('./core');
const TL = require('../timeline.json');
const { hex, rgba, clamp, easeOut } = C;
// build chunks
const CH = [];
for (const c of TL) {
  const groups = {};
  for (const w of c.words) (groups[w.chunk] ||= []).push(w);
  const keys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  keys.forEach((k, i) => { const ws = groups[k]; CH.push({ words: ws, s: ws[0].s - 0.06, e: ws[ws.length - 1].e, warm: c.warm, italic: c.italic, clip: c.id }); });
}
for (let i = 0; i < CH.length; i++) { const nx = CH[i + 1]; CH[i].end = Math.min(CH[i].e + 0.45, nx ? nx.s - 0.02 : 1e9); }
const FS = 76, LH = 92, MAXW = 820, CX = 510, CY = 1330;
function layout(ctx, ch) {
  ctx.font = `${ch.italic ? 'italic ' : ''}900 ${FS}px Inter`;
  const sp = ctx.measureText(' ').width; const lines = [[]]; let lw = 0;
  for (const w of ch.words) { const txt = w.w.toUpperCase(); const ww = ctx.measureText(txt).width; if (lw + ww > MAXW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ ...w, txt, ww }); lw += ww + sp; }
  const out = []; lines.forEach((ln, li) => { const tw = ln.reduce((a, w) => a + w.ww, 0) + sp * (ln.length - 1); let x = CX - tw / 2; const y = CY + (li - (lines.length - 1) / 2) * LH; for (const w of ln) { out.push({ ...w, x: x + w.ww / 2, y }); x += w.ww + sp; } });
  return out;
}
function drawSubs(F, t) {
  const ctx = F.ctx;
  ctx.save(); ctx.setTransform(F.S, 0, 0, F.S, 0, 0);
  for (const ch of CH) {
    if (t < ch.s || t > ch.end) continue;
    const fadeOut = clamp((ch.end - t) / 0.12);
    const L = layout(ctx, ch);
    ctx.font = `${ch.italic ? 'italic ' : ''}900 ${FS}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const w of L) {
      if (t < w.s - 0.04) continue;
      const k = easeOut(clamp((t - w.s + 0.04) / 0.1)); const sc = 0.9 + 0.1 * k, a = k * fadeOut;
      ctx.save(); ctx.translate(w.x, w.y); ctx.scale(sc, sc); ctx.globalAlpha = a;
      ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 22 * F.S; ctx.shadowOffsetY = 4 * F.S;
      ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineJoin = 'round'; ctx.strokeText(w.txt, 0, 0);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = w.hl ? (ch.warm ? '#FFB454' : '#7FD3FF') : '#FFFFFF'; ctx.fillText(w.txt, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}
module.exports = { drawSubs, CH };
