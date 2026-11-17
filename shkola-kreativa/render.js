// node render.js out.mp4 [scale] [from] [to]  -> frames piped losslessly into ffmpeg (video only)
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
(async () => {
  const out = process.argv[2] || 'video_noaudio.mp4', scale = +(process.argv[3] || 1);
  const from = +(process.argv[4] || 0), to = +(process.argv[5] || 239);
  const w = Math.round(1920 * scale), h = Math.round(1080 * scale);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '24', '-c:v', 'png', '-i', '-',
    '-vf', `scale=${w}:${h}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', scale < 1 ? 'veryfast' : 'slow', '-crf', scale < 1 ? '23' : '14',
    '-tune', 'animation', '-r', '24', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await p.goto('file://' + path.resolve(__dirname, 'film.html'));
  const t0 = Date.now();
  for (let f = from; f <= to; f++) {
    const d = await p.evaluate(f => grab(f, 'image/png'), f);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 40 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', out);
})();
