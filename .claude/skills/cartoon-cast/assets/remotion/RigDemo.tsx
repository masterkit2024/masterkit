/**
 * Пример использования в Remotion:
 *   <Composition id="RigDemo" component={RigDemo} width={1080} height={1920} fps={30} durationInFrames={120} />
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { RigScene } from './scene';

export const RigDemo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <RigScene frame={frame} />
    </AbsoluteFill>
  );
};
