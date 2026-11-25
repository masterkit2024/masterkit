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
    case "deaf": la = { a: -120, b: -114 }; ra = { a: 120, b: 114 }; f = o.face ?? "closed"; break;
    case "flat": la = { a: 100, b: 30 }; ra = { a: 120, b: 20 }; ll = { a: -30, b: 20 }; rl = { a: -10, b: 10 }; bodyTilt = 18; f = o.face ?? "flat"; break;
    case "tired": la = { a: -4, b: 0 }; ra = { a: 4, b: 0 }; headDy = 14; headDx = 8; f = o.face ?? "tired"; break;
    case "eat": la = { a: -30, b: -40 }; ra = { a: 40, b: 60 }; f = o.face ?? "eat"; break;
    case "crossnose": la = { a: -20, b: -10 }; ra = { a: 150, b: 126 }; f = o.face ?? "cross"; break;
    case "point": la = { a: -10, b: 0 }; ra = { a: 95, b: 0 }; break;
    case "onefoot": la = { a: -95, b: 0 }; ra = { a: 95, b: 0 }; rl = { a: 60, b: -110 }; f = o.face ?? "passport"; break;
    case "nosepick": la = { a: -10, b: 0 }; ra = { a: 150, b: 128 }; f = o.face ?? "passport"; break;
    case "snap": la = { a: -10, b: 0 }; ra = { a: 110, b: 50 }; f = o.face ?? "smile"; break;
    case "draw": la = { a: -10, b: 0 }; ra = { a: 130, b: 20 + Math.sin(t * 25) * 15 }; f = o.face ?? "smile"; break;
    case "wave": { const k = o.armWave ?? 0; la = { a: -10, b: 0 }; ra = { a: 20 + (150 - 20) * k, b: 10 + (20 + Math.sin(t * 6) * 25 - 10) * k }; f = o.face ?? "smile"; break; }
    case "facepalm": la = { a: -10, b: 0 }; ra = { a: 150, b: 122 }; headDy = 10; f = o.face ?? "closed"; break;
    case "crouch": crouch = 110; ll = { a: 70, b: -130 }; rl = { a: 50, b: -120 }; la = { a: 40, b: 50 }; ra = { a: 50, b: 50 }; headDy = 10; f = o.face ?? "tired"; break;
    case "hold": ra = { a: 60, b: 50 }; break;
    case "holdcone": ra = { a: 70, b: 60 }; break;
    case "lost": la = { a: -10, b: 0 }; ra = { a: 160, b: 10 }; f = o.face ?? "scream"; break;
    case "back": la = { a: -6, b: 0 }; ra = { a: 6, b: 0 }; break;
  }
  return { la, ra, ll, rl, bodyTilt, crouch, bob, headDx, headDy, f };
}

/** draws a person in canonical units; ctx already transformed (origin = feet) */
export function drawPerson(ctx: CanvasRenderingContext2D, o: PersonOpts) {
  const P = poseOf(o);
  const t = o.t ?? 0;
  const gray = !!o.gray;
  const col = o.bodyColor ?? (gray ? PAL.gray : PAL.body);
  const headCol = gray ? PAL.grayHead : PAL.skin;
  const cap = o.cap ?? !gray;
  const isBack = o.pose === "back" || !!o.backView;
  const hipY = -200 + P.crouch, bodyTop = hipY - 220, headCY = bodyTop - 50 + P.headDy, shY = bodyTop + 36;
  const L = limb(-14, hipY, 105, 100, P.ll.a, P.ll.b), R = limb(14, hipY, 105, 100, P.rl.a, P.rl.b);
  const LA = limb(-22, shY, 95, 90, P.la.a, P.la.b), RA = limb(22, shY, 95, 90, P.ra.a, P.ra.b);
  const jx = o.jitter ? Math.sin(t * 90) * o.jitter : 0;
  const headR = 48.5;
  const f = P.f;
  const puff = f === "flat" || f === "eat";

  ctx.save();
  ctx.translate(jx, 0);
  if (o.flip) ctx.scale(-1, 1);
  ctx.translate(0, -P.bob);
  ctx.translate(0, hipY); ctx.rotate((((P.bodyTilt + (o.tilt ?? 0)) * Math.PI) / 180)); ctx.translate(0, -hipY);
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  const strokeLimb = (pts: number[], color: string, w: number) => {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.lineTo(pts[4], pts[5]); ctx.stroke();
  };
  const OUT = 12; // outline thickness
  // ---------- outline pass (plum) ----------
  for (const pass of [0, 1]) {
    const c = (x: string) => (pass === 0 ? PAL.plum : x);
    const g = pass === 0 ? OUT : 0;
    strokeLimb(LA.pts, c(col), LW + g);
    strokeLimb(L.pts, c(col), LW + g);
    strokeLimb(R.pts, c(col), LW + g);
    if (o.sock) { ctx.fillStyle = c(PAL.white); ctx.beginPath(); ctx.arc(R.pts[4], R.pts[5], 14 + g / 2, 0, 7); ctx.fill(); }
    ctx.fillStyle = c(col);
    ctx.beginPath(); ctx.roundRect(-37.5 - g / 2, bodyTop - g / 2, 75 + g, hipY - bodyTop + 20 + g, 37.5 + g / 2); ctx.fill();
    if (o.towel) { ctx.fillStyle = c(PAL.white); ctx.beginPath(); ctx.roundRect(-46 - g / 2, hipY - 60 - g / 2, 92 + g, 90 + g, 14); ctx.fill(); }
    // head
    ctx.save(); ctx.translate(P.headDx, headCY);
    ctx.fillStyle = c(headCol);
    if (puff && !isBack) { ctx.beginPath(); ctx.ellipse(-34, 14, 22 + g / 2, 18 + g / 2, 0, 0, 7); ctx.ellipse(34, 14, 22 + g / 2, 18 + g / 2, 0, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, headR + g / 2, 0, 7); ctx.fill();
    if (cap) {
      ctx.fillStyle = c(PAL.cap); ctx.beginPath(); ctx.moveTo(-headR - g / 2, -12); ctx.arc(0, -12, headR + g / 2, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c(PAL.capDark); ctx.beginPath(); ctx.roundRect((isBack ? -headR : 10) - g / 2, -18 - g / 2, (isBack ? headR * 2 : 62) + g, 12 + g, 6); ctx.fill();
    }
    ctx.restore();
    strokeLimb(RA.pts, c(col), LW + g);
    if (o.hand) { ctx.save(); ctx.translate(RA.pts[4], RA.pts[5]); ctx.scale(o.handScale ?? 1, o.handScale ?? 1); drawItem(ctx, o.hand, pass === 0, o.pressK ?? 1); ctx.restore(); }
  }
  // ---------- face ----------
  ctx.save(); ctx.translate(P.headDx, headCY);
  if (isBack) {
    ctx.fillStyle = gray ? "#7F8599" : "#6B4A35";
    ctx.beginPath(); ctx.moveTo(-headR, -6); ctx.arc(0, -6, headR, Math.PI, 0); ctx.closePath(); ctx.fill();
    if (cap) { ctx.fillStyle = PAL.cap; ctx.beginPath(); ctx.moveTo(-headR, -12); ctx.arc(0, -12, headR, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = PAL.capDark; ctx.beginPath(); ctx.roundRect(-headR, -18, headR * 2, 12, 6); ctx.fill(); }
  } else {
    if (puff) { ctx.fillStyle = "rgba(255,143,177,0.7)"; ctx.beginPath(); ctx.arc(-30, 16, 8, 0, 7); ctx.arc(30, 16, 8, 0, 7); ctx.fill(); }
    drawEyes(ctx, f, o, headCol, t, gray);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6;
    if (f === "passport") { ctx.beginPath(); ctx.moveTo(-34, -24); ctx.lineTo(-12, -24); ctx.moveTo(12, -24); ctx.lineTo(34, -24); ctx.stroke(); }
    if (f === "tired" || o.bags) { ctx.strokeStyle = "#8A6A9A"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-32, 6); ctx.quadraticCurveTo(-22, 12, -12, 6); ctx.moveTo(12, 6); ctx.quadraticCurveTo(22, 12, 32, 6); ctx.stroke(); }
    drawMouth(ctx, f);
    if (o.moustache) { ctx.fillStyle = "#4A4F60"; ctx.fill(new Path2D("M -26 16 Q -12 6 0 14 Q 12 6 26 16 Q 14 22 0 18 Q -14 22 -26 16 Z")); }
    if ((o.stubble ?? 0) > 0) {
      ctx.strokeStyle = "#7A7F8E"; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 14; i++) { if (i / 14 > (o.stubble ?? 0)) break; const a = Math.PI * (0.18 + (i / 13) * 0.64); const cx = Math.cos(a) * 40, cy = Math.sin(a) * 40; ctx.moveTo(cx, cy - 4); ctx.lineTo(cx * 1.08, cy * 1.08 + 4); }
      ctx.stroke();
    }
    if (cap) { ctx.fillStyle = PAL.cap; ctx.beginPath(); ctx.moveTo(-headR, -12); ctx.arc(0, -12, headR, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = PAL.capDark; ctx.beginPath(); ctx.roundRect(10, -18, 62, 12, 6); ctx.fill(); }
  }
  ctx.restore();
  // re-draw front arm over head when it is raised to the face
  if (["crossnose", "nosepick", "facepalm", "deaf"].includes(o.pose ?? "")) {
    strokeLimb(RA.pts, PAL.plum, LW + OUT); strokeLimb(RA.pts, col, LW);
    if (o.pose === "deaf") { strokeLimb(LA.pts, PAL.plum, LW + OUT); strokeLimb(LA.pts, col, LW); }
  }
  ctx.restore();
}

function drawEyes(ctx: CanvasRenderingContext2D, f: Face, o: PersonOpts, headCol: string, t: number, gray: boolean) {
  const ex = 22, ey = -6;
  let bk = o.blinkK ?? -1;
  if (bk < 0) { const ph = (t + (gray ? 0.7 : 0)) % 3.1; bk = ph < 0.13 ? 1 : 0; }
  ctx.strokeStyle = PAL.ink; ctx.fillStyle = PAL.ink; ctx.lineWidth = 6;
  if (f === "cross") {
    ctx.beginPath();
    for (const cx of [-ex, ex]) { ctx.moveTo(cx - 9, ey - 9); ctx.lineTo(cx + 9, ey + 9); ctx.moveTo(cx - 9, ey + 9); ctx.lineTo(cx + 9, ey - 9); }
    ctx.stroke(); return;
  }
  if (f === "closed" || bk >= 0.95) { ctx.beginPath(); ctx.moveTo(-ex - 9, ey); ctx.lineTo(-ex + 9, ey); ctx.moveTo(ex - 9, ey); ctx.lineTo(ex + 9, ey); ctx.stroke(); return; }
  const big = f === "shock" || f === "scream";
  const ry = big ? 11 : 8 * (1 - bk) + 0.5;
  ctx.beginPath(); ctx.ellipse(-ex, ey, big ? 10 : 8, ry, 0, 0, 7); ctx.ellipse(ex, ey, big ? 10 : 8, ry, 0, 0, 7); ctx.fill();
  if (bk > 0 && bk < 0.95) { ctx.fillStyle = headCol; ctx.fillRect(-ex - 12, ey - 14, 24, 28 * bk); ctx.fillRect(ex - 12, ey - 14, 24, 28 * bk); }
}

function drawMouth(ctx: CanvasRenderingContext2D, f: Face) {
  ctx.strokeStyle = PAL.ink; ctx.fillStyle = PAL.ink; ctx.lineWidth = 6;
  const q = (d: string) => ctx.stroke(new Path2D(d));
  switch (f) {
    case "shock": ctx.beginPath(); ctx.ellipse(0, 24, 10, 14, 0, 0, 7); ctx.fill(); break;
    case "scream": ctx.beginPath(); ctx.ellipse(0, 26, 18, 20, 0, 0, 7); ctx.fill(); break;
    case "tired": q("M -12 28 Q 0 22 12 28"); break;
    case "eat": q("M -10 24 Q 0 30 10 24"); break;
    case "smile": q("M -14 20 Q 0 32 14 20"); break;
    case "cross": ctx.lineWidth = 5; q("M -12 26 Q -6 20 0 26 Q 6 32 12 26"); break;
    default: q("M -12 24 L 12 24");
  }
}

export function drawItem(ctx: CanvasRenderingContext2D, it: HandItem, outline: boolean, pressK = 1) {
  const o = (c: string) => (outline ? PAL.plum : c);
  const g = outline ? 6 : 0;
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
