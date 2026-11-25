import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, continueRender, delayRender } from "remotion";
import { C, W, H, FPS, clamp, pr, popS, FONT_SUB } from "./lib";
import { S1, S2, S3, S4, S5, S6 } from "./ScenesA";
import { S7, S8, S9, S10, S11 } from "./ScenesB";
import { T, WORDS } from "./timing";

const fontCss = `
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url('${staticFile("fonts/montserrat-cyrillic-800-normal.woff2")}') format('woff2'); unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url('${staticFile("fonts/montserrat-latin-800-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 700; src: url('${staticFile("fonts/inter-cyrillic-700-normal.woff2")}') format('woff2'); unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Inter'; font-weight: 700; src: url('${staticFile("fonts/inter-latin-700-normal.woff2")}') format('woff2'); }
`;

type Sc = { a: number; b: number; C: React.FC<{ t: number }> };
const SCENES: Sc[] = [
  { a: T.s1, b: T.s2, C: S1 },
  { a: T.s2, b: T.s3, C: S2 },
  { a: T.s3, b: T.s4, C: S3 },
  { a: T.s4, b: T.s5, C: S4 },
  { a: T.s5, b: T.s6, C: S5 },
  { a: T.s6, b: T.s7, C: S6 },
  { a: T.s7, b: T.s8, C: S7 },
  { a: T.s8, b: T.s9, C: S8 },
  { a: T.s9, b: T.s10, C: S9 },
  { a: T.s10, b: T.s11, C: S10 },
  { a: T.s11, b: T.end + 1, C: S11 },
];

// ---------- subtitles ----------
const ACCENT = /^(нажал|сто|пожалел|нельзя|звук|инфразвук|оглохнешь|воздух|пятьсот|самолёта|стеной|первой|мозг|тормозит|тридцати|треть|память|физике|есть|мешает|порядке|застывает|магазин|паспорт|пукнул|ледник|сквозь|молоко|моргнула|мороженое|съесть|можешь|душ|шторке|миллиметр|часа|рустам|перепутали|рукой|статуй|носу|усы|билборде|чайнику|шуметь|минуты|часов|чай|заметил|колебания|страшно|роняли|цифры|темпе|кнопку|стоит|способность)$/i;

type Group = { words: { w: string; s: number }[]; s: number; e: number };
const buildGroups = (): Group[] => {
  const g: Group[] = [];
  let cur: { w: string; s: number }[] = [];
  const flush = (e: number) => {
    if (cur.length) g.push({ words: cur, s: cur[0].s, e });
    cur = [];
  };
  WORDS.forEach((wd, i) => {
    if (wd.w === "—") return;
    cur.push({ w: wd.w, s: wd.s });
    const next = WORDS[i + 1];
    const strong = /[.!?…]$/.test(wd.w);
    const soft = /[,:]$/.test(wd.w);
    const gap = next ? next.s - wd.e : 9;
    if (strong || gap > 0.35 || cur.length >= 5 || (soft && cur.length >= 3)) {
      flush(wd.e);
    }
  });
  flush(WORDS[WORDS.length - 1].e);
  // hold until next group (max +0.6 s)
  for (let i = 0; i < g.length; i++) {
    const nx = g[i + 1]?.s ?? g[i].e + 0.6;
    g[i].e = Math.min(nx - 0.02, g[i].e + 0.6);
  }
  return g;
};
const GROUPS = buildGroups();

const Subs: React.FC<{ t: number }> = ({ t }) => {
  const g = GROUPS.find((x) => t >= x.s - 0.05 && t <= x.e);
  if (!g) return null;
  // no subtitle over the meme freeze & scream title (already big on screen)
  const words = g.words.filter((w) => t >= w.s - 0.05);
  let accentIdx = g.words.findIndex((w) => ACCENT.test(w.w.replace(/[.,!?:…«»"]/g, "")));
  const line = words.map((w, i) => ({ ...w, acc: i === accentIdx }));
  // wrap to 2 lines if long
  const text = line.map((l) => l.w).join(" ");
  const twoLines = text.length > 22;
  const split = twoLines ? Math.ceil(line.length / 2) : line.length;
  const lines = twoLines ? [line.slice(0, split), line.slice(split)] : [line];
  const s = popS(t, g.s - 0.05, 0.1);
  return (
    <g transform={`translate(${W / 2} ${0.88 * H}) scale(${s})`}>
      {lines.map((ln, li) => (
        <text key={li} y={(li - (lines.length - 1) / 2) * 74 + (twoLines ? -20 : 0)} textAnchor="middle" dominantBaseline="central"
          fontFamily={FONT_SUB} fontWeight={700} fontSize={64} stroke="#000" strokeWidth={12} strokeLinejoin="round" paintOrder="stroke">
          {ln.map((w, i) => (
            <tspan key={i} fill={w.acc ? C.yellow : C.white}>{(i ? " " : "") + w.w.replace(/[—]/g, "")}</tspan>
          ))}
        </text>
      ))}
    </g>
  );
};

// ---------- transitions ----------
const sceneAt = (t: number) => SCENES.findIndex((s) => t >= s.a && t < s.b);

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [handle] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    (document as any).fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  const i = Math.max(0, sceneAt(t));
  const sc = SCENES[i];
  const Cur = sc.C;
  let content: React.ReactNode = <Cur t={t} />;

  // S3 -> S4: slide left 0.2 s
  if (i === 3 && t < T.s4 + 0.2) {
    const k = pr(t, T.s4, 0.2);
    content = (
      <g>
        <g transform={`translate(${-k * W} 0)`}><S3 t={T.s4 - 0.001} /></g>
        <g transform={`translate(${(1 - k) * W} 0)`}><S4 t={t} /></g>
      </g>
    );
  }
  // S6 -> S7: wipe right 0.2 s
  if (i === 6 && t < T.s7 + 0.2) {
    const k = pr(t, T.s7, 0.2);
    content = (
      <g>
        <S6 t={T.s7 - 0.001} />
        <clipPath id="wipe"><rect x={0} y={0} width={k * W} height={H} /></clipPath>
        <g clipPath="url(#wipe)"><S7 t={t} /></g>
        <rect x={k * W - 12} y={0} width={24} height={H} fill={C.yellow} />
      </g>
    );
  }
  // S4 -> S5 white flash 0.15 s
  const flash = t >= T.s5 - 0.075 && t < T.s5 + 0.075 ? 1 - Math.abs(t - T.s5) / 0.075 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <style>{fontCss}</style>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="desat"><feColorMatrix type="saturate" values="0" /></filter>
        </defs>
        {content}
        {flash > 0 && <rect width={W} height={H} fill="#fff" opacity={flash} />}
        <Subs t={t} />
      </svg>
    </AbsoluteFill>
  );
};
