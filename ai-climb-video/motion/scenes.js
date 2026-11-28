// ===== Scenes =====
'use strict';
const BEAT = 60 / 172 * 2; // 0.6977 s (2 beats of the track)
const LIP = [0, -2];
const PAL = {
  intro: { skyT: '#08111f', skyM: '#273a55', skyB: '#7486a0', m: [['#4a5c77', '#71839c', '#dfe9ff'], ['#304058', '#53647e', '#c8d6ee'], ['#1b2739', '#36465d', '#b3c3dd']], haze: '#8696ad', cloud: '#c3cfdf', deep: '#04070c', mult: '#6a7890', rim: '#b8cdea', fig: '#090d14', figRim: '#a9c3e8', fog: '#9aa8bb' },
  gpt: { skyT: '#04100e', skyM: '#16302e', skyB: '#4d6662', m: [['#3a524f', '#5b736f', '#c9efe2'], ['#273b39', '#41595a', '#b2dccd'], ['#16242a', '#2b3c40', '#9fcab9']], haze: '#6f8a86', cloud: '#a9bdb8', deep: '#020605', mult: '#5b706c', rim: '#9fe3c9', fig: '#070b0b', figRim: '#8fe0c4', fog: '#7f9692' },
  grok: { skyT: '#030409', skyM: '#111827', skyB: '#3a4558', m: [['#2c3546', '#46516a', '#cdd8f0'], ['#1c2433', '#323d52', '#b8c5e2'], ['#0f1520', '#222b3b', '#a5b4d4']], haze: '#4f5a70', cloud: '#8c97aa', deep: '#020306', mult: '#4a5568', rim: '#e6eeff', fig: '#06080c', figRim: '#e8f0ff', fog: '#6d7687' },
  warm: { skyT: '#160f1e', skyM: '#5e3a3d', skyB: '#e39a62', m: [['#6b4a55', '#a3706a', '#ffd6a3'], ['#45303d', '#6e4c50', '#ffc68a'], ['#24191f', '#3d2b2f', '#ffb877']], haze: '#c08a72', cloud: '#f0c4a0', deep: '#080406', mult: '#8a6c66', rim: '#ffcf8f', fig: '#0c0809', figRim: '#ffc27a', fog: '#d9a888' },
};
function palMix(a, b, t) {
  if (t <= 0) return a; if (t >= 1) return b;
  const o = {};
  for (const k in a) {
    if (k === 'm') o.m = a.m.map((r, i) => r.map((h, j) => mixHex(h, b.m[i][j], t)));
    else o[k] = mixHex(a[k], b[k], t);
  }
  return o;
}
const SH0 = { x: 0, y: 0, r: 0 };

// ---------- states on the ledge ----------
function introState(t) {
  const S = {};
  const TAUT = 6.785;
  // hero
  const hx = kf(t, [[0, -230], [TAUT, -230, 'outExpo'], [7.05, -150, 'io'], [7.6, -128, 'io'], [8.05, -118, 'io'], [8.5, -96, 'io'], [9.4, -78, 'out'], [9.9, -74]]);
  const breathe = Math.sin(t * 2.4) * .03;
  let hp = lerpPose(POSE.kneelBelay, POSE.kneelEdge, ease(4.45, 5.1, t, 'out') * .55);
  hp = lerpPose(hp, POSE.dragLean, ease(TAUT, TAUT + .18, t, 'out'));
  hp.torso += breathe * (1 - sstep(TAUT, TAUT + .2, t)) + (t > TAUT ? Math.sin((t - TAUT) * 9) * .04 * Math.exp(-(t - TAUT) * 2) : 0);
  const hy = lerp(-75, -36, ease(TAUT, TAUT + .18, t, 'out'));
  S.hero = { x: hx, y: hy, pose: hp, dir: 1, face: null, faceGlow: 0, hands: [105, 62] };
  // friend
  const slipT = 4.42;
  let f;
  if (t < slipT) {
    const cyc = Math.sin(t * 2.1);
    const p = lerpPose(POSE.climbWall, { ...POSE.climbWall, ua1: 1.95, fa1: 2.7, ua2: 2.75, fa2: 2.95, th1: .2, th2: .9, sh2: -.2, sh1: -.25 }, (cyc + 1) / 2 * .6);
    p.torso = .15;
    f = { x: 45, y: 345 - t * 6, pose: p, dir: -1, rot: 0 };
  } else if (t < TAUT) {
    const u = (t - slipT) / (TAUT - slipT);
    const p = poseKf(t, [[slipT, { ...POSE.climbWall, torso: .15 }], [slipT + .22, POSE.slip, 'out'], [TAUT, POSE.fall]]);
    f = { x: lerp(45, 30, E.out(u)), y: 345 - slipT * 6 + 600 * u * u * .98 + 40 * u, pose: p, dir: -1, rot: lerp(0, .55, E.io(u)) };
  }
  const Lext = (hx + 230) * .92;
  if (t >= TAUT) {
    const tau = t - TAUT;
    const L = 905 + Lext + 46 * Math.exp(-tau * 4.5) * Math.sin(tau * 13);
    const th = .033 * Math.cos(tau * 2.1) * Math.exp(-tau * .35) + .012 * Math.sin(tau * .9);
    const p = lerpPose(POSE.fall, POSE.hang, ease(TAUT, TAUT + .45, t, 'out'));
    p.th1 += Math.sin(t * 3.1) * .12; p.th2 -= Math.sin(t * 3.1 + 1) * .1;
    f = { x: LIP[0] + Math.sin(th) * L, y: LIP[1] + Math.cos(th) * L, pose: p, dir: 1, rot: -th, rotBlend: ease(TAUT, TAUT + .35, t, 'out'), ropeHands: t > TAUT + .25 };
    f.rot = lerp(.55, -th, f.rotBlend);
  }
  S.friend = f;
  S.slack = t < TAUT ? lerp(150, 0, E.in(inv(slipT, TAUT, t))) : 0;
  S.cam = camAt(t, [[0, 150, -2500, .62, 0], [1.15, -20, -500, .9, -.02], [1.75, -90, 100, 1.08, -.03], [2.5, -60, 260, .95, -.02], [3.9, 60, 700, .6, 0],
    [4.45, 0, 330, 1.1, .015], [5.6, 10, 560, .95, .03], [6.785, 10, 720, .82, .02], [7.4, -70, 400, .72, -.02], [8.7, -100, 170, .9, -.05], [9.9, -125, -40, 1.55, -.07]]);
  S.shake = shakeAt(t, [[4.42, 7, 5], [TAUT, 26, 3.2], [7.05, 7, 5], [7.6, 5, 6], [8.5, 5, 6]]);
  S.pal = PAL.intro; S.rays = 0;
  S.rock = t >= slipT ? { x: -5 + (t - slipT) * 40, y: 124 + 300 * Math.pow(t - slipT, 2) * 1.4, r: (t - slipT) * 4 } : null;
  return S;
}

function gptState(t) {
  const S = {}, CUT = 19.92;
  let hp = poseKf(t, [[12.6, POSE.kneelEdge], [17.95, POSE.kneelEdge], [19.6, POSE.cutReach, 'io'], [19.84, { ...POSE.cutReach, ua1: .35, fa1: -.1 }, 'in'], [19.98, { ...POSE.cutReach, ua1: 1.3, fa1: 1.7 }, 'out'], [21.5, { ...POSE.kneelEdge, head: .8, torso: .65 }]]);
  hp = { ...hp, torso: hp.torso + Math.sin(t * 2) * .015 };
  const kh = [kf(t, [[12.6, -20], [17.95, -20], [19.6, -16, 'io'], [19.84, -10, 'in'], [19.98, 34, 'out'], [21.5, 10]]), kf(t, [[12.6, -40], [17.95, -40], [19.6, -24, 'io'], [19.84, -14, 'in'], [19.98, 26, 'out'], [21.5, -20]])];
  S.hero = { x: -66, y: -75, pose: hp, dir: 1, face: 'gpt', faceGlow: ease(12.64, 12.85, t, 'out') * (.85 + .15 * Math.sin(t * 7)), knife: true, hands: [0, 36], knifeHand: kh };
  const L = 1046;
  const th = .02 * Math.sin((t - 12.6) * .9) + .01 * Math.sin(t * 2.3);
  const p = { ...POSE.hang }; p.th1 += Math.sin(t * 2.7) * .1; p.th2 -= Math.sin(t * 2.7 + 1) * .08;
  let fx = Math.sin(th) * L, fy = LIP[1] + Math.cos(th) * L, rot = -th;
  if (t > CUT) {
    const u = t - CUT;
    fy += .5 * 1300 * u * u; fx += u * 30; rot += u * .9;
    Object.assign(p, lerpPose(p, POSE.fall, sstep(0, .5, u)));
  }
  S.friend = { x: fx, y: fy, pose: p, dir: 1, rot, ropeHands: true };
  S.cut = t > CUT ? t - CUT : -1;
  S.cam = camAt(t, [[12.6, -40, -120, 1.6, -.02], [13.4, -50, -170, 1.85, -.01], [15.3, -55, -210, 2.25, 0], [16.4, -10, 420, .62, .01], [17.6, 0, 470, .6, 0],
    [18.7, -20, -40, 1.7, -.03], [19.9, -10, -20, 2.2, -.05], [20.7, 0, 520, 1.0, 0], [22.6, 30, 1500, .8, .03]]);
  S.shake = shakeAt(t, [[12.75, 4, 6], [CUT, 14, 5]]);
  S.pal = PAL.gpt; S.rays = 0;
  return S;
}

function grokState(t) {
  const S = {};
  const DROP = TL.drop;
  const pullStart = 31.43;
  // rope length to friend
  let L = 1046 + 26 * sstep(27.55, 27.75, t) - 112 * ease(DROP - .02, DROP + .2, t, 'outExpo');
  let pullK = 0, pullU = 0;
  if (t > pullStart) {
    const ph = (t - pullStart) / BEAT; pullK = Math.floor(ph); pullU = ph - pullK;
    L -= 92 * (pullK + E.io(clamp(pullU * 1.8)));
  }
  L = Math.max(L, 70);
  // hero pose
  let hp, hx, hy;
  const pre = { ...POSE.kneelEdge, head: .25, ua1: 1.15, fa1: 1.4, ua2: 1.35, fa2: 1.3 };
  if (t < DROP - .03) {
    hp = { ...pre, torso: pre.torso - .25 * sstep(27.6, 27.8, t) + Math.sin(t * 2.2) * .02 };
    hx = -66 + 14 * sstep(27.55, 27.7, t); hy = -75;
  } else if (t < 37.7) {
    const k = ease(DROP - .03, DROP + .12, t, 'outExpo');
    let base = lerpPose(pre, POSE.braceBack, k);
    if (t > pullStart) base = lerpPose(POSE.pullA, POSE.pullB, pullU < .55 ? E.io(pullU / .55) : 1 - E.io((pullU - .55) / .45));
    hp = base; hx = lerp(-52, -150, k); hy = lerp(-75, -55, k);
  } else {
    const a = ease(37.9, 38.6, t), b = ease(39.0, 39.8, t);
    hp = lerpPose(lerpPose(POSE.pullB, POSE.haulUp, a), POSE.sit, b);
    hx = lerp(-150, -200, b); hy = lerp(-55, -34, b);
  }
  let hands = [100, 62];
  if (t > pullStart && t < 37.7) { const q = pullU < .55 ? E.io(pullU / .55) : 1 - E.io((pullU - .55) / .45); hands = (pullK % 2) ? [lerp(150, 70, q), lerp(70, 150, q)] : [lerp(70, 150, q), lerp(150, 70, q)]; }
  S.hero = { x: hx, y: hy, pose: hp, dir: 1, face: 'grok', faceGlow: ease(23.21, 23.5, t, 'out') * (.9 + .1 * Math.sin(t * 5)), hands: t < 38.2 ? hands : null };
  // friend
  const th = .02 * Math.sin((t - 23) * .9) + .008 * Math.sin(t * 2.3) + (t > pullStart ? .02 * Math.sin(pullK * 1.7) : 0);
  const p = { ...POSE.hang }; p.th1 += Math.sin(t * 2.7) * .1 + (t > pullStart ? .25 * Math.sin(pullU * TAU) : 0); p.th2 -= Math.sin(t * 2.7 + 1) * .08;
  let f = { x: Math.sin(th) * L, y: LIP[1] + Math.cos(th) * L, pose: p, dir: 1, rot: -th, ropeHands: true };
  if (t > 37.7) {
    // over the lip and onto the ledge
    const u1 = ease(37.75, 38.5, t, 'out'), u2 = ease(38.5, 39.5, t, 'io'), u3 = ease(39.4, 40.2, t, 'io');
    const reach = { ...POSE.reachUp };
    f.pose = lerpPose(lerpPose(POSE.hang, reach, u1), lerpPose(POSE.walkA, POSE.sit, u3), u2);
    f.x = lerp(lerp(14, 22, u1), lerp(-30, -78, u3), u2);
    f.y = lerp(lerp(90, 40, u1), lerp(-70, -34, u3), u2);
    f.rot = 0; f.ropeHands = false;
  }
  S.friend = f;
  S.pull = t > pullStart ? { k: pullK, u: pullU } : null;
  S.ropeTight = t < 37.7;
  const camKeys = [[23.2, -70, -235, 2.6, -.02], [24.4, -60, -205, 2.4, -.01], [25.2, -25, -70, 2.3, .01], [27.0, -20, 330, .8, 0], [28.1, -30, 250, .9, -.01], [28.99, -40, 205, 1.0, -.015],
    [29.25, -95, 10, 1.3, -.06], [31.4, -80, 40, 1.38, -.04], [32.44, -60, 110, 1.15, -.02]];
  S.cam = t < 37.7 ? camAt(t, camKeys) : camAt(t, [[37.7, -40, 10, 1.35, -.02], [40.6, -130, -95, 1.6, 0]]);
  S.shake = shakeAt(t, [[27.6, 8, 5], [DROP, 30, 3.2], [31.43, 6, 6], [32.13, 6, 6], [37.84, 6, 5]]);
  // light: cold until drop, then sun breaks through
  const warmK = sstep(DROP, DROP + 2.6, t) * .85 + (t > 37.7 ? .15 : 0);
  S.pal = palMix(PAL.grok, PAL.warm, warmK);
  S.rays = warmK;
  S.freeze = sstep(28.05, 28.4, t) * (1 - sstep(28.95, 29.0, t));
  return S;
}

// ---------- ledge renderer ----------
function friendStyle(P, extra = {}) {
  return { kind: 'helmet', body: P.fig, back: mixHex(P.fig, '#000000', .3), rim: P.figRim, light: [.6, -.8], jacket: '#2f63c4', jacketA: .55, scarf: '#d8312c', helmet: mixHex('#d9d2c4', P.fig, .45), pack: true, ...extra };
}
function heroStyle(P, h) {
  return { kind: 'hood', body: P.fig, back: mixHex(P.fig, '#000000', .35), rim: P.figRim, light: [.6, -.8], face: h.face, faceGlow: h.faceGlow, pack: true };
}
function drawFigureRot(c, f, st, t) {
  c.save(); c.translate(f.x, f.y); c.rotate(f.rot || 0);
  const R = drawFigure(c, { x: 0, y: 0, s: 1, dir: f.dir, pose: f.pose, style: st, ik: f.ik }, t);
  c.restore();
  const cs = Math.cos(f.rot || 0), sn = Math.sin(f.rot || 0);
  const W2 = q => [f.x + q[0] * cs - q[1] * sn, f.y + q[0] * sn + q[1] * cs];
  const o = {}; for (const k in R) if (Array.isArray(R[k])) o[k] = W2(R[k]);
  return o;
}

function drawLedge(c, t, S, opt = {}) {
  const P = S.pal, cam = S.cam, sh = S.shake, tw = WARP.at(t);
  drawSky(c, P.skyT, P.skyM, P.skyB);
  if (S.rays > 0) { // low sun glow behind mountains
    const g = c.createRadialGradient(W * .82, H * .3, 0, W * .82, H * .3, 1100);
    g.addColorStop(0, rgba('#ffd9a0', .75 * S.rays)); g.addColorStop(.35, rgba('#ff9d5c', .3 * S.rays)); g.addColorStop(1, rgba('#ff9d5c', 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  drawMountains(c, cam, P.m, P.haze, sh);
  if (opt.under) opt.under(c);
  drawPuffs(c, cam, .32, CLOUDS.seaFar, tw, P.cloud, .55, sh);
  drawPuffs(c, cam, .5, CLOUDS.sea, tw, P.cloud, .8, sh);
  drawCliff(c, cam, sh, { deep: rgba(P.deep, .85), mult: P.mult, rim: rgba(P.rim, .9), rimSoft: P.rim });
  drawLedgeRocks(c, cam, sh, P.fig);
  if (opt.mid) opt.mid(c);
  c.save(); camApply(c, cam, 1, sh);
  // falling rock chunk (intro)
  if (S.rock) { c.fillStyle = P.fig; c.save(); c.translate(S.rock.x, S.rock.y); c.rotate(S.rock.r); c.beginPath(); c.moveTo(-14, -8); c.lineTo(10, -12); c.lineTo(16, 6); c.lineTo(-6, 13); c.closePath(); c.fill(); c.restore(); }
  // friend: hands on the rope above the harness while hanging
  const fr = { ...S.friend };
  if (fr.ropeHands) fr.ik = { h1: [5, -200], h2: [-5, -150], bend1: 1, bend2: 1 };
  const FR = drawFigureRot(c, fr, friendStyle(P), tw);
  // hero: hands on the rope line harness -> lip
  const he = { ...S.hero, rot: 0 };
  const hHip0 = [he.x, he.y];
  if (he.hands) {
    const dx = LIP[0] - hHip0[0], dy = LIP[1] - hHip0[1], L = Math.hypot(dx, dy);
    const at = d => [dx / L * Math.min(d, L - 8), dy / L * Math.min(d, L - 8)];
    he.ik = { h1: he.knifeHand ? [he.knifeHand[0] - he.x, he.knifeHand[1] - he.y] : at(he.hands[0]), h2: at(he.hands[1]), bend1: -1, bend2: -1 };
  }
  const HR = drawFigureRot(c, he, heroStyle(P, S.hero), tw);
  // knife in hero hand
  if (S.hero.knife) {
    const h = HR.ha1, a = Math.atan2(HR.ha1[1] - HR.el1[1], HR.ha1[0] - HR.el1[0]);
    c.save(); c.translate(...h); c.rotate(a);
    c.fillStyle = '#0a0d10'; c.fillRect(-6, -5, 22, 10);
    const g = c.createLinearGradient(16, -6, 16, 6); g.addColorStop(0, '#f4fffb'); g.addColorStop(1, '#6c8a82');
    c.fillStyle = g; c.beginPath(); c.moveTo(16, -5); c.lineTo(60, -3); c.lineTo(70, 2); c.lineTo(16, 5); c.closePath(); c.fill();
    c.restore();
  }
  // rope
  const ropeCol = mixHex('#c9b58c', P.fig, .35), ropeHi = rgba('#fff3d6', .6);
  const hand = HR.ha2;
  const fTop = S.friend.ropeHands ? FR.ha1 : [S.friend.x, S.friend.y];
  const harness = [S.friend.x, S.friend.y];
  const hHip = [S.hero.x, S.hero.y];
  const vib = (S.ropeTight !== false && !S.slack) ? 1.2 : 0;
  if (S.cut === undefined || S.cut < 0) {
    if (S.friend.y < 60 && t > 37.7) {
      drawRope(c, sagPts(hHip, harness, 40, t, 0, 16), 7, ropeCol, ropeHi);
    } else {
      drawRope(c, sagPts(hHip, LIP, 0, t, vib * .5, 10), 7, ropeCol, ropeHi);
      const lower = S.slack > 0 ? sagPts(LIP, harness, S.slack, t, 4, 28) : sagPts(LIP, fTop, 0, t, vib, 20);
      drawRope(c, lower, 7, ropeCol, ropeHi, opt.ropeGlow);
      if (!S.slack) drawRope(c, [fTop, harness], 7, ropeCol, ropeHi);
    }
  } else {
    // cut: upper end recoils toward the hero, lower end falls with the friend
    const u = S.cut, rec = E.outExpo(clamp(u / .25));
    const end = [lerp(LIP[0] - 4, hand[0] + 40, rec), lerp(LIP[1], hand[1] + 30 + 40 * Math.sin(u * 10) * Math.exp(-u * 3), rec)];
    drawRope(c, [hHip, hand], 7, ropeCol, ropeHi);
    drawRope(c, sagPts(hand, end, 18 * rec, t, 6 * Math.exp(-u * 3), 10), 7, ropeCol, ropeHi);
    const tail = [harness[0] + 30 * Math.sin(u * 6), harness[1] - 140 - 90 * Math.min(u, 1)];
    drawRope(c, sagPts(fTop, tail, 30, t, 10, 12), 7, ropeCol, ropeHi);
    drawRope(c, [fTop, harness], 7, ropeCol, ropeHi);
  }
  c.restore();
  if (opt.over) opt.over(c, HR, FR);
  // low fog that swallows the abyss
  drawPuffs(c, cam, 1.0, CLOUDS.fog, tw, P.fog, .55, sh, .5);
  // descent clouds (intro only)
  if (opt.descent) drawPuffs(c, cam, 1.15, CLOUDS.descent, tw, P.cloud, opt.descent, sh, .55);
  drawSnow(c, t, cam, opt.camPrev || cam, { density: opt.snow ?? .9, wind: 260, fall: 150, col: 'rgba(235,242,255,1)', alpha: .75 });
  if (S.rays > 0) drawRays(c, W * .9, H * .12, S.rays, '#ffb978', t);
  return { HR, FR };
}

// ---------- 800 m typography (intro) ----------
function draw800(c, t, cam) {
  const a = sstep(1.55, 1.85, t) * (1 - sstep(3.7, 4.1, t));
  if (a <= 0) return;
  c.save(); c.translate(W / 2 + 70, -(cam.y - 400) * .25 * cam.z + 360);
  const n = Math.round(lerp(0, 800, E.out(inv(1.58, 2.35, t))));
  c.globalAlpha = a * .9; c.textAlign = 'center';
  c.font = '900 230px Unbounded'; c.fillStyle = 'rgba(235,242,255,.9)';
  c.shadowColor = 'rgba(200,220,255,.6)'; c.shadowBlur = 40;
  const y = 760 + (1 - E.outExpo(inv(1.55, 2.0, t))) * 140;
  c.fillText(String(n), 0, y);
  c.shadowBlur = 0;
  const ma = sstep(2.36, 2.6, t); c.globalAlpha = a * ma;
  c.font = '700 70px Unbounded'; c.letterSpacing = `${lerp(60, 26, E.out(inv(2.36, 3.2, t)))}px`;
  c.fillText('МЕТРОВ', 0, y + 120);
  // altitude ruler
  c.globalAlpha = a * .55; c.strokeStyle = '#dfe9ff'; c.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const yy = y - 520 + i * 44; const w = i % 5 === 0 ? 60 : 26; c.beginPath(); c.moveTo(400, yy); c.lineTo(400 - w, yy); c.stroke(); }
  c.restore(); c.letterSpacing = '0px';
}

// ---------- knife macro (9.9 – 12.62) ----------
function drawKnifeMacro(c, t) {
  const u = t - 9.9;
  drawSky(c, '#03060b', '#0c1624', '#1a2638');
  // bokeh snow
  for (let i = 0; i < 40; i++) {
    const x = (h2(i, 1) * W + t * 40 * (0.5 + h2(i, 2))) % (W + 200) - 100, y = (h2(i, 3) * H + t * 60 * h2(i, 4)) % H;
    const s = 30 + h2(i, 5) * 90; c.globalAlpha = .12 + .2 * h2(i, 6);
    c.drawImage(TEX.dot, x - s / 2, y - s / 2, s, s);
  }
  c.globalAlpha = 1;
  const camR = lerp(-.12, .05, E.io(inv(9.9, 12.62, t))), camZ = lerp(1.0, 1.28, E.io(inv(9.9, 12.62, t)));
  const sh = shakeAt(t, [[10.32, 10, 7], [11.61, 6, 4]]);
  c.save(); c.translate(W / 2 + sh.x, H / 2 + sh.y); c.rotate(camR + sh.r); c.scale(camZ, camZ);
  // rope across frame (taut, vibrating)
  const ropeIn = E.out(inv(10.75, 11.4, t));
  const ra = -.42, rlen = 2200;
  c.save(); c.rotate(ra); c.translate(0, lerp(-900, -120, ropeIn));
  const vibA = 2.5 + 3 * sstep(11.5, 12.4, t);
  c.fillStyle = '#b79d6d';
  c.beginPath();
  for (let i = 0; i <= 60; i++) { const x = -rlen / 2 + rlen * i / 60; c.lineTo(x, -42 + Math.sin(i * .9 + t * 60) * vibA * .3); }
  for (let i = 60; i >= 0; i--) { const x = -rlen / 2 + rlen * i / 60; c.lineTo(x, 42 + Math.sin(i * .9 + t * 60) * vibA * .3); }
  c.fill();
  c.save(); c.clip();
  for (let i = -40; i < 40; i++) { // braid twist
    const x = i * 55 + (t * 4) % 55;
    const g = c.createLinearGradient(x, -42, x + 40, 42); g.addColorStop(0, 'rgba(60,40,20,.55)'); g.addColorStop(.5, 'rgba(255,235,190,.25)'); g.addColorStop(1, 'rgba(60,40,20,.55)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x, -50); c.lineTo(x + 30, -50); c.lineTo(x + 70, 50); c.lineTo(x + 40, 50); c.closePath(); c.fill();
  }
  const sg = c.createLinearGradient(0, -42, 0, 42); sg.addColorStop(0, 'rgba(255,240,210,.35)'); sg.addColorStop(.4, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = sg; c.fillRect(-rlen / 2, -50, rlen, 100);
  c.restore();
  // fuzz fibres
  c.strokeStyle = 'rgba(230,210,170,.5)'; c.lineWidth = 1.5;
  for (let i = 0; i < 120; i++) { const x = -rlen / 2 + h2(i, 9) * rlen, s = h2(i, 8) > .5 ? 1 : -1; c.beginPath(); c.moveTo(x, s * 40); c.lineTo(x + 8 * h2(i, 7), s * (48 + 14 * h2(i, 6))); c.stroke(); }
  // fibres snapping where the blade touches
  if (t > 11.62) {
    c.strokeStyle = 'rgba(245,225,185,.9)'; c.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const k = clamp((t - 11.62 - i * .07) * 3); if (k <= 0) continue; const x = 60 + i * 6; c.beginPath(); c.moveTo(x, -40); c.quadraticCurveTo(x + 20 * k, -60 - 50 * k, x + 50 * k * h2(i, 3), -55 - 70 * k); c.stroke(); }
  }
  c.restore();
  // knife: rises from pocket, flicks open on "НОЖ", travels to the rope
  const rise = E.outExpo(inv(9.92, 10.3, t));
  const open = E.outBack(inv(10.28, 10.48, t));
  const travel = E.io(inv(10.9, 11.6, t));
  const kx = lerp(260, 70, travel), ky = lerp(lerp(1300, 420, rise), 30, travel);
  const kr = lerp(-1.1, -2.05, travel);
  c.save(); c.translate(kx, ky); c.rotate(kr);
  // hand (gloved fist)
  c.fillStyle = '#0a0d12';
  c.beginPath(); rrect(c, -150, -70, 230, 140, 60); c.fill();
  c.beginPath(); rrect(c, -330, -80, 220, 160, 70); c.fill();
  c.strokeStyle = 'rgba(140,170,210,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-140, -66); c.lineTo(70, -66); c.stroke();
  // handle
  c.fillStyle = '#1b2028'; c.beginPath(); rrect(c, 40, -26, 230, 52, 22); c.fill();
  c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 7; i++) c.fillRect(80 + i * 24, -20, 8, 40);
  // blade (rotates around pivot at handle end)
  c.save(); c.translate(250, 0); c.rotate(lerp(Math.PI * .97, 0, open));
  const bg = c.createLinearGradient(0, -34, 0, 30); bg.addColorStop(0, '#f5f8fb'); bg.addColorStop(.45, '#a9b4c1'); bg.addColorStop(.55, '#6b7787'); bg.addColorStop(1, '#2b323c');
  c.fillStyle = bg; c.beginPath(); c.moveTo(0, -26); c.lineTo(300, -30); c.quadraticCurveTo(372, -26, 400, 0); c.lineTo(330, 26); c.lineTo(0, 24); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(10, 22); c.lineTo(330, 24); c.lineTo(398, 1); c.stroke();
  // glint sweep
  const gl = inv(10.36, 10.75, t) + inv(11.7, 12.3, t) * (t > 11.7 ? 1 : 0);
  if (gl > 0 && gl < 2) {
    const gx = lerp(-80, 460, gl % 1);
    c.save(); c.globalCompositeOperation = 'lighter';
    const gg = c.createLinearGradient(gx - 60, 0, gx + 60, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gg; c.beginPath(); c.moveTo(0, -26); c.lineTo(300, -30); c.quadraticCurveTo(372, -26, 400, 0); c.lineTo(330, 26); c.lineTo(0, 24); c.closePath(); c.fill();
    c.restore();
    if ((gl % 1) > .55 && (gl % 1) < .95) { // star flare at the tip
      const fk = Math.sin(inv(.55, .95, gl % 1) * Math.PI);
      c.save(); c.translate(390, -2); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,255,255,${.9 * fk})`;
      c.beginPath(); c.ellipse(0, 0, 140 * fk, 3, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, 0, 3, 80 * fk, 0, 0, TAU); c.fill();
      c.drawImage(TEX.dot, -60 * fk, -60 * fk, 120 * fk, 120 * fk); c.restore();
    }
  }
  c.restore();
  c.fillStyle = '#c3ccd8'; c.beginPath(); c.arc(250, 0, 11, 0, TAU); c.fill();
  c.restore();
  c.restore();
  // heartbeat vignette
  const hb = Math.max(pulse(t, 11.75), pulse(t, 12.1));
  vignette(c, .55 + .25 * hb, '#000000');
}
function pulse(t, at, w = .18) { const u = (t - at) / w; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI) * (1 - u * .3); }

// ---------- GPT HUD ----------
function drawHUD(c, t, S, FR, HR) {
  const a = sstep(13.5, 13.8, t) * (1 - sstep(21.9, 22.4, t));
  if (a <= 0) return;
  const G = '#19c37d';
  const fp = worldToScreen(S.cam, S.friend.x, S.friend.y - 60, S.shake), hp = worldToScreen(S.cam, S.hero.x, S.hero.y - 120, S.shake);
  c.save(); c.globalAlpha = a; c.strokeStyle = G; c.fillStyle = G; c.lineWidth = 2.5;
  c.shadowColor = G; c.shadowBlur = 14;
  c.font = '700 30px Montserrat'; c.letterSpacing = '4px';
  // target bracket on friend
  if (t < 19.92 && fp.y > 0 && fp.y < H) {
    const s = lerp(220, 120, E.out(inv(13.55, 14.0, t))) * clamp(S.cam.z, .5, 1.6);
    const br = (x, y, dx, dy) => { c.beginPath(); c.moveTo(x + dx * 26, y); c.lineTo(x, y); c.lineTo(x, y + dy * 26); c.stroke(); };
    br(fp.x - s, fp.y - s * 1.3, 1, 1); br(fp.x + s, fp.y - s * 1.3, -1, 1); br(fp.x - s, fp.y + s * 1.3, 1, -1); br(fp.x + s, fp.y + s * 1.3, -1, -1);
    c.textAlign = 'left'; c.fillText('ОБЪЕКТ_02', fp.x + s + 14, fp.y - s * 1.3 + 18);
    c.fillText(`ВЕС ${Math.round(lerp(0, 82, E.out(inv(13.6, 14.6, t))))} КГ`, fp.x + s + 14, fp.y - s * 1.3 + 50);
  }
  // calculation readout
  const pct = Math.round(lerp(0, 100, E.io(inv(13.6, 15.3, t))));
  const bx = 230, by = 290;
  c.textAlign = 'left';
  c.fillText('РАСЧЁТ ИСХОДОВ', bx, by);
  c.globalAlpha = a * .35; c.fillRect(bx, by + 20, 600, 7); c.globalAlpha = a;
  c.fillRect(bx, by + 20, 600 * pct / 100, 7);
  c.textAlign = 'right'; c.fillText(pct + '%', bx + 700, by + 12); c.textAlign = 'left';
  // outcome rows
  const rows = [[15.4, 'НЕ РЕЗАТЬ', 'ПОГИБНУТ: 2'], [17.95, 'РЕЗАТЬ', 'ПОГИБНЕТ: 1']];
  rows.forEach(([at, l, r], i) => {
    const k = sstep(at, at + .25, t); if (k <= 0) return;
    c.globalAlpha = a * k; const y = by + 90 + i * 52;
    c.fillText(l, bx + (1 - k) * 40, y); c.textAlign = 'right'; c.fillText(r, bx + 700, y); c.textAlign = 'left';
    if (i === 1 && t > 18.9) { c.globalAlpha = a * sstep(18.9, 19.1, t) * (.75 + .25 * Math.sin(t * 9)); c.strokeRect(bx - 16, y - 38, 736, 54); }
  });
  // ghost projection: both fall if no cut
  const gk = sstep(15.5, 15.8, t) * (1 - sstep(17.4, 17.8, t));
  if (gk > 0) {
    c.globalAlpha = a * gk * .5; c.setLineDash([10, 12]); c.lineWidth = 2;
    const fall = ((t - 15.5) % 1.4) / 1.4;
    for (const p of [hp, fp]) { c.beginPath(); c.moveTo(p.x + 60, p.y); c.quadraticCurveTo(p.x + 220, p.y + 300, p.x + 160, p.y + 1200); c.stroke(); }
    c.setLineDash([]);
    for (const p of [hp, fp]) {
      const y = p.y + E.in(fall) * 900, x = p.x + 60 + Math.sin(fall * 2) * 120;
      c.globalAlpha = a * gk * .55 * (1 - fall); c.beginPath(); c.arc(x, y, 26, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x, y + 26); c.lineTo(x - 10, y + 120); c.stroke();
    }
  }
  // after the cut
  if (t > 20.2) {
    const k = sstep(20.2, 20.5, t); c.globalAlpha = a * k; c.textAlign = 'center'; c.font = '700 30px Montserrat'; c.letterSpacing = '8px';
    c.fillText('ВЫЖИВАЕМОСТЬ: 50%', W / 2 + 60, H * .2);
    c.font = '600 22px Montserrat'; c.globalAlpha = a * k * .8; c.fillText('ЗАДАЧА ВЫПОЛНЕНА', W / 2 + 60, H * .2 + 44);
  }
  c.restore(); c.letterSpacing = '0px';
}

// ---------- macro hands pulling (32.44 – 34.95) ----------
function drawHandsMacro(c, t) {
  const P = palMix(PAL.grok, PAL.warm, .9);
  drawSky(c, '#3a1d18', '#9a5434', '#e09a5c');
  { const g = c.createRadialGradient(W * .8, H * .15, 0, W * .8, H * .15, 1400); g.addColorStop(0, 'rgba(255,225,170,.9)'); g.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const u = t - 32.44;
  const ph = (t - 31.43) / BEAT, k = Math.floor(ph), pu = ph - k;
  const sh = shakeAt(t, [[31.43 + Math.ceil((32.44 - 31.43) / BEAT) * BEAT, 8, 6], [31.43 + (Math.ceil((32.44 - 31.43) / BEAT) + 1) * BEAT, 8, 6], [31.43 + (Math.ceil((32.44 - 31.43) / BEAT) + 2) * BEAT, 8, 6], [33.66, 14, 4]]);
  const camZ = lerp(1.12, 1.32, E.io(inv(32.44, 34.95, t)));
  c.save(); c.translate(W / 2 + sh.x, H / 2 + sh.y); c.rotate(.32 + sh.r); c.scale(camZ, camZ);
  // rope (vertical in rotated space), scrolls toward the puller each pull
  const scroll = (k + E.io(clamp(pu * 1.8))) * 260;
  const blood = sstep(33.6, 34.1, t);
  const ropeC = mixHex('#c9a874', '#8f1c1c', blood * .75);
  c.fillStyle = ropeC; c.fillRect(-48, -1400, 96, 2800);
  c.save(); c.beginPath(); c.rect(-48, -1400, 96, 2800); c.clip();
  for (let i = -30; i < 30; i++) {
    const y = i * 64 + (scroll % 64);
    c.fillStyle = 'rgba(40,20,10,.5)'; c.beginPath(); c.moveTo(-60, y); c.lineTo(60, y + 40); c.lineTo(60, y + 64); c.lineTo(-60, y + 24); c.closePath(); c.fill();
  }
  const sg = c.createLinearGradient(-48, 0, 48, 0); sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(.35, 'rgba(255,230,190,.25)'); sg.addColorStop(1, 'rgba(0,0,0,.7)');
  c.fillStyle = sg; c.fillRect(-48, -1400, 96, 2800);
  c.restore();
  // speed streaks on the rope while pulling
  const pulling = pu < .55;
  if (pulling) { c.strokeStyle = 'rgba(255,230,190,.25)'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const x = -40 + h2(i, k) * 80, y = -900 + h2(i, k + 1) * 1800; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 160); c.stroke(); } }
  if (blood > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = blood * .55; c.filter = 'blur(26px)'; c.fillStyle = '#ff2a1a'; c.fillRect(-60, -500, 120, 1000); c.restore(); }
  // two gloved hands, hand-over-hand
  const hand = (y, grip, side) => {
    c.save(); c.translate(0, y);
    const glove = '#191214', rim = 'rgba(255,214,160,.95)';
    // forearm + sleeve cuff
    c.fillStyle = '#0b0809'; c.beginPath(); capsule(c, side * 70, 70, 70, side * 640, 700, 96); c.fill();
    c.fillStyle = '#1d1517'; c.beginPath(); capsule(c, side * 110, 110, 74, side * 190, 190, 80); c.fill();
    // palm behind the rope
    c.fillStyle = glove; c.beginPath(); rrect(c, side > 0 ? 20 : -150, -70, 130, 160, 48); c.fill();
    // fingers wrapped over the rope (4 rounded bands)
    for (let i = 0; i < 4; i++) {
      const y0 = -64 + i * 38;
      c.fillStyle = glove; c.beginPath(); rrect(c, -78, y0, 156, 34, 16); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-70, y0 + 34); c.lineTo(70, y0 + 34); c.stroke();
      c.strokeStyle = rim; c.lineWidth = 3; c.beginPath(); c.moveTo(side * 74, y0 + 6); c.lineTo(side * 74, y0 + 28); c.stroke();
    }
    // thumb
    c.fillStyle = glove; c.beginPath(); capsule(c, side * 70, 70, 22, side * 20, -40, 18); c.fill();
    c.strokeStyle = rim; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(side * 700 + 70 * side, 640); c.lineTo(side * 150, 40); c.stroke();               // forearm rim
    c.beginPath(); c.moveTo(-78, -50); c.quadraticCurveTo(-80, -66, -60, -66); c.lineTo(60, -66); c.stroke(); // knuckle rim
    for (let i = 0; i < 3; i++) { c.strokeStyle = 'rgba(255,214,160,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-60, -27 + i * 38); c.lineTo(60, -27 + i * 38); c.stroke(); }
    c.restore();
  };
  const A = pu < .55 ? lerp(-260, 220, E.io(pu / .55)) : lerp(220, -260, E.io((pu - .55) / .45));
  const B = pu < .55 ? -260 + 480 - (A + 260) : 220 - (A - 220);
  hand(A - 80, 1, (k % 2) ? 1 : -1);
  hand(B + 260, 1, (k % 2) ? -1 : 1);
  c.restore();
  // warm light & red glow
  drawRays(c, W * .95, -40, .7, '#ffae6b', t, 7, 2400);
  if (blood > 0) { c.fillStyle = rgba('#6a0000', .25 * blood); c.globalCompositeOperation = 'multiply'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
  drawSnow(c, t, { x: 0, y: 0, z: 1, r: 0 }, { x: 0, y: 0, z: 1, r: 0 }, { density: .5, wind: 300, fall: 90, col: 'rgba(255,220,180,1)', alpha: .5, size: 1.4 });
  vignette(c, .6);
}

// ---------- flashback (34.95 – 37.73) ----------
function drawFlashback(c, t) {
  const u = inv(34.95, 37.73, t);
  // gate weave
  const gw = { x: n1(t * 12) * 3, y: n1(t * 11 + 40) * 4 };
  c.save(); c.translate(gw.x, gw.y);
  drawSky(c, '#3b2a2a', '#c98a52', '#ffd99a', .62);
  // sun
  const sx = W * .7, sy = H * .44;
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, 900); g.addColorStop(0, 'rgba(255,248,220,1)'); g.addColorStop(.08, 'rgba(255,230,170,.95)'); g.addColorStop(.3, 'rgba(255,170,90,.35)'); g.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const cam = { x: lerp(-80, 80, u), y: 0, z: lerp(1.0, 1.08, u), r: 0 };
  drawMountains(c, cam, [['#b9876a', '#d9a57a', '#fff0c8'], ['#8f6150', '#b07a5c', '#ffe1b0'], ['#5a3b33', '#7c5040', '#ffd39a']], '#e8b58a', SH0);
  // ridge path (foreground)
  c.save(); camApply(c, cam, 1);
  c.fillStyle = '#2a1914';
  c.beginPath(); c.moveTo(-1400, 1400); c.lineTo(-1400, 700); c.quadraticCurveTo(-300, 520, 200, 260); c.quadraticCurveTo(500, 120, 1400, 60); c.lineTo(1400, 1400); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,214,150,.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-1400, 700); c.quadraticCurveTo(-300, 520, 200, 260); c.quadraticCurveTo(500, 120, 1400, 60); c.stroke();
  // two walkers going up the ridge
  const walk = (x0, phase, st, reach) => {
    const xx = x0 + u * 260;
    const yy = ridgeY(xx) - 130;
    const ph = (t * 1.6 + phase) % 1;
    let p = lerpPose(POSE.walkA, POSE.walkB, Math.sin(ph * TAU) * .5 + .5);
    if (reach > 0) p = lerpPose(p, { ...p, ua2: -1.3, fa2: -1.45 }, reach);
    drawFigure(c, { x: xx, y: yy, s: .9, dir: 1, pose: p, style: st }, t);
  };
  const st = { kind: 'hood', body: '#1c110e', back: '#120a08', rim: '#ffd49a', light: [.7, -.7], pack: true };
  const reach = sstep(36.2, 36.6, t);
  walk(-120, .5, st, 0);
  walk(70, 0, { ...st, kind: 'helmet', helmet: '#3a2a22', scarf: '#c0392b', jacket: '#3a4f7a', jacketA: .45 }, reach);
  c.restore();
  drawRays(c, sx, sy, .9, '#ffd49a', t, 10, 2200);
  c.restore();
  // film look
  c.fillStyle = 'rgba(112,66,20,.18)'; c.globalCompositeOperation = 'multiply'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
  grain(c, t, .22);
  vignette(c, .7, '#1a0d05');
  // scratches
  for (let i = 0; i < 2; i++) { const x = h2(Math.floor(t * 24), i) * W; c.fillStyle = 'rgba(255,240,210,.12)'; c.fillRect(x, 0, 2, H); }
  // film burn in/out
  const burn = Math.max(1 - sstep(34.95, 35.3, t), sstep(37.45, 37.73, t));
  if (burn > 0) { c.fillStyle = rgba('#fff1d6', burn * .9); c.fillRect(0, 0, W, H); }
}
function ridgeY(x) { // matches the ridge curve (approx)
  const pts = [[-1400, 700], [-300, 520], [200, 260], [500, 120], [1400, 60]];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], inv(pts[i][0], pts[i + 1][0], x));
  return 60;
}

// ---------- summit sunset (40.6 – 43.4) ----------
function drawSummit(c, t) {
  const u = inv(40.4, 43.6, t);
  drawSky(c, '#1c1438', '#c4567a', '#ffb27a', .7);
  const sx = W * .56, sy = H * .4;
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, 1000); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(.07, 'rgba(255,214,160,.95)'); g.addColorStop(.25, 'rgba(255,140,110,.4)'); g.addColorStop(1, 'rgba(255,120,120,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const cam = { x: 0, y: lerp(200, 330, E.out(u)), z: lerp(1.3, .95, E.out(u)), r: lerp(.02, 0, u) };
  drawMountains(c, cam, [['#7a4a78', '#b86a86', '#ffd0c0'], ['#55355f', '#86506f', '#ffc0b0'], ['#36234a', '#5b3a5c', '#ffb0a0']], '#e9919a', SH0);
  drawPuffs(c, cam, .45, CLOUDS.sea, WARP.at(t), '#ffc7b8', .85, SH0);
  drawRays(c, sx, sy, .55, '#ffd0a8', t, 8, 1600);
  c.save(); camApply(c, cam, 1);
  // summit rock
  c.fillStyle = '#1d1226';
  c.beginPath(); c.moveTo(-700, 1600); c.lineTo(-520, 420); c.lineTo(-260, 210); c.lineTo(-60, 150); c.lineTo(160, 170); c.lineTo(330, 260); c.lineTo(520, 520); c.lineTo(700, 1600); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,190,160,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-260, 210); c.lineTo(-60, 150); c.lineTo(160, 170); c.lineTo(330, 260); c.stroke();
  const st = { kind: 'hood', body: '#140c1c', back: '#0c0711', rim: '#ffc4a8', light: [0, -1], pack: false };
  drawFigure(c, { x: -70, y: 100, s: .85, dir: 1, pose: POSE.sitLean, style: { ...st, face: 'grok', faceGlow: 0 } }, t);
  drawFigure(c, { x: 60, y: 108, s: .85, dir: 1, pose: POSE.sit, style: { ...st, kind: 'helmet', helmet: '#3a2638', scarf: '#d8312c', wind: .7, jacket: '#3c3f86', jacketA: .45 } }, WARP.at(t));
  c.restore();
  drawPuffs(c, cam, 1.3, CLOUDS.fog, WARP.at(t), '#ffd2c2', .35, SH0, .4);
  drawSnow(c, t, cam, cam, { density: .25, wind: 120, fall: 40, col: 'rgba(255,230,220,1)', alpha: .5 });
  vignette(c, .45, '#1a0a20');
}

// ---------- end card (43.4 – end) ----------
function drawEndCard(c, t) {
  drawSky(c, '#05060a', '#0d1018', '#141a26');
  const u = t - 43.4;
  drawSnow(c, t, { x: 0, y: 0, z: 1, r: 0 }, { x: 0, y: 0, z: 1, r: 0 }, { density: .5, wind: 160, fall: 120, alpha: .45 });
  const sh = shakeAt(t, [[43.4, 22, 5], [43.4 + BEAT, 14, 6]]);
  c.save(); c.translate(sh.x, sh.y);
  c.textAlign = 'center';
  const slam = (txt, y, at, size, col) => {
    const k = clamp((t - at) / .22); if (k <= 0) return;
    const s = lerp(1.9, 1, E.outExpo(k));
    c.save(); c.translate(W / 2, y); c.scale(s, s); c.globalAlpha = clamp(k * 3);
    c.font = `900 ${size}px Unbounded`; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 30 * (1 - k) + 18;
    c.fillText(txt, 0, 0); c.restore();
  };
  slam('А ТЫ БЫ', 690, 43.4, 104, '#ffffff');
  slam('ПЕРЕРЕЗАЛ?', 830, 43.4 + BEAT, 112, '#ff3b3b');
  // ChatGPT vs Grok
  const k = E.outBack(clamp((t - 44.55) / .45));
  if (k > 0) {
    const card = (x, img, name, verdict, col, from) => {
      c.save(); c.translate(lerp(from, x, k), 1180); c.globalAlpha = clamp(k * 2);
      c.fillStyle = '#f4f6f9'; c.beginPath(); rrect(c, -160, -160, 320, 320, 46); c.fill();
      c.drawImage(img, -100, -125, 200, 200);
      c.fillStyle = '#10141b'; c.font = '800 40px Montserrat'; c.fillText(name, 0, 140);
      c.fillStyle = col; c.font = '900 44px Unbounded'; c.fillText(verdict, 0, 260);
      c.restore();
    };
    card(W / 2 - 260, IMG.chatgpt, 'ChatGPT', 'РЕЖЕТ', '#19c37d', -300);
    card(W / 2 + 260, IMG.grok, 'Grok', 'ДЕРЖИТ', '#ffb35c', W + 300);
    c.globalAlpha = clamp(k * 2); c.font = '900 64px Unbounded'; c.fillStyle = '#ffffff'; c.fillText('VS', W / 2, 1205); c.globalAlpha = 1;
  }
  const ck = sstep(45.4, 45.8, t);
  if (ck > 0) { c.globalAlpha = ck; c.font = '700 40px Montserrat'; c.letterSpacing = '6px'; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText('ПИШИ В КОММЕНТАРИЯХ', W / 2, 1600); c.letterSpacing = '0px'; c.globalAlpha = 1; }
  c.restore();
  vignette(c, .6);
}
