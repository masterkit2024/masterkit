import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { DUR } from "./timing";
export const Root: React.FC = () => (
  <Composition id="SlowedWorld" component={Main} durationInFrames={Math.round(DUR * 30)} fps={30} width={1080} height={1920} />
);
