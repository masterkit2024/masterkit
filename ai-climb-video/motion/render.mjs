// Full render: N parallel workers, each encodes its frame range to an intermediate H.264 segment.
// usage: node render.mjs [workers=4] [fps=60]
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const N = +(process.argv[2] || 4), FPS = +(process.argv[3] || 60);
const tl = JSON.parse(fs.readFileSync(path.join(root, 'media/timeline.json')));
const total = Math.round(tl.duration * FPS);
const outDir = path.join(root, 'out'); fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const per = Math.ceil(total / N);
const t0 = Date.now();
await Promise.all([...Array(N).keys()].map(async w => {
  const a = w * per, b = Math.min(total, a + per);
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', e => console.log('pageerror', w, e.message));
  await page.goto(`http://localhost:${port}/index.html?t=0`); await page.evaluate(() => READY);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), path.join(outDir, `seg${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) {
    const data = await page.evaluate(t => { renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', .96); }, i / FPS);
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 120 === 0) console.log(`w${w} ${i - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await page.close();
}));
await browser.close(); srv.close();
fs.writeFileSync(path.join(outDir, 'segs.txt'), [...Array(N).keys()].map(w => `file 'seg${w}.mp4'`).join('\n'));
console.log('done', total, 'frames', ((Date.now() - t0) / 1000).toFixed(0), 's');
