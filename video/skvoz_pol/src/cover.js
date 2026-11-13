// Thumbnail / cover 1080x1920. Key content kept inside the 3:4 profile-grid crop (y 240..1680).
window.renderAt = function () {
  const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.filter = 'none'; c.globalAlpha = 1;
  // upper room
  c.save(); cam(c, 540, 760, 1.25);
  wallpaper(c, -400, -200, 1900, 1300, '#ffd98f', '#ffcc70', 90);
  windowFrame(c, 700, 330, 240, 260, ['#7fd4ff', '#d8f3ff'], 0);
  sofa(c, 170, 1000, '#5b6cff', 300);
  c.restore();
  // floor slice at screen y ~1010
  const FY = 1010;
  // underground below the floor: layers down to glowing core
  [['#8a5a32',FY],['#6e4426',FY+260],['#4a2a22',FY+500],['#2a1414',FY+700]].forEach(([col,y])=>{c.fillStyle=col;c.fillRect(0,y,W,H-y);line(c,0,y,W,y,5,'rgba(0,0,0,.35)','butt');});
  c.save(); c.beginPath(); c.arc(W/2, H+380, 560, 0, TAU); c.fillStyle='#ff6a2b'; c.fill(); c.lineWidth=8; c.strokeStyle=OUT; c.stroke();
  c.beginPath(); c.arc(W/2, H+380, 400, 0, TAU); c.fillStyle='#ffad33'; c.fill(); c.stroke(); c.beginPath(); c.arc(W/2, H+380, 250, 0, TAU); c.fillStyle='#fff4a8'; c.fill(); c.stroke(); c.restore();
  for (let i = 0; i < 26; i++) circle(c, hash(i) * W, FY + 120 + hash(i + 3) * 500, 10 + hash(i + 6) * 22, 'rgba(0,0,0,.18)');
  c.fillStyle = rgrad(c, W / 2, H + 120, 300, 1000, ['rgba(255,220,120,.5)', 'rgba(255,120,40,.25)', 'rgba(255,90,30,0)']); c.fillRect(0, FY, W, H - FY);
  speedLines(c, 0.37, { n: 26, spd: 0, col: 'rgba(255,240,200,.35)', len: 300, x0: 120, w: 840 });
  // floor slab
  c.fillStyle = '#9aa3b5'; c.fillRect(0, FY, W, 70); line(c, 0, FY, W, FY, 8, OUT, 'butt'); line(c, 0, FY + 70, W, FY + 70, 8, OUT, 'butt');
  // hero: half through the floor, falling
  const hx = 540, hy = 1400;
  aura(c, hx, 1080, 560, 1);
  c.save(); c.translate(hx, hy); c.scale(1.7, 1.7); c.translate(-hx, -hy);
  person(c, { x: hx, y: hy, s: 1, emo: 'scream', ...POSE.armsUp, look: { x: 0, y: -1 }, glow: .8 });
  c.restore();
  // ghosted floor over the part inside the slab
  c.save(); c.globalAlpha = .55; c.fillStyle = '#9aa3b5'; c.fillRect(0, FY, W, 70); c.restore();
  ripple(c, hx, FY + 35, 1, .55, { axis: 'h', size: 520, n: 3, gap: .12, dur: 1.2 });
  // title
  text(c, 'ЧТО ЕСЛИ ТЫ', W / 2, 300, { size: 104, fill: '#fff', sw: 22 });
  text(c, 'ПРОХОДИШЬ\nСКВОЗЬ ВСЁ?', W / 2, 500, { size: 140, fill: '#5ff4ff', rot: -.035, sw: 26 });
  // badge
  c.save(); c.translate(810, 1560); c.rotate(.08);
  rr(c, -230, -70, 460, 140, 36); fillStroke(c, '#ff3b3b', 10);
  text(c, '40 МИНУТ\nПАДЕНИЯ', 0, 2, { size: 54, sw: 10, lh: 1.0 });
  c.restore();
  vignette(c, .3);
};
