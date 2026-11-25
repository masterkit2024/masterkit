import React from "react";
import {
  C, W, H, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, pr, popS, win, shake, rnd,
  Txt, Title, GridBg, Button, pressScale, Toggle, tog, StepPlate, Stamp, Kettle, WallClock, Kitchen, ClockIcon,
} from "./lib";
import { Person, feetY } from "./Person";
import { T } from "./timing";

/** camera: zoom z around (cx,cy) px + offset */
export const Cam: React.FC<{ z?: number; cx?: number; cy?: number; sx?: number; sy?: number; dx?: number; dy?: number; children: React.ReactNode }> = ({
  z = 1, cx = W / 2, cy = H / 2, sx, sy, dx = 0, dy = 0, children,
}) => <g transform={`translate(${dx} ${dy}) translate(${sx ?? cx} ${sy ?? cy}) scale(${z}) translate(${-cx} ${-cy})`}>{children}</g>;

const TABLE = 0.62 * H;
const KET_Y = TABLE - 0.07 * W;

// ============ SCENE 1 ============
export const S1: React.FC<{ t: number }> = ({ t }) => {
  const a = T.s1, p = T.press1;
  const z = lerp(1, 1.08, pr(t, a, T.s2 - a));
  const ringK = pr(t, p + 0.05, 0.6);
  const dim = clamp(ringK * 1.2) * 0.2;
  const tired = t >= T.tired1;
  const spin = pr(t, T.tired1, 0.5);
  const minute = easeInOut(spin) * 360 * 5;
  const hour = easeInOut(spin) * 150;
  return (
    <g>
      <Cam z={z} cy={H * 0.55}>
        <Kitchen windowStreet />
        <WallClock x={0.2 * W} y={0.25 * H} d={0.14 * W * 1.4} h1={hour} h2={minute} />
        <Kettle x={0.72 * W} y={KET_Y} t={t} steam={0.25} />
        <Person x={0.28 * W} y={feetY(0.5, 0.3)} h={0.3} pose={tired ? "tired" : "idle"} t={t} />
        <Button x={0.5 * W} y={0.8 * H} s={pressScale(t, p)} />
        {t > p && ringK < 1 && (
          <circle cx={0.5 * W} cy={0.8 * H} r={lerp(90, 1900, easeOut(ringK))} fill="none" stroke={C.yellow} strokeWidth={lerp(40, 10, ringK)} opacity={1 - ringK * 0.6} />
        )}
      </Cam>
      <rect width={W} height={H} fill="#000" opacity={dim} />
      {t >= p && t < p + 2 / 30 && <rect width={W} height={H} fill="#fff" />}
      <Title t={t} a={a} b={T.tired1} y={0.12} size={76} lines={["МИР ×100 МЕДЛЕННЕЕ"]} />
      <Title t={t} a={T.tired1} y={0.12} size={76} color={C.red} lines={["ЧЕРЕЗ 5 ЧАСОВ ПОЖАЛЕЛ"]} />
    </g>
  );
};

// ============ SCENE 2 ============
export const S2: React.FC<{ t: number }> = ({ t }) => {
  const [sx, sy] = shake(t, T.stamp2, 0.2, 6);
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <GridBg />
      <Person x={0.5 * W} y={feetY(0.74, 0.2)} h={0.2} pose="shock" t={t} />
      <Stamp t={t} a={T.stamp2} x={0.5 * W} y={0.42 * H} />
    </g>
  );
};

// ============ SCENE 3 : SOUND ============
const EarIcon: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={70} fill={C.panel} />
    <path d="M -18 40 Q -40 40 -36 10 Q -40 -40 0 -44 Q 36 -44 34 -8 Q 32 14 12 22 Q 0 28 4 44" stroke={C.white} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M -8 -4 Q -4 -22 12 -18" stroke={C.white} strokeWidth={8} fill="none" strokeLinecap="round" />
    <line x1={-52} y1={52} x2={52} y2={-52} stroke={C.red} strokeWidth={14} strokeLinecap="round" />
  </g>
);

export const S3: React.FC<{ t: number }> = ({ t }) => {
  const a = T.s3;
  const comp = easeInOut(pr(t, T.slow3, 0.6));
  const periods = lerp(8, 1, comp);
  const flat = easeOut(pr(t, T.deaf3, 0.3));
  const amp = 0.06 * H * (1 - flat);
  const x0 = 0.4 * W, x1 = 0.9 * W, y0 = 0.55 * H;
  const speed = lerp(3.2, 0.3, comp);
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const k = i / 200;
    const x = lerp(x0, x1, k);
    const ph = k * periods * Math.PI * 2 + t * speed * Math.PI * 2;
    const env = Math.min(1, k * 8, (1 - k) * 8);
    pts.push(`${x.toFixed(1)},${(y0 + Math.sin(ph) * amp * env).toFixed(1)}`);
  }
  const deaf = t >= T.deaf3;
  const slow = t >= T.slow3;
  const appear = pr(t, a + 0.2, 0.3);
  return (
    <g>
      <GridBg />
      <StepPlate t={t} a={a} label="ШАГ 1/3 · ЗВУК" on={tog(t, T.deaf3, 1, 0)} />
      <Person x={0.25 * W} y={feetY(0.55, 0.28)} h={0.28} pose={deaf ? "deaf" : "idle"} t={t} />
      <g opacity={appear}>
        <polyline points={pts.join(" ")} fill="none" stroke={C.blue} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        {!slow ? (
          <Txt x={0.65 * W} y={0.4 * H} size={48}>200 Гц · ГОЛОС</Txt>
        ) : (
          <Txt x={0.65 * W} y={0.4 * H} size={48} color={C.red} s={popS(t, T.slow3 + 0.3)}>2 Гц · ИНФРАЗВУК</Txt>
        )}
      </g>
      {deaf && <EarIcon x={0.25 * W} y={feetY(0.55, 0.28) - 0.28 * H - 90} s={popS(t, T.deaf3)} />}
    </g>
  );
};

// ============ SCENE 4 : AIR ============
const Plane: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} fill={C.white}>
    <path d="M -160 0 L 170 -14 L 200 0 L 170 14 Z" />
    <path d="M -10 -6 L -80 -120 L -40 -120 L 60 -6 Z" />
    <path d="M -10 6 L -80 120 L -40 120 L 60 6 Z" opacity={0.9} />
    <path d="M -150 -4 L -190 -60 L -165 -60 L -120 -4 Z" />
  </g>
);

export const S4: React.FC<{ t: number }> = ({ t }) => {
  const a = T.s4;
  const running = t >= T.fast4;
  const flat = t >= T.wall4;
  const spd = t < T.walk4 ? 0 : t < T.fast4 ? 5 : Math.round(lerp(5, 500, easeOut(pr(t, T.fast4, 0.8))));
  const [sx, sy] = t >= T.fast4 && t < T.clothes4 ? [(rnd(Math.floor(t * 30)) - 0.5) * 6, (rnd(Math.floor(t * 30) + 99) - 0.5) * 6] : [0, 0];
  const scroll = t < T.fast4 ? (t - a) * 120 : (T.fast4 - a) * 120 + (t - T.fast4) * (flat ? 200 : 2400);
  const feet = feetY(0.58, 0.28);
  const px = 0.25 * W;
  // cap & sock flight
  const ck = pr(t, T.clothes4, 0.6);
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <rect width={W} height={H} fill={C.bg} />
      {/* stars */}
      {Array.from({ length: 24 }).map((_, i) => (
        <circle key={i} cx={(rnd(i) * W * 1.2 - (scroll * 0.05) % (W * 1.2) + W * 1.2) % (W * 1.2)} cy={rnd(i + 50) * 0.6 * H} r={3 + rnd(i + 9) * 3} fill={C.white} opacity={0.35} />
      ))}
      <rect y={0.7 * H} width={W} height={0.3 * H} fill={C.wall} />
      {Array.from({ length: 8 }).map((_, i) => {
        const x = ((i * 220 - scroll) % 1760 + 1760) % 1760 - 200;
        return <rect key={i} x={x} y={0.82 * H - 8} width={120} height={16} fill={C.white} />;
      })}
      <StepPlate t={t} a={a} label="ШАГ 2/3 · ВОЗДУХ" on={1} />
      <Txt x={0.5 * W} y={0.28 * H} size={120} color={C.yellow} s={t >= T.fast4 && t < T.fast4 + 0.9 ? 1 + 0.08 * Math.sin(pr(t, T.fast4, 0.9) * Math.PI) : 1}>{`${spd} км/ч`}</Txt>
      {/* speed lines */}
      {running && !flat &&
        Array.from({ length: 12 }).map((_, i) => {
          const ph = ((t - T.fast4) * 2.2 + rnd(i)) % 1;
          const x = lerp(W + 100, -300, ph);
          return <rect key={i} x={x} y={0.36 * H + rnd(i + 3) * 0.32 * H} width={220 + rnd(i + 7) * 160} height={8} rx={4} fill={C.white} opacity={0.75} />;
        })}
      {/* plane */}
      {t >= T.plane4 && t < T.plane4 + 1 && <Plane x={lerp(-0.2, 1.2, pr(t, T.plane4, 1)) * W} y={0.46 * H} />}
      {/* air wall */}
      {flat && (
        <rect x={px + 70} y={feet - 0.35 * H} width={0.12 * W} height={0.35 * H} rx={16} fill={C.blue} opacity={0.35 * popS(t, T.wall4)} />
      )}
      <Person
        x={flat ? px + 40 : px}
        y={feet}
        h={0.28}
        pose={flat ? "flat" : running ? "run" : t >= T.walk4 ? "walk" : "idle"}
        t={t}
        cap={t < T.clothes4}
      />
      {t >= T.clothes4 && ck < 1 && (
        <g>
          <g transform={`translate(${lerp(px + 60, -150, ck)} ${feet - 0.28 * H + lerp(0, -300, Math.sin(ck * Math.PI * 0.8))}) rotate(${-ck * 540})`}>
            <path d="M -45 0 A 45 45 0 0 1 45 0 Z" fill="#E53935" />
            <rect x={10} y={-6} width={60} height={12} rx={6} fill="#B71C1C" />
          </g>
          <g transform={`translate(${lerp(px + 20, -150, ck)} ${feet - 30 + lerp(0, -380, Math.sin(ck * Math.PI * 0.7))}) rotate(${ck * 720})`}>
            <path d="M -14 -40 L 14 -40 L 14 10 L 40 10 Q 50 30 30 34 L -14 34 Z" fill={C.white} />
          </g>
        </g>
      )}
      <Stamp t={t} a={T.stamp4} x={0.74 * W} y={0.4 * H} scale={0.6} />
    </g>
  );
};

// ============ SCENE 5 : BRAIN ============
const Brain: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[[-80, 0, 70], [-20, -40, 80], [60, -20, 75], [80, 40, 60], [0, 40, 70], [-70, 50, 55]].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill={C.pink} />
    ))}
    <path d="M -70 -10 Q -40 -40 -10 -10 Q 20 20 50 -10 M -60 40 Q -20 20 20 50" stroke="#E0688D" strokeWidth={10} fill="none" strokeLinecap="round" />
    <Txt x={0} y={10} size={52} color={C.bg}>ПАМЯТЬ</Txt>
  </g>
);

export const S5: React.FC<{ t: number }> = ({ t }) => {
  const a = T.s5;
  const fk = pr(t, T.drop5, 1.2);
  const py = lerp(0.2, 0.8, easeIn(fk));
  const ph = 0.12;
  const grow = easeOut(pr(t, T.bars5, 0.6));
  const disp = t >= T.digits5;
  const digits = ["3", "8", "1"];
  const di = disp ? Math.floor((t - T.digits5) / 0.5) % 3 : 0;
  const pulse = t >= T.mem5 ? 1 + 0.15 * Math.sin(pr(t, T.mem5, 0.5) * Math.PI) : 1;
  const app = pr(t, a + 0.3, 0.3);
  return (
    <g>
      <GridBg />
      <StepPlate t={t} a={a} label="ШАГ 3/3 · МОЗГ" on={1} />
      <g opacity={app}>
        <rect x={0.1 * W} y={0.15 * H} width={0.25 * W} height={0.7 * H} fill={C.panel} rx={12} />
        <rect x={0.1 * W} y={0.85 * H - 30} width={0.25 * W} height={30} fill="#7ED957" opacity={0.6} />
        <Txt x={0.225 * W} y={0.5 * H} size={64} color={C.gray} op={0.6}>31 м</Txt>
        <line x1={0.08 * W} y1={0.15 * H} x2={0.08 * W} y2={0.85 * H} stroke={C.gray} strokeWidth={4} strokeDasharray="12 10" />
        <Person x={0.22 * W} y={(py + ph / 2) * H} h={ph} pose={t >= T.drop5 ? "shock" : "idle"} t={t} />
        {t >= T.drop5 && fk < 1 && (
          <g stroke={C.white} strokeWidth={5} opacity={0.6}>
            {[-40, 0, 40].map((o) => (
              <line key={o} x1={0.22 * W + o} y1={(py - 0.03) * H} x2={0.22 * W + o} y2={(py - 0.12) * H} />
            ))}
          </g>
        )}
        {/* bars */}
        <Txt x={0.45 * W} y={0.31 * H} size={42} color={C.gray} anchor="start">ПО ЧАСАМ</Txt>
        <rect x={0.45 * W} y={0.33 * H} width={0.35 * W * grow + 1} height={0.04 * H} rx={10} fill={C.gray} />
        <Txt x={0.45 * W} y={0.395 * H} size={42} color={C.red} anchor="start">ПО ОЩУЩЕНИЮ</Txt>
        <rect x={0.45 * W} y={0.41 * H} width={0.47 * W * grow + 1} height={0.04 * H} rx={10} fill={C.red} />
        {grow > 0.95 && <Txt x={0.86 * W} y={0.43 * H} size={48} color={C.white} s={popS(t, T.bars5 + 0.6)}>≈ +⅓</Txt>}
        {/* display */}
        <rect x={0.55 * W} y={0.53 * H} width={0.3 * W} height={0.1 * H} rx={14} fill="#000" stroke={C.panel} strokeWidth={8} />
        <Txt x={0.7 * W} y={0.58 * H} size={120} color={disp ? C.yellow : "#333"} font="Inter">{disp ? digits[di] : "8"}</Txt>
        {disp && (
          <g transform={`translate(${0.7 * W} ${0.505 * H}) scale(${popS(t, T.digits5 + 0.2)})`}>
            <path d="M -200 0 L -185 15 L -160 -15" stroke={C.gray} strokeWidth={8} fill="none" strokeLinecap="round" />
            <Txt x={20} y={0} size={40} color={C.gray}>ОБЫЧНЫЙ ТЕМП</Txt>
          </g>
        )}
      </g>
      {t >= T.memIn5 && <Brain x={0.7 * W} y={0.78 * H} s={popS(t, T.memIn5, 0.25) * pulse} />}
    </g>
  );
};

// ============ SCENE 6 : TWIST ============
export const S6: React.FC<{ t: number }> = ({ t }) => {
  const a = T.s6;
  const crack = t >= T.crack6;
  const ck = pr(t, T.crack6, 0.5);
  const burst = easeOut(pr(t, T.color6, 0.5));
  const toggles = [T.tog6a, T.tog6b, T.tog6c];
  const labels = ["ЗВУК", "ВОЗДУХ", "МОЗГ"];
  const frozen = t >= T.freeze6;
  const tz = frozen ? T.freeze6 : t;
  const z = lerp(1, 1.1, easeInOut(pr(t, T.press6, T.s7 - T.press6)));
  const desat = t >= T.freeze6 ? (t < T.freeze6 + 0.5 ? 1 : clamp(1 - (t - T.freeze6 - 0.5) / 0.25)) : 0;
  return (
    <g filter={desat > 0 ? "url(#desat)" : undefined}>
      <rect width={W} height={H} fill="#000" />
      <circle cx={W / 2} cy={H * 0.45} r={burst * 1400} fill={C.bg} />
      <Cam z={z} cy={H * 0.6}>
        {/* dust */}
        {Array.from({ length: 20 }).map((_, i) => {
          const yy = ((rnd(i) * H - tz * (30 + rnd(i + 2) * 40)) % H + H) % H;
          const xx = rnd(i + 20) * W + Math.sin(tz + i) * 20;
          return <circle key={i} cx={xx} cy={yy} r={4 + rnd(i + 4) * 5} fill={C.white} opacity={0.5 * burst} />;
        })}
        {/* stamps */}
        {!crack && [0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${(i - 1) * 16} ${(i - 1) * 90}) rotate(${(i - 1) * 5} ${W / 2} ${0.45 * H})`}>
            <Stamp t={t} a={a - 1} x={W / 2} y={0.45 * H} scale={0.85} />
          </g>
        ))}
        {crack && ck < 1 &&
          Array.from({ length: 18 }).map((_, i) => {
            const bx = W / 2 + (rnd(i) - 0.5) * 0.6 * W;
            const by = 0.45 * H + (rnd(i + 5) - 0.5) * 0.25 * H;
            return (
              <path key={i} d={`M 0 0 L ${40 + rnd(i + 1) * 60} ${10} L ${20} ${50 + rnd(i + 2) * 40} Z`}
                fill={i % 3 ? C.red : C.white}
                transform={`translate(${bx + (rnd(i + 9) - 0.5) * 300 * ck} ${by + easeIn(ck) * 900}) rotate(${ck * (rnd(i + 3) - 0.5) * 720})`}
                opacity={1 - ck} />
            );
          })}
        {/* toggles */}
        {burst > 0 && labels.map((l, i) => (
          <g key={l} opacity={clamp(burst * 2)}>
            <Txt x={0.36 * W} y={(0.3 + i * 0.1) * H} size={52} anchor="end" color={t >= toggles[i] ? C.green : C.gray}>{l}</Txt>
            <Toggle x={0.5 * W + 40} y={(0.3 + i * 0.1) * H} on={tog(t, toggles[i], 0, 1)} w={0.12 * W * 1.5} />
          </g>
        ))}
        <Person x={0.5 * W} y={feetY(0.75, 0.25)} h={0.25} pose="hold" t={tz} hand={<Button x={0} y={0} d={90} s={pressScale(t, T.press6)} />} />
      </Cam>
      <Title t={t} a={a + 0.15} b={T.s7} y={0.17} size={80} lines={["А ЧТО ЕСЛИ", "ФИЗИКЕ", "ВСЁ РАВНО?"]} />
      {t >= T.press6 && t < T.press6 + 2 / 30 && <rect width={W} height={H} fill="#fff" opacity={0.8} />}
    </g>
  );
};

export { Cam as Camera, ClockIcon };
