// usage: node thumb.mjs out.png
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const b = await chromium.launch(); const p = await b.newPage();
p.on('pageerror', e => console.log('pageerror', e.message));
await p.goto(`http://localhost:${srv.address().port}/thumb.html`);
const data = await p.evaluate(() => makeThumb());
fs.writeFileSync(process.argv[2], Buffer.from(data.split(',')[1], 'base64'));
await b.close(); srv.close(); console.log('ok');
