import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { DUR } from "./timing";
import { Main3D } from "../src3d/Main3D";
export const Root: React.FC = () => (
  <>
  <Composition id="SlowedWorld3D" component={Main3D} durationInFrames={Math.round(DUR * 30)} fps={30} width={1080} height={1920} />
  <Composition id="SlowedWorld" component={Main} durationInFrames={Math.round(DUR * 30)} fps={30} width={1080} height={1920} />
  </>
);
