// 10-second silent cut of the bridge short: five beats taken straight from the full timeline.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { BridgeShort } from "./Bridge";

// [source start, source end) frames of the 67 s timeline
export const CUTS: [number, number][] = [
  [0, 66],      // hook: the column marches onto the bridge
  [136, 196],   // aerial of the town and the bridge
  [497, 524],   // side view: the deck bounces under the march
  [717, 750],   // high wide over the whole column
  [1032, 1114], // the bolt snaps, aerial, the deck drops into the river
  [1140, 1172], // soldiers sitting in the river
];
export const EDIT_FRAMES = CUTS.reduce((n, [a, b]) => n + b - a, 0);

export const Edit10: React.FC = () => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 6, EDIT_FRAMES - 10, EDIT_FRAMES], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let from = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {CUTS.map(([a, b]) => {
        const el = (
          <Sequence key={a} from={from} durationInFrames={b - a}>
            <Sequence from={-a}><BridgeShort /></Sequence>
          </Sequence>
        );
        from += b - a;
        return el;
      })}
      {fade > 0 && <AbsoluteFill style={{ background: "#000", opacity: fade }} />}
    </AbsoluteFill>
  );
};
