const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const DURATION = 131.6;
let SUBS = [];
const off = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
// grain tile
const grain = document.createElement('canvas'); grain.width = grain.height = 256;
{ const g = grain.getContext('2d'), id = g.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 18; } g.putImageData(id, 0, 0); }

window.ready = (async () => { SUBS = window.SUBS_DATA; })();

function sceneAt(t) { for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i].a && t < SCENES[i].b) return i; return SCENES.length - 1; }

function drawScene(c, i, t) {
  const S = SCENES[i];
  c.save();
  const n = S.mb ? S.mb(t) : 1;
  if (n <= 1) { S.draw(c, t); }
  else {
    // temporal supersampling motion blur (shutter 180°)
    const acc = off[2].getContext('2d');
    for (let k = 0; k < n; k++) {
      const tt = t - (k / n) * (.5 / FPS);
      acc.setTransform(1, 0, 0, 1, 0, 0); acc.globalAlpha = 1; acc.fillStyle = '#000'; acc.fillRect(0, 0, W, H);
      S.draw(acc, tt);
      c.globalAlpha = 1 / (k + 1); c.drawImage(off[2], 0, 0);
    }
    c.globalAlpha = 1;
  }
  c.restore();
}

function renderFrame(c, t) {
  const i = sceneAt(t), S = SCENES[i];
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none';
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  // transitions: around boundary S.a with previous scene's tout
  const P = SCENES[i - 1]; const TD = .16;
  const nearStart = P && P.tout && t < S.a + TD;
  const nearEnd = S.tout && t > S.b - TD && SCENES[i + 1];
  if (nearStart || nearEnd) {
    const A = nearStart ? i - 1 : i, B = A + 1, type = SCENES[A].tout, edge = SCENES[B].a;
    const k = clamp((t - (edge - TD)) / (2 * TD)); const e = ease.io(k);
    const a = off[0].getContext('2d'), b = off[1].getContext('2d');
    if (type === 'cutFlash') {
      drawScene(c, t < edge ? A : B, t);
      const f = 1 - Math.abs(k - .5) * 2; c.fillStyle = `rgba(255,255,255,${f * .55})`; c.fillRect(0, 0, W, H);
    } else {
      a.setTransform(1, 0, 0, 1, 0, 0); b.setTransform(1, 0, 0, 1, 0, 0);
      drawScene(a, A, t); drawScene(b, B, t);
      const dx = type === 'whipL' ? -W : type === 'whipR' ? W : 0, dy = type === 'whipU' ? -H : type === 'whipD' ? H : 0;
      const ghosts = 6; const vel = Math.sin(k * Math.PI);
      for (let g = 0; g < ghosts; g++) {
        const gk = e - vel * .06 * g / ghosts;
        c.globalAlpha = 1 / (g + 1);
        c.drawImage(off[0], dx * gk, dy * gk); c.drawImage(off[1], dx * (gk - 1), dy * (gk - 1));
      }
      c.globalAlpha = 1;
    }
  } else drawScene(c, i, t);
  // subtitles
  if (!(typeof S.noSubs === 'function' ? S.noSubs(t) : S.noSubs)) drawSubs(c, t);
  // global grade
  c.setTransform(1, 0, 0, 1, 0, 0);
  vignette(c, .28);
  c.globalAlpha = 1; const gx = Math.floor(hash(t * 30) * 256), gy = Math.floor(hash(t * 30 + 7) * 256);
  c.save(); c.translate(-gx, -gy); c.fillStyle = c.createPattern(grain, 'repeat'); c.fillRect(0, 0, W + 256, H + 256); c.restore();
  // fade in/out
  if (t > DURATION - .4) { c.fillStyle = `rgba(0,0,0,${inv(DURATION - .4, DURATION, t)})`; c.fillRect(0, 0, W, H); }
}

function drawSubs(c, t) {
  const ch = SUBS.find(s => t >= s.start - .05 && t < s.end); if (!ch) return;
  if (HIDE_SUBS.some(([a, b]) => t >= a && t < b)) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const size = 64; c.font = `900 ${size}px ${F_HEAD}`;
  // layout words into lines (max width 900)
  const words = ch.words.map(w => ({ ...w, txt: w.w.toUpperCase() }));
  const space = size * .4; const lines = [[]]; let lw = 0;
  words.forEach(w => { w.wd = c.measureText(w.txt).width; if (lw + w.wd > 880 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(w); lw += w.wd + space; });
  const y0 = 1440 - (lines.length - 1) * size * .55;
  const chIn = ease.outBack(clamp((t - ch.start + .05) / .18), 1.6);
  lines.forEach((ln, li) => {
    const total = ln.reduce((s, w) => s + w.wd, 0) + space * (ln.length - 1);
    let x = W / 2 - total / 2; const y = y0 + li * size * 1.12;
    ln.forEach(w => {
      const on = t >= w.t - .03; const k = clamp((t - w.t + .03) / .12);
      const sc = on ? 1 + .07 * Math.sin(k * Math.PI) : 1;
      c.save(); c.translate(x + w.wd / 2, y); c.scale(sc * chIn, sc * chIn);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.lineWidth = 16; c.strokeStyle = OUT; c.strokeText(w.txt, 0, 0);
      c.fillStyle = on ? '#ffe14d' : '#ffffff'; c.fillText(w.txt, 0, 0);
      c.restore(); x += w.wd + space;
    });
  });
  c.restore();
}
const HIDE_SUBS = [];

window.renderAt = function (t) { renderFrame(ctx, t); };
window.sheet = function (ts) {
  const tmp = document.createElement('canvas'); const n = ts.length, cols = Math.min(n, 4), rows = Math.ceil(n / cols);
  tmp.width = cols * 360; tmp.height = rows * 640; const c2 = tmp.getContext('2d');
  ts.forEach((t, i) => { window.renderAt(t); c2.drawImage(cv, (i % cols) * 360, Math.floor(i / cols) * 640, 360, 640); c2.fillStyle = '#ff0'; c2.font = 'bold 26px sans-serif'; c2.fillText(t.toFixed(2), (i % cols) * 360 + 8, Math.floor(i / cols) * 640 + 30); });
  return tmp.toDataURL('image/png');
};
