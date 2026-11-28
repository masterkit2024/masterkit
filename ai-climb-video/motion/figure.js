// ===== Character rig: rim-lit silhouettes =====
'use strict';
// angles (radians): limbs absolute, 0 = pointing down, + = toward facing direction.
// torso: 0 = upright, + = lean forward. head: tilt relative to torso.
const POSE = {
  stand: { torso: 0, head: 0, ua1: .15, fa1: .1, ua2: -.15, fa2: -.1, th1: .08, sh1: 0, th2: -.08, sh2: 0 },
  kneelBelay: { torso: .35, head: .2, ua1: 1.25, fa1: 1.6, ua2: .9, fa2: 1.4, th1: 1.45, sh1: 0, th2: .2, sh2: -.15 },
  climbWall: { torso: -.08, head: -.35, ua1: 2.75, fa1: 2.95, ua2: 1.9, fa2: 2.7, th1: .9, sh1: -.2, th2: .1, sh2: -.25 },
  slip: { torso: -.5, head: -.6, ua1: 2.9, fa1: 3.0, ua2: 2.4, fa2: 2.9, th1: .6, sh1: 1.4, th2: -.4, sh2: .3 },
  fall: { torso: -.9, head: -.5, ua1: 2.6, fa1: 2.2, ua2: 3.4, fa2: 3.8, th1: .9, sh1: .2, th2: -.6, sh2: -1.2 },
  hang: { torso: .05, head: -.45, ua1: 2.95, fa1: 3.05, ua2: 2.75, fa2: 3.0, th1: .25, sh1: -.1, th2: -.1, sh2: -.25 },
  dragLean: { torso: -.75, head: .25, ua1: 1.35, fa1: 1.45, ua2: 1.15, fa2: 1.4, th1: 1.25, sh1: .4, th2: 1.0, sh2: .1 },
  kneelEdge: { torso: .55, head: .45, ua1: .85, fa1: .4, ua2: 1.35, fa2: 1.1, th1: 1.5, sh1: -.2, th2: .45, sh2: -.6 },
  cutReach: { torso: .75, head: .6, ua1: .55, fa1: .2, ua2: 1.55, fa2: 1.25, th1: 1.5, sh1: -.2, th2: .45, sh2: -.6 },
  braceBack: { torso: -.62, head: .35, ua1: 1.25, fa1: 1.35, ua2: 1.05, fa2: 1.3, th1: 1.5, sh1: 1.15, th2: 1.25, sh2: .85 },
  pullA: { torso: -.78, head: .3, ua1: .8, fa1: 1.75, ua2: 1.35, fa2: 1.45, th1: 1.5, sh1: 1.15, th2: 1.25, sh2: .85 },
  pullB: { torso: -.5, head: .4, ua1: 1.4, fa1: 1.5, ua2: .75, fa2: 1.7, th1: 1.5, sh1: 1.15, th2: 1.25, sh2: .85 },
  haulUp: { torso: -.6, head: .3, ua1: 1.0, fa1: 1.2, ua2: .9, fa2: 1.25, th1: 1.6, sh1: .5, th2: 1.3, sh2: .2 },
  sit: { torso: -.08, head: .12, ua1: .5, fa1: 1.25, ua2: .3, fa2: 1.15, th1: 1.5, sh1: .25, th2: 1.42, sh2: .15 },
  sitLean: { torso: -.2, head: -.05, ua1: -.55, fa1: -.6, ua2: .35, fa2: 1.2, th1: 1.5, sh1: .2, th2: 1.4, sh2: .1 },
  walkA: { torso: .12, head: 0, ua1: -.45, fa1: -.15, ua2: .5, fa2: .9, th1: .55, sh1: .1, th2: -.4, sh2: -.75 },
  walkB: { torso: .12, head: 0, ua1: .5, fa1: .9, ua2: -.45, fa2: -.15, th1: -.4, sh1: -.75, th2: .55, sh2: .1 },
  reachUp: { torso: .1, head: -.4, ua1: 2.9, fa1: 3.05, ua2: .5, fa2: .4, th1: .3, sh1: -.1, th2: -.1, sh2: -.25 },
};
function lerpPose(a, b, t) { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k] ?? a[k], t); return o; }
function poseKf(t, keys) { // [[t, poseObj, ease]]
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, p0, e] = keys[i], [t1, p1] = keys[i + 1];
    if (t <= t1) return lerpPose(p0, p1, E[e || 'io'](inv(t0, t1, t)));
  }
  return keys[keys.length - 1][1];
}

const DIM = { torso: 112, neck: 10, head: 30, ua: 58, fa: 54, th: 66, sh: 64 };

// computes joint positions; returns {hip, neck, head, sh, el1, ha1, el2, ha2, kn1, ft1, kn2, ft2}
function rig(f) {
  const s = f.s, d = f.dir, p = { ...f.pose };
  const v = (a, L) => [Math.sin(a) * L * s * d, Math.cos(a) * L * s];
  const hip = [f.x, f.y];
  const neck = [hip[0] + Math.sin(p.torso) * DIM.torso * s * d, hip[1] - Math.cos(p.torso) * DIM.torso * s];
  const ha = p.torso + p.head;
  const head = [neck[0] + Math.sin(ha) * (DIM.neck + DIM.head) * s * d, neck[1] - Math.cos(ha) * (DIM.neck + DIM.head) * s];
  const sh = [lerp(hip[0], neck[0], .9), lerp(hip[1], neck[1], .9)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  if (f.ik) { // two-bone IK toward hand targets (local coords)
    const solve = (T, bend) => {
      const dx = T[0] - sh[0], dy = T[1] - sh[1], a = DIM.ua * s, b = DIM.fa * s;
      const D = clamp(Math.hypot(dx, dy), Math.abs(a - b) + 1, (a + b) * .999);
      const ang = Math.atan2(dx * d, dy);
      const al = Math.acos(clamp((a * a + D * D - b * b) / (2 * a * D), -1, 1));
      const ua = ang + bend * al;
      const ex = sh[0] + Math.sin(ua) * a * d, ey = sh[1] + Math.cos(ua) * a;
      return [ua, Math.atan2((T[0] - ex) * d, T[1] - ey)];
    };
    if (f.ik.h1) [p.ua1, p.fa1] = solve(f.ik.h1, f.ik.bend1 ?? -1);
    if (f.ik.h2) [p.ua2, p.fa2] = solve(f.ik.h2, f.ik.bend2 ?? -1);
  }
  const el1 = add(sh, v(p.ua1, DIM.ua)), ha1 = add(el1, v(p.fa1, DIM.fa));
  const el2 = add(sh, v(p.ua2, DIM.ua)), ha2 = add(el2, v(p.fa2, DIM.fa));
  const kn1 = add(hip, v(p.th1, DIM.th)), ft1 = add(kn1, v(p.sh1, DIM.sh));
  const kn2 = add(hip, v(p.th2, DIM.th)), ft2 = add(kn2, v(p.sh2, DIM.sh));
  return { hip, neck, head, sh, el1, ha1, el2, ha2, kn1, ft1, kn2, ft2, ha };
}

// style: {body, back, rim, rimW, light:[lx,ly], kind:'hood'|'helmet', jacket, scarf, face:'gpt'|'grok'|null, faceGlow}
function drawFigure(c, f, t) {
  const R = rig(f), s = f.s, d = f.dir, st = f.style;
  const L = st.light || [-.6, -.8];
  const parts = (col, colBack, off) => {
    const o = [off[0], off[1]];
    const P = q => [q[0] + o[0], q[1] + o[1]];
    const limb = (a, b, r1, r2, colr) => { c.fillStyle = colr; c.beginPath(); const A = P(a), B = P(b); capsule(c, A[0], A[1], r1 * s, B[0], B[1], r2 * s); c.fill(); };
    // back limbs
    limb(R.sh, R.el2, 11, 9.5, colBack); limb(R.el2, R.ha2, 9.5, 8, colBack);
    c.fillStyle = colBack; c.beginPath(); c.arc(...P(R.ha2), 9.5 * s, 0, TAU); c.fill();
    limb(R.hip, R.kn2, 14, 11.5, colBack); limb(R.kn2, R.ft2, 11.5, 9, colBack);
    boot(c, P(R.kn2), P(R.ft2), s, d, colBack);
    // backpack
    if (st.pack) {
      const a = f.pose.torso, cx = lerp(R.hip[0], R.neck[0], .55) - Math.cos(a) * 30 * s * d, cy = lerp(R.hip[1], R.neck[1], .55) - Math.sin(a) * 30 * s;
      c.save(); c.translate(...P([cx, cy])); c.rotate(a * d); c.fillStyle = col; c.beginPath(); rrect(c, -22 * s, -42 * s, 44 * s, 80 * s, 14 * s); c.fill(); c.restore();
    }
    // torso
    c.fillStyle = col; c.beginPath();
    { const A = P(R.hip), B = P(R.neck); capsule(c, A[0], A[1], 22 * s, B[0], B[1], 25 * s); }
    c.fill();
    // front leg
    limb(R.hip, R.kn1, 14.5, 12, col); limb(R.kn1, R.ft1, 12, 9.5, col);
    boot(c, P(R.kn1), P(R.ft1), s, d, col);
    // head
    c.beginPath(); c.arc(...P(R.head), (st.kind === 'hood' ? 35 : 31) * s, 0, TAU); c.fill();
    if (st.kind === 'hood') { // hood peak
      c.save(); c.translate(...P(R.head)); c.rotate(R.ha * d);
      c.beginPath(); c.moveTo(-30 * s * d, -8 * s); c.quadraticCurveTo(-26 * s * d, -46 * s, 6 * s * d, -38 * s); c.lineTo(10 * s * d, -20 * s); c.closePath(); c.fill(); c.restore();
    }
    // front arm
    limb(R.sh, R.el1, 11.5, 10, col); limb(R.el1, R.ha1, 10, 8.5, col);
    c.beginPath(); c.arc(...P(R.ha1), 10 * s, 0, TAU); c.fill();
  };
  // rim pass (offset toward light), then body
  const rw = (st.rimW ?? 3.2) * s;
  parts(st.rim, st.rim, [L[0] * rw, L[1] * rw]);
  parts(st.body, st.back || st.body, [0, 0]);
  // colored jacket overlay for friend
  if (st.jacket) {
    c.save(); c.globalAlpha = st.jacketA ?? 1; c.fillStyle = st.jacket; c.beginPath();
    capsule(c, R.hip[0], R.hip[1], 19 * s, R.neck[0], R.neck[1], 22 * s); c.fill();
    c.beginPath(); capsule(c, R.sh[0], R.sh[1], 9.5 * s, R.el1[0], R.el1[1], 8.5 * s); c.fill();
    c.restore();
  }
  if (st.scarf) {
    const n = R.neck, wind = st.wind ?? 1;
    c.save(); c.fillStyle = st.scarf; c.beginPath();
    c.arc(n[0], n[1] + 2 * s, 15 * s, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(n[0] - 6 * s, n[1]);
    const segs = 6; const pts = [];
    for (let i = 1; i <= segs; i++) {
      const u = i / segs;
      pts.push([n[0] - d * (u * 70 * s) * wind + n1(t * 6 - i * .7) * 10 * s * u, n[1] + u * 18 * s + n1(t * 7.3 - i * .9 + 30) * 14 * s * u]);
    }
    for (const p of pts) c.lineTo(p[0], p[1] - 6 * s);
    for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1] + 6 * s);
    c.closePath(); c.fill(); c.restore();
  }
  if (st.kind === 'helmet') {
    c.save(); c.fillStyle = st.helmet || '#e8e2d6'; c.translate(...R.head); c.rotate(R.ha * d);
    c.beginPath(); c.arc(0, -4 * s, 33 * s, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill(); c.restore();
  }
  // face: hood opening + logo glow
  if (st.kind === 'hood') {
    const fx = R.head[0] + Math.sin(R.ha + .9) * 12 * s * d, fy = R.head[1] - Math.cos(R.ha + .9) * 12 * s + 4 * s;
    c.save(); c.translate(fx, fy); c.rotate(R.ha * d * .6);
    c.fillStyle = '#05070b'; c.beginPath(); c.ellipse(0, 2 * s, 21 * s, 25 * s, 0, 0, TAU); c.fill();
    const fg = st.faceGlow ?? 0;
    if (st.face && fg > 0) {
      const img = st.face === 'gpt' ? IMG.gpt_green : IMG.grok_ice, core = st.face === 'gpt' ? IMG.chatgpt_white : IMG.grok_white;
      const sz = 40 * s;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = fg * .8; c.drawImage(st.face === 'gpt' ? IMG.gpt_glow : IMG.grok_glow, -sz * 1.25, -sz * 1.25, sz * 2.5, sz * 2.5);
      c.globalAlpha = fg * .9; c.drawImage(img, -sz / 2, -sz / 2, sz, sz);
      c.globalAlpha = fg; c.drawImage(core, -sz / 2 + 1, -sz / 2 + 1, sz - 2, sz - 2);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    c.restore();
  }
  return R;
}
function boot(c, kn, ft, s, d, col) {
  const a = Math.atan2(ft[1] - kn[1], ft[0] - kn[0]);
  c.save(); c.translate(ft[0], ft[1]); c.rotate(a - Math.PI / 2);
  c.fillStyle = col; c.beginPath(); rrect(c, (d > 0 ? -11 : -23) * s, -6 * s, 34 * s, 17 * s, 7 * s);
  c.fill(); c.restore();
}
