// 2D-персонажи для карточек в 3D-мире (Canvas2D, синхронно).
// Каноническая фигура: рост ~576 ед., ноги в (0,0), вверх = минус.
export const PAL = {
  skin: "#FFC9A0",
  body: "#4D8BFF",
  gray: "#9AA0B5",
  grayHead: "#D3D6E0",
  ink: "#1A1020",
  plum: "#241726",
  cap: "#E53935",
  capDark: "#B71C1C",
  pink: "#FF8FB1",
  yellow: "#FFD93D",
  red: "#FF4D4D",
  green: "#3DDC84",
  blue: "#4DD0FF",
  white: "#FFFFFF",
};

export type Pose =
  | "idle" | "walk" | "run" | "shock" | "deaf" | "flat" | "tired" | "eat" | "crossnose" | "point" | "onefoot"
  | "nosepick" | "snap" | "draw" | "wave" | "facepalm" | "crouch" | "back" | "scream" | "hold" | "holdcone" | "lost" | "fall";
export type Face = "neutral" | "shock" | "flat" | "tired" | "eat" | "cross" | "passport" | "scream" | "smile" | "closed";
export type HandItem = "button" | "milk" | "cone" | "coneEmpty" | "coneDown" | "marker" | "mochalka" | null;

export interface PersonOpts {
  pose?: Pose; t?: number; gray?: boolean; cap?: boolean; face?: Face; flip?: boolean; tilt?: number; stubble?: number;
  sock?: boolean; jitter?: number; blinkK?: number; towel?: boolean; moustache?: boolean; bodyColor?: string;
  hand?: HandItem; bags?: boolean; armWave?: number; backView?: boolean; handScale?: number; pressK?: number;
}

type Limb = { a: number; b: number };
const LW = 22;
const limb = (sx: number, sy: number, L1: number, L2: number, a: number, b: number) => {
  const r1 = (a * Math.PI) / 180, r2 = ((a + b) * Math.PI) / 180;
  const ex = sx + Math.sin(r1) * L1, ey = sy + Math.cos(r1) * L1;
  return { pts: [sx, sy, ex, ey, ex + Math.sin(r2) * L2, ey + Math.cos(r2) * L2] };
};

export function poseOf(o: PersonOpts) {
  const pose = o.pose ?? "idle", t = o.t ?? 0;
  let la: Limb = { a: -12, b: -8 }, ra: Limb = { a: 12, b: 8 }, ll: Limb = { a: -5, b: 0 }, rl: Limb = { a: 5, b: 0 };
  let bodyTilt = 0, crouch = 0, bob = 0, headDx = 0, headDy = 0;
  let f: Face = o.face ?? "neutral";
  const cyc = t * (pose === "run" ? 9 : 6);
  switch (pose) {
    case "walk": { const sw = Math.sin(cyc) * 28; ll = { a: sw, b: Math.max(0, -sw) * 0.6 }; rl = { a: -sw, b: Math.max(0, sw) * 0.6 }; la = { a: -sw * 0.9, b: 10 }; ra = { a: sw * 0.9, b: 10 }; bob = Math.abs(Math.cos(cyc)) * 8; break; }
    case "run": { const sw = Math.sin(cyc) * 50; ll = { a: sw, b: -Math.max(0, -sw) * 1.4 }; rl = { a: -sw, b: -Math.max(0, sw) * 1.4 }; la = { a: -sw * 1.1, b: 70 }; ra = { a: sw * 1.1, b: 70 }; bodyTilt = 25; bob = Math.abs(Math.cos(cyc)) * 18; break; }
    case "fall": { la = { a: -150 + Math.sin(t * 20) * 15, b: -20 }; ra = { a: 150 - Math.sin(t * 20) * 15, b: 20 }; ll = { a: -30 + Math.sin(t * 17) * 15, b: 30 }; rl = { a: 30, b: -30 }; f = o.face ?? "shock"; break; }
    case "shock": la = { a: -150, b: -20 }; ra = { a: 150, b: 20 }; ll = { a: -12, b: 0 }; rl = { a: 12, b: 0 }; f = o.face ?? "shock"; break;
    case "scream": la = { a: -150, b: -20 }; ra = { a: 150, b: 20 }; f = o.face ?? "scream"; break;
    case "deaf": la = { a: -150, b: -24 }; ra = { a: 150, b: 24 }; f = o.face ?? "closed"; break;
    case "flat": la = { a: 100, b: 30 }; ra = { a: 120, b: 20 }; ll = { a: -30, b: 20 }; rl = { a: -10, b: 10 }; bodyTilt = 18; f = o.face ?? "flat"; break;
    case "tired": la = { a: -4, b: 0 }; ra = { a: 4, b: 0 }; headDy = 14; headDx = 8; f = o.face ?? "tired"; break;
    case "eat": la = { a: -30, b: -40 }; ra = { a: 40, b: 60 }; f = o.face ?? "eat"; break;
    case "crossnose": la = { a: -20, b: -10 }; ra = { a: 150, b: 102 }; f = o.face ?? "cross"; break;
    case "point": la = { a: -10, b: 0 }; ra = { a: 95, b: 0 }; break;
    case "onefoot": la = { a: -95, b: 0 }; ra = { a: 95, b: 0 }; rl = { a: 60, b: -110 }; f = o.face ?? "passport"; break;
    case "nosepick": la = { a: -10, b: 0 }; ra = { a: 150, b: 104 }; f = o.face ?? "passport"; break;
    case "snap": la = { a: -10, b: 0 }; ra = { a: 110, b: 50 }; f = o.face ?? "smile"; break;
    case "draw": la = { a: -10, b: 0 }; ra = { a: 130, b: 20 + Math.sin(t * 25) * 15 }; f = o.face ?? "smile"; break;
    case "wave": { const k = o.armWave ?? 0; la = { a: -10, b: 0 }; ra = { a: 20 + (150 - 20) * k, b: 10 + (20 + Math.sin(t * 6) * 25 - 10) * k }; f = o.face ?? "smile"; break; }
    case "facepalm": la = { a: -10, b: 0 }; ra = { a: 155, b: 92 }; headDy = 10; f = o.face ?? "closed"; break;
    case "crouch": crouch = 90; ll = { a: 70, b: -130 }; rl = { a: 50, b: -120 }; la = { a: 40, b: 50 }; ra = { a: 50, b: 50 }; headDy = 10; f = o.face ?? "tired"; break;
    case "hold": ra = { a: 60, b: 50 }; break;
    case "holdcone": ra = { a: 70, b: 60 }; break;
    case "lost": la = { a: -10, b: 0 }; ra = { a: 160, b: 10 }; f = o.face ?? "scream"; break;
    case "back": la = { a: -6, b: 0 }; ra = { a: 6, b: 0 }; break;
  }
  return { la, ra, ll, rl, bodyTilt, crouch, bob, headDx, headDy, f };
}

/** draws a person in canonical units; ctx already transformed (origin = feet).
 *  Style: big round head, bean torso, thin black stick limbs with dot hands/feet, plum outline. */
export function drawPerson(ctx: CanvasRenderingContext2D, o: PersonOpts) {
  const P = poseOf(o);
  const t = o.t ?? 0;
  const gray = !!o.gray;
  const col = o.bodyColor ?? (gray ? PAL.gray : PAL.body);
  const colDark = shade(col, -0.18);
  const headCol = gray ? "#DCDDE5" : "#F7D9BC";
  const cap = o.cap ?? !gray;
  const isBack = o.pose === "back" || !!o.backView;
  const hipY = -185 + P.crouch;
  const bodyTop = hipY - 175;
  const headCY = bodyTop - 70 + P.headDy;
  const shY = bodyTop + 38;
  const L = limb(-24, hipY - 8, 95, 92, P.ll.a, P.ll.b), R = limb(24, hipY - 8, 95, 92, P.rl.a, P.rl.b);
  const LA = limb(-48, shY, 80, 75, P.la.a, P.la.b), RA = limb(48, shY, 80, 75, P.ra.a, P.ra.b);
  const jx = o.jitter ? Math.sin(t * 90) * o.jitter : 0;
  const HR = 90, HRY = 85;
  const f = P.f;
  const puff = f === "flat" || f === "eat";
  const LIMB = "#1A1020", LWS = 8;

  ctx.save();
  ctx.translate(jx, 0);
  if (o.flip) ctx.scale(-1, 1);
  ctx.translate(0, -P.bob);
  ctx.translate(0, hipY); ctx.rotate(((P.bodyTilt + (o.tilt ?? 0)) * Math.PI) / 180); ctx.translate(0, -hipY);
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  const stick = (pts: number[]) => {
    ctx.strokeStyle = LIMB; ctx.lineWidth = LWS; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.lineTo(pts[4], pts[5]); ctx.stroke();
  };
  const dot = (x: number, y: number, r: number) => { ctx.fillStyle = LIMB; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const foot = (pts: number[]) => { ctx.fillStyle = LIMB; ctx.beginPath(); ctx.ellipse(pts[4] + 8, pts[5] - 2, 17, 8, 0, 0, 7); ctx.fill(); };
  const outlined = (path: Path2D, fill: string | CanvasGradient, w = 10) => { ctx.strokeStyle = PAL.plum; ctx.lineWidth = w; ctx.stroke(path); ctx.fillStyle = fill; ctx.fill(path); };

  // back arm + legs
  stick(LA.pts); dot(LA.pts[4], LA.pts[5], 11);
  stick(L.pts); foot(L.pts);
  stick(R.pts); foot(R.pts);
  if (o.sock) { ctx.fillStyle = "#fff"; ctx.strokeStyle = PAL.plum; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(R.pts[4] + 8, R.pts[5] - 6, 18, 12, 0, 0, 7); ctx.fill(); ctx.stroke(); }

  // torso (bean)
  const tw = 62, tb = hipY + 10;
  const torso = new Path2D();
  torso.moveTo(-tw * 0.8, bodyTop + 30);
  torso.bezierCurveTo(-tw * 0.85, bodyTop - 5, tw * 0.85, bodyTop - 5, tw * 0.8, bodyTop + 30);
  torso.bezierCurveTo(tw * 1.15, tb - 70, tw * 1.05, tb, 0, tb);
  torso.bezierCurveTo(-tw * 1.05, tb, -tw * 1.15, tb - 70, -tw * 0.8, bodyTop + 30);
  torso.closePath();
  const tg = ctx.createLinearGradient(-tw, 0, tw, 0); tg.addColorStop(0, shade(col, 0.08)); tg.addColorStop(1, colDark);
  outlined(torso, tg);
  ctx.save(); ctx.clip(torso);
  if (!gray && !o.bodyColor) {
    // white cross straps
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(-tw, bodyTop + 10); ctx.lineTo(tw, tb - 30); ctx.moveTo(tw, bodyTop + 10); ctx.lineTo(-tw, tb - 30); ctx.stroke();
  }
  ctx.fillStyle = shade(col, -0.35); ctx.fillRect(-tw * 1.2, tb - 42, tw * 2.4, 12);
  ctx.restore();
  if (o.towel) { const tp = new Path2D(); tp.roundRect(-tw * 1.05, tb - 70, tw * 2.1, 82, 18); outlined(tp, "#ffffff", 8); ctx.strokeStyle = "#dfe5ef"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-20, tb - 66); ctx.lineTo(-30, tb + 8); ctx.stroke(); }

  // head
  ctx.save(); ctx.translate(P.headDx, headCY);
  const head = new Path2D(); head.ellipse(0, 0, HR, HRY, 0, 0, 7);
  if (puff && !isBack) { const ch = new Path2D(); ch.ellipse(-62, 30, 34, 30, 0, 0, 7); ch.ellipse(62, 30, 34, 30, 0, 0, 7); outlined(ch, headCol); }
  const hg = ctx.createRadialGradient(-30, -35, 10, 0, 0, HR * 1.1); hg.addColorStop(0, shade(headCol, 0.06)); hg.addColorStop(1, shade(headCol, -0.07));
  outlined(head, hg, 11);
  if (isBack) {
    ctx.save(); ctx.clip(head); ctx.fillStyle = gray ? "#8D92A3" : "#6B4A35"; ctx.beginPath(); ctx.ellipse(0, -10, HR + 4, HRY - 2, 0, 0, 7); ctx.fill(); ctx.restore();
  } else {
    if (puff) { ctx.fillStyle = "rgba(255,143,177,0.55)"; ctx.beginPath(); ctx.arc(-46, 30, 12, 0, 7); ctx.arc(46, 30, 12, 0, 7); ctx.fill(); }
    ctx.save(); ctx.scale(1.25, 1.25); ctx.translate(0, 4);
    drawEyes(ctx, f, o, headCol, t, gray);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6;
    if (f === "passport") { ctx.beginPath(); ctx.moveTo(-36, -24); ctx.lineTo(-12, -24); ctx.moveTo(12, -24); ctx.lineTo(36, -24); ctx.stroke(); }
    if (f === "tired" || o.bags) { ctx.strokeStyle = "#8A6A9A"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-32, 7); ctx.quadraticCurveTo(-22, 13, -12, 7); ctx.moveTo(12, 7); ctx.quadraticCurveTo(22, 13, 32, 7); ctx.stroke(); }
    if (f === "shock" || f === "scream") { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-34, -30); ctx.quadraticCurveTo(-22, -38, -10, -30); ctx.moveTo(10, -30); ctx.quadraticCurveTo(22, -38, 34, -30); ctx.stroke(); }
    drawMouth(ctx, f);
    if (o.moustache) { ctx.fillStyle = "#3A3540"; ctx.fill(new Path2D("M -34 18 Q -16 4 0 14 Q 16 4 34 18 Q 18 26 0 20 Q -18 26 -34 18 Z")); }
    if ((o.stubble ?? 0) > 0) {
      ctx.strokeStyle = "#7A7F8E"; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 16; i++) { if (i / 16 > (o.stubble ?? 0)) break; const a = Math.PI * (0.2 + (i / 15) * 0.6); const cx = Math.cos(a) * 52, cy = Math.sin(a) * 48; ctx.moveTo(cx, cy - 5); ctx.lineTo(cx * 1.06, cy * 1.06 + 4); }
      ctx.stroke();
    }
    ctx.restore();
  }
  if (cap) {
    const dome = new Path2D(); dome.moveTo(-HR + 4, -42); dome.bezierCurveTo(-HR + 6, -HRY - 48, HR - 6, -HRY - 48, HR - 4, -42); dome.closePath();
    outlined(dome, PAL.cap, 10);
    ctx.fillStyle = PAL.capDark; ctx.fillRect(-HR + 8, -54, HR * 2 - 16, 12);
    const visor = new Path2D(); if (isBack) visor.roundRect(-HR + 2, -50, HR * 2 - 4, 16, 8); else visor.roundRect(30, -52, HR + 22, 17, 9);
    outlined(visor, PAL.capDark, 8);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -HRY - 22, 9, 0, 7); ctx.fill();
  }
  ctx.restore();

  // front arm
  stick(RA.pts); dot(RA.pts[4], RA.pts[5], 11);
  if (o.hand) { ctx.save(); ctx.translate(RA.pts[4], RA.pts[5]); ctx.scale(o.handScale ?? 1, o.handScale ?? 1); drawItem(ctx, o.hand, true, o.pressK ?? 1); drawItem(ctx, o.hand, false, o.pressK ?? 1); ctx.restore(); }
  if (o.pose === "deaf") { stick(LA.pts); dot(LA.pts[4], LA.pts[5], 11); }
  ctx.restore();
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function drawEyes(ctx: CanvasRenderingContext2D, f: Face, o: PersonOpts, headCol: string, t: number, gray: boolean) {
  const ex = 24, ey = -6;
  let bk = o.blinkK ?? -1;
  if (bk < 0) { const ph = (t + (gray ? 0.7 : 0)) % 3.1; bk = ph < 0.13 ? 1 : 0; }
  ctx.strokeStyle = PAL.ink; ctx.fillStyle = PAL.ink; ctx.lineWidth = 6;
  if (f === "cross") {
    ctx.beginPath();
    for (const cx of [-ex, ex]) { ctx.moveTo(cx - 9, ey - 9); ctx.lineTo(cx + 9, ey + 9); ctx.moveTo(cx - 9, ey + 9); ctx.lineTo(cx + 9, ey - 9); }
    ctx.stroke(); return;
  }
  if (f === "closed" || bk >= 0.95) { ctx.beginPath(); ctx.moveTo(-ex - 9, ey); ctx.quadraticCurveTo(-ex, ey + 6, -ex + 9, ey); ctx.moveTo(ex - 9, ey); ctx.quadraticCurveTo(ex, ey + 6, ex + 9, ey); ctx.stroke(); return; }
  const big = f === "shock" || f === "scream";
  const ry = big ? 12 : 9 * (1 - bk) + 0.5;
  ctx.beginPath(); ctx.ellipse(-ex, ey, big ? 9 : 6.5, ry, 0, 0, 7); ctx.ellipse(ex, ey, big ? 9 : 6.5, ry, 0, 0, 7); ctx.fill();
  if (bk > 0 && bk < 0.95) { ctx.fillStyle = headCol; ctx.fillRect(-ex - 12, ey - 14, 24, 28 * bk); ctx.fillRect(ex - 12, ey - 14, 24, 28 * bk); }
}

function drawMouth(ctx: CanvasRenderingContext2D, f: Face) {
  ctx.strokeStyle = PAL.ink; ctx.fillStyle = PAL.ink; ctx.lineWidth = 5;
  const q = (d: string) => ctx.stroke(new Path2D(d));
  switch (f) {
    case "shock": ctx.beginPath(); ctx.ellipse(0, 26, 9, 12, 0, 0, 7); ctx.fill(); break;
    case "scream": ctx.beginPath(); ctx.ellipse(0, 28, 17, 20, 0, 0, 7); ctx.fill(); break;
    case "tired": q("M -11 30 Q 0 24 11 30"); break;
    case "eat": q("M -9 26 Q 0 31 9 26"); break;
    case "smile": q("M -14 22 Q 0 34 14 22"); break;
    case "cross": ctx.lineWidth = 4; q("M -12 28 Q -6 22 0 28 Q 6 34 12 28"); break;
    case "flat": q("M -10 26 L 10 26"); break;
    default: q("M -9 26 Q 0 29 9 26");
  }
}

export function drawItem(ctx: CanvasRenderingContext2D, it: HandItem, outline: boolean, pressK = 1) {
  const o = (c: string) => (outline ? PAL.plum : c);
  const g = outline ? 5 : 0;
  ctx.save();
  switch (it) {
    case "button": {
      ctx.scale(pressK, pressK);
      ctx.fillStyle = o("#B02A2A"); ctx.beginPath(); ctx.arc(0, 6, 46 + g, 0, 7); ctx.fill();
      ctx.fillStyle = o(PAL.red); ctx.beginPath(); ctx.arc(0, 0, 44 + g, 0, 7); ctx.fill();
      if (!outline) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 21, 0, 7); ctx.moveTo(0, 0); ctx.lineTo(0, -13); ctx.moveTo(0, 0); ctx.lineTo(10, 0); ctx.stroke(); }
      break;
    }
    case "milk": {
      ctx.fillStyle = o("#fff"); ctx.fillRect(-27 - g, -84 - g, 54 + 2 * g, 110 + 2 * g);
      if (!outline) { ctx.fillStyle = "#E6EAF2"; ctx.beginPath(); ctx.moveTo(-27, -60); ctx.lineTo(0, -84); ctx.lineTo(27, -60); ctx.fill(); ctx.fillStyle = "#3D7BFF"; ctx.fillRect(-27, -34, 54, 30); }
      break;
    }
    case "cone": case "coneEmpty": case "coneDown": {
      if (it === "coneDown") ctx.rotate(Math.PI);
      ctx.fillStyle = o("#E0A458"); ctx.beginPath(); ctx.moveTo(-24 - g, -10 - g); ctx.lineTo(24 + g, -10 - g); ctx.lineTo(0, 60 + g); ctx.closePath(); ctx.fill();
      if (it === "cone") { ctx.fillStyle = o(PAL.pink); ctx.beginPath(); ctx.arc(0, -30, 30 + g, 0, 7); ctx.fill(); }
      if (!outline) { ctx.strokeStyle = "#B9803A"; ctx.lineWidth = 4; ctx.stroke(new Path2D("M -14 4 L 10 30 M -4 -8 L 16 14 M 8 -8 L -10 30")); }
      break;
    }
    case "marker": {
      ctx.rotate(-0.5); ctx.fillStyle = o(PAL.yellow); ctx.fillRect(-9 - g, -70 - g, 18 + 2 * g, 70 + 2 * g);
      if (!outline) { ctx.fillStyle = PAL.ink; ctx.fillRect(-9, -82, 18, 14); }
      break;
    }
    case "mochalka": ctx.fillStyle = o("#7ED957"); ctx.beginPath(); ctx.ellipse(0, 0, 30 + g, 20 + g, 0, 0, 7); ctx.fill(); break;
  }
  ctx.restore();
}
