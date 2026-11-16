// ===== Characters: flat cartoon people with thick outline =====
const PAL = {
  hero: { skin: '#ffd2a8', skinSh: '#f2b384', top: '#ff7a1a', topSh: '#e05a00', pants: '#2f56ff', pantsSh: '#2241c9', shoe: '#ffffff', hair: '#2a1d3a', hairStyle: 'spiky' },
  girl: { skin: '#ffd9bd', skinSh: '#f3b998', top: '#ff4fa3', topSh: '#d93485', pants: '#7b3cff', pantsSh: '#5c25d6', shoe: '#ffe14d', hair: '#7a3b1c', hairStyle: 'long', lashes: true, skirt: true },
  baba: { skin: '#f6caa4', skinSh: '#e2a882', top: '#2fbf71', topSh: '#22985a', pants: '#4b3b8f', pantsSh: '#3a2c74', shoe: '#5a3a22', hair: '#d9d9e8', hairStyle: 'scarf', scarf: '#ff3b3b', skirt: true, glasses: true },
  dad: { skin: '#f5c7a0', skinSh: '#dfa77e', top: '#3fb7ff', topSh: '#2593d6', pants: '#3b3b4f', pantsSh: '#2b2b3c', shoe: '#222', hair: '#3a2a1a', hairStyle: 'bald', mustache: true },
  mom: { skin: '#ffd2b0', skinSh: '#f0b38f', top: '#ffd23f', topSh: '#e2b000', pants: '#ff6f61', pantsSh: '#d9534a', shoe: '#a33', hair: '#2b1a12', hairStyle: 'bun', skirt: true },
  kid: { skin: '#ffd8b8', skinSh: '#f0b898', top: '#8be04e', topSh: '#62b72c', pants: '#2f56ff', pantsSh: '#2241c9', shoe: '#fff', hair: '#e8a23a', hairStyle: 'spiky' },
};

const dirv = a => ({ x: Math.sin(a), y: Math.cos(a) });
function limb2(ctx, p0, a1, a2, len, w, col, s, endR, endCol) {
  const p1 = { x: p0.x + dirv(a1).x * len, y: p0.y + dirv(a1).y * len };
  const p2 = { x: p1.x + dirv(a1 + a2).x * len, y: p1.y + dirv(a1 + a2).y * len };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = OUT; ctx.lineWidth = w + 10 * s; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  return p2;
}

// Emotion presets: brows [innerY, outerY] offsets, mouth type, extras
const EMO = {
  calm: { brow: [0, 0], mouth: 'smile', m: .4 },
  happy: { brow: [-6, -2], mouth: 'grin', m: 1 },
  joy: { brow: [-10, -4], mouth: 'open', m: 1 },
  sly: { brow: [6, -10], mouth: 'smirk', m: 1, lids: .45 },
  shock: { brow: [-16, -12], mouth: 'O', m: 1, pupil: .6 },
  scream: { brow: [-18, -6], mouth: 'scream', m: 1, pupil: .5, sweat: true },
  worried: { brow: [-10, 6], mouth: 'wobble', m: .6, sweat: true },
  choke: { brow: [-8, 8], mouth: 'puff', m: 1, blue: true, sweat: true },
  cool: { brow: [2, -2], mouth: 'smirk', m: .8, shades: true },
  bored: { brow: [4, 4], mouth: 'flat', m: 1, lids: .55 },
  closed: { brow: [-2, 0], mouth: 'smile', m: .5, closed: true },
  awk: { brow: [-12, 4], mouth: 'awk', m: 1, sweat: true, blush: true },
  angry: { brow: [10, -8], mouth: 'flat', m: 1 },
  determined: { brow: [8, -6], mouth: 'grin', m: .7 },
};

/*
 p: {x,y (feet), s, pal, face(-1..1), emo, legs:[tL,kL,tR,kR], arms:[uL,fL,uR,fR], lean, tilt, look:{x,y},
     blink(0..1 closed), clothes(bool), alpha, glow(0..1), bob, hold:{side, fn}}
 angles: 0 = pointing down, +  = towards screen-right
*/
function person(ctx, p) {
  const s = p.s || 1, pal = p.pal || PAL.hero; const face = p.face ?? 0;
  const leg = 64 * s, torso = 124 * s, arm = 60 * s, hr = 72 * s;
  const clothes = p.clothes !== false;
  ctx.save();
  if (p.alpha !== undefined) ctx.globalAlpha *= p.alpha;
  const legs = p.legs || [.12, 0, -.12, 0];
  const arms = p.arms || [.25, -.1, -.25, .1];
  const lean = p.lean || 0;
  const hip = { x: p.x, y: p.y - 2 * leg + (p.bob || 0) };
  if (p.glow) aura(ctx, hip.x, hip.y - torso * .6, 330 * s, p.glow);
  // legs
  const legCol = clothes ? pal.pants : pal.skin;
  const fL = limb2(ctx, { x: hip.x - 20 * s, y: hip.y }, legs[0], legs[1], leg, 24 * s, legCol, s);
  const fR = limb2(ctx, { x: hip.x + 20 * s, y: hip.y }, legs[2], legs[3], leg, 24 * s, legCol, s);
  const shoeCol = clothes ? pal.shoe : pal.skin;
  const fd = face >= 0 ? 1 : -1;
  ell(ctx, fL.x + 10 * s * fd, fL.y + 4 * s, 24 * s, 13 * s, shoeCol, 5 * s, -legs[0] - legs[1]);
  ell(ctx, fR.x + 10 * s * fd, fR.y + 4 * s, 24 * s, 13 * s, shoeCol, 5 * s, -legs[2] - legs[3]);
  // torso
  ctx.save(); ctx.translate(hip.x, hip.y); ctx.rotate(lean);
  const topCol = clothes ? pal.top : pal.skin, topSh = clothes ? pal.topSh : pal.skinSh;
  ctx.beginPath();
  ctx.moveTo(-44 * s, -torso + 16 * s); ctx.quadraticCurveTo(-46 * s, -torso, -28 * s, -torso - 4 * s);
  ctx.lineTo(28 * s, -torso - 4 * s); ctx.quadraticCurveTo(46 * s, -torso, 44 * s, -torso + 16 * s);
  if (clothes && pal.skirt) { ctx.lineTo(52 * s, 22 * s); ctx.lineTo(-52 * s, 22 * s); }
  else { ctx.lineTo(40 * s, 10 * s); ctx.quadraticCurveTo(0, 18 * s, -40 * s, 10 * s); }
  ctx.closePath(); fillStroke(ctx, topCol, 0);
  // shade strip
  ctx.save(); ctx.clip(); ctx.fillStyle = topSh; ctx.fillRect(14 * s, -torso - 10 * s, 60 * s, torso + 40 * s);
  if (clothes && pal === PAL.hero) { // hoodie pocket + strings
    rr(ctx, -26 * s, -50 * s, 52 * s, 30 * s, 10 * s); fillStroke(ctx, pal.topSh, 4 * s);
    line(ctx, -10 * s, -torso + 4 * s, -12 * s, -torso + 40 * s, 4 * s, '#fff'); line(ctx, 10 * s, -torso + 4 * s, 12 * s, -torso + 40 * s, 4 * s, '#fff');
  }
  if (!clothes) { // belly button + simple chest lines
    circle(ctx, 0, -30 * s, 3 * s, OUT); line(ctx, -22 * s, -torso + 46 * s, -8 * s, -torso + 50 * s, 3 * s, pal.skinSh); line(ctx, 22 * s, -torso + 46 * s, 8 * s, -torso + 50 * s, 3 * s, pal.skinSh);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-44 * s, -torso + 16 * s); ctx.quadraticCurveTo(-46 * s, -torso, -28 * s, -torso - 4 * s);
  ctx.lineTo(28 * s, -torso - 4 * s); ctx.quadraticCurveTo(46 * s, -torso, 44 * s, -torso + 16 * s);
  if (clothes && pal.skirt) { ctx.lineTo(52 * s, 22 * s); ctx.lineTo(-52 * s, 22 * s); }
  else { ctx.lineTo(40 * s, 10 * s); ctx.quadraticCurveTo(0, 18 * s, -40 * s, 10 * s); }
  ctx.closePath(); fillStroke(ctx, null, 6 * s);
  ctx.restore();
  const rot = (px, py) => ({ x: hip.x + px * Math.cos(lean) - py * Math.sin(lean), y: hip.y + px * Math.sin(lean) + py * Math.cos(lean) });
  const shL = rot(-38 * s, -torso + 18 * s), shR = rot(38 * s, -torso + 18 * s);
  const neck = rot(0, -torso);
  // head
  const tilt = (p.tilt || 0) + lean * .5;
  const hc = { x: neck.x + Math.sin(tilt) * (hr + 2 * s), y: neck.y - Math.cos(tilt) * (hr + 2 * s) };
  // back hair (long)
  if (pal.hairStyle === 'long') { ctx.save(); ctx.translate(hc.x, hc.y); ctx.rotate(tilt); rr(ctx, -hr * 1.08, -hr * .5, hr * 2.16, hr * 2.05, hr * .7); fillStroke(ctx, pal.hair, 6 * s); ctx.restore(); }
  // arms (drawn before head so hands can go in front later? keep after torso)
  const armCol = clothes ? pal.top : pal.skin;
  const hL = limb2(ctx, shL, arms[0] + lean, arms[1], arm, 20 * s, armCol, s);
  const hR = limb2(ctx, shR, arms[2] + lean, arms[3], arm, 20 * s, armCol, s);
  circle(ctx, hL.x, hL.y, 14 * s, pal.skin, 5 * s); circle(ctx, hR.x, hR.y, 14 * s, pal.skin, 5 * s);
  if (p.hold) p.hold(ctx, hL, hR, s);
  // head
  ctx.save(); ctx.translate(hc.x, hc.y); ctx.rotate(tilt);
  head(ctx, hr, s, pal, p);
  ctx.restore();
  ctx.restore();
  return { hip, hc, hL, hR, fL, fR, neck };
}

function head(ctx, hr, s, pal, p) {
  const emo = EMO[p.emo || 'calm'] || EMO.calm; const face = p.face ?? 0; const fx = face * 16 * s;
  // ears
  ell(ctx, -hr * .96 + fx * .3, 6 * s, 14 * s, 18 * s, pal.skin, 5 * s); ell(ctx, hr * .96 + fx * .3, 6 * s, 14 * s, 18 * s, pal.skin, 5 * s);
  ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); fillStroke(ctx, emo.blue ? '#b9d4ff' : pal.skin, 0);
  ctx.save(); ctx.clip(); ctx.fillStyle = emo.blue ? '#94b6f0' : pal.skinSh; ctx.beginPath(); ctx.arc(hr * .55, hr * .2, hr * .9, 0, TAU); ctx.globalAlpha = .55; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); fillStroke(ctx, null, 6 * s);
  // hair
  const hc = pal.hair;
  if (pal.hairStyle === 'spiky') {
    ctx.beginPath(); ctx.moveTo(-hr * .95, -hr * .2);
    const n = 6; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; const r1 = hr * 1.05, r2 = hr * 1.32; const am = a + Math.PI / n / 2; ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 - 4 * s); if (i < n) ctx.lineTo(Math.cos(am) * r2 + 6 * s, Math.sin(am) * r2 - 2 * s); }
    ctx.lineTo(hr * .95, -hr * .25); ctx.quadraticCurveTo(0, -hr * .45, -hr * .95, -hr * .2); fillStroke(ctx, hc, 6 * s);
  } else if (pal.hairStyle === 'long') {
    ctx.beginPath(); ctx.moveTo(-hr * 1.02, hr * .1); ctx.quadraticCurveTo(-hr * 1.1, -hr * 1.15, 0, -hr * 1.08); ctx.quadraticCurveTo(hr * 1.1, -hr * 1.15, hr * 1.02, hr * .1);
    ctx.quadraticCurveTo(hr * .7, -hr * .55, hr * .05, -hr * .52); ctx.quadraticCurveTo(-hr * .5, -hr * .2, -hr * 1.02, hr * .1); fillStroke(ctx, hc, 6 * s);
    circle(ctx, hr * .62, -hr * .78, 13 * s, '#ffe14d', 4 * s);
  } else if (pal.hairStyle === 'scarf') {
    ctx.beginPath(); ctx.moveTo(-hr * 1.08, hr * .35); ctx.quadraticCurveTo(-hr * 1.25, -hr * 1.3, 0, -hr * 1.18); ctx.quadraticCurveTo(hr * 1.25, -hr * 1.3, hr * 1.08, hr * .35);
    ctx.quadraticCurveTo(hr * .9, -hr * .6, 0, -hr * .62); ctx.quadraticCurveTo(-hr * .9, -hr * .6, -hr * 1.08, hr * .35); fillStroke(ctx, pal.scarf, 6 * s);
    for (let i = 0; i < 5; i++) circle(ctx, -hr * .6 + i * hr * .3, -hr * .85 + Math.abs(i - 2) * hr * .06, 5 * s, '#fff');
    ell(ctx, -hr * .55, -hr * .45, hr * .3, hr * .12, pal.hair, 4 * s, -.2); ell(ctx, hr * .55, -hr * .45, hr * .3, hr * .12, pal.hair, 4 * s, .2);
  } else if (pal.hairStyle === 'bald') {
    ell(ctx, -hr * .92, -hr * .15, hr * .16, hr * .3, hc, 4 * s); ell(ctx, hr * .92, -hr * .15, hr * .16, hr * .3, hc, 4 * s);
    ell(ctx, -hr * .3, -hr * .7, hr * .25, hr * .1, 'rgba(255,255,255,.5)', 0, -.4);
  } else if (pal.hairStyle === 'bun') {
    circle(ctx, 0, -hr * 1.18, hr * .38, hc, 6 * s);
    ctx.beginPath(); ctx.moveTo(-hr * 1.0, -hr * .05); ctx.quadraticCurveTo(-hr * 1.05, -hr * 1.08, 0, -hr * 1.04); ctx.quadraticCurveTo(hr * 1.05, -hr * 1.08, hr * 1.0, -hr * .05);
    ctx.quadraticCurveTo(hr * .6, -hr * .6, 0, -hr * .6); ctx.quadraticCurveTo(-hr * .6, -hr * .6, -hr * 1.0, -hr * .05); fillStroke(ctx, hc, 6 * s);
  }
  // eyes
  const ex = 26 * s, ey = -2 * s; const look = p.look || { x: face * .6, y: 0 };
  let open = 1 - (p.blink || 0); if (emo.closed || p.eyesClosed) open = 0;
  const pupil = emo.pupil || 1;
  for (const sd of [-1, 1]) {
    const x0 = sd * ex + fx, y0 = ey;
    if (open < .12) { ctx.beginPath(); ctx.arc(x0, y0 + 2 * s, 14 * s, Math.PI * .15, Math.PI * .85); ctx.lineWidth = 6 * s; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); }
    else {
      ell(ctx, x0, y0, 17 * s, 21 * s * open, '#fff', 5 * s);
      ctx.save(); ctx.beginPath(); ctx.ellipse(x0, y0, 17 * s, 21 * s * open, 0, 0, TAU); ctx.clip();
      circle(ctx, x0 + look.x * 7 * s, y0 + look.y * 8 * s + 2 * s, 9.5 * s * pupil, OUT); circle(ctx, x0 + look.x * 7 * s + 3 * s, y0 + look.y * 8 * s - 2 * s, 3 * s * pupil, '#fff');
      if (emo.lids) { ctx.fillStyle = pal.skin; ctx.fillRect(x0 - 20 * s, y0 - 24 * s, 40 * s, 44 * s * emo.lids); line(ctx, x0 - 18 * s, y0 - 24 * s + 44 * s * emo.lids, x0 + 18 * s, y0 - 24 * s + 44 * s * emo.lids, 6 * s, OUT); }
      ctx.restore();
    }
    if (pal.lashes) { line(ctx, x0 + sd * 13 * s, y0 - 16 * s, x0 + sd * 22 * s, y0 - 24 * s, 4 * s, OUT); }
    // brows
    const by = y0 - 34 * s; const [bi, bo] = emo.brow;
    line(ctx, x0 - sd * 13 * s, by + bi * s, x0 + sd * 13 * s, by + bo * s, 7 * s, pal.hairStyle === 'scarf' ? '#999' : OUT);
  }
  if (pal.glasses && !emo.shades) { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * ex + fx, ey, 22 * s, 0, TAU); ctx.lineWidth = 4 * s; ctx.strokeStyle = '#555'; ctx.stroke(); } line(ctx, -4 * s + fx, ey, 4 * s + fx, ey, 4 * s, '#555'); }
  if (emo.shades || p.shades) {
    ctx.save(); ctx.translate(fx, ey);
    rr(ctx, -50 * s, -14 * s, 44 * s, 28 * s, 10 * s); fillStroke(ctx, '#111', 4 * s); rr(ctx, 6 * s, -14 * s, 44 * s, 28 * s, 10 * s); fillStroke(ctx, '#111', 4 * s);
    line(ctx, -8 * s, -6 * s, 8 * s, -6 * s, 5 * s, '#111'); line(ctx, -40 * s, -8 * s, -26 * s, -8 * s, 4 * s, 'rgba(255,255,255,.6)'); line(ctx, 16 * s, -8 * s, 30 * s, -8 * s, 4 * s, 'rgba(255,255,255,.6)');
    ctx.restore();
  }
  if (pal.mustache) { ctx.beginPath(); ctx.moveTo(fx - 30 * s, 34 * s); ctx.quadraticCurveTo(fx - 14 * s, 18 * s, fx, 28 * s); ctx.quadraticCurveTo(fx + 14 * s, 18 * s, fx + 30 * s, 34 * s); ctx.quadraticCurveTo(fx, 28 * s, fx - 30 * s, 34 * s); fillStroke(ctx, pal.hair, 4 * s); }
  if (emo.blush || p.blush) { ctx.save(); ctx.globalAlpha *= .45; ell(ctx, -44 * s + fx, 24 * s, 14 * s, 8 * s, '#ff5a7a'); ell(ctx, 44 * s + fx, 24 * s, 14 * s, 8 * s, '#ff5a7a'); ctx.restore(); }
  // mouth
  const mx = fx, my = 38 * s; const m = emo.m * (p.mouth ?? 1);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (emo.mouth) {
    case 'smile': ctx.beginPath(); ctx.arc(mx, my - 12 * s, 18 * s, Math.PI * .2, Math.PI * .8); ctx.lineWidth = 6 * s; ctx.strokeStyle = OUT; ctx.stroke(); break;
    case 'grin': ctx.beginPath(); ctx.moveTo(mx - 26 * s, my - 6 * s); ctx.quadraticCurveTo(mx, my + 30 * s * m, mx + 26 * s, my - 6 * s); ctx.closePath(); fillStroke(ctx, '#fff', 6 * s); break;
    case 'open': ctx.beginPath(); ctx.moveTo(mx - 24 * s, my - 6 * s); ctx.quadraticCurveTo(mx, my + 40 * s, mx + 24 * s, my - 6 * s); ctx.closePath(); fillStroke(ctx, '#7a1530', 6 * s); ell(ctx, mx, my + 12 * s, 10 * s, 6 * s, '#ff6f8a'); break;
    case 'smirk': ctx.beginPath(); ctx.moveTo(mx - 20 * s, my); ctx.quadraticCurveTo(mx + 6 * s, my + 12 * s, mx + 26 * s, my - 10 * s); ctx.lineWidth = 6 * s; ctx.strokeStyle = OUT; ctx.stroke(); break;
    case 'O': ell(ctx, mx, my + 6 * s, 14 * s * m, 20 * s * m, '#7a1530', 6 * s); break;
    case 'scream': ell(ctx, mx, my + 8 * s, 24 * s, 30 * s, '#7a1530', 6 * s); ell(ctx, mx, my + 22 * s, 12 * s, 8 * s, '#ff6f8a'); break;
    case 'wobble': { ctx.beginPath(); ctx.moveTo(mx - 20 * s, my + 4 * s); for (let i = 1; i <= 4; i++) ctx.lineTo(mx - 20 * s + i * 10 * s, my + 4 * s + (i % 2 ? -5 : 5) * s); ctx.lineWidth = 5 * s; ctx.strokeStyle = OUT; ctx.stroke(); break; }
    case 'puff': ell(ctx, mx, my + 4 * s, 10 * s, 6 * s, OUT); ell(ctx, mx - 44 * s, my - 4 * s, 16 * s, 14 * s, 'rgba(160,190,255,.8)'); ell(ctx, mx + 44 * s, my - 4 * s, 16 * s, 14 * s, 'rgba(160,190,255,.8)'); break;
    case 'flat': line(ctx, mx - 18 * s, my + 2 * s, mx + 18 * s, my + 2 * s, 6 * s, OUT); break;
    case 'awk': { ctx.beginPath(); ctx.moveTo(mx - 28 * s, my); ctx.lineTo(mx + 28 * s, my); ctx.lineTo(mx + 24 * s, my + 14 * s); ctx.lineTo(mx - 24 * s, my + 14 * s); ctx.closePath(); fillStroke(ctx, '#fff', 5 * s); line(ctx, mx - 26 * s, my + 7 * s, mx + 26 * s, my + 7 * s, 3 * s, OUT); for (let i = -2; i <= 2; i++) line(ctx, mx + i * 10 * s, my, mx + i * 10 * s, my + 14 * s, 3 * s, OUT); break; }
  }
  if (emo.sweat) { ctx.beginPath(); const sx = hr * .8, sy = -hr * .45; ctx.moveTo(sx, sy - 22 * s); ctx.quadraticCurveTo(sx + 14 * s, sy, sx, sy + 8 * s); ctx.quadraticCurveTo(sx - 14 * s, sy, sx, sy - 22 * s); fillStroke(ctx, '#8fd8ff', 4 * s); }
}

// common poses
const POSE = {
  stand: { legs: [.08, 0, -.08, 0], arms: [-.18, .1, .18, -.1] },
  armsUp: { legs: [.25, -.3, -.25, .3], arms: [-2.5, -.3, 2.5, .3] },
  flail: (t) => ({ legs: [.3 + Math.sin(t * 13) * .4, -.5, -.3 + Math.sin(t * 13 + 2) * .4, .5], arms: [-2.2 + Math.sin(t * 15) * .5, -.5, 2.2 + Math.sin(t * 15 + 1) * .5, .5] }),
  walk: (t, sp = 7) => { const w = Math.sin(t * sp); return { legs: [w * .45, Math.max(0, -w) * -.5 + .05, -w * .45, Math.max(0, w) * -.5 + .05], arms: [-w * .45 - .1, .3, w * .45 + .1, -.3], bob: -Math.abs(Math.cos(t * sp)) * 6 }; },
  tiptoe: (t, sp = 6) => { const w = Math.sin(t * sp); return { legs: [w * .35, -.45, -w * .35, -.45], arms: [-1.1, 2.0, 1.1 + w * .1, 1.2], bob: -Math.abs(Math.cos(t * sp)) * 12 }; },
  chill: { legs: [1.3, -.6, 1.1, -.2], arms: [-2.6, -1.29, 2.6, 1.29] },
  throat: { legs: [.3, -.4, -.3, .4], arms: [-1.2, 3.7, 1.2, -3.7] },
  cover: { legs: [.05, 0, -.05, 0], arms: [-.2, .98, .2, -.98] },
  thumbs: { legs: [.08, 0, -.08, 0], arms: [-.18, .1, 1.6, 1.3] },
  point: { legs: [.08, 0, -.08, 0], arms: [-.18, .1, 1.57, 0] },
  hang: { legs: [.1, 0, -.1, 0], arms: [-2.9, -.05, 2.9, .05] },
};
const blinkAt = (t, seed = 0) => { const per = 3.2 + hash(seed) * 1.5; const ph = (t + hash(seed + 4) * per) % per; return ph < .12 ? Math.sin(ph / .12 * Math.PI) : 0; };
