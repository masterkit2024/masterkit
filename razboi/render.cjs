// node render.cjs <worker> <workers>  -> build/seg_<worker>.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const wi = +process.argv[2], WN = +process.argv[3];
  const TOTAL = Math.round(200.5 * 60);
  let a = Math.floor(TOTAL * wi / WN), b = Math.floor(TOTAL * (wi + 1) / WN);
  if (process.argv[4]) { a = +process.argv[4]; b = +process.argv[5]; }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '60', '-threads', '2', process.argv[6] || `build/seg_${wi}.mp4`], {stdio: ['pipe', 'inherit', 'inherit']});
  const br = await chromium.launch();
  const p = await br.newPage({viewport: {width: 1920, height: 1080}});
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => window.ready);
  const t0 = Date.now();
  for (let i = a; i < b; i++) {
    const d = await p.evaluate(async i => { await window.renderFrame(i); return document.getElementById('c').toDataURL('image/jpeg', .95); }, i);
    const buf = Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 600 === 0) console.log(`w${wi} ${i - a}/${b - a} ${((Date.now() - t0)/1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await br.close(); console.log(`w${wi} done ${b - a} frames ${((Date.now() - t0)/1000).toFixed(0)}s`);
})();
