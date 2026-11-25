import React from "react";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  bg: "#0F1226",
  panel: "#1E2342",
  wall: "#2A2F55",
  floor: "#1B1F3D",
  yellow: "#FFD93D",
  red: "#FF4D4D",
  green: "#3DDC84",
  blue: "#4DD0FF",
  pink: "#FF8FB1",
  gray: "#9AA0B5",
  white: "#FFFFFF",
  skin: "#FFC9A0",
  body: "#4D8BFF",
  grayHead: "#C9CDD8",
  ink: "#0B0D1C",
};

export const FONT_HEAD = "Montserrat";
export const FONT_SUB = "Inter";

// ---------- time helpers ----------
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number) => k * k * k;
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOutBack = (k: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
/** progress 0..1 of [a, a+d] */
export const pr = (t: number, a: number, d: number) => clamp((t - a) / d);
/** pop-in scale (0.1 s, small overshoot) */
export const popS = (t: number, a: number, d = 0.12) => (t < a ? 0 : easeOutBack(pr(t, a, d)));
/** visible window with fade */
export const win = (t: number, a: number, b: number, f = 0.08) =>
  t < a || t > b ? 0 : Math.min(1, (t - a) / f, (b - t) / f);
export const shake = (t: number, a: number, d: number, amp: number, seed = 1) => {
  if (t < a || t > a + d) return [0, 0];
  const k = 1 - (t - a) / d;
  const f = Math.floor(t * 30);
  const r1 = Math.sin(f * 12.9898 * seed) * 43758.5453;
  const r2 = Math.sin(f * 78.233 * seed) * 12345.678;
  return [(r1 - Math.floor(r1) - 0.5) * 2 * amp * k, (r2 - Math.floor(r2) - 0.5) * 2 * amp * k];
};
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- text ----------
export const Txt: React.FC<{
  x: number; y: number; size: number; color?: string; children: React.ReactNode;
  s?: number; rot?: number; font?: string; stroke?: number; strokeColor?: string; op?: number; anchor?: "middle" | "start" | "end";
}> = ({ x, y, size, color = C.white, children, s = 1, rot = 0, font = FONT_HEAD, stroke = 0, strokeColor = "#000", op = 1, anchor = "middle" }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <text
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={font}
      fontWeight={font === FONT_HEAD ? 800 : 700}
      fontSize={size}
      fill={color}
      stroke={stroke ? strokeColor : undefined}
      strokeWidth={stroke ? stroke * 2 : undefined}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  </g>
);

/** Title text: x,y in fractions, pop-in */
export const Title: React.FC<{ t: number; a: number; b?: number; x?: number; y: number; size: number; color?: string; lines: string[] }> = ({
  t, a, b = 1e9, x = 0.5, y, size, color = C.yellow, lines,
}) => {
  if (t < a || t > b) return null;
  const maxLen = Math.max(...lines.map((l) => l.length));
  const fit = Math.min(1, (0.92 * W) / (maxLen * size * 0.74));
  const s = popS(t, a) * fit;
  const lh = size * 1.12;
  return (
    <g transform={`translate(${x * W} ${y * H}) scale(${s})`}>
      {lines.map((l, i) => (
        <Txt key={i} x={0} y={(i - (lines.length - 1) / 2) * lh} size={size} color={color} stroke={6} strokeColor={C.bg}>
          {l}
        </Txt>
      ))}
    </g>
  );
};

// ---------- backgrounds ----------
export const GridBg: React.FC<{ color?: string }> = ({ color = C.bg }) => {
  const lines = [];
  for (let x = 0; x <= W; x += 60) lines.push(<line key={"v" + x} x1={x} y1={0} x2={x} y2={H} />);
  for (let y = 0; y <= H; y += 60) lines.push(<line key={"h" + y} x1={0} y1={y} x2={W} y2={y} />);
  return (
    <g>
      <rect width={W} height={H} fill={color} />
      <g stroke={C.panel} strokeWidth={3}>{lines}</g>
    </g>
  );
};

// ---------- button ----------
export const ClockIcon: React.FC<{ r: number; color?: string; h1?: number; h2?: number; sw?: number }> = ({ r, color = C.white, h1 = 0, h2 = 90, sw }) => {
  const w = sw ?? r * 0.16;
  const a1 = ((h1 - 90) * Math.PI) / 180, a2 = ((h2 - 90) * Math.PI) / 180;
  return (
    <g stroke={color} strokeWidth={w} strokeLinecap="round" fill="none">
      <circle r={r} />
      <line x1={0} y1={0} x2={Math.cos(a1) * r * 0.62} y2={Math.sin(a1) * r * 0.62} />
      <line x1={0} y1={0} x2={Math.cos(a2) * r * 0.45} y2={Math.sin(a2) * r * 0.45} />
    </g>
  );
};

export const pressScale = (t: number, a: number) => {
  if (t < a || t > a + 0.3) return 1;
  const k = (t - a) / 0.3;
  if (k < 0.33) return lerp(1, 0.85, k / 0.33);
  if (k < 0.66) return lerp(0.85, 1.1, (k - 0.33) / 0.33);
  return lerp(1.1, 1, (k - 0.66) / 0.34);
};

export const Button: React.FC<{ x: number; y: number; d?: number; s?: number }> = ({ x, y, d = 0.18 * W, s = 1 }) => {
  const r = d / 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cy={r * 0.12} r={r} fill="#B02A2A" />
      <circle r={r} fill={C.red} />
      <circle r={r * 0.86} fill="none" stroke="#B02A2A" strokeWidth={r * 0.06} />
      <ClockIcon r={r * 0.48} h1={0} h2={90} />
    </g>
  );
};

// ---------- toggle ----------
export const Toggle: React.FC<{ x: number; y: number; on: number; w?: number }> = ({ x, y, on, w = 0.12 * W }) => {
  const h = 0.05 * W * 1.0;
  const col = on > 0.5 ? C.green : "#555555";
  const r = h / 2 - 6;
  const cx = lerp(-w / 2 + h / 2, w / 2 - h / 2, easeInOut(clamp(on)));
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={col} />
      <circle cx={cx} r={r} fill={C.white} />
    </g>
  );
};

/** toggle value with 0.15 s slide; switches at time a from v0 to v1 */
export const tog = (t: number, a: number, v0 = 1, v1 = 0) => lerp(v0, v1, pr(t, a, 0.15));

// ---------- step plate ----------
export const StepPlate: React.FC<{ t: number; a: number; label: string; on: number }> = ({ t, a, label, on }) => {
  const k = easeOut(pr(t, a, 0.3));
  const w = 0.85 * W, h = 0.08 * H;
  const y = lerp(-h, 0.08 * H, k);
  return (
    <g transform={`translate(${W / 2} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill={C.panel} stroke={C.yellow} strokeWidth={6} />
      <Txt x={-w / 2 + 40} y={0} size={50} anchor="start">{label}</Txt>
      <Toggle x={w / 2 - 110} y={0} on={on} />
    </g>
  );
};

// ---------- stamp ----------
export const Stamp: React.FC<{ t: number; a: number; x: number; y: number; scale?: number; text?: string; op?: number }> = ({ t, a, x, y, scale = 1, text = "НЕЛЬЗЯ", op = 1 }) => {
  if (t < a) return null;
  const k = pr(t, a, 0.25);
  const s = lerp(2, 1, easeOutBack(k)) * scale;
  const w = 0.7 * W, h = 0.1 * H;
  return (
    <g transform={`translate(${x} ${y}) rotate(-8) scale(${s})`} opacity={clamp(k * 3) * op}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={C.red} rx={10} />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} fill="none" stroke={C.white} strokeWidth={8} rx={6} />
      <Txt x={0} y={4} size={110}>{text}</Txt>
    </g>
  );
};

// ---------- kettle ----------
export const Kettle: React.FC<{ x: number; y: number; t: number; steam?: number; shakeAmp?: number; light?: boolean }> = ({ x, y, t, steam = 0.5, shakeAmp = 0, light = true }) => {
  const w = 0.12 * W, h = 0.14 * W;
  const sx = shakeAmp ? Math.sin(t * 60) * shakeAmp : 0;
  const puffs = [];
  for (let i = 0; i < 3; i++) {
    const ph = ((t * 0.8 * (0.6 + steam)) + i / 3) % 1;
    const px = -w * 0.62 + Math.sin(ph * 6 + i) * 10 - ph * 20;
    const py = -h * 0.55 - ph * 200 * (0.5 + steam);
    puffs.push(<circle key={i} cx={px} cy={py} r={14 + ph * 26 * (0.5 + steam)} fill={C.white} opacity={(1 - ph) * 0.85 * clamp(steam * 2)} />);
  }
  return (
    <g transform={`translate(${x + sx} ${y})`}>
      {puffs}
      {/* handle */}
      <path d={`M ${w * 0.25} ${-h * 0.45} Q ${w * 0.75} ${-h * 0.4} ${w * 0.52} ${h * 0.2}`} stroke="#9AA2AE" strokeWidth={16} fill="none" strokeLinecap="round" />
      {/* spout */}
      <path d={`M ${-w * 0.38} ${0} L ${-w * 0.68} ${-h * 0.5} L ${-w * 0.56} ${-h * 0.52} L ${-w * 0.3} ${-h * 0.2} Z`} fill="#C9CED6" />
      {/* body trapezoid */}
      <path d={`M ${-w * 0.3} ${-h * 0.5} L ${w * 0.3} ${-h * 0.5} L ${w * 0.5} ${h * 0.5} L ${-w * 0.5} ${h * 0.5} Z`} fill="#C9CED6" />
      <rect x={-w * 0.12} y={-h * 0.62} width={w * 0.24} height={h * 0.14} rx={8} fill="#9AA2AE" />
      <rect x={-w * 0.55} y={h * 0.42} width={w * 1.1} height={h * 0.12} rx={6} fill="#6E7584" />
      {light && <circle cx={0} cy={h * 0.18} r={9} fill={C.red} />}
    </g>
  );
};

// ---------- wall clock ----------
export const WallClock: React.FC<{ x: number; y: number; d: number; h1: number; h2: number }> = ({ x, y, d, h1, h2 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={d / 2} fill={C.white} />
    <circle r={d / 2} fill="none" stroke={C.panel} strokeWidth={10} />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * d * 0.38} y1={Math.sin(a) * d * 0.38} x2={Math.cos(a) * d * 0.44} y2={Math.sin(a) * d * 0.44} stroke={C.panel} strokeWidth={6} />;
    })}
    <ClockIcon r={d * 0.0001} color={C.panel} h1={h1} h2={h2} sw={0} />
    <g stroke={C.panel} strokeLinecap="round">
      <line x1={0} y1={0} x2={Math.cos(((h1 - 90) * Math.PI) / 180) * d * 0.25} y2={Math.sin(((h1 - 90) * Math.PI) / 180) * d * 0.25} strokeWidth={12} />
      <line x1={0} y1={0} x2={Math.cos(((h2 - 90) * Math.PI) / 180) * d * 0.38} y2={Math.sin(((h2 - 90) * Math.PI) / 180) * d * 0.38} strokeWidth={8} />
    </g>
    <circle r={8} fill={C.red} />
  </g>
);

// ---------- kitchen ----------
export const Kitchen: React.FC<{ windowStreet?: boolean }> = ({ windowStreet }) => (
  <g>
    <rect width={W} height={0.62 * H} fill={C.wall} />
    <rect y={0.62 * H} width={W} height={0.38 * H} fill={C.floor} />
    {/* tiles strip */}
    {Array.from({ length: 10 }).map((_, i) => (
      <rect key={i} x={i * 120 + 6} y={0.5 * H} width={108} height={0.12 * H - 8} fill="#323862" rx={6} />
    ))}
    {windowStreet && (
      <g transform={`translate(${0.82 * W} ${0.25 * H})`}>
        <rect x={-0.1 * W - 12} y={-0.125 * H - 12} width={0.2 * W + 24} height={0.25 * H + 24} fill="#3A3F6B" rx={8} />
        <rect x={-0.1 * W} y={-0.125 * H} width={0.2 * W} height={0.25 * H} fill="#3A3F6B" />
        <rect x={-0.1 * W} y={-0.125 * H} width={0.2 * W} height={0.25 * H} fill="#1B1F3D" />
        <rect x={-0.1 * W} y={0.02 * H} width={0.2 * W} height={0.105 * H} fill={C.bg} />
        <rect x={-0.1 * W + 20} y={-0.02 * H} width={50} height={0.04 * H} fill={C.bg} />
        <rect x={-0.1 * W + 120} y={-0.05 * H} width={60} height={0.07 * H} fill={C.bg} />
        <line x1={0} y1={-0.125 * H} x2={0} y2={0.125 * H} stroke="#3A3F6B" strokeWidth={12} />
        <line x1={-0.1 * W} y1={0} x2={0.1 * W} y2={0} stroke="#3A3F6B" strokeWidth={12} />
      </g>
    )}
    {/* table */}
    <rect x={0.15 * W} y={0.62 * H} width={0.7 * W} height={0.06 * H} fill="#5B4A3A" />
    <rect x={0.19 * W} y={0.68 * H} width={30} height={0.14 * H} fill="#4A3B2E" />
    <rect x={0.81 * W - 30} y={0.68 * H} width={30} height={0.14 * H} fill="#4A3B2E" />
  </g>
);

// ---------- subtitles helpers ----------
export type Word = { w: string; s: number; e: number };
