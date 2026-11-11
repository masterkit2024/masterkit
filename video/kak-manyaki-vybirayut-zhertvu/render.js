// usage: node render.js stills out_dir t1 t2 ...   |  node render.js video out.mp4 f0 f1  | node render.js events out.json | node render.js bench
const { chromium } = require('playwright');
const fs = require('fs'); const { spawn } = require('child_process');
(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--disable-web-security', '--font-render-hinting=none'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  p.on('console', m => { if (m.type() === 'error') console.error('PAGE', m.text()); });
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.waitForFunction('window.READY === true', null, { timeout: 900000 });
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of rest) { const f = Math.round(parseFloat(t) * 30); const d = await p.evaluate(f => R(f), f); fs.writeFileSync(`${out}/t${(+t).toFixed(1).padStart(6, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
  } else if (mode === 'events') {
    const e = await p.evaluate(() => ({ events: EVENTS, shots: SHOTS.map(s => ({ t0: s.t0, tr: s.tr, lb: s.lb })), dur: TL.dur + END_EXTRA }));
    fs.writeFileSync(out, JSON.stringify(e));
  } else if (mode === 'bench') {
    const t0 = Date.now(); for (let f = 3000; f < 3060; f++) await p.evaluate(f => R(f), f); console.log('ms/frame', (Date.now() - t0) / 60);
  } else if (mode === 'video') {
    const f0 = +rest[0], f1 = +rest[1];
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = f0; f < f1; f++) {
      const d = await p.evaluate(f => R(f), f);
      const buf = Buffer.from(d.split(',')[1], 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 300 === 0) console.log(out, f, '/', f1);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
