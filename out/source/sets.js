// 2D illustrated sets (flat layered shapes, soft gradients, glow). Coordinates 1080x1920 frame; some sets are wider for panning.
const C = require('./core');
const T = require('./toon');
const { hex, rgba, mix, shade, lg, rg, glow, cone, dust, rain, glassDrops, rng, clamp, lerp, VW, VH } = C;
const INK = T.INK;
const AMBER = hex('#ffb454'), ICE = hex('#7fd3ff');
const ol = (ctx, lw = 3, a = 0.85) => { ctx.lineWidth = lw; ctx.strokeStyle = `rgba(36,22,26,${a})`; ctx.lineJoin = 'round'; ctx.stroke(); };
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// ===================== STATION =====================
function stWall(c, t, o = {}) {
  const w = o.warm || 0;
  c.fillStyle = lg(c, 0, 0, 0, 1400, [[0, rgba(mix(hex('#123a52'), hex('#5a3a22'), w))], [1, rgba(mix(hex('#0a2232'), hex('#2e1c10'), w))]]); c.fillRect(-600, -400, VW + 1200, 1800);
  // wall panels
  c.fillStyle = rgba(mix(hex('#0e2e42'), hex('#4a2e1a'), w)); for (const x of [-300, 30, 370, 710, 1050, 1390]) c.fillRect(x - 20, -400, 40, 1800);
  for (const [cx, wd] of [[-170, 240], [200, 250], [540, 250], [880, 250], [1250, 240]]) stWindow(c, t, cx, 230, wd, 1150, o);
  c.fillStyle = rgba(mix(hex('#0d2b3d'), hex('#3d2614'), w)); c.fillRect(-600, 150, VW + 1200, 36);
}
function stWindow(c, t, cx, top, wd, bot, o) {
  const w = o.warm || 0;
  c.save(); c.beginPath(); c.moveTo(cx - wd / 2, bot); c.lineTo(cx - wd / 2, top + wd / 2); c.arc(cx, top + wd / 2, wd / 2, Math.PI, 0); c.lineTo(cx + wd / 2, bot); c.closePath();
  c.save(); c.clip();
  c.fillStyle = lg(c, 0, top, 0, bot, [[0, rgba(mix(hex('#1b4f72'), hex('#7a4a22'), w))], [1, rgba(mix(hex('#2a6c8a'), hex('#b07434'), w))]]); c.fillRect(cx - wd, top, wd * 2, bot - top);
  // city silhouettes
  const R = rng(cx | 0); c.fillStyle = rgba(mix(hex('#0f3248'), hex('#4a2a14'), w));
  let x = cx - wd / 2; while (x < cx + wd / 2) { const bw = 30 + R() * 50, bh = 120 + R() * 260; c.fillRect(x, bot - bh, bw, bh); for (let k = 0; k < 6; k++) if (R() < 0.5) { c.fillStyle = rgba(mix(hex('#bfe9ff'), hex('#ffd28a'), w), 0.75); c.fillRect(x + 6 + R() * (bw - 14), bot - bh + 10 + R() * (bh - 20), 6, 8); c.fillStyle = rgba(mix(hex('#0f3248'), hex('#4a2a14'), w)); } x += bw + 4; }
  if (o.train) { const k = o.train, tx = cx - wd + k * wd * 2.2; c.fillStyle = '#1a1410'; c.fillRect(tx - 400, bot - 140, 400, 100); c.fillStyle = 'rgba(255,220,150,0.9)'; for (let i = 0; i < 5; i++) c.fillRect(tx - 380 + i * 75, bot - 125, 50, 34); glow(c, tx, bot - 90, 160, hex('#fff1d0'), 0.9); }
  rain(c, t, cx | 0, 28, [cx - wd / 2, top, wd, bot - top], mix(hex('#cfeaff'), hex('#ffe2b0'), w), 0.28, 60, 2, 0.08, 900);
  glassDrops(c, t, (cx | 0) + 3, 22, [cx - wd / 2, top, wd, bot - top], mix(hex('#d6f0ff'), hex('#ffe6c0'), w), 0.7);
  c.restore();
  c.lineWidth = 12; c.strokeStyle = rgba(mix(hex('#0a1f2c'), hex('#2a180c'), w)); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, bot); for (let y = top + wd / 2 + 150; y < bot; y += 220) { c.moveTo(cx - wd / 2, y); c.lineTo(cx + wd / 2, y); } c.stroke();
  c.restore();
}
function stClock(c, x, y, r, hh, mm, o = {}) {
  const w = o.warm || 0;
  glow(c, x, y, r * 1.7, mix(hex('#cfeeff'), hex('#ffd59a'), w), 0.25 * (o.glow ?? 1));
  c.fillStyle = '#c8a050'; c.beginPath(); c.arc(x, y, r * 1.1, 0, 6.283); c.fill(); ol(c, 4);
  c.fillStyle = rg(c, x - r * 0.3, y - r * 0.3, 0, r * 1.3, [[0, rgba(mix(hex('#ffffff'), hex('#fff4dc'), w))], [1, rgba(mix(hex('#cfe6ee'), hex('#ffd9a6'), w))]]); c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); ol(c, 4);
  c.strokeStyle = INK; c.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.lineWidth = i % 3 ? 4 : 8; c.beginPath(); c.moveTo(x + Math.sin(a) * r * 0.78, y - Math.cos(a) * r * 0.78); c.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); c.stroke(); }
  const ha = (hh % 12 + mm / 60) / 12 * 6.283, ma = mm / 60 * 6.283;
  if (o.spin) { c.save(); c.globalAlpha = 0.18; for (let k = 1; k < 8; k++) { const a2 = ma + o.spin * k * 0.06; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a2) * r * 0.8, y - Math.cos(a2) * r * 0.8); c.stroke(); } c.restore(); }
  c.lineWidth = 11; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); c.stroke();
  c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ma) * r * 0.78, y - Math.cos(ma) * r * 0.78); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x, y, 10, 0, 6.283); c.fill();
  c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y - r * 1.1); c.lineTo(x, y - r * 1.1 - 200); c.stroke();
}
function stBoard(c, t, x, y, w, h, o = {}) {
  const ww = o.warm || 0;
  rr(c, x, y, w, h, 14); c.fillStyle = '#0b1218'; c.fill(); ol(c, 5);
  if (o.flap) { o.flap(c, x, y, w, h); return; }
  const R = rng(4);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 14; k++) { if (R() > 0.65) continue; const fl = Math.sin(t * 3 + r * 2 + k) > 0.92; c.fillStyle = rgba(mix(hex('#cff3ff'), hex('#ffd9a0'), ww), fl ? 0.25 : 0.8); c.fillRect(x + 18 + k * (w - 36) / 14 + 3, y + 16 + r * (h - 32) / 3 + 4, (w - 36) / 14 - 8, (h - 32) / 3 - 10); }
}
function stLamp(c, x, y, len, I, w = 0) {
  const col = mix(hex('#e6f6ff'), hex('#ffcf8a'), w);
  c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x, -300); c.lineTo(x, y); c.stroke();
  c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x + 20, y); c.lineTo(x + 66, y + 56); c.lineTo(x - 66, y + 56); c.closePath(); c.fillStyle = '#1d3a48'; c.fill(); ol(c, 4);
  glow(c, x, y + 58, 110, col, 0.95 * I); cone(c, x, y + 56, 0, 0.42, len, col, 0.2 * I, 56);
}
function stFloor(c, t, y0, o = {}) {
  const w = o.warm || 0;
  c.fillStyle = lg(c, 0, y0, 0, VH, [[0, rgba(mix(hex('#18475e'), hex('#6a4424'), w))], [1, rgba(mix(hex('#071a24'), hex('#22140a'), w))]]); c.fillRect(-600, y0, VW + 1200, VH);
  c.strokeStyle = rgba(mix(hex('#2a6680'), hex('#8a5a2a'), w), 0.45); c.lineWidth = 3; c.beginPath(); for (let i = -12; i <= 12; i++) { c.moveTo(540 + i * 90, y0); c.lineTo(540 + i * 300, VH + 200); } for (let k = 1; k < 7; k++) { const yy = y0 + Math.pow(k / 7, 1.6) * (VH - y0); c.moveTo(-600, yy); c.lineTo(VW + 600, yy); } c.stroke();
  c.save(); c.globalCompositeOperation = 'lighter'; c.filter = C.fb(c, 12); for (const x of [200, 540, 880]) { c.fillStyle = lg(c, 0, y0, 0, y0 + 500, [[0, rgba(mix(hex('#5ab8e0'), AMBER, w), 0.3)], [1, 'rgba(0,0,0,0)']]); c.fillRect(x - 90, y0, 180, 500); } c.restore();
}
// ticket booth: draws back, calls inside(c) to draw keeper, then front frame
function stBooth(c, t, x, y, w, h, inside, o = {}) {
  const ww = o.warm || 0, wood = mix(hex('#1f5466'), hex('#7a4a26'), ww);
  rr(c, x, y, w, h, 20); c.fillStyle = rgba(shade(wood, -0.2)); c.fill(); ol(c, 5);
  const gx = x + 36, gy = y + 70, gw = w - 72, gh = h * 0.48;
  c.save(); rr(c, gx, gy, gw, gh, 60); c.clip();
  c.fillStyle = lg(c, 0, gy, 0, gy + gh, [[0, rgba(mix(hex('#2b6f86'), hex('#a8743a'), ww))], [1, rgba(mix(hex('#164a5e'), hex('#6a4420'), ww))]]); c.fillRect(gx, gy, gw, gh);
  glow(c, gx + gw * 0.7, gy + 40, gw * 0.7, mix(hex('#d8f4ff'), hex('#ffd59a'), ww), 0.3);
  if (inside) inside(c, gx, gy, gw, gh);
  c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(200,240,255,0.10)'; c.beginPath(); c.moveTo(gx + gw * 0.15, gy); c.lineTo(gx + gw * 0.32, gy); c.lineTo(gx + gw * 0.12, gy + gh); c.lineTo(gx - gw * 0.05, gy + gh); c.closePath(); c.fill(); c.restore();
  c.restore();
  rr(c, gx, gy, gw, gh, 60); c.lineWidth = 14; c.strokeStyle = rgba(shade(wood, 0.15)); c.stroke(); ol(c, 4);
  // counter
  rr(c, x - 16, gy + gh - 6, w + 32, 30, 10); c.fillStyle = rgba(shade(wood, 0.25)); c.fill(); ol(c, 4);
  rr(c, x + 20, gy + gh + 50, w - 40, h - gh - 140, 14); c.fillStyle = rgba(shade(wood, -0.05)); c.fill(); ol(c, 3, 0.5);
  rr(c, x + w * 0.22, y + 16, w * 0.56, 40, 10); c.fillStyle = rgba(shade(wood, -0.4)); c.fill(); ol(c, 3);
}
function bench(c, x, y, w, ww = 0) {
  const wood = mix(hex('#3d5a66'), hex('#8a5a32'), ww);
  c.fillStyle = INK; for (const lx of [x + 30, x + w - 50]) { c.fillRect(lx, y, 18, 120); }
  rr(c, x, y - 14, w, 30, 10); c.fillStyle = rgba(shade(wood, 0.15)); c.fill(); ol(c, 4);
  rr(c, x, y - 150, w, 26, 10); c.fillStyle = rgba(wood); c.fill(); ol(c, 4); rr(c, x, y - 96, w, 26, 10); c.fill(); ol(c, 4);
}
function suitcase(c, x, y, s = 1, ww = 0) {
  const col = mix(hex('#8a3b3b'), hex('#a04a32'), ww);
  rr(c, x, y - 200 * s, 140 * s, 200 * s, 18 * s); c.fillStyle = rgba(col); c.fill(); ol(c, 4);
  c.fillStyle = rgba(shade(col, -0.25)); for (let i = 1; i < 3; i++) c.fillRect(x + i * 46 * s, y - 196 * s, 8 * s, 192 * s);
  rr(c, x + 44 * s, y - 240 * s, 52 * s, 44 * s, 10 * s); c.lineWidth = 8 * s; c.strokeStyle = INK; c.stroke();
}
function pocketWatch(c, x, y, r, open, t, I = 1) {
  glow(c, x, y, r * 5 * (0.6 + open * 0.6), AMBER, 0.6 * I * (0.35 + open * 0.65));
  c.save(); c.translate(x, y);
  c.fillStyle = '#e8b24a'; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); ol(c, Math.max(2, r * 0.12));
  c.fillStyle = '#c88a2a'; c.beginPath(); c.arc(0, -r * 1.12, r * 0.2, 0, 6.283); c.fill(); ol(c, Math.max(2, r * 0.08));
  if (open > 0.05) {
    c.fillStyle = '#fff4d8'; c.beginPath(); c.arc(0, 0, r * 0.78, 0, 6.283); c.fill();
    c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = r * 0.1; const a = t * 6.283 / 60 * 8; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a) * r * 0.6, -Math.cos(a) * r * 0.6); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(1.2) * r * 0.38, -Math.cos(1.2) * r * 0.38); c.stroke();
    c.fillStyle = '#f2c45c'; c.beginPath(); c.ellipse(0, -r - r * open * 0.85, r, r * open * 0.85, 0, Math.PI, 0); c.fill(); ol(c, Math.max(2, r * 0.1));
  }
  c.restore();
}
// ===================== HALLWAY (flat elevation, wide) =====================
// world x: 0..2000. Floor line y=1520.
function hallway(c, t, o = {}) {
  const old = o.old || 0, lamp = o.lamp ?? 1, kit = o.kitchen ?? 1, door = o.door ?? 0; // door 0=open, 1=closed
  const wall = mix(hex('#e8b57a'), hex('#cfae88'), old), wall2 = shade(wall, -0.12), floorY = 1520;
  c.fillStyle = lg(c, 0, 0, 0, floorY, [[0, rgba(shade(wall, -0.25))], [0.45, rgba(wall)], [1, rgba(shade(wall, -0.08))]]); c.fillRect(-400, -400, 2800, floorY + 400);
  // wallpaper motif
  const R = rng(12); c.fillStyle = rgba(wall2, 0.75);
  for (let y = 40; y < floorY - 120; y += 110) for (let x = -360 + ((y / 110) % 2) * 60; x < 2400; x += 120) { c.beginPath(); c.ellipse(x, y, 9, 15, 0, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(x + 13, y + 6, 7, 5, 0.6, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(x - 13, y + 6, 7, 5, -0.6, 0, 6.283); c.fill(); }
  // ceiling shadow & floor
  c.fillStyle = lg(c, 0, -400, 0, 200, [[0, 'rgba(60,30,15,0.7)'], [1, 'rgba(60,30,15,0)']]); c.fillRect(-400, -400, 2800, 600);
  c.fillStyle = lg(c, 0, floorY, 0, VH + 200, [[0, rgba(mix(hex('#9a5a32'), hex('#8a6040'), old))], [1, rgba(mix(hex('#5a2e18'), hex('#4a3020'), old))]]); c.fillRect(-400, floorY, 2800, 800);
  c.strokeStyle = 'rgba(60,30,15,0.35)'; c.lineWidth = 3; for (let x = -400; x < 2400; x += 70) { c.beginPath(); c.moveTo(x, floorY); c.lineTo(x - 140, VH + 200); c.stroke(); }
  c.fillStyle = rgba(mix(hex('#6a3a20'), hex('#5a4030'), old)); c.fillRect(-400, floorY - 26, 2800, 30); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(-400, floorY - 26); c.lineTo(2400, floorY - 26); c.stroke();
  // front door (left) x 40..300
  frameDoor(c, 40, 640, 260, floorY - 640, hex('#8a5232'), 0, '#2a1810');
  c.fillStyle = '#d8b25a'; c.beginPath(); c.arc(270, 1090, 14, 0, 6.283); c.fill(); ol(c, 3);
  // hooks + jackets
  c.fillStyle = '#5a3420'; rr(c, 360, 760, 330, 30, 10); c.fill(); ol(c, 3);
  for (const [x, col] of [[400, '#46607a'], [500, '#8a4a36'], [610, '#4a6a48']]) { c.beginPath(); c.moveTo(x, 780); c.quadraticCurveTo(x + 60, 860, x + 50, 1080); c.lineTo(x - 50, 1090); c.quadraticCurveTo(x - 60, 860, x, 780); c.closePath(); c.fillStyle = col; c.fill(); ol(c, 4); }
  // shoe rack
  rr(c, 360, 1350, 330, 150, 12); c.fillStyle = '#7a4a2a'; c.fill(); ol(c, 4); c.fillStyle = '#5a3420'; c.fillRect(372, 1420, 306, 8);
  for (const [x, col] of [[400, '#2a2a30'], [480, '#c85a4a'], [570, '#efe9df'], [640, '#3a3030']]) { rr(c, x - 30, 1320, 64, 30, 12); c.fillStyle = col; c.fill(); ol(c, 3); }
  // ceiling lamp x 820
  lampShade(c, 820, 300, lamp, old);
  // kitchen doorway x 960..1220 (bright)
  c.save(); rr(c, 960, 640, 260, floorY - 640, 6); c.clip();
  c.fillStyle = lg(c, 0, 640, 0, floorY, [[0, rgba(mix(hex('#ffe2a8'), hex('#e0c8a0'), old), 1)], [1, rgba(mix(hex('#f0b870'), hex('#c8a880'), old))]]); c.fillRect(960, 640, 260, floorY - 640);
  c.globalAlpha = 0.25 + 0.75 * kit;
  // stove + pot inside
  rr(c, 1010, 1180, 170, 340, 10); c.fillStyle = '#f2ede2'; c.fill(); ol(c, 4); c.fillStyle = '#2a2a2a'; c.fillRect(1030, 1200, 130, 12);
  rr(c, 1040, 1110, 110, 80, 14); c.fillStyle = '#c8433a'; c.fill(); ol(c, 4); c.fillStyle = INK; c.fillRect(1032, 1104, 126, 12);
  if (o.steam) for (let i = 0; i < 6; i++) { const ph = (t * 0.35 + i / 6) % 1; c.fillStyle = `rgba(255,250,240,${0.5 * (1 - ph) * o.steam})`; c.beginPath(); c.arc(1095 + Math.sin(t * 2 + i) * 20, 1090 - ph * 300, 18 + ph * 40, 0, 6.283); c.fill(); }
  c.restore(); c.globalAlpha = 1;
  frameOnly(c, 960, 640, 260, floorY - 640, hex('#efe2c8'));
  glow(c, 1090, 1000, 420, hex('#ffcf8a'), 0.35 * kit);
  // light switch
  rr(c, 1262, 980, 34, 54, 6); c.fillStyle = '#f4efe4'; c.fill(); ol(c, 3);
  c.fillStyle = INK; c.fillRect(1274, o.switchOff ? 1010 : 992, 10, 14);
  // Dima's room door x 1360..1620
  c.save(); rr(c, 1360, 640, 260, floorY - 640, 4); c.clip(); c.fillStyle = '#2a1a12'; c.fillRect(1360, 640, 260, 900);
  glow(c, 1560, 1100, 260, hex('#ffcf8a'), 0.45 * (1 - door)); c.restore();
  // door leaf: closes by swinging (width shrinks from 40 -> 260)
  const lw = lerp(46, 260, door);
  rr(c, 1360, 640, lw, floorY - 640, 4); c.fillStyle = lg(c, 1360, 0, 1360 + lw, 0, [[0, rgba(hex('#f3e8d2'))], [1, rgba(shade(hex('#e6d6b8'), -0.15 * (1 - door)))]]); c.fill(); ol(c, 4);
  if (door > 0.6) { rr(c, 1360 + 40 * door, 700, lw - 80 * door, 340, 8); ol(c, 3, 0.4); rr(c, 1360 + 40 * door, 1100, lw - 80 * door, 340, 8); ol(c, 3, 0.4); c.fillStyle = '#d8b25a'; c.beginPath(); c.arc(1360 + lw - 34, 1090, 13, 0, 6.283); c.fill(); ol(c, 3); }
  frameOnly(c, 1360, 640, 260, floorY - 640, hex('#efe2c8'));
  // living room doorway x 1720..1980 (dim)
  rr(c, 1720, 640, 260, floorY - 640, 4); c.fillStyle = '#3a2416'; c.fill(); glow(c, 1880, 1050, 220, hex('#ffb870'), 0.3);
  frameOnly(c, 1720, 640, 260, floorY - 640, hex('#efe2c8'));
  // lamp warm falloff
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = rg(c, 820, 500, 100, 1500, [[0, 'rgba(255,255,255,1)'], [1, rgba(mix(hex('#8a5a48'), hex('#6a5a58'), old))]]); c.fillRect(-400, -400, 2800, 2600); c.restore();
}
function lampShade(c, x, y, I, old = 0) {
  c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x, -200); c.lineTo(x, y); c.stroke();
  glow(c, x, y + 70, 520, hex('#ffd59a'), 0.55 * I);
  c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x + 50, y); c.lineTo(x + 120, y + 110); c.quadraticCurveTo(x, y + 130, x - 120, y + 110); c.closePath(); c.fillStyle = rgba(mix(hex('#f0a24a'), hex('#e0a868'), old)); c.fill(); ol(c, 4);
  c.save(); c.clip(); c.fillStyle = `rgba(255,240,200,${0.5 * I})`; c.fillRect(x - 40, y, 80, 140); c.restore();
  glow(c, x, y + 120, 140, hex('#fff1c8'), 0.8 * I);
  cone(c, x, y + 115, 0, 0.55, 1150, hex('#ffd08a'), 0.12 * I, 110);
}
function frameOnly(c, x, y, w, h, col) { c.lineWidth = 22; c.strokeStyle = rgba(col); c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.stroke(); c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 11, y + h); c.lineTo(x - 11, y - 11); c.lineTo(x + w + 11, y - 11); c.lineTo(x + w + 11, y + h); c.stroke(); }
function frameDoor(c, x, y, w, h, col, open, dark) { rr(c, x, y, w, h, 4); c.fillStyle = rgba(col); c.fill(); ol(c, 4); rr(c, x + 30, y + 60, w - 60, h * 0.38, 8); ol(c, 3, 0.4); rr(c, x + 30, y + h * 0.5, w - 60, h * 0.42, 8); ol(c, 3, 0.4); frameOnly(c, x, y, w, h, hex('#efe2c8')); }

// ===================== LIVING ROOM =====================
function livingRoom(c, t) {
  c.fillStyle = lg(c, 0, 0, 0, 1500, [[0, '#6a3e26'], [1, '#4a2a18']]); c.fillRect(-300, -300, VW + 600, 1800);
  c.fillStyle = 'rgba(40,20,10,0.25)'; for (let x = -300; x < VW + 300; x += 60) c.fillRect(x, -300, 22, 1800);
  // carpet on the wall
  c.save(); c.translate(560, 560); rr(c, -340, -230, 680, 460, 20); c.fillStyle = '#8a2a22'; c.fill(); ol(c, 5); c.strokeStyle = '#e0a050'; c.lineWidth = 8; c.strokeRect(-300, -195, 600, 390);
  for (let i = 0; i < 4; i++) { c.strokeStyle = ['#e0a050', '#5a1a14', '#d07040', '#f0c070'][i]; c.lineWidth = 7; c.beginPath(); c.moveTo(0, -160 + i * 32); c.lineTo(250 - i * 55, 0); c.lineTo(0, 160 - i * 32); c.lineTo(-250 + i * 55, 0); c.closePath(); c.stroke(); }
  c.restore();
  // floor lamp
  glow(c, 120, 700, 420, hex('#ffb870'), 0.55); c.beginPath(); c.moveTo(60, 640); c.lineTo(180, 640); c.lineTo(210, 760); c.lineTo(30, 760); c.closePath(); c.fillStyle = '#e8a050'; c.fill(); ol(c, 4); c.fillStyle = INK; c.fillRect(114, 760, 12, 620);
  // sofa
  rr(c, 170, 900, 860, 300, 50); c.fillStyle = '#7a4a3a'; c.fill(); ol(c, 5);
  rr(c, 200, 1110, 800, 190, 36); c.fillStyle = '#8a5a46'; c.fill(); ol(c, 5);
  for (const x of [120, 960]) { rr(c, x, 1020, 130, 300, 46); c.fillStyle = '#6a3e30'; c.fill(); ol(c, 5); }
  c.fillStyle = '#3a2216'; c.fillRect(-300, 1360, VW + 600, 800);
}
function tvSet(c, x, y, w, h, reflect) {
  rr(c, x - 34, y - 34, w + 68, h + 110, 30); c.fillStyle = '#5a4030'; c.fill(); ol(c, 5);
  rr(c, x, y, w, h, 50); c.fillStyle = '#0d0f10'; c.fill(); ol(c, 4);
  c.save(); rr(c, x, y, w, h, 50); c.clip(); if (reflect) { c.globalAlpha = 0.38; reflect(c); c.globalAlpha = 1; }
  c.fillStyle = 'rgba(255,240,220,0.08)'; c.beginPath(); c.moveTo(x + w * 0.1, y); c.lineTo(x + w * 0.35, y); c.lineTo(x + w * 0.15, y + h); c.lineTo(x - w * 0.1, y + h); c.closePath(); c.fill(); c.restore();
  for (const kx of [x + w + 4]) { c.fillStyle = '#2a2018'; c.beginPath(); c.arc(kx, y + 60, 12, 0, 6.283); c.fill(); }
}
// ===================== DOOR CLOSE-UP =====================
function doorCU(c, t, o = {}) {
  c.fillStyle = lg(c, 0, 0, VW, 0, [[0, '#b0703e'], [1, '#7a4426']]); c.fillRect(-300, -300, VW + 600, VH + 600);
  const R = rng(7); c.fillStyle = 'rgba(120,60,30,0.35)'; for (let y = 0; y < VH; y += 150) for (let x = -100 + ((y / 150) % 2) * 80; x < 700; x += 160) { c.beginPath(); c.ellipse(x, y, 14, 24, 0, 0, 6.283); c.fill(); }
  const dx = 600; rr(c, dx, -200, 700, VH + 400, 0); c.fillStyle = lg(c, dx, 0, dx + 600, 0, [[0, '#f6ead2'], [1, '#c8b08c']]); c.fill(); ol(c, 6);
  rr(c, dx + 80, 120, 360, 700, 14); ol(c, 4, 0.35); rr(c, dx + 80, 900, 360, 800, 14); ol(c, 4, 0.35);
  c.fillStyle = '#efe2c8'; c.fillRect(dx - 40, -200, 40, VH + 400); c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(dx - 40, -200, 40, VH + 400);
  glow(c, 120, 80, 760, hex('#ffd59a'), 0.6);
}
// ===================== STREET (side view, wide) =====================
// world x -400..2600; sidewalk top y=1400; road below
function street(c, t, o = {}) {
  const warm = o.warm ?? 1;
  c.fillStyle = lg(c, 0, -300, 0, 1400, [[0, rgba(mix(hex('#0c1a2e'), hex('#1e1a2c'), warm * 0.5))], [1, rgba(mix(hex('#2a3a5a'), hex('#5a3a34'), warm))]]); c.fillRect(-800, -400, 4200, 1900);
  // far panel blocks
  const R = rng(3);
  for (let i = 0; i < 16; i++) { const x = -700 + i * 230, w = 210, h = 600 + (i % 3) * 140, top = 1180 - h; c.fillStyle = rgba(mix(hex('#18243a'), hex('#2a2230'), warm * 0.6)); c.fillRect(x, top, w, h); for (let r = 0; r < h / 70 - 1; r++) for (let k = 0; k < 5; k++) { if (R() > 0.32) continue; c.fillStyle = rgba(R() < 0.8 ? mix(hex('#bfe0ff'), hex('#ffc070'), warm) : hex('#bfe0ff'), 0.85); c.fillRect(x + 14 + k * 40, top + 20 + r * 70, 24, 32); } }
  c.fillStyle = lg(c, 0, 900, 0, 1200, [[0, 'rgba(255,190,130,0)'], [1, rgba(mix(hex('#6a8aa8'), hex('#c07a50'), warm), 0.45)]]); c.fillRect(-800, 900, 4200, 300);
  // entrance building (near) x 1500..2300
  if (o.entrance) entranceBlock(c, t, 1500, o.winLit || 0, warm);
  // road
  c.fillStyle = lg(c, 0, 1180, 0, 1400, [[0, '#2a2a32'], [1, '#18181e']]); c.fillRect(-800, 1180, 4200, 220);
  c.fillStyle = 'rgba(230,230,220,0.35)'; for (let x = -800; x < 3400; x += 160) c.fillRect(x, 1290, 80, 8);
  // curb & sidewalk
  c.fillStyle = '#4a4a52'; c.fillRect(-800, 1400, 4200, 22); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(-800, 1400); c.lineTo(3400, 1400); c.stroke();
  c.fillStyle = lg(c, 0, 1420, 0, VH, [[0, '#3a3a42'], [1, '#1c1c22']]); c.fillRect(-800, 1422, 4200, 600);
  c.strokeStyle = 'rgba(15,15,20,0.4)'; c.lineWidth = 3; for (let x = -800; x < 3400; x += 120) { c.beginPath(); c.moveTo(x, 1422); c.lineTo(x - 60, VH); c.stroke(); }
  // puddle reflections
  c.save(); c.globalCompositeOperation = 'lighter'; c.filter = C.fb(c, 8); for (const x of o.lamps || []) { c.fillStyle = lg(c, 0, 1430, 0, 1800, [[0, rgba(mix(hex('#d8f0ff'), hex('#ffb35a'), warm), 0.35)], [1, 'rgba(0,0,0,0)']]); c.fillRect(x + 40, 1430, 70, 380); } c.restore();
}
function streetLamp(c, t, x, warm = 1) {
  const col = mix(hex('#d8f0ff'), hex('#ffb35a'), warm);
  c.strokeStyle = INK; c.lineWidth = 16; c.beginPath(); c.moveTo(x, 1410); c.lineTo(x, 640); c.quadraticCurveTo(x, 590, x + 80, 590); c.stroke();
  c.strokeStyle = '#2a2a32'; c.lineWidth = 9; c.beginPath(); c.moveTo(x, 1410); c.lineTo(x, 640); c.quadraticCurveTo(x, 590, x + 80, 590); c.stroke();
  c.beginPath(); c.ellipse(x + 90, 596, 46, 16, 0, 0, 6.283); c.fillStyle = '#2a2a32'; c.fill(); ol(c, 4);
  glow(c, x + 90, 610, 260, col, 0.8); cone(c, x + 90, 606, 0, 0.42, 820, col, 0.17, 40);
  c.save(); c.beginPath(); c.moveTo(x + 90, 606); c.lineTo(x + 440, 1420); c.lineTo(x - 260, 1420); c.closePath(); c.clip(); rain(c, t, x | 0, 70, [x - 260, 600, 700, 820], col, 0.55, 46, 2.4, 0.05, 1400); c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rg(c, x + 90, 1420, 0, 300, [[0, rgba(col, 0.32)], [1, 'rgba(0,0,0,0)']]); c.beginPath(); c.ellipse(x + 90, 1430, 300, 60, 0, 0, 6.283); c.fill(); c.restore();
}
function busStop(c, x, warm = 1) {
  c.fillStyle = rgba(mix(hex('#9ab8cc'), hex('#d8a878'), warm), 0.2); rr(c, x - 250, 1000, 500, 400, 4); c.fill(); ol(c, 5);
  c.fillStyle = INK; c.fillRect(x - 262, 990, 16, 420); c.fillRect(x + 246, 990, 16, 420);
  rr(c, x - 290, 960, 580, 46, 12); c.fillStyle = '#2e3440'; c.fill(); ol(c, 4);
  rr(c, x - 180, 1240, 360, 22, 8); c.fillStyle = '#6a4a32'; c.fill(); ol(c, 3);
  glow(c, x, 1010, 220, mix(hex('#d8f0ff'), hex('#ffd59a'), warm), 0.45);
  // stop sign (blank pictogram)
  c.fillStyle = INK; c.fillRect(x + 300, 900, 10, 510); c.beginPath(); c.arc(x + 305, 900, 44, 0, 6.283); c.fillStyle = '#f0f0e8'; c.fill(); ol(c, 4); rr(c, x + 280, 884, 50, 30, 6); c.fillStyle = '#3a6ab0'; c.fill();
}
function bus(c, x, door, warm = 1) {
  const body = mix(hex('#e8dcb8'), hex('#f0c880'), warm * 0.5), y = 1000;
  rr(c, x - 520, y, 1040, 360, 50); c.fillStyle = lg(c, 0, y, 0, y + 360, [[0, rgba(shade(body, 0.08))], [1, rgba(shade(body, -0.3))]]); c.fill(); ol(c, 5);
  c.fillStyle = '#c8433a'; c.fillRect(x - 520, y + 250, 1040, 26);
  for (let i = 0; i < 5; i++) { if (i === 2) continue; rr(c, x - 480 + i * 200, y + 50, 160, 140, 18); c.fillStyle = rgba(mix(hex('#9fd0e0'), hex('#ffd59a'), warm), 0.85); c.fill(); ol(c, 4); }
  // door in the middle
  const dw = 150, dx = x - 75; rr(c, dx, y + 40, dw, 300, 10); c.fillStyle = rgba(mix(hex('#cfefff'), hex('#ffe6b8'), warm)); c.fill();
  const half = dw / 2 * (1 - door); c.fillStyle = rgba(shade(body, -0.1)); c.fillRect(dx, y + 40, half, 300); c.fillRect(dx + dw - half, y + 40, half, 300); rr(c, dx, y + 40, dw, 300, 10); ol(c, 4);
  for (const wx of [x - 330, x + 330]) { c.fillStyle = INK; c.beginPath(); c.arc(wx, y + 360, 62, 0, 6.283); c.fill(); c.fillStyle = '#6a6a72'; c.beginPath(); c.arc(wx, y + 360, 26, 0, 6.283); c.fill(); }
  glow(c, x + 520, y + 260, 170, hex('#fff1d0'), 0.8); glow(c, x, y + 120, 520, mix(hex('#bfe6ff'), hex('#ffcf8a'), warm), 0.18);
}
function entranceBlock(c, t, x, winLit, warm) {
  c.fillStyle = '#262632'; c.fillRect(x, 120, 900, 1290); c.strokeStyle = 'rgba(80,80,100,0.6)'; c.lineWidth = 3; for (let y = 300; y < 1400; y += 220) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 900, y); c.stroke(); }
  const R = rng(9);
  for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) { const wx = x + 80 + k * 210, wy = 170 + r * 220, target = r === 2 && k === 1; const lit = target ? winLit : (R() < 0.3 ? 1 : 0); rr(c, wx, wy, 120, 150, 6); c.fillStyle = lit ? rgba(hex('#ffc874'), target ? 0.25 + 0.75 * winLit : 0.85) : '#14141c'; c.fill(); ol(c, 3); if (target && winLit > 0) glow(c, wx + 60, wy + 75, 260, hex('#ffc070'), 0.6 * winLit); }
  // door + canopy
  rr(c, x + 360, 1130, 180, 280, 6); c.fillStyle = '#4a3020'; c.fill(); ol(c, 4); rr(c, x + 330, 1100, 240, 30, 6); c.fillStyle = '#3a3a46'; c.fill(); ol(c, 3); glow(c, x + 450, 1140, 160, hex('#ffd08a'), 0.7);
}
// ===================== OFFICE / PHONE =====================
function office(c, t) {
  c.fillStyle = lg(c, 0, 0, 0, VH, [[0, '#0a2236'], [1, '#04101a']]); c.fillRect(-300, -300, VW + 600, VH + 600);
  const R = rng(31);
  for (let i = 0; i < 18; i++) { const x = -250 + i * 90, w = 70 + R() * 50, h = 400 + R() * 800; c.fillStyle = `rgb(${14 + R() * 10},${40 + R() * 20},${66 + R() * 20})`; c.fillRect(x, 1250 - h, w, h); for (let k = 0; k < h / 34; k++) for (let j = 0; j < w / 22; j++) if (R() < 0.28) { c.fillStyle = 'rgba(160,225,255,0.8)'; c.fillRect(x + 6 + j * 22, 1250 - h + 10 + k * 34, 10, 14); } }
  c.fillStyle = '#03080d'; for (let x = -300; x < VW + 300; x += 380) c.fillRect(x, -300, 26, 2400);
  c.fillStyle = lg(c, 0, 1250, 0, VH, [[0, '#0e2432'], [1, '#03080c']]); c.fillRect(-300, 1250, VW + 600, 900);
}
function laptop(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(-170, 0); c.lineTo(170, 0); c.lineTo(150, -240); c.lineTo(-150, -240); c.closePath(); c.fillStyle = '#2a3440'; c.fill(); ol(c, 5);
  c.beginPath(); c.moveTo(-152, -14); c.lineTo(152, -14); c.lineTo(136, -226); c.lineTo(-136, -226); c.closePath(); c.fillStyle = '#9ad8ff'; c.fill();
  c.fillStyle = '#2a6a90'; for (let i = 0; i < 6; i++) c.fillRect(-110, -200 + i * 30, 100 + (i * 41) % 110, 12);
  rr(c, -210, 0, 420, 20, 8); c.fillStyle = '#3a4450'; c.fill(); ol(c, 4); c.restore();
  glow(c, x, y - 120 * s, 460 * s, hex('#9ad8ff'), 0.4);
}
module.exports = { AMBER, ICE, ol, rr, stWall, stClock, stBoard, stLamp, stFloor, stBooth, bench, suitcase, pocketWatch, hallway, lampShade, livingRoom, tvSet, doorCU, street, streetLamp, busStop, bus, entranceBlock, office, laptop };
