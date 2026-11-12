const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const fs = require('fs');
const { W, H, F, font } = K; const { P, put, sheet } = Pp;
(async () => {
  await Pp.loadPhotos(); K.S.T = 1000;
  const c = K.mk(W, H), x = c.getContext('2d');
  x.drawImage(X.cork(9, '#c08a52'), -300, -200);
  // dark vignette paper bands
  put(x, sheet({ w: 2100, h: 520, color: '#1d2433', seed: 5, torn: [22, 0, 0, 0], tex: .6 }), W / 2, H - 230, { rot: -.02 });
  // four faceless cards with red thread
  const pos = [[300, 300, -.08], [720, 250, .05], [1160, 290, -.04], [1600, 250, .07]];
  pos.forEach(([px, py, r], i) => {
    const card = Pp.cutout('thumbcard' + i, 300, 380, (cx, part) => { part(X.R(0, 0, 300, 380, 4), '#f4efe3'); part(X.R(20, 20, 260, 280, 2), ['#2c3e5c', '#3d4d3c', '#4a3426', '#1d2b44'][i]); cx.save(); cx.translate(150, 300); cx.scale(2.6, 2.6); cx.fillStyle = '#0d1018'; cx.fill(Pp.personPath(i === 2 ? 'woman' : 'coat', 0)); cx.restore(); font(cx, F.hand, 50, '700'); cx.fillStyle = '#1d2433'; cx.textAlign = 'center'; cx.fillText('дело ' + (i + 1), 150, 350); });
    put(x, card, px, py, { rot: r }); });
  for (let i = 0; i < 3; i++) X.thread(x, [pos[i][0], pos[i][1] - 170], [pos[i + 1][0], pos[i + 1][1] - 170], 1, 60);
  X.thread(x, [pos[0][0], pos[0][1] - 170], [pos[3][0], pos[3][1] - 170], 1, 230);
  pos.forEach(([px, py]) => put(x, Pp.pin(), px, py - 175, { elev: .4, s: 1.3 }));
  // headline: two lines, red bold with white sticker border
  const line = (s, y, size) => { const spr = Pp.cached('th|' + s, () => { const m = K.mk(10, 10).getContext('2d'); font(m, F.osw, size, '700'); m.letterSpacing = '4px'; const w = m.measureText(s).width + 60, h = size * 1.25; let sp = Pp.sprite(Math.ceil(w), Math.ceil(h), 10, (c2) => { font(c2, F.osw, size, '700'); c2.letterSpacing = '4px'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillStyle = '#d1242c'; c2.fillText(s, w / 2, h / 2 + size * .04); }); sp = Pp.stickerize(sp, 14, '#fbf8f1'); return sp; }); put(x, spr, W / 2, y, { rot: -.025 }); };
  line('ПО ЧЕМУ ОН', 710, 190); line('ВЫБИРАЕТ?', 905, 210);
  X.scraps(x, [P.yellow, P.coral, P.teal, P.cream], 0, 1);
  // vignette
  const g = x.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const o = K.mk(1280, 720), ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(c, 0, 0, 1280, 720);
  fs.mkdirSync('out', { recursive: true }); fs.writeFileSync('out/thumbnail.png', await o.encode('png'));
})();
