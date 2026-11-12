// ===== animation helpers =====
const K = require('./core'); const Pp = require('./paper');
const { W, H, clamp, lerp, E, hr, S, twos } = K;
// fly in & land like paper: from offset with rotation & elevation; optional exit
function fly(ctx, spr, x, y, t0, o = {}) {
  const T = o.twos ? twos() : S.T; const d = o.d || .55; let p = clamp((T - t0) / d); if (T < t0) return;
  const from = o.from || [0, -H * .8]; const e = (o.ease || E.out5)(p);
  let px = lerp(x + from[0], x, e), py = lerp(y + from[1], y, e), rot = lerp((o.rot || 0) + (o.spin === undefined ? .5 : o.spin), o.rot || 0, e), elev = (1 - e) * (o.lift || 1.2) + (o.elev || 0), s = lerp(o.s0 || 1.15, 1, e) * (o.s || 1), a = o.a === undefined ? 1 : o.a;
  // settle bounce
  if (p >= 1 && o.bounce !== false) { const q = (T - t0 - d) / .25; if (q < 1) { s *= 1 + Math.sin(q * Math.PI) * .015; } }
  if (o.out !== undefined && T > o.out) { const q = clamp((T - o.out) / (o.outD || .45)); const qe = E.in(q); const to = o.to || [W * .9, -H * .3]; px = lerp(px, x + to[0], qe); py = lerp(py, y + to[1], qe); rot += qe * (o.outSpin || .8); elev += qe * 1.2; if (q >= 1) return; }
  if (o.drift) { px += Math.sin(S.T * .7 + x) * o.drift; py += Math.cos(S.T * .6 + y) * o.drift * .6; }
  Pp.put(ctx, spr, px, py, { rot, s, elev, a, sx: o.sx, sy: o.sy });
  return [px, py];
}
// pop: scale up from 0 with back ease (stickers, pins)
function pop(ctx, spr, x, y, t0, o = {}) { const T = o.twos === false ? S.T : twos(); const p = clamp((T - t0) / (o.d || .3)); if (p <= 0) return; let a = o.a === undefined ? 1 : o.a; let s = E.back(p) * (o.s || 1); let yy = y;
  if (o.out !== undefined && S.T > o.out) { const q = clamp((S.T - o.out) / (o.outD || .4)); a *= 1 - q; s *= 1 - q * .4; yy -= q * 60; if (q >= 1) return; }
  Pp.put(ctx, spr, x, yy, { rot: o.rot || 0, s, elev: (1 - p) * .8 + (o.elev || 0), a }); }
// sweep away (stickers swept off)
function sweep(t, t0, dx = 1400, dy = -200) { const q = E.in(clamp((S.T - t0) / .5)); return [q * dx, q * dy, q * 1.4, q]; }
module.exports = { fly, pop, sweep };
