// ===== core: canvas, math, time, cues, camera =====
const { createCanvas, GlobalFonts, Path2D, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const W = 1920, H = 1080, FPS = 30;
const DIR = __dirname;
GlobalFonts.registerFromPath(path.join(DIR, 'fonts/Oswald.ttf'), 'Osw');
GlobalFonts.registerFromPath(path.join(DIR, 'fonts/PTMono.ttf'), 'Mono');
GlobalFonts.registerFromPath(path.join(DIR, 'fonts/Caveat.ttf'), 'Hand');
GlobalFonts.registerFromPath(path.join(DIR, 'fonts/Playfair.ttf'), 'Play');
const F = { osw: 'Osw', mono: 'Mono', hand: 'Hand', play: 'Play' };
const TL = require('./timeline.json');

const mk = (w, h) => createCanvas(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)));
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  lin: t => t,
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  out5: t => 1 - Math.pow(1 - t, 5),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  expo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  back: t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3.2) + 1,
  drop: t => { // falls in and bounces slightly (paper landing)
    if (t >= 1) return 1; const a = E.out5(clamp(t / .7)); const b = t > .7 ? Math.sin((t - .7) / .3 * Math.PI) * .03 * (1 - t) : 0; return a + b;
  },
};
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hr(i), hr(i + 1), u) * 2 - 1; };

// ---- time ----
const S = { T: 0, F: 0, sub: 0 };          // current absolute time, frame, subframe
const now = () => S.T;
const twos = () => Math.floor(S.T * 12) / 12;          // stop-motion clock (on twos)
const tw = (t0, d = .5, e = E.out) => e(clamp((S.T - t0) / d));
const tw2 = (t0, d = .5, e = E.out) => e(clamp((twos() - t0) / d)); // stepped
const since = t0 => S.T - t0;

// ---- cues ----
const norm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');
const WN = TL.words.map(w => Object.assign({ n: norm(w.w) }, w)).filter(w => w.n);
function cue(s, phrase, n = 0, end = false) {
  const toks = phrase.split(/\s+/).map(norm).filter(x => x);
  const ws = WN.filter(w => w.s === s); let k = 0;
  for (let i = 0; i + toks.length <= ws.length; i++) {
    let ok = true; for (let j = 0; j < toks.length; j++) if (!ws[i + j].n.startsWith(toks[j])) { ok = false; break; }
    if (ok) { if (k === n) return end ? ws[i + toks.length - 1].t1 : ws[i].t0; k++; }
  }
  throw new Error('cue not found: ' + s + ' ' + phrase);
}
const cueE = (s, p, n = 0) => cue(s, p, n, true);
const SC = n => TL.scenes[n - 1];

// ---- sound events (registered at build time) ----
const EVENTS = [];
function ev(t, type, o = {}) { EVENTS.push(Object.assign({ t: +(+t).toFixed(3), type }, o)); return t; }

// ---- camera ----
let CAM = { x: 0, y: 0, z: 1, r: 0 };
function camera(lt, D, c = {}) {
  const p = (c.ease || E.sine)(clamp(lt / Math.max(D, .01)));
  const g = (k, d) => c[k] ? lerp(c[k][0], c[k][1], p) : d;
  const hh = c.hand === undefined ? 1 : c.hand;
  CAM = {
    x: g('x', 0) + (noise1(S.T * .45) * 7 + noise1(S.T * 1.3 + 9) * 2) * hh,
    y: g('y', 0) + (noise1(S.T * .4 + 3) * 6 + noise1(S.T * 1.5 + 5) * 2) * hh,
    z: g('z', 1), r: g('r', 0) + noise1(S.T * .3 + 7) * .003 * hh,
  };
  if (c.shake) { const k = c.shake(); CAM.x += noise1(S.T * 40) * k; CAM.y += noise1(S.T * 43 + 2) * k; CAM.r += noise1(S.T * 37) * k * .0015; }
}
function L(ctx, depth, fn) {
  ctx.save(); const z = Math.pow(CAM.z, depth);
  ctx.translate(W / 2, H / 2); ctx.rotate(CAM.r * depth); ctx.scale(z, z);
  ctx.translate(-W / 2 - CAM.x * depth, -H / 2 - CAM.y * depth);
  fn(); ctx.restore();
}
// impact shake helper: returns shake amount from a list of hit times
const hits = (list, amp = 14, d = .35) => () => list.reduce((a, t) => { const q = (S.T - t) / d; return a + (q >= 0 && q < 1 ? (1 - q) * (1 - q) * amp : 0); }, 0);

function font(ctx, fam, size, wt = '') { ctx.font = `${wt} ${size}px ${fam}`.trim(); }

module.exports = { createCanvas, Path2D, loadImage, W, H, FPS, F, TL, mk, clamp, lerp, E, mulberry, hr, noise1, S, now, twos, tw, tw2, since, cue, cueE, SC, EVENTS, ev, camera, L, hits, font, CAMref: () => CAM };
