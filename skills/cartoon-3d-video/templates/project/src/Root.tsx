import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { Edit10, EDIT_FRAMES } from "./videos/bridge/Edit10";
import { makeVideo } from "./engine/Video";
import { SPEC as TIME } from "./videos/timemachine/video";
const TimeMachine = makeVideo(TIME);
import { SPEC as LINEUP } from "./videos/lineup/video";
const Lineup = makeVideo(LINEUP);
export const Root: React.FC = () => (<>
  <Composition id="TimeMachine" component={TimeMachine.Component} durationInFrames={TimeMachine.frames} fps={30} width={1080} height={1920} />
  {/* reference sheet: all characters (frame 0) and the 14 faces (frame 30) */}
  <Composition id="Lineup" component={Lineup.Component} durationInFrames={Lineup.frames} fps={30} width={1080} height={1920} />
  <Composition id="Cartoon10" component={Edit10} durationInFrames={EDIT_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
</>);
