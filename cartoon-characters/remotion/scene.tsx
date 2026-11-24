/**
 * Тестовая сцена рига: чистая функция от кадра (без зависимостей от Remotion),
 * поэтому её можно рендерить и в Remotion, и любым другим способом.
 */
import React from 'react';
import { BabaGlyba, Kesha, Lenya, MouthShape, palette, Sugrob } from '../characters';

export const SCENE = { width: 1080, height: 1920, fps: 30, durationInFrames: 120 };

/** Простейший «липсинк»: последовательность форм рта, по 3 кадра на слог. */
const TALK: MouthShape[] = ['closed', 'slight', 'wide', 'o', 'slight', 'smile', 'closed', 'wide', 'slight', 'closed'];
const talk = (f: number, from: number, to: number): MouthShape => (f < from || f > to ? 'closed' : TALK[Math.floor((f - from) / 3) % TALK.length]);

const blink = (f: number, every: number, offset = 0) => {
  const t = (f + offset) % every;
  return t < 3 ? [0.6, 1, 0.5][t] : 0;
};

export function RigScene({ frame }: { frame: number }) {
  const f = frame;
  const s = Math.sin;
  const floor = 1500;
  const k = 0.44;

  // Баба Глыба впадает в ярость на 60-м кадре: «пружинный» прыжок по squash
  const rageT = f - 60;
  const rage = rageT >= 0;
  const pop = rage ? Math.exp(-rageT / 6) * Math.cos(rageT / 2.2) : 0;

  return (
    <svg width={SCENE.width} height={SCENE.height} viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}>
      <rect width={SCENE.width} height={SCENE.height} fill={palette.bg} />
      <rect y={floor} width={SCENE.width} height={SCENE.height - floor} fill={palette.bgFloor} />

      {/* Лёня: еле дышит, медленно моргает, бурчит */}
      <Lenya
        x={120} y={floor - 30} scale={k} emotion="deadpan" mouth={talk(f, 70, 110)} blink={blink(f, 70, 20)}
        rig={{ squash: 1 + s(f / 14) * 0.012, head: 6 + s(f / 20) * 3, armL: { shoulder: 5 + s(f / 18) * 3 }, armR: { shoulder: 7 + s(f / 18 + 1) * 3 } }}
      />
      {/* Сугроб: покачивается, довольный */}
      <Sugrob
        x={410} y={floor - 80} scale={k} emotion={rage ? 'shock' : 'neutral'} mouth={rage ? 'o' : 'closed'} blink={blink(f, 80)}
        rig={{ lean: 5 + s(f / 16) * 3, head: 7 + s(f / 16 + 0.6) * 4, squash: 1 + s(f / 16) * 0.015 }}
      />
      {/* Кеша: паникует и тараторит, руки в движении */}
      <Kesha
        x={370} y={floor + 220} scale={k} emotion={rage ? 'shock' : 'panic'} mouth={talk(f, 0, 58)} blink={blink(f, 45, 10)}
        look={{ x: rage ? 1 : s(f / 7) * 0.5 }}
        pose="panic"
        rig={{
          bodyY: -Math.abs(s(f / 4)) * 14,
          armL: { shoulder: 140 + s(f / 3) * 18, elbow: -30 + s(f / 3 + 1) * 20 },
          armR: { shoulder: 135 + s(f / 3 + 2) * 18, elbow: -25 + s(f / 3 + 3) * 20 },
          head: s(f / 5) * 6,
        }}
      />
      {/* Баба Глыба: робкая → ГЛЫБА */}
      <BabaGlyba
        x={rage ? 760 : 790} y={floor + 200} scale={rage ? 0.4 : 0.44} rage={rage} wind={0.6 + 0.4 * s(f / 3)}
        emotion="neutral" mouth={rage ? talk(f, 62, 110) : 'closed'} blink={rage ? 0 : blink(f, 50, 5)}
        rig={{ squash: 1 + pop * 0.18, bodyY: pop * 30, head: rage ? s(f / 4) * 3 : 9 + s(f / 12) * 2 }}
      />
    </svg>
  );
}
