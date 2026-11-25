import React from "react";
import { C, H, lerp } from "./lib";

/*
  Canonical figure: total height ~576 px, origin at feet (y = 0), up is negative.
  Head d = 97 (0.09 W), body capsule 75 x 220, limbs 22 px.
*/
export type Pose =
  | "idle" | "walk" | "run" | "shock" | "deaf" | "flat" | "tired" | "eat"
  | "fly" | "crossnose" | "point" | "onefoot" | "nosepick" | "snap" | "draw"
  | "wave" | "facepalm" | "crouch" | "back" | "scream" | "hold" | "holdcone" | "lost";

export type Face =
  | "neutral" | "shock" | "flat" | "tired" | "eat" | "cross" | "passport" | "scream" | "smile" | "closed" | "blink";

type Limb = { a: number; b: number }; // shoulder/hip angle (deg from straight down, + = towards front/right), elbow/knee bend

export interface PersonProps {
  x: number; // px
  y: number; // px, feet position
  h?: number; // fraction of frame height (total height)
  pose?: Pose;
  t?: number; // seconds (for cycles)
  gray?: boolean;
  cap?: boolean;
  face?: Face;
  flip?: boolean; // face left
  tilt?: number; // extra tilt deg
  stubble?: number; // 0..1
  sock?: boolean;
  jitter?: number;
  blinkK?: number; // 0 open .. 1 closed (overrides)
  towel?: boolean;
  moustache?: boolean;
  bodyColor?: string;
  hand?: React.ReactNode; // item drawn at right hand
  opacity?: number;
  bags?: boolean;
  armWave?: number; // 0..1 raise right arm for wave
  backView?: boolean;
}

const LW = 22;

const limbPath = (sx: number, sy: number, L1: number, L2: number, a: number, b: number) => {
  const r1 = (a * Math.PI) / 180;
  const ex = sx + Math.sin(r1) * L1, ey = sy + Math.cos(r1) * L1;
  const r2 = ((a + b) * Math.PI) / 180;
  const hx = ex + Math.sin(r2) * L2, hy = ey + Math.cos(r2) * L2;
  return { d: `M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`, hx, hy };
};

export const Person: React.FC<PersonProps> = ({
  x, y, h = 0.3, pose = "idle", t = 0, gray = false, cap = !gray, face, flip = false, tilt = 0, stubble = 0, sock = false,
  jitter = 0, blinkK, towel, moustache, bodyColor, hand, opacity = 1, bags, armWave = 0, backView = false,
}) => {
  const isBack = pose === "back" || backView;
  const s = (h * H) / 576;
  const col = bodyColor ?? (gray ? C.gray : C.body);
  const headCol = gray ? C.grayHead : C.skin;

  // defaults
  let la: Limb = { a: -12, b: -8 }, ra: Limb = { a: 12, b: 8 }; // left arm (screen-left = back when facing right)
  let ll: Limb = { a: -5, b: 0 }, rl: Limb = { a: 5, b: 0 };
  let bodyTilt = 0, crouch = 0, bob = 0, headDx = 0, headDy = 0;
  let f: Face = face ?? "neutral";

  const cyc = t * (pose === "run" || pose === "fly" ? 9 : 6);
  switch (pose) {
    case "walk": {
      const sw = Math.sin(cyc) * 28;
      ll = { a: sw, b: Math.max(0, -sw) * 0.6 };
      rl = { a: -sw, b: Math.max(0, sw) * 0.6 };
      la = { a: -sw * 0.9, b: 10 };
      ra = { a: sw * 0.9, b: 10 };
      bob = Math.abs(Math.cos(cyc)) * 8;
      break;
    }
    case "run": {
      const sw = Math.sin(cyc) * 50;
      ll = { a: sw, b: -Math.max(0, -sw) * 1.4 };
      rl = { a: -sw, b: -Math.max(0, sw) * 1.4 };
      la = { a: -sw * 1.1, b: 70 };
      ra = { a: sw * 1.1, b: 70 };
      bodyTilt = 25;
      bob = Math.abs(Math.cos(cyc)) * 18;
      break;
    }
    case "fly": {
      ll = { a: -40, b: -50 }; rl = { a: -20, b: -60 };
      la = { a: -120, b: 0 }; ra = { a: 100, b: 0 };
      bodyTilt = 50;
      break;
    }
    case "shock":
      la = { a: -150, b: -20 }; ra = { a: 150, b: 20 };
      ll = { a: -12, b: 0 }; rl = { a: 12, b: 0 };
      f = face ?? "shock";
      break;
    case "scream":
      la = { a: -150, b: -20 }; ra = { a: 150, b: 20 };
      f = face ?? "scream";
      break;
    case "deaf":
      la = { a: -120, b: -114 }; ra = { a: 120, b: 114 };
      f = face ?? "closed";
      break;
    case "flat":
      la = { a: 100, b: 30 }; ra = { a: 120, b: 20 };
      ll = { a: -30, b: 20 }; rl = { a: -10, b: 10 };
      bodyTilt = 18;
      f = face ?? "flat";
      break;
    case "tired":
      la = { a: -4, b: 0 }; ra = { a: 4, b: 0 };
      headDy = 14; headDx = 8;
      f = face ?? "tired";
      break;
    case "eat":
      la = { a: -30, b: -40 }; ra = { a: 40, b: 60 };
      f = face ?? "eat";
      break;
    case "crossnose":
      la = { a: -20, b: -10 }; ra = { a: 150, b: 126 };
      f = face ?? "cross";
      break;
    case "point":
      la = { a: -10, b: 0 }; ra = { a: 95, b: 0 };
      break;
    case "onefoot":
      la = { a: -95, b: 0 }; ra = { a: 95, b: 0 };
      rl = { a: 60, b: -110 };
      f = face ?? "passport";
      break;
    case "nosepick":
      la = { a: -10, b: 0 }; ra = { a: 150, b: 128 };
      f = face ?? "passport";
      break;
    case "snap":
      la = { a: -10, b: 0 }; ra = { a: 110, b: 50 };
      f = face ?? "smile";
      break;
    case "draw":
      la = { a: -10, b: 0 }; ra = { a: 130, b: 20 + Math.sin(t * 25) * 15 };
      f = face ?? "smile";
      break;
    case "wave":
      la = { a: -10, b: 0 };
      ra = { a: lerp(20, 150, armWave), b: lerp(10, 20 + Math.sin(t * 6) * 25, armWave) };
      f = face ?? "smile";
      break;
    case "facepalm":
      la = { a: -10, b: 0 }; ra = { a: 150, b: 122 };
      headDy = 10;
      f = face ?? "closed";
      break;
    case "crouch":
      crouch = 110;
      ll = { a: 70, b: -130 }; rl = { a: 50, b: -120 };
      la = { a: 40, b: 50 }; ra = { a: 50, b: 50 };
      headDy = 10;
      f = face ?? "tired";
      break;
    case "hold":
      ra = { a: 60, b: 50 };
      break;
    case "holdcone":
      ra = { a: 70, b: 60 };
      break;
    case "lost":
      la = { a: -10, b: 0 }; ra = { a: 160, b: 10 };
      f = face ?? "scream";
      break;
    case "back":
      la = { a: -6, b: 0 }; ra = { a: 6, b: 0 };
      break;
  }
  if (moustache && pose === "wave") f = face ?? "smile";

  const hipY = -200 + crouch;
  const bodyTop = hipY - 220;
  const neckY = bodyTop + 6;
  const headCY = bodyTop - 50 + headDy;
  const shY = bodyTop + 36;

  const jx = jitter ? Math.sin(t * 90) * jitter : 0;

  // legs
  const L = limbPath(-14, hipY, 105, 100, ll.a, ll.b);
  const R = limbPath(14, hipY, 105, 100, rl.a, rl.b);
  // arms
  const LA = limbPath(-22, shY, 95, 90, la.a, la.b);
  const RA = limbPath(22, shY, 95, 90, ra.a, ra.b);

  // blink
  let bk = blinkK ?? 0;
  if (blinkK === undefined && f !== "closed") {
    const ph = (t + (gray ? 0.7 : 0)) % 3.1;
    bk = ph < 0.12 ? 1 : 0;
  }

  const eyes = () => {
    const ex = 22, ey = -6;
    if (f === "cross") {
      return (
        <g stroke={C.ink} strokeWidth={6} strokeLinecap="round">
          {[-ex, ex].map((cx) => (
            <g key={cx}>
              <line x1={cx - 9} y1={ey - 9} x2={cx + 9} y2={ey + 9} />
              <line x1={cx - 9} y1={ey + 9} x2={cx + 9} y2={ey - 9} />
            </g>
          ))}
        </g>
      );
    }
    if (f === "closed" || bk >= 0.95) {
      return (
        <g stroke={C.ink} strokeWidth={6} strokeLinecap="round">
          <line x1={-ex - 9} y1={ey} x2={-ex + 9} y2={ey} />
          <line x1={ex - 9} y1={ey} x2={ex + 9} y2={ey} />
        </g>
      );
    }
    const ry = 8 * (1 - bk) + 0.5;
    const big = f === "shock" || f === "scream";
    return (
      <g fill={C.ink}>
        <ellipse cx={-ex} cy={ey} rx={big ? 10 : 8} ry={big ? 11 : ry} />
        <ellipse cx={ex} cy={ey} rx={big ? 10 : 8} ry={big ? 11 : ry} />
        {bk > 0 && bk < 0.95 && (
          <g>
            <rect x={-ex - 12} y={ey - 14} width={24} height={28 * bk} fill={headCol} />
            <rect x={ex - 12} y={ey - 14} width={24} height={28 * bk} fill={headCol} />
          </g>
        )}
      </g>
    );
  };
  const mouth = () => {
    switch (f) {
      case "shock": return <ellipse cx={0} cy={24} rx={10} ry={14} fill={C.ink} />;
      case "scream": return <ellipse cx={0} cy={26} rx={18} ry={20} fill={C.ink} />;
      case "flat": return <line x1={-14} y1={24} x2={14} y2={24} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />;
      case "tired": return <path d="M -12 28 Q 0 22 12 28" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
      case "eat": return <path d="M -10 24 Q 0 30 10 24" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
      case "smile": return <path d="M -14 20 Q 0 32 14 20" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
      case "cross": return <path d="M -12 26 Q -6 20 0 26 Q 6 32 12 26" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />;
      default: return <line x1={-12} y1={24} x2={12} y2={24} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />;
    }
  };

  const headR = 48.5;
  const puff = f === "flat" || f === "eat";

  return (
    <g transform={`translate(${x + jx} ${y}) scale(${flip ? -s : s} ${s})`} opacity={opacity}>
      <g transform={`translate(0 ${-bob}) rotate(${bodyTilt + tilt} 0 ${hipY})`}>
        {/* back arm */}
        <path d={LA.d} stroke={col} strokeWidth={LW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* legs */}
        <path d={L.d} stroke={col} strokeWidth={LW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={R.d} stroke={col} strokeWidth={LW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {sock && <circle cx={R.hx} cy={R.hy} r={14} fill={C.white} />}
        {/* body capsule */}
        <rect x={-37.5} y={bodyTop} width={75} height={hipY - bodyTop + 20} rx={37.5} fill={col} />
        {towel && <rect x={-46} y={hipY - 60} width={92} height={90} rx={14} fill={C.white} />}
        {/* head */}
        <g transform={`translate(${headDx} ${headCY})`}>
          {isBack ? (
            <g>
              <circle r={headR} fill={headCol} />
              <path d={`M ${-headR} -6 A ${headR} ${headR} 0 0 1 ${headR} -6 Z`} fill={gray ? "#7F8599" : "#6B4A35"} />
            </g>
          ) : (
            <g>
              {puff && <ellipse cx={-34} cy={14} rx={22} ry={18} fill={headCol} />}
              {puff && <ellipse cx={34} cy={14} rx={22} ry={18} fill={headCol} />}
              <circle r={headR} fill={headCol} />
              {puff && <circle cx={-30} cy={16} r={8} fill={C.pink} opacity={0.7} />}
              {puff && <circle cx={30} cy={16} r={8} fill={C.pink} opacity={0.7} />}
              {eyes()}
              {(f === "passport") && (
                <g stroke={C.ink} strokeWidth={6} strokeLinecap="round">
                  <line x1={-34} y1={-24} x2={-12} y2={-24} />
                  <line x1={12} y1={-24} x2={34} y2={-24} />
                </g>
              )}
              {(f === "tired" || bags) && (
                <g stroke="#8A6A9A" strokeWidth={4} fill="none" strokeLinecap="round">
                  <path d="M -32 6 Q -22 12 -12 6" />
                  <path d="M 12 6 Q 22 12 32 6" />
                </g>
              )}
              {mouth()}
              {moustache && <path d="M -26 16 Q -12 6 0 14 Q 12 6 26 16 Q 14 22 0 18 Q -14 22 -26 16 Z" fill="#4A4F60" />}
              {stubble > 0 && (
                <g stroke="#7A7F8E" strokeWidth={3} strokeLinecap="round">
                  {Array.from({ length: 14 }).map((_, i) => {
                    if (i / 14 > stubble) return null;
                    const a = Math.PI * (0.18 + (i / 13) * 0.64);
                    const cx = Math.cos(a) * 40, cy = Math.sin(a) * 40;
                    return <line key={i} x1={cx} y1={cy - 4} x2={cx * 1.08} y2={cy * 1.08 + 4} />;
                  })}
                </g>
              )}
            </g>
          )}
          {cap && (
            <g>
              <path d={`M ${-headR} -12 A ${headR} ${headR} 0 0 1 ${headR} -12 Z`} fill="#E53935" />
              <rect x={isBack ? -headR : 10} y={-18} width={isBack ? headR * 2 : 62} height={12} rx={6} fill="#B71C1C" />
            </g>
          )}
        </g>
        {/* front arm */}
        <path d={RA.d} stroke={col} strokeWidth={LW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {hand && <g transform={`translate(${RA.hx} ${RA.hy}) scale(${1})`}>{hand}</g>}
      </g>
    </g>
  );
};

/** feet y from spec center y (fraction) and height fraction */
export const feetY = (cy: number, h: number) => (cy + h / 2) * H;

// ---------- items ----------
export const Milk: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-27} y={-60} width={54} height={86} fill={C.white} rx={4} />
    <path d="M -27 -60 L 0 -84 L 27 -60 Z" fill="#E6EAF2" />
    <rect x={-27} y={-34} width={54} height={30} fill="#3D7BFF" />
    <rect x={-6} y={-92} width={12} height={10} fill="#3D7BFF" />
  </g>
);

export const Cone: React.FC<{ ball?: boolean; s?: number; rot?: number }> = ({ ball = true, s = 1, rot = 0 }) => (
  <g transform={`scale(${s}) rotate(${rot})`}>
    <path d="M -24 -10 L 24 -10 L 0 60 Z" fill="#E0A458" />
    <path d="M -14 4 L 10 30 M -4 -8 L 16 14 M 8 -8 L -10 30" stroke="#B9803A" strokeWidth={4} />
    {ball && <circle cy={-30} r={30} fill={C.pink} />}
  </g>
);

export const Marker: React.FC = () => (
  <g transform="rotate(-30)">
    <rect x={-9} y={-70} width={18} height={70} rx={4} fill={C.yellow} />
    <rect x={-9} y={-82} width={18} height={14} rx={3} fill={C.ink} />
  </g>
);

export const Mochalka: React.FC = () => <ellipse rx={30} ry={20} fill="#7ED957" />;
