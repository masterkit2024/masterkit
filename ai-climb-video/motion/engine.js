// ===== Core helpers: math, easing, noise, keyframes, splines =====
'use strict';
const W = 1080, H = 1920;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const sstep = (a, b, v) => { const t = inv(a, b, v); return t * t * (3 - 2 * t); };
const E = {
  lin: t => t,
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outQuint: t => 1 - Math.pow(1 - t, 5),
  ioSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
const ease = (a, b, t, e = 'io') => E[e](inv(a, b, t));

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const _perm = (() => { const r = rng(1337), p = []; for (let i = 0; i < 512; i++) p.push(r()); return p; })();
function n1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(_perm[i & 511], _perm[(i + 1) & 511], u) * 2 - 1; }
function h2(i, j) { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); }
function n2(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h2(i, j), h2(i + 1, j), u), lerp(h2(i, j + 1), h2(i + 1, j + 1), u), v);
}
function fbm2(x, y, o = 4) { let s = 0, a = .5, f = 1; for (let k = 0; k < o; k++) { s += a * n2(x * f, y * f); f *= 2.03; a *= .5; } return s; }
function fbm1(x, o = 4) { let s = 0, a = .5, f = 1; for (let k = 0; k < o; k++) { s += a * n1(x * f + k * 17.3); f *= 2.1; a *= .5; } return s; }

// keyframes: [[t, v, easeToNext?], ...]  v may be number or array
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, e] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = E[e || 'io'](inv(t0, t1, t));
      return Array.isArray(v0) ? v0.map((x, k) => lerp(x, v1[k], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}
// smooth spline through keys (time-aware Catmull-Rom / cubic Hermite), keeps velocity continuous
function spl(t, keys) {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t0, p0] = keys[i], [t1, p1] = keys[i + 1];
  const tan = k => {
    if (k <= 0 || k >= n - 1) return 0;
    const [ta, pa] = keys[k - 1], [tb, pb] = keys[k + 1];
    return (pb - pa) / (tb - ta);
  };
  const m0 = tan(i) * (t1 - t0), m1 = tan(i + 1) * (t1 - t0);
  const u = (t - t0) / (t1 - t0), u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
}
// camera spline: keys [[t, x, y, z, r]]
function camAt(t, keys) {
  const ch = c => keys.map(k => [k[0], k[c]]);
  return { x: spl(t, ch(1)), y: spl(t, ch(2)), z: spl(t, ch(3)), r: spl(t, ch(4)) };
}

// ===== canvas helpers =====
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function capsule(c, x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1e-3;
  const nx = -dy / L, ny = dx / L;
  c.moveTo(x1 + nx * r1, y1 + ny * r1); c.lineTo(x2 + nx * r2, y2 + ny * r2);
  c.arc(x2, y2, r2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
  c.lineTo(x1 - nx * r1, y1 - ny * r1);
  c.arc(x1, y1, r1, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true);
  c.closePath();
}
function rrect(c, x, y, w, h, r) {
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function rgba(hex, a) { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16 & 255},${v >> 8 & 255},${v & 255},${a})`; }
function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const ch = s => Math.round(lerp(a >> s & 255, b >> s & 255, t));
  return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
}

// ===== assets =====
const IMG = {};
async function loadImages() {
  const names = ['chatgpt', 'grok', 'claude', 'gemini', 'deepseek', 'chatgpt_white', 'grok_white'];
  await Promise.all(names.map(n => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { IMG[n] = im; res(); }; im.onerror = rej; im.src = 'assets/logos/' + n + '.png';
  })));
  // tinted glow versions of face logos
  const tint = (src, col) => { const c = mkCanvas(512, 512), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 512, 512); return c; };
  IMG.gpt_green = tint(IMG.chatgpt_white, '#19c37d');
  IMG.grok_ice = tint(IMG.grok_white, '#cfe6ff');
  const glow = (src, r) => { const c = mkCanvas(512, 512), g = c.getContext('2d'); g.filter = `blur(${r}px)`; g.drawImage(src, 96, 96, 320, 320); g.drawImage(src, 96, 96, 320, 320); return c; };
  IMG.gpt_glow = glow(IMG.gpt_green, 26); IMG.grok_glow = glow(IMG.grok_ice, 26);
}

const TEX = {};
function buildTextures() {
  // rock texture (tileable-ish), dark
  const S = 768, c = mkCanvas(S, S), g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S * 8, v = y / S * 8;
    let n = fbm2(u, v, 5);
    const strata = Math.sin(v * 3.2 + fbm2(u * .5, v * .5, 3) * 6) * .5 + .5;
    const crack = Math.pow(1 - Math.abs(fbm2(u * 1.3 + 9, v * 1.3, 4) * 2 - 1), 14);
    let val = n * .75 + strata * .25 - crack * .55;
    val = clamp(val);
    const i = (y * S + x) * 4;
    d[i] = 40 + val * 70; d[i + 1] = 44 + val * 72; d[i + 2] = 54 + val * 78; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  TEX.rock = c;
  // film grain frames
  TEX.grain = [];
  for (let k = 0; k < 6; k++) {
    const gc = mkCanvas(384, 384), gg = gc.getContext('2d'), gi = gg.createImageData(384, 384), gd = gi.data, r = rng(100 + k);
    for (let i = 0; i < gd.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 90; gd[i] = gd[i + 1] = gd[i + 2] = v; gd[i + 3] = 255; }
    gg.putImageData(gi, 0, 0); TEX.grain.push(gc);
  }
  // soft cloud puff sprite
  const cs = mkCanvas(256, 256), cg = cs.getContext('2d');
  const rg = cg.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.45, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  cg.fillStyle = rg; cg.fillRect(0, 0, 256, 256); TEX.puff = cs;
  // bokeh dot
  const bs = mkCanvas(64, 64), bg = bs.getContext('2d');
  const br = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
  br.addColorStop(0, 'rgba(255,255,255,.9)'); br.addColorStop(.6, 'rgba(255,255,255,.35)'); br.addColorStop(1, 'rgba(255,255,255,0)');
  bg.fillStyle = br; bg.fillRect(0, 0, 64, 64); TEX.dot = bs;
}

// ===== world camera =====
// layer transform with parallax factor p (1 = subject plane, <1 far, >1 near)
function camApply(c, cam, p = 1, shake = { x: 0, y: 0, r: 0 }) {
  const z = Math.pow(cam.z, p);
  c.translate(W / 2 + shake.x * p, H / 2 + shake.y * p);
  c.rotate(cam.r + shake.r);
  c.scale(z, z);
  c.translate(-cam.x * p, -cam.y * p);
}
function worldToScreen(cam, x, y, shake = { x: 0, y: 0, r: 0 }) {
  let dx = (x - cam.x) * cam.z, dy = (y - cam.y) * cam.z;
  const r = cam.r + shake.r, cs = Math.cos(r), sn = Math.sin(r);
  return { x: W / 2 + shake.x + dx * cs - dy * sn, y: H / 2 + shake.y + dx * sn + dy * cs };
}
function shakeAt(t, hits) { // hits: [[time, amp, decay]]
  let x = 0, y = 0, r = 0;
  for (const [th, amp, dec] of hits) {
    if (t < th) continue;
    const k = amp * Math.exp(-(t - th) * dec);
    if (k < .05) continue;
    x += n1((t - th) * 38 + th) * k; y += n1((t - th) * 41 + th * 3 + 50) * k; r += n1((t - th) * 30 + 90) * k * .0018;
  }
  return { x, y, r };
}
