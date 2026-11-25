import React from "react";
import { C, W, H, clamp, lerp, easeOut, easeIn, easeInOut, pr, popS, rnd, Txt, Title, Kettle, Kitchen } from "./lib";
import { Person, feetY, Milk, Cone, Marker, Mochalka } from "./Person";
import { Cam } from "./ScenesA";
import { T } from "./timing";

const sc = (h: number) => (h * H) / 576;

// ============ SCENE 7 : SHOP ============
export const S7: React.FC<{ t: number }> = ({ t }) => {
  const qh = 0.2;
  const qFeet = feetY(0.58, qh) + 20;
  const pFeet = qFeet + 40;
  const ph = 0.22;
  // player x path
  let px: number, pose: any = "walk", face: any;
  const runA = T.run7, runB = T.run7 + 1.5;
  if (t < T.q7) px = lerp(-0.12, 0.03, easeOut(pr(t, T.s7, 1.6)));
  else if (t < runA) px = 0.03;
  else if (t < runB) px = lerp(0.03, 0.6, easeInOut(pr(t, runA, runB - runA)));
  else if (t < T.leave7) px = 0.6;
  else px = lerp(0.6, 1.3, easeIn(pr(t, T.leave7, 0.7)));
  if (t < T.q7) pose = t < T.s7 + 1.6 ? "walk" : "hold";
  else if (t < runA) pose = "hold";
  else if (t < runB) pose = "run";
  else if (t < T.leave7) pose = "hold";
  else pose = "run";
  // inside cloud?
  const cloudX0 = 0.44 + 0.01 * Math.max(0, t - T.fart7);
  const cloudK = popS(t, T.fart7, 0.5);
  const inCloud = t >= runA && Math.abs(px - cloudX0) < 0.1 && t < runB;
  if (inCloud) { pose = "crossnose"; face = "cross"; }
  const exited = t >= runA && px > cloudX0 + 0.05;
  // camera
  let z = lerp(1, 1.06, pr(t, T.q7, 3));
  let cx = W / 2, cy = H / 2;
  const ck = easeInOut(pr(t, T.cashier7, 0.5));
  const cashX = 0.78 * W, cashFeet = feetY(0.5, 0.22);
  const cashHeadY = cashFeet - 465 * sc(0.22);
  z = lerp(z, 2.2, ck); cx = lerp(cx, cashX, ck); cy = lerp(cy, cashHeadY, ck);
  const shk = t > T.run7 + 0.4 && t < T.run7 + 1.4 ? [(rnd(Math.floor(t * 30)) - 0.5) * 8, (rnd(Math.floor(t * 30) + 7) - 0.5) * 8] : [0, 0];
  const blink = t >= T.cashier7 + 0.3 ? clamp((t - T.cashier7 - 0.3) / (T.s8 - T.cashier7 - 0.4)) : undefined;
  const trailOn = pose === "run" || inCloud;
  const fartHl = t >= T.dyad7 && t < T.fart7 + 0.6 ? 1 + 0.06 * Math.sin((t - T.dyad7) * 14) : 1;
  return (
    <g transform={`translate(${shk[0]} ${shk[1]})`}>
      <Cam z={z} cx={cx} cy={cy} sx={W / 2} sy={H / 2}>
        <rect width={W} height={H} fill="#3A3F6B" />
        {/* shelves */}
        {[0.2, 0.32].map((yy, i) => (
          <g key={i}>
            <rect x={0.04 * W} y={yy * H} width={0.36 * W} height={16} fill="#2A2F55" />
            {Array.from({ length: 7 }).map((_, j) => (
              <rect key={j} x={0.05 * W + j * 54} y={yy * H - 70} width={40} height={70} rx={6} fill={[C.pink, C.yellow, C.blue, C.green][(i + j) % 4]} opacity={0.7} />
            ))}
          </g>
        ))}
        <Txt x={0.72 * W} y={0.2 * H} size={70} color={C.yellow}>МАГАЗИН</Txt>
        <rect y={0.62 * H} width={W} height={0.38 * H} fill={C.floor} />
        {/* cashier behind counter */}
        <Person x={cashX} y={cashFeet} h={0.22} gray pose="idle" face={blink !== undefined ? "neutral" : "passport"} blinkK={blink} t={t} flip />
        <rect x={0.45 * W} y={0.55 * H} width={0.5 * W} height={0.07 * H} fill="#8A6A4A" />
        <rect x={0.45 * W} y={0.62 * H} width={0.5 * W} height={0.12 * H} fill="#6E5338" />
        <g transform={`translate(${0.6 * W} ${0.55 * H})`}>
          <rect x={-0.06 * W} y={-0.08 * W} width={0.12 * W} height={0.08 * W} rx={8} fill="#8F95A8" />
          <rect x={-0.045 * W} y={-0.07 * W} width={0.09 * W} height={0.03 * W} fill={t >= T.beep7 && t < T.beep7 + 0.4 ? C.green : "#2A2F55"} />
        </g>
        {/* queue */}
        {[0.1, 0.2, 0.3, 0.4].map((qx, i) => (
          <g key={i} transform={i === 3 ? `translate(${qx * W} ${qFeet}) scale(${fartHl}) translate(${-qx * W} ${-qFeet})` : undefined}>
            <Person x={qx * W} y={qFeet} h={qh} gray pose="idle" face="passport" t={t + i} jitter={1} blinkK={0} />
          </g>
        ))}
        {/* fart cloud */}
        {t >= T.fart7 && (
          <g opacity={0.55}>
            <ellipse cx={cloudX0 * W} cy={qFeet - 0.07 * H} rx={0.12 * W * cloudK * 1.3} ry={0.06 * H * cloudK * 1.1} fill="#7ED957" />
            <ellipse cx={(cloudX0 + 0.05) * W} cy={qFeet - 0.12 * H} rx={0.07 * W * cloudK} ry={0.04 * H * cloudK} fill="#7ED957" />
          </g>
        )}
        {/* trail */}
        {trailOn && [3, 2, 1].map((k) => (
          <Person key={k} x={(px - k * 0.06) * W} y={pFeet} h={ph} pose={pose} t={t - k * 0.05} bodyColor="#9B6BFF" opacity={0.12 * (4 - k)} cap={false} />
        ))}
        {exited && pose === "run" && (
          <path d={`M ${(px - 0.04) * W} ${pFeet - 120} Q ${(px - 0.2) * W} ${pFeet - 150} ${(px - 0.34) * W} ${pFeet - 100}`} stroke="#7ED957" strokeWidth={26} fill="none" opacity={0.5} strokeLinecap="round" />
        )}
        <Person x={px * W} y={pFeet} h={ph} pose={pose} face={face} t={t} hand={pose === "hold" || pose === "walk" ? <Milk s={0.9} /> : undefined} />
        {exited && (
          <g opacity={0.6}>
            {[0, 1, 2].map((i) => <circle key={i} cx={px * W - 40 - i * 30} cy={pFeet - 300 + Math.sin(t * 4 + i) * 20} r={16} fill="#7ED957" />)}
          </g>
        )}
        {/* +1 milk */}
        {t >= T.beep7 && t < T.cashier7 && (
          <Txt x={0.5 * W} y={lerp(0.38, 0.33, pr(t, T.beep7, 1.2)) * H} size={80} color={C.yellow} s={popS(t, T.beep7)} stroke={6} strokeColor={C.bg}>+1 МОЛОКО</Txt>
        )}
      </Cam>
    </g>
  );
};

// ============ SCENE 8 : ICE CREAM ============
export const Street: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1B1F3D" />
        <stop offset="1" stopColor="#3A3F6B" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sky)" />
    {[[0, 0.42, 220], [200, 0.36, 180], [370, 0.46, 240], [600, 0.32, 200], [790, 0.4, 290]].map(([x, y, w], i) => (
      <g key={i}>
        <rect x={x} y={y * H} width={w} height={(0.72 - y) * H} fill={C.bg} />
        {Array.from({ length: 6 }).map((_, j) => (
          <rect key={j} x={x + 30 + (j % 2) * (w / 2 - 10)} y={y * H + 50 + Math.floor(j / 2) * 120} width={50} height={60} fill={rnd(i * 7 + j) > 0.5 ? "#FFD93D" : "#2A2F55"} opacity={0.6} />
        ))}
      </g>
    ))}
    <rect y={0.72 * H} width={W} height={0.28 * H} fill={C.wall} />
    <rect y={0.72 * H} width={W} height={14} fill="#3A3F6B" />
  </g>
);

// hand position for "holdcone" pose (canonical units)
const HAND = { x: 22 + Math.sin((70 * Math.PI) / 180) * 95 + Math.sin((130 * Math.PI) / 180) * 90, y: -384 + Math.cos((70 * Math.PI) / 180) * 95 + Math.cos((130 * Math.PI) / 180) * 90 };

export const S8: React.FC<{ t: number }> = ({ t }) => {
  const mh = 0.32, mx = 0.3 * W, mFeet = feetY(0.58, 0.28) + 10;
  const s = sc(mh);
  const hx = mx + HAND.x * s, hy = mFeet + HAND.y * s;
  const ph = 0.28;
  const pFeet = mFeet;
  const fall = pr(t, T.drop8, 3.0);
  // player dashes to under the ball
  const dk = easeOut(pr(t, T.dash8, 0.35));
  const px = lerp(0.75 * W, hx + 30, dk);
  const crouching = t >= T.dash8 + 0.35;
  const headY = pFeet - (465 - 110) * sc(ph);
  const ballStartY = hy - 30 * s * 0.9;
  const eatAt = T.eat8;
  const by = t < T.drop8 ? ballStartY : lerp(ballStartY, headY, clamp((t - T.drop8) / (eatAt - T.drop8)));
  const ballGone = t >= eatAt;
  const ck = easeInOut(pr(t, T.close8, 0.25));
  const mHeadY = mFeet - 465 * s;
  const z = lerp(1, 2.6, ck);
  const pose: any = t < T.dash8 ? "idle" : !crouching ? "run" : ballGone ? "eat" : "crouch";
  return (
    <g>
      <Cam z={z} cx={lerp(W / 2, mx, ck)} cy={lerp(H / 2, mHeadY - 40, ck)} sx={W / 2} sy={H / 2}>
        <Street />
        <Person x={mx} y={mFeet} h={mh} gray pose={t >= T.close8 ? "lost" : "holdcone"} face={t >= T.close8 ? "scream" : t >= T.drop8 + 1 ? "neutral" : "neutral"} t={t}
          hand={<Cone ball={t < T.drop8} s={0.9} rot={t >= T.close8 ? 180 : 0} />} />
        {!ballGone && t >= T.drop8 && (
          <g transform={`translate(${hx + 10} ${by}) rotate(${fall * 90})`}>
            <circle r={30 * s * 0.9} fill={C.pink} />
            <g stroke={C.blue} strokeWidth={4} opacity={0.6}>
              <line x1={-20} y1={-50} x2={-20} y2={-80} />
              <line x1={20} y1={-50} x2={20} y2={-80} />
            </g>
          </g>
        )}
        <Person x={px} y={pFeet} h={ph} pose={pose} t={t} flip />
        {t >= T.dash8 && !crouching && Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={px + 60 + rnd(i) * 200} y={pFeet - 400 + rnd(i + 3) * 300} width={160} height={8} rx={4} fill={C.white} opacity={0.6} />
        ))}
        {t >= eatAt + 0.1 && t < T.close8 && (
          <Txt x={px} y={headY - 130} size={72} color={C.pink} s={popS(t, eatAt + 0.1)} stroke={6} strokeColor={C.bg}>ням</Txt>
        )}
      </Cam>
      {t >= T.text8 && t < T.close8 && (
        <Title t={t} a={T.text8} y={0.2} size={56} color={C.white} lines={["ПРОСТО ПОТОМУ ЧТО МОЖЕШЬ"]} />
      )}
    </g>
  );
};

// ============ SCENE 9 : SHOWER ============
export const S9: React.FC<{ t: number }> = ({ t }) => {
  const feet = feetY(0.6, 0.28);
  // player movement
  const ak = easeInOut(pr(t, T.approach9, 1.6));
  const px = lerp(0.2, 0.3, ak) * W;
  const waiting = t >= T.wait9;
  const revealed = t >= T.reveal9;
  const pose: any = revealed ? "shock" : waiting ? "crouch" : t >= T.approach9 && ak < 1 ? "walk" : "back";
  const gapPx = t < T.gap9 ? 0 : t < T.reveal9 ? 1 + Math.floor((t - T.gap9) / 1.2) : 0;
  const open = easeOut(pr(t, T.reveal9, 0.35));
  // camera
  let z = 1, cx = W / 2, cy = H / 2;
  const cabX = 0.62 * W, cabY = 0.45 * H, cabW = 0.25 * W * 1.3, cabH = 0.45 * H;
  const gk = easeInOut(pr(t, T.gap9, 0.5)) * (1 - easeInOut(pr(t, T.wait9 - 0.2, 0.4)));
  z = lerp(z, 2.6, gk); cx = lerp(cx, cabX + cabW / 2 - 60, gk); cy = lerp(cy, cabY - 40, gk);
  const rFeet = cabY + cabH / 2 - 10;
  const rs = sc(0.3);
  const rHead = rFeet - 465 * rs;
  const rk = easeOut(pr(t, T.rustam9, 0.3)) * (1 - easeInOut(pr(t, T.meme9 + 1.6, 0.4)));
  z = lerp(z, 2.0, rk); cx = lerp(cx, cabX, rk); cy = lerp(cy, rHead, rk);
  const frozen = t >= T.rustam9 + 0.3 && t < T.meme9 + 1.6;
  const tt = frozen ? T.rustam9 + 0.3 : t;
  const flip = pr(t, T.flip9, 0.4);
  const flipS = Math.cos(flip * Math.PI);
  const waveK = t >= T.wave9 ? (t >= T.more9 ? 1 - 0.7 * pr(t, T.more9, 0.2) + 0.7 * pr(t, T.more9 + 0.2, 1.8) : easeOut(pr(t, T.wave9, 0.3))) : 0;
  const clockBlink = t >= T.gap9 && t < T.wait9 && Math.floor(t * 2) % 2 === 0;
  return (
    <g>
      <Cam z={z} cx={cx} cy={cy} sx={W / 2} sy={H / 2}>
        <rect width={W} height={H} fill="#3A3F6B" />
        <g stroke="#2A2F55" strokeWidth={4}>
          {Array.from({ length: 15 }).map((_, i) => <line key={"v" + i} x1={i * 80} y1={0} x2={i * 80} y2={0.72 * H} />)}
          {Array.from({ length: 10 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * 80} x2={W} y2={i * 80} />)}
        </g>
        <rect y={0.72 * H} width={W} height={0.28 * H} fill={C.floor} />
        {/* door */}
        <rect x={0.04 * W} y={0.3 * H} width={0.2 * W} height={0.42 * H} fill="#2A2F55" rx={6} />
        <circle cx={0.21 * W} cy={0.52 * H} r={10} fill={C.gray} />
        <g transform={`translate(${0.14 * W} ${0.35 * H}) scale(${flipS * (t >= T.sign9 && t < T.sign9 + 0.6 ? 1.15 : 1)} 1)`}>
          <rect x={-55} y={-55} width={110} height={110} rx={14} fill={flipS > 0 ? C.red : C.blue} />
          <Txt x={0} y={4} size={80} s={1}>{flipS > 0 ? "Ж" : "М"}</Txt>
        </g>
        {/* clock */}
        <g transform={`translate(${0.85 * W} ${0.13 * H})`}>
          <circle r={70} fill={C.white} />
          <line x1={0} y1={0} x2={0} y2={-50} stroke={C.panel} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 40})`} />
          <line x1={0} y1={0} x2={30} y2={0} stroke={C.panel} strokeWidth={10} strokeLinecap="round" transform={`rotate(${t * 4})`} />
          {clockBlink && <Txt x={0} y={110} size={44} color={C.yellow}>+10 мин</Txt>}
        </g>
        {/* cabin */}
        <rect x={cabX - cabW / 2 - 16} y={cabY - cabH / 2 - 16} width={cabW + 32} height={cabH + 32} fill="#2A2F55" rx={10} />
        <rect x={cabX - cabW / 2} y={cabY - cabH / 2} width={cabW} height={cabH} fill="#BFE8F7" />
        {Array.from({ length: 6 }).map((_, i) => (
          <circle key={i} cx={cabX - cabW / 2 + 40 + (i % 3) * 80} cy={cabY - cabH / 2 + 40 + Math.floor(i / 3) * 40} r={6} fill={C.blue} />
        ))}
        {revealed && (
          <Person x={cabX} y={rFeet} h={0.3} gray towel moustache pose="wave" armWave={waveK} face="smile" t={tt} cap={false}
            hand={<Mochalka />} />
        )}
        {/* curtain */}
        <rect x={cabX - cabW / 2 - 20} y={cabY - cabH / 2 - 26} width={cabW + 40} height={14} rx={7} fill={C.gray} />
        {(() => {
          const cw = lerp(cabW, cabW * 0.12, open) - gapPx * 0.6;
          const folds = [];
          for (let i = 0; i < 6; i++) folds.push(<line key={i} x1={cabX - cabW / 2 + (i + 0.5) * (cw / 6)} y1={cabY - cabH / 2} x2={cabX - cabW / 2 + (i + 0.5) * (cw / 6)} y2={cabY + cabH / 2} stroke="#DDE2EE" strokeWidth={8} />);
          return (
            <g>
              <rect x={cabX - cabW / 2} y={cabY - cabH / 2 - 12} width={cw} height={cabH + 12} fill={C.white} />
              {folds}
              {gapPx > 0 && open === 0 && (
                <g>
                  <rect x={cabX + cabW / 2 - 2 - gapPx * 1.5} y={cabY - cabH / 2} width={2 + gapPx * 1.5} height={cabH} fill="#1B1F3D" />
                  <line x1={cabX + cabW / 2 - 24} y1={cabY - 40} x2={cabX + cabW / 2 - 4 - gapPx * 1.5} y2={cabY - 40} stroke={C.yellow} strokeWidth={4} />
                  <Txt x={cabX + cabW / 2 - 70} y={cabY - 70} size={22} color={C.yellow}>{`${gapPx} мм`}</Txt>
                </g>
              )}
            </g>
          );
        })()}
        <Person x={px} y={feet} h={0.28} pose={pose} backView={!revealed} t={tt} />
      </Cam>
      {t >= T.wait9 && t < T.reveal9 && (
        <g transform={`translate(${t >= T.wait9b ? (rnd(Math.floor(t * 30)) - 0.5) * 10 : 0} 0)`}>
          <Title t={t} a={T.wait9} y={0.2} size={t >= T.wait9b ? 96 : 72} lines={[t >= T.wait9b ? "2 ЧАСА!" : "2 ЧАСА"]} />
        </g>
      )}
      {t >= T.more9 && <Title t={t} a={T.more9} y={0.2} size={72} lines={["ещё 2 часа"]} />}
    </g>
  );
};

// ============ SCENE 10 : STATUES & MOUSTACHES ============
const BigFace: React.FC<{ x: number; y: number; r: number; must: number; id: string }> = ({ x, y, r, must, id }) => (
  <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
    <circle r={100} fill={C.grayHead} />
    <ellipse cx={-38} cy={-16} rx={11} ry={14} fill={C.ink} />
    <ellipse cx={38} cy={-16} rx={11} ry={14} fill={C.ink} />
    <path d="M -40 50 Q 0 62 40 50" stroke={C.ink} strokeWidth={9} fill="none" strokeLinecap="round" />
    <path id={id} d="M -66 36 Q -40 6 -4 26 M 4 26 Q 40 6 66 36" stroke={C.ink} strokeWidth={18} fill="none" strokeLinecap="round"
      pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - must} />
  </g>
);

export const S10: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.s10b) {
    const snaps = [T.snap10a, T.snap10b, T.snap10c];
    const poses: any[] = ["point", "onefoot", "nosepick"];
    const snapping = snaps.some((s) => t >= s - 0.15 && t < s + 0.25);
    return (
      <g>
        <rect width={W} height={H} fill={C.wall} />
        <rect y={0.72 * H} width={W} height={0.28 * H} fill={C.floor} />
        {[0.25, 0.5, 0.75].map((x, i) => (
          <g key={i}>
            <rect x={x * W - 90} y={feetY(0.6, 0.26)} width={180} height={40} rx={6} fill="#3A3F6B" />
            <Person x={x * W} y={feetY(0.6, 0.26)} h={0.26} gray pose={t >= snaps[i] ? poses[i] : "idle"} face="passport" t={t + i} blinkK={0} />
            {t >= snaps[i] && t < snaps[i] + 0.35 && (
              <circle cx={x * W} cy={feetY(0.6, 0.26) - 0.13 * H} r={lerp(40, 200, pr(t, snaps[i], 0.35))} fill="none" stroke={C.yellow} strokeWidth={8} opacity={1 - pr(t, snaps[i], 0.35)} />
            )}
          </g>
        ))}
        <Person x={0.86 * W} y={0.83 * H} h={0.17} pose={snapping ? "snap" : "idle"} t={t} flip />
        {snapping && <Txt x={0.86 * W - 120} y={0.83 * H - 0.13 * H} size={60} color={C.yellow}>✦</Txt>}
        <Title t={t} a={T.s10} y={0.15} size={72} lines={["СТАТУИ"]} />
      </g>
    );
  }
  const must = easeInOut(pr(t, T.draw10, 0.5));
  const gk = t >= T.grid10 ? easeOut(pr(t, T.grid10, 0.4)) : 0;
  const mk = must;
  return (
    <g>
      <rect width={W} height={H} fill={C.bg} />
      {gk === 0 ? (
        <g>
          <rect x={60} y={300} width={W - 120} height={H - 720} rx={20} fill="#E8EBF2" stroke={C.panel} strokeWidth={24} />
          <rect x={W / 2 - 30} y={H - 420} width={60} height={300} fill={C.panel} />
          <BigFace x={W / 2} y={0.4 * H} r={330} must={must} id="m0" />
          {t >= T.draw10 - 0.3 && (
            <g transform={`translate(${W / 2 + lerp(-200, 200, mk)} ${0.4 * H + 90 - Math.sin(mk * Math.PI * 2) * 30})`}><g transform="scale(2.2)"><Marker /></g></g>
          )}
        </g>
      ) : (
        <g>
          {Array.from({ length: 9 }).map((_, i) => {
            const cx = (i % 3) * (W / 3) + W / 6, cy = 260 + Math.floor(i / 3) * 470 + 300;
            const sk = popS(t, T.grid10 + i * 0.05, 0.2);
            return (
              <g key={i} transform={`translate(${cx} ${cy}) scale(${sk})`}>
                <rect x={-W / 6 + 12} y={-220} width={W / 3 - 24} height={440} rx={14} fill="#E8EBF2" stroke={C.panel} strokeWidth={10} />
                <BigFace x={0} y={0} r={120} must={1} id={"m" + (i + 1)} />
              </g>
            );
          })}
        </g>
      )}
      <Title t={t} a={T.s10b} y={0.08} size={72} lines={["УСЫ"]} />
    </g>
  );
};

// ============ SCENE 11 : FINALE ============
const Plate: React.FC<{ t: number; a: number; x: number; y: number; text: string; color: string }> = ({ t, a, x, y, text, color }) => {
  if (t < a) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${popS(t, a, 0.15)})`}>
      <rect x={-230} y={-60} width={460} height={120} rx={26} fill={C.panel} stroke={color} strokeWidth={6} />
      <Txt x={0} y={2} size={56} color={color}>{text}</Txt>
    </g>
  );
};

export const S11: React.FC<{ t: number }> = ({ t }) => {
  const scream = t >= T.scream11 && t < T.back11;
  const frozen = t >= T.freeze11;
  const tt = frozen ? T.freeze11 : t;
  if (scream) {
    const zk = easeOut(pr(t, T.scream11, 0.5));
    const mx = 0.5 * W, mFeet = 0.95 * H, ms = sc(0.45);
    const headY = mFeet - 465 * ms;
    return (
      <g>
        <Cam z={lerp(1, 2.0, zk)} cx={mx} cy={lerp(H / 2, headY + 30, zk)} sx={W / 2} sy={H / 2}>
          <Street />
          <Person x={mx} y={mFeet} h={0.45} gray pose="lost" face="scream" t={t} hand={<Cone ball={false} rot={180} s={0.9} />} jitter={3} />
        </Cam>
        {/* window frame */}
        <g fill="none" stroke="#3A3F6B">
          <rect x={30} y={30} width={W - 60} height={H - 60} strokeWidth={60} />
          <line x1={W / 2} y1={0} x2={W / 2} y2={H * 0.18} strokeWidth={30} />
        </g>
        <Title t={t} a={T.scream11} y={0.2} size={80} color={C.red} lines={["ГДЕ МОЁ", "МОРОЖЕНОЕ?!"]} />
      </g>
    );
  }
  const ek = easeOut(pr(t, T.s11, 1.1));
  const px = lerp(-0.15, 0.28, ek) * W;
  const palm = t >= T.palm11 && t < T.palm11 + 3.2;
  const pose: any = t < T.s11 + 1.1 ? "walk" : palm ? "facepalm" : "tired";
  const steam = t >= T.tea11 ? 1.2 : 0.6;
  const blinkOn = frozen && Math.floor((t - T.freeze11) / 0.4) % 2 === 0 && t - T.freeze11 < 2.4;
  return (
    <g>
      <Kitchen windowStreet />
      {/* tiny man in window */}
      <Person x={0.86 * W} y={0.25 * H + 0.12 * H} h={0.1} gray pose={t >= T.back11 ? "lost" : "holdcone"} t={tt} hand={<Cone ball={false} s={0.9} />} />
      <rect x={0.72 * W - 4} y={0.125 * H} width={8} height={0.25 * H} fill="#3A3F6B" opacity={0} />
      <Kettle x={0.72 * W} y={0.62 * H - 0.07 * W} t={tt} steam={steam} shakeAmp={t < T.tea11 ? 2 : 4} light={t < T.tea11} />
      <Person x={px} y={feetY(0.5, 0.3)} h={0.3} pose={pose} t={tt} stubble={clamp((t - T.you11) / 1)} bags={t >= T.you11} />
      <Plate t={t} a={T.world11} x={0.25 * W} y={0.15 * H} text="МИР: 3 МИН" color={C.gray} />
      <Plate t={t} a={T.you11} x={0.75 * W} y={0.15 * H} text="ТЫ: 5 ЧАСОВ" color={C.yellow} />
      {t >= T.tea11 && <Title t={t} a={T.tea11} y={0.3} size={76} lines={["ЭТО БЫЛ ПРОСТО ЧАЙ"]} />}
      {blinkOn && <rect x={14} y={14} width={W - 28} height={H - 28} fill="none" stroke={C.red} strokeWidth={28} />}
    </g>
  );
};
