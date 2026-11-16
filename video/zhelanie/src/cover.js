window.renderAt = function () {
  const c = ctx, t = 0.3; c.setTransform(1, 0, 0, 1, 0, 0); c.filter = 'none'; c.globalAlpha = 1;
  c.fillStyle = rgrad(c, 540, 1050, 100, 1300, ['#ffcf5a', '#ff7a1a', '#c2300f']); c.fillRect(0, 0, W, H);
  rays(c, 540, 1100, 0, { n: 16, a: .18, col: '#fff6c8', r: 1800, w: 110, spin: 0 });
  // flying wishes
  const arrow = (x1, y1, x2, y2) => { line(c, x1, y1, x2, y2, 14, OUT); const a = Math.atan2(y2 - y1, x2 - x1); poly(c, [x2, y2, x2 - 40 * Math.cos(a - .5), y2 - 40 * Math.sin(a - .5), x2 - 40 * Math.cos(a + .5), y2 - 40 * Math.sin(a + .5)], OUT, 0); };
  arrow(250, 1110, 390, 1240); arrow(840, 1110, 700, 1240); arrow(330, 1500, 450, 1380);
  pizza(c, 170, 960, 115, t, { steam: true });
  extinguisher(c, 900, 960, .6, { rot: .35 });
  towTruck(c, 230, 1640, .5, t);
  // hero jumping with fire
  c.save(); c.translate(560, 1560); c.scale(1.45, 1.45); c.translate(-540, -1480);
  smoke(c, 500, 1330, 1.1, 1.2, 7);
  person(c, { x: 540, y: 1480, s: 1, emo: 'scream', ...POSE.armsUp, look: { x: 0, y: -1 }, blink: 0 });
  flames(c, 495, 1370, 130, 1.3);
  c.restore();
  text(c, 'ЧТО ЕСЛИ ВСЁ,', W / 2, 250, { size: 100, fill: '#fff', sw: 22 });
  text(c, 'ЧТО ПОЖЕЛАЕШЬ,', W / 2, 365, { size: 100, fill: '#fff', sw: 22 });
  text(c, 'ПОЯВЛЯЕТСЯ\nВ Ж*ПЕ?', W / 2, 540, { size: 130, fill: '#ffe14d', rot: -.035, sw: 26 });
  vignette(c, .3);
};
