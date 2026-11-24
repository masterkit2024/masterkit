// Покадровый рендер тестовой сцены (тот же RigScene, что и в Remotion) → SVG-кадры.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { RigScene, SCENE } from '../remotion/scene';
const dir = path.join(__dirname, 'frames');
fs.mkdirSync(dir, { recursive: true });
for (let f = 0; f < SCENE.durationInFrames; f++) {
  const svg = renderToStaticMarkup(<RigScene frame={f} />).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  fs.writeFileSync(path.join(dir, `f${String(f).padStart(4, '0')}.svg`), svg);
}
console.log('frames', SCENE.durationInFrames);
