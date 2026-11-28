// node render.js scene.html out_dir WxH fps [bg0|-] [frames: "a,b,c" or "from-to"]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
(async () => {
  const [,, html, out, size = '1080x1920', fpsArg = '60', mode = '', only] = process.argv;
  const [w, h] = size.split('x').map(Number), fps = +fpsArg;
  fs.mkdirSync(out, { recursive: true });
  const root = path.dirname(path.resolve(html));
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };
  const srv = http.createServer((q, r) => {
    const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  }).listen(0);
  const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  pg.on('console', m => console.log('PAGE:', m.text())); pg.on('pageerror', e => console.log('ERR:', e.message));
  await pg.goto(`http://127.0.0.1:${port}/${path.basename(html)}?w=${w}&h=${h}&fps=${fps}${mode === 'bg0' ? '&bg=0' : ''}`);
  await pg.evaluate(() => window.ready);
  const dur = await pg.evaluate(() => window.DUR);
  let frames;
  if (only && only.includes('-')) { const [a, z] = only.split('-').map(Number); frames = []; for (let f = a; f <= Math.min(z, Math.round(fps * dur) - 1); f++) frames.push(f); }
  else frames = only ? only.split(',').map(Number) : [...Array(Math.round(fps * dur)).keys()];
  for (const f of frames) {
    const d = await pg.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, f / fps);
    fs.writeFileSync(path.join(out, `f${String(f).padStart(5, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close(); srv.close();
})();
