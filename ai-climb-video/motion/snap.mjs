// Renders selected times to PNG (for review). usage: node snap.mjs outdir t1 t2 ...
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const [out, ...ts] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); }); p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto(`http://localhost:${port}/index.html?t=0`); await p.evaluate(() => READY);
for (const t of ts) {
  const t0 = Date.now();
  const data = await p.evaluate(t => { renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', .9); }, +t);
  fs.writeFileSync(path.join(out, `t${(+t).toFixed(2).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  console.log(t, Date.now() - t0, 'ms');
}
await b.close(); srv.close();
