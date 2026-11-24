import React from 'react';
import { Composition } from 'remotion';
import { RigDemo } from './RigDemo';
import { SCENE } from './scene';

export const RemotionRoot: React.FC = () => (
  <Composition id="RigDemo" component={RigDemo} width={SCENE.width} height={SCENE.height} fps={SCENE.fps} durationInFrames={SCENE.durationInFrames} />
);
