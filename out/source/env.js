// Environments: station (layered 2.5D), hallway & street (true 3D pinhole projection), office, phone UI
const C = require('./core');
const { hex, rgba, mix, shade, lg, rg, spline, clamp, lerp, glow, cone, dust, rain, glassDrops, rng, VW, VH } = C;
const COLD = { key: hex('#d6ecff'), kx: -1, amb: hex('#1d2d55'), rim: hex('#8fdcff'), rimX: 1, rimI: 0.8, ki: 0.9 };
const WARM = { key: hex('#ffd49a'), kx: -1, amb: hex('#5e3328'), rim: hex('#ffc27a'), rimX: 1, rimI: 0.85, ki: 1 };
const AMBER = hex('#ffb454'), ICE = hex('#7fd3ff');

// ================= STATION =================
function stationWall(ctx, t, o = {}) {
  const warm = o.warm || 0, dim = o.dim || 0;
  const top = mix(hex('#0d2a3a'), hex('#3a2616'), warm), bot = mix(hex('#06141d'), hex('#1e130b'), warm);
  ctx.fillStyle = lg(ctx, 0, -400, 0, 2300, [[0, rgba(shade(top, -dim * 0.5))], [1, rgba(shade(bot, -dim * 0.5))]]); ctx.fillRect(-800, -800, VW + 1600, VH + 1600);
  // wall panels / pilasters
  ctx.fillStyle = rgba(shade(mix(hex('#0a2230'), hex('#2c1c10'), warm), -dim * 0.4), 1);
  for (const x of [-420, 30, 350, 730, 1050, 1500]) ctx.fillRect(x - 26, -600, 52, 2100);
  // tall arched windows
  for (const [cx, topY, w] of [[-240, 260, 300], [190, 300, 260], [890, 300, 260], [1320, 260, 300]]) windowArch(ctx, t, cx, topY, w, 1320, o);
  // central tall window behind clock
  windowArch(ctx, t, 540, 650, 240, 1320, o);
  // cornice
  ctx.fillStyle = rgba(mix(hex('#123446'), hex('#4a3018'), warm), 1); ctx.fillRect(-800, 160, VW + 1600, 30);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-800, 190, VW + 1600, 18);
}
function windowArch(ctx, t, cx, topY, w, botY, o) {
  const warm = o.warm || 0;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(cx - w / 2, botY); ctx.lineTo(cx - w / 2, topY + w / 2); ctx.arc(cx, topY + w / 2, w / 2, Math.PI, 0); ctx.lineTo(cx + w / 2, botY); ctx.closePath();
  ctx.save(); ctx.clip();
  // night outside
  ctx.fillStyle = lg(ctx, 0, topY, 0, botY, [[0, rgba(mix(hex('#0f3550'), hex('#5a3a1e'), warm))], [0.7, rgba(mix(hex('#123d52'), hex('#6a4420'), warm))], [1, rgba(mix(hex('#1b4a5a'), hex('#8a5a28'), warm))]]); ctx.fillRect(cx - w, topY, 2 * w, botY - topY);
  // city bokeh
  const R = rng(cx | 0);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) { const x = cx - w / 2 + R() * w, y = topY + w * 0.6 + R() * (botY - topY - w * 0.6), r = 6 + R() * 18; const col = R() < 0.7 ? mix(hex('#6fc7ff'), AMBER, warm) : mix(hex('#bfe9ff'), hex('#ffd9a0'), warm); ctx.fillStyle = rg(ctx, x, y, 0, r, [[0, rgba(col, 0.35)], [0.6, rgba(col, 0.15)], [1, rgba(col, 0)]]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
  // incoming train headlight (final)
  if (o.train) { const k = o.train; const x = cx - w * 0.8 + k * w * 1.4; glow(ctx, x, botY - 120, 140 * (0.5 + k), hex('#fff1d0'), 0.7 * Math.min(1, k * 3)); }
  ctx.globalCompositeOperation = 'source-over';
  rain(ctx, t, cx | 0, 40, [cx - w / 2, topY, w, botY - topY], mix(hex('#a8dcff'), hex('#ffe2b0'), warm), 0.18, 70, 1.2, 0.08, 900);
  glassDrops(ctx, t, (cx | 0) + 5, 26, [cx - w / 2, topY, w, botY - topY], mix(hex('#bfe6ff'), hex('#ffe0b0'), warm), 0.55);
  ctx.restore();
  // frame + mullions
  ctx.strokeStyle = rgba(mix(hex('#081a24'), hex('#24160b'), warm), 1); ctx.lineWidth = 14; ctx.stroke();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx, botY); for (let y = topY + w / 2 + 160; y < botY; y += 200) { ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); } ctx.stroke();
  // inner rim highlight
  ctx.strokeStyle = rgba(mix(ICE, AMBER, warm), 0.12); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - w / 2 + 8, botY); ctx.lineTo(cx - w / 2 + 8, topY + w / 2); ctx.stroke();
  ctx.restore();
}
// big analog station clock
function stationClock(ctx, cx, cy, r, hh, mm, o = {}) {
  const warm = o.warm || 0, glowA = o.glowA ?? 1;
  ctx.save();
  glow(ctx, cx, cy, r * 1.6, mix(hex('#bfe6ff'), hex('#ffd59a'), warm), 0.18 * glowA);
  ctx.fillStyle = lg(ctx, cx - r, cy - r, cx + r, cy + r, [[0, '#6a5a3a'], [0.5, '#2e2416'], [1, '#7a6440']]); ctx.beginPath(); ctx.arc(cx, cy, r * 1.08, 0, 6.283); ctx.fill();
  ctx.fillStyle = rg(ctx, cx - r * 0.3, cy - r * 0.3, 0, r * 1.2, [[0, rgba(mix(hex('#e8f2f2'), hex('#fff0d6'), warm))], [1, rgba(mix(hex('#9fb6bd'), hex('#d8b98a'), warm))]]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fill();
  ctx.strokeStyle = '#1a1a1a'; ctx.lineCap = 'butt';
  for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, big = i % 5 === 0; ctx.lineWidth = big ? r * 0.05 : r * 0.015; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r * (big ? 0.78 : 0.86), cy - Math.cos(a) * r * (big ? 0.78 : 0.86)); ctx.lineTo(cx + Math.sin(a) * r * 0.93, cy - Math.cos(a) * r * 0.93); ctx.stroke(); }
  const ha = (hh % 12 + mm / 60) / 12 * 6.283, ma = mm / 60 * 6.283;
  // motion blur trails for spinning
  if (o.spin) { ctx.save(); ctx.globalAlpha = 0.25; for (let k = 1; k < 7; k++) { const a2 = ma + o.spin * k * 0.05; ctx.strokeStyle = 'rgba(20,20,20,0.5)'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a2) * r * 0.82, cy - Math.cos(a2) * r * 0.82); ctx.stroke(); } ctx.restore(); }
  ctx.strokeStyle = '#141414'; ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(ha) * r * 0.5, cy - Math.cos(ha) * r * 0.5); ctx.stroke();
  ctx.lineWidth = r * 0.045; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(ma) * r * 0.8, cy - Math.cos(ma) * r * 0.8); ctx.stroke();
  ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.06, 0, 6.283); ctx.fill();
  // glass sheen
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg(ctx, cx - r, cy - r, cx, cy, [[0, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fill();
  ctx.restore();
}
function departureBoard(ctx, t, x, y, w, h, o = {}) {
  const warm = o.warm || 0;
  ctx.save(); ctx.fillStyle = '#05090c'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#1b2a33'; ctx.lineWidth = 6; ctx.strokeRect(x, y, w, h);
  const R = rng(9); const rows = 4, cols = 18, cw = (w - 30) / cols, chh = (h - 30) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const on = R() < 0.62; const fl = Math.sin(t * 3 + r * 2 + c) > 0.94 || (r === 1 && Math.floor(t * 2) % 2 === 0);
    if (!on) continue;
    const col = mix(hex('#cfefff'), hex('#ffd9a0'), warm);
    ctx.fillStyle = rgba(col, fl ? 0.25 : 0.75); ctx.fillRect(x + 15 + c * cw + 3, y + 15 + r * chh + 4, cw - 6, chh - 10);
  }
  ctx.restore();
  glow(ctx, x + w / 2, y + h / 2, w * 0.6, mix(hex('#bfe6ff'), hex('#ffd59a'), warm), 0.08);
}
function pendantLamp(ctx, x, y, len, intensity, warm = 0) {
  const col = mix(hex('#dff2ff'), hex('#ffcf8a'), warm);
  ctx.save(); ctx.strokeStyle = '#05080a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, y); ctx.stroke();
  ctx.fillStyle = lg(ctx, x - 60, y, x + 60, y, [[0, '#0c1418'], [0.5, '#2a3a40'], [1, '#0a1014']]); ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.lineTo(x + 70, y + 60); ctx.lineTo(x - 70, y + 60); ctx.closePath(); ctx.fill();
  ctx.restore();
  glow(ctx, x, y + 62, 90, col, 0.9 * intensity);
  cone(ctx, x, y + 60, 0, 0.42, len, col, 0.22 * intensity, 60);
}
function stationFloor(ctx, t, y0, o = {}) {
  const warm = o.warm || 0, dim = o.dim || 0;
  ctx.fillStyle = lg(ctx, 0, y0, 0, VH + 300, [[0, rgba(shade(mix(hex('#0b2633'), hex('#3a2614'), warm), -dim * .4))], [1, rgba(mix(hex('#030a0e'), hex('#120a05'), warm))]]); ctx.fillRect(-800, y0, VW + 1600, VH + 900);
  // tiles perspective lines
  ctx.strokeStyle = rgba(mix(hex('#1f4a5a'), hex('#6a4420'), warm), 0.35); ctx.lineWidth = 2; ctx.beginPath();
  for (let i = -14; i <= 14; i++) { ctx.moveTo(540 + i * 60, y0); ctx.lineTo(540 + i * 260, VH + 400); }
  for (let k = 0; k < 10; k++) { const yy = y0 + Math.pow(k / 10, 1.8) * (VH + 400 - y0); ctx.moveTo(-800, yy); ctx.lineTo(VW + 800, yy); }
  ctx.stroke();
  // reflections of windows & lamps
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = C.fb(ctx, 10);
  for (const [x, w] of [[190, 200], [540, 180], [890, 200]]) { ctx.fillStyle = lg(ctx, 0, y0, 0, y0 + 600, [[0, rgba(mix(hex('#4aa8d8'), AMBER, warm), 0.28)], [1, rgba(mix(hex('#4aa8d8'), AMBER, warm), 0)]]); ctx.fillRect(x - w / 2, y0, w, 600); }
  ctx.restore();
}
function booth(ctx, t, x, y, w, h, o = {}) {
  // returns glass rect so the keeper can be drawn inside before glass sheen
  const warm = o.warm || 0;
  const wood = mix(hex('#13323d'), hex('#4a2c16'), warm);
  ctx.save();
  shadePanel(ctx, x, y, w, h, wood);
  // glass window
  const gx = x + 40, gy = y + 60, gw = w - 80, gh = h * 0.5;
  ctx.fillStyle = rgba(mix(hex('#0d2a36'), hex('#3a2412'), warm)); ctx.fillRect(gx, gy, gw, gh);
  // interior light
  ctx.fillStyle = rg(ctx, gx + gw * 0.5, gy + gh * 0.3, 10, gw * 0.8, [[0, rgba(mix(hex('#bfe6ff'), hex('#ffd59a'), warm), 0.35)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(gx, gy, gw, gh);
  ctx.restore();
  return { gx, gy, gw, gh };
}
function boothFront(ctx, t, x, y, w, h, g, o = {}) {
  const warm = o.warm || 0;
  const wood = mix(hex('#173a46'), hex('#5a341a'), warm);
  ctx.save();
  // counter + lower panel
  shadePanel(ctx, x, g.gy + g.gh, w, h - (g.gy + g.gh - y), wood);
  ctx.fillStyle = rgba(shade(wood, 0.2)); ctx.fillRect(x - 10, g.gy + g.gh - 6, w + 20, 18);
  // window frame
  ctx.strokeStyle = rgba(shade(wood, -0.3)); ctx.lineWidth = 16; ctx.strokeRect(g.gx, g.gy, g.gw, g.gh);
  // speaking arch cutout
  ctx.strokeStyle = rgba(shade(wood, -0.2)); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(g.gx + g.gw / 2, g.gy + g.gh, 70, Math.PI, 0); ctx.stroke();
  // glass reflections
  ctx.save(); ctx.beginPath(); ctx.rect(g.gx, g.gy, g.gw, g.gh); ctx.clip(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = lg(ctx, g.gx, g.gy, g.gx + g.gw, g.gy + g.gh, [[0, 'rgba(180,220,255,0.10)'], [0.35, 'rgba(180,220,255,0.02)'], [0.4, 'rgba(200,235,255,0.13)'], [0.48, 'rgba(180,220,255,0.0)'], [1, 'rgba(180,220,255,0.06)']]); ctx.fillRect(g.gx, g.gy, g.gw, g.gh);
  ctx.restore();
  // sign plate (blank, no text)
  ctx.fillStyle = rgba(shade(wood, -0.4)); ctx.fillRect(x + w * 0.25, y + 10, w * 0.5, 36); ctx.strokeStyle = 'rgba(200,170,90,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(x + w * 0.25, y + 10, w * 0.5, 36);
  ctx.restore();
}
function shadePanel(ctx, x, y, w, h, col) {
  ctx.fillStyle = lg(ctx, x, y, x + w, y, [[0, rgba(shade(col, 0.1))], [1, rgba(shade(col, -0.35))]]); ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = rgba(shade(col, -0.4), 0.8); ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.strokeRect(x + 14 + (i - 1) * (w - 28) / 3, y + h * 0.62, (w - 28) / 3 - 10, h * 0.3); }
}
function bench(ctx, x, y, w, warm = 0) {
  const wood = mix(hex('#2c3a3e'), hex('#6a4426'), warm);
  ctx.save(); ctx.fillStyle = '#05080a'; for (const lx of [x + 30, x + w - 50]) ctx.fillRect(lx, y, 20, 140);
  ctx.fillStyle = lg(ctx, 0, y - 10, 0, y + 30, [[0, rgba(shade(wood, 0.25))], [1, rgba(shade(wood, -0.4))]]); ctx.fillRect(x, y - 10, w, 34);
  ctx.fillStyle = rgba(shade(wood, -0.2)); ctx.fillRect(x, y - 150, w, 24); ctx.fillRect(x, y - 95, w, 24);
  ctx.restore();
}
function suitcase(ctx, x, y, s, L) {
  ctx.save(); ctx.fillStyle = lg(ctx, x, y, x + 130 * s, y, [[0, '#3a3f48'], [1, '#15181d']]); ctx.beginPath(); ctx.roundRect(x, y - 190 * s, 130 * s, 190 * s, 14 * s); ctx.fill();
  ctx.strokeStyle = '#0a0c0f'; ctx.lineWidth = 3 * s; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 32 * s, y - 185 * s); ctx.lineTo(x + i * 32 * s, y - 5 * s); ctx.stroke(); }
  ctx.fillStyle = '#0a0c0f'; ctx.fillRect(x + 50 * s, y - 230 * s, 8 * s, 42 * s); ctx.fillRect(x + 72 * s, y - 230 * s, 8 * s, 42 * s); ctx.fillRect(x + 46 * s, y - 236 * s, 38 * s, 10 * s);
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lg(ctx, x + 130 * s, y, x + 110 * s, y, [[0, rgba(L.rim, 0.5)], [1, rgba(L.rim, 0)]]); ctx.fillRect(x + 100 * s, y - 190 * s, 30 * s, 190 * s);
  ctx.restore();
}
// pocket watch (amber glowing)
function pocketWatch(ctx, x, y, r, open, t, glowI = 1) {
  ctx.save(); ctx.translate(x, y);
  glow(ctx, 0, 0, r * 5 * (0.6 + open * 0.6), AMBER, 0.55 * glowI * (0.4 + open * 0.6));
  ctx.fillStyle = lg(ctx, -r, -r, r, r, [[0, '#f0c66a'], [0.5, '#9a6a22'], [1, '#e8b85a']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
  if (open > 0.05) {
    ctx.fillStyle = rg(ctx, 0, 0, 0, r * 0.85, [[0, '#fff3d6'], [1, '#f2c47a']]); ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = r * 0.06; ctx.lineCap = 'round';
    const a = t * 6.283 / 60 * 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * r * 0.65, -Math.cos(a) * r * 0.65); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a / 12 + 1) * r * 0.4, -Math.cos(a / 12 + 1) * r * 0.4); ctx.stroke();
    // lid
    ctx.save(); ctx.scale(1, Math.cos(open * Math.PI * 0.9)); ctx.translate(0, -r * 2 * Math.sign(Math.cos(open * Math.PI * 0.9) || 1) * 0); ctx.restore();
    ctx.fillStyle = 'rgba(232,184,90,0.9)'; ctx.beginPath(); ctx.ellipse(0, -r - r * open * 0.9, r, r * open * 0.9, 0, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
}

// ================= 3D projection helper =================
function cam3(o) { // o:{x,y,z,f,vpx,vpy,eye}
  const f = o.f || 1000, vpx = o.vpx ?? 540, vpy = o.vpy ?? 820, eye = o.eye ?? 1.55;
  return { f, vpx, vpy, eye, cx: o.x || 0, cy: o.y || 0, cz: o.z || 0, pan: o.pan || 0,
    p(X, Y, Z) { const z = Math.max(0.05, Z - this.cz); return [this.vpx + (X - this.cx) * this.f / z + this.pan, this.vpy + (this.eye + this.cy - Y) * this.f / z]; },
    s(Z) { return this.f / Math.max(0.05, Z - this.cz); } };
}
function quad(ctx, pts) { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); }

// ================= HALLWAY (panel flat, early autumn night) =================
// corridor: X in [-0.65,0.65], floor Y=0, ceiling 2.55, back wall Z=6.2
const HW = { xl: -0.65, xr: 0.65, ceil: 2.55, back: 6.2 };
function hallway(ctx, cm, t, o = {}) {
  const old = o.old || 0, lampI = o.lamp ?? 1, kitchen = o.kitchen ?? 1, roomDoor = o.roomDoor ?? 0; // 0 open..1 closed
  const { xl, xr, ceil, back } = HW, zn = Math.max(cm.cz + 0.1, 0.2);
  const P = (X, Y, Z) => cm.p(X, Y, Z);
  const wallCol = mix(hex('#c79a62'), hex('#a8906e'), old), floorCol = mix(hex('#7a4a2a'), hex('#6a4a34'), old);
  // back wall
  quad(ctx, [P(xl, 0, back), P(xr, 0, back), P(xr, ceil, back), P(xl, ceil, back)]); ctx.fillStyle = rgba(shade(wallCol, -0.25)); ctx.fill();
  // room door on back wall (Dima's room)
  const dx0 = -0.38, dx1 = 0.38, dh = 2.05;
  quad(ctx, [P(dx0, 0, back), P(dx1, 0, back), P(dx1, dh, back), P(dx0, dh, back)]); ctx.fillStyle = '#1a0f08'; ctx.fill();
  if (roomDoor < 1) { // room interior glimpse: desk lamp glow
    const c = P(0.1, 0.9, back + 1.5); glow(ctx, c[0], c[1], cm.s(back) * 0.6, hex('#ffcf8a'), 0.5 * (1 - roomDoor));
  }
  // door leaf (rotating shut)
  const ang = (1 - roomDoor) * 1.5; // radians open
  const hx = dx0, lx = hx + Math.cos(ang) * (dx1 - dx0), lz = back - Math.sin(ang) * (dx1 - dx0);
  quad(ctx, [P(hx, 0, back), P(lx, 0, lz), P(lx, dh, lz), P(hx, dh, back)]);
  const dcol = mix(hex('#e9dcc4'), hex('#cfc2aa'), old);
  ctx.fillStyle = lg(ctx, P(hx, 1, back)[0], 0, P(lx, 1, lz)[0], 0, [[0, rgba(shade(dcol, -0.2))], [1, rgba(shade(dcol, -0.05 - (1 - roomDoor) * 0.3))]]); ctx.fill();
  { const k = P(lerp(hx, lx, 0.88), 1.0, lerp(back, lz, 0.88)); ctx.fillStyle = '#c9a050'; ctx.beginPath(); ctx.arc(k[0], k[1], cm.s(back) * 0.025, 0, 6.283); ctx.fill(); }
  // door frame
  ctx.strokeStyle = rgba(shade(dcol, -0.15)); ctx.lineWidth = cm.s(back) * 0.05; quad(ctx, [P(dx0, 0, back), P(dx0, dh, back), P(dx1, dh, back), P(dx1, 0, back)]); ctx.stroke();
  // floor
  quad(ctx, [P(xl, 0, zn), P(xr, 0, zn), P(xr, 0, back), P(xl, 0, back)]);
  { const a = P(0, 0, back), b = P(0, 0, zn); ctx.fillStyle = lg(ctx, 0, a[1], 0, Math.min(b[1], 4000), [[0, rgba(shade(floorCol, -0.35))], [1, rgba(shade(floorCol, -0.1))]]); ctx.fill(); }
  // linoleum pattern (diamond grid)
  ctx.save(); ctx.clip(); ctx.strokeStyle = rgba(shade(floorCol, -0.45), 0.35); ctx.lineWidth = 1.5; ctx.beginPath();
  for (let z = Math.ceil(zn * 4) / 4; z <= back; z += 0.25) { const a = P(xl, 0, z), b = P(xr, 0, z); ctx.moveTo(...a); ctx.lineTo(...b); }
  for (let x = xl; x <= xr + 0.01; x += 0.26) { const a = P(x, 0, zn), b = P(x, 0, back); ctx.moveTo(...a); ctx.lineTo(...b); }
  ctx.stroke(); ctx.restore();
  // ceiling
  quad(ctx, [P(xl, ceil, zn), P(xr, ceil, zn), P(xr, ceil, back), P(xl, ceil, back)]); ctx.fillStyle = rgba(shade(mix(hex('#d8c2a0'), hex('#b8ab98'), old), -0.45)); ctx.fill();
  // left wall + wallpaper
  quad(ctx, [P(xl, 0, zn), P(xl, 0, back), P(xl, ceil, back), P(xl, ceil, zn)]);
  ctx.fillStyle = lg(ctx, P(xl, 1, zn)[0], 0, P(xl, 1, back)[0], 0, [[0, rgba(shade(wallCol, -0.15))], [1, rgba(shade(wallCol, -0.35))]]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = rgba(shade(wallCol, -0.4), 0.28); ctx.lineWidth = 1.2;
  for (let z = Math.ceil(zn * 8) / 8; z < back; z += 0.125) { const a = P(xl, 0, z), b = P(xl, ceil, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // small flower motif dots
  ctx.fillStyle = rgba(shade(wallCol, -0.45), 0.35); for (let z = Math.ceil(zn * 4) / 4 + 0.06; z < back; z += 0.25) for (let y = 0.2; y < ceil; y += 0.28) { const p = P(xl, y + (Math.round(z * 4) % 2) * 0.14, z); ctx.beginPath(); ctx.arc(p[0], p[1], cm.s(z) * 0.012, 0, 6.283); ctx.fill(); }
  ctx.restore();
  // right wall
  quad(ctx, [P(xr, 0, zn), P(xr, 0, back), P(xr, ceil, back), P(xr, ceil, zn)]);
  ctx.fillStyle = lg(ctx, P(xr, 1, zn)[0], 0, P(xr, 1, back)[0], 0, [[0, rgba(shade(wallCol, -0.05))], [1, rgba(shade(wallCol, -0.3))]]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = rgba(shade(wallCol, -0.35), 0.25); ctx.lineWidth = 1.2;
  for (let z = Math.ceil(zn * 8) / 8; z < back; z += 0.125) { const a = P(xr, 0, z), b = P(xr, ceil, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  ctx.restore();
  // baseboards
  ctx.strokeStyle = rgba(shade(floorCol, -0.3)); ctx.lineWidth = 6; for (const X of [xl, xr]) { ctx.beginPath(); ctx.moveTo(...P(X, 0.06, zn)); ctx.lineTo(...P(X, 0.06, back)); ctx.stroke(); }
  // kitchen doorway on right wall Z 2.2..3.1 (bright)
  const k0 = 2.2, k1 = 3.05;
  quad(ctx, [P(xr, 0, k0), P(xr, 0, k1), P(xr, 2.05, k1), P(xr, 2.05, k0)]);
  ctx.fillStyle = rgba(mix(hex('#ffcf8a'), hex('#e8c89a'), old), 0.95 * kitchen + 0.05); ctx.fill();
  { const c = P(xr + 0.4, 1.2, (k0 + k1) / 2); glow(ctx, c[0], c[1], cm.s(k0) * 1.0, hex('#ffc070'), 0.45 * kitchen); }
  // light spill on floor from kitchen
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; quad(ctx, [P(xr, 0, k0), P(xr, 0, k1), P(xr - 0.7, 0, k1 + 0.3), P(xr - 0.8, 0, k0 - 0.2)]); ctx.fillStyle = rgba(hex('#ffb060'), 0.22 * kitchen); ctx.filter = C.fb(ctx, 12); ctx.fill(); ctx.restore();
  // steam drifting out of kitchen
  if (o.steam) { ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < 7; i++) { const ph = (t * 0.12 + i / 7) % 1; const p = P(xr - ph * 0.6, 1.4 + ph * 0.9 + Math.sin(i + t) * 0.1, k0 + 0.3 + i * 0.08); const r = cm.s(k0) * (0.12 + ph * 0.3); ctx.fillStyle = rg(ctx, p[0], p[1], 0, r, [[0, `rgba(255,235,210,${0.16 * (1 - ph) * o.steam})`], [1, 'rgba(255,235,210,0)']]); ctx.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r); } ctx.restore(); }
  // living-room doorway on left wall Z 3.9..4.7 (dim)
  const l0 = 3.9, l1 = 4.7;
  quad(ctx, [P(xl, 0, l0), P(xl, 0, l1), P(xl, 2.05, l1), P(xl, 2.05, l0)]); ctx.fillStyle = '#1e140c'; ctx.fill();
  { const c = P(xl - 0.6, 0.9, 4.3); glow(ctx, c[0], c[1], cm.s(4.3) * 0.5, hex('#ffb870'), 0.25); }
  // coat hooks with jackets on left wall Z 1.3..2.0
  for (const [z, col] of [[1.45, '#3a4a5a'], [1.7, '#6a3a2a'], [1.95, '#2e3a2c']]) {
    if (z < zn + 0.2) continue;
    const a = P(xl + 0.02, 1.85, z), b = P(xl + 0.14, 1.0, z + 0.1), s = cm.s(z);
    ctx.fillStyle = rgba(shade(hex(col), -0.2)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(a[0] + s * 0.18, a[1] + s * 0.3, b[0] + s * 0.08, b[1]); ctx.lineTo(b[0] - s * 0.12, b[1] + s * 0.02); ctx.quadraticCurveTo(a[0] - s * 0.05, a[1] + s * 0.4, a[0] - s * 0.02, a[1]); ctx.closePath(); ctx.fill();
  }
  { const a = P(xl, 1.9, 1.3), b = P(xl, 1.9, 2.1); ctx.strokeStyle = '#4a3020'; ctx.lineWidth = cm.s(1.7) * 0.04; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // shoe rack on left wall floor Z 1.4..2.3
  { quad(ctx, [P(xl, 0, 1.4), P(xl + 0.3, 0, 1.4), P(xl + 0.3, 0.45, 1.4), P(xl, 0.45, 1.4)]); ctx.fillStyle = '#5a3a24'; ctx.fill(); quad(ctx, [P(xl + 0.3, 0, 1.4), P(xl + 0.3, 0, 2.3), P(xl + 0.3, 0.45, 2.3), P(xl + 0.3, 0.45, 1.4)]); ctx.fillStyle = '#6e4a2e'; ctx.fill(); quad(ctx, [P(xl, 0.45, 1.4), P(xl + 0.3, 0.45, 1.4), P(xl + 0.3, 0.45, 2.3), P(xl, 0.45, 2.3)]); ctx.fillStyle = '#8a6040'; ctx.fill(); for (const z of [1.55, 1.8, 2.05]) { const p = P(xl + 0.2, 0.47, z); ctx.fillStyle = '#2a1e18'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - cm.s(z) * 0.03, cm.s(z) * 0.08, cm.s(z) * 0.035, 0, 0, 6.283); ctx.fill(); } }
  // light switch on right wall
  { const p = P(xr, 1.25, 1.9), s = cm.s(1.9); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(p[0] - s * 0.03, p[1] - s * 0.05, s * 0.06, s * 0.1); }
  // ceiling lamp with fabric shade at Z 3.0
  const lp = P(0, 2.2, 3.2), ls = cm.s(3.2);
  ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(0, ceil, 3.2)); ctx.lineTo(lp[0], lp[1]); ctx.stroke();
  const shadeC = mix(hex('#e8a050'), hex('#d89a60'), old);
  ctx.fillStyle = lg(ctx, lp[0] - ls * 0.25, 0, lp[0] + ls * 0.25, 0, [[0, rgba(shade(shadeC, -0.1))], [0.5, rgba(shade(shadeC, 0.35 * lampI))], [1, rgba(shade(shadeC, -0.2))]]);
  ctx.beginPath(); ctx.moveTo(lp[0] - ls * 0.12, lp[1]); ctx.lineTo(lp[0] + ls * 0.12, lp[1]); ctx.lineTo(lp[0] + ls * 0.25, lp[1] + ls * 0.2); ctx.quadraticCurveTo(lp[0], lp[1] + ls * 0.24, lp[0] - ls * 0.25, lp[1] + ls * 0.2); ctx.closePath(); ctx.fill();
  glow(ctx, lp[0], lp[1] + ls * 0.22, ls * 0.6, hex('#ffd08a'), 0.75 * lampI);
  cone(ctx, lp[0], lp[1] + ls * 0.2, 0, 0.55, ls * 2.1, hex('#ffc880'), 0.14 * lampI, ls * 0.22);
  { const fp = P(0, 0, 3.2); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, fp[0], fp[1], 0, ls * 0.9, [[0, rgba(hex('#ffc070'), 0.3 * lampI)], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.ellipse(fp[0], fp[1], ls * 0.9, ls * 0.25, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
  // overall warm light falloff near camera
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rg(ctx, lp[0], lp[1] + ls * 0.6, ls * 0.2, 1300, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(150,110,90,1)']]); ctx.fillRect(-500, -500, VW + 1000, VH + 1000); ctx.restore();
  return { lampPos: lp, P };
}

// ================= LIVING ROOM (dad + black TV) =================
function livingRoom(ctx, t, o = {}) {
  ctx.fillStyle = lg(ctx, 0, 0, 0, VH, [[0, '#2a1a10'], [1, '#120a06']]); ctx.fillRect(-400, -400, VW + 800, VH + 800);
  // wallpaper stripes
  ctx.strokeStyle = 'rgba(90,60,35,0.35)'; ctx.lineWidth = 2; for (let x = -400; x < VW + 400; x += 34) { ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, 1300); ctx.stroke(); }
  // carpet on wall (classic)
  ctx.save(); ctx.translate(560, 560); ctx.fillStyle = '#5a1e18'; ctx.fillRect(-330, -230, 660, 460); ctx.strokeStyle = 'rgba(210,150,80,0.45)'; ctx.lineWidth = 6; ctx.strokeRect(-300, -200, 600, 400);
  for (let i = 0; i < 5; i++) { ctx.strokeStyle = `rgba(${150 + i * 20},${60 + i * 15},40,0.4)`; ctx.beginPath(); ctx.moveTo(0, -170 + i * 20); ctx.lineTo(250 - i * 40, 0); ctx.lineTo(0, 170 - i * 20); ctx.lineTo(-250 + i * 40, 0); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
  // floor lamp warm
  glow(ctx, 120, 760, 380, hex('#ffb060'), 0.5); ctx.fillStyle = '#c88a48'; ctx.beginPath(); ctx.moveTo(70, 700); ctx.lineTo(170, 700); ctx.lineTo(200, 800); ctx.lineTo(40, 800); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#20140c'; ctx.fillRect(116, 800, 8, 560);
  // sofa
  const sc = hex('#5a3a2e');
  ctx.fillStyle = lg(ctx, 0, 880, 0, 1330, [[0, rgba(shade(sc, 0.1))], [1, rgba(shade(sc, -0.5))]]); ctx.beginPath(); ctx.roundRect(170, 880, 860, 300, 40); ctx.fill();
  ctx.fillStyle = rgba(shade(sc, -0.1)); ctx.beginPath(); ctx.roundRect(200, 1080, 800, 200, 30); ctx.fill();
  ctx.fillStyle = rgba(shade(sc, -0.25)); ctx.beginPath(); ctx.roundRect(130, 1000, 120, 300, 40); ctx.fill(); ctx.beginPath(); ctx.roundRect(950, 1000, 120, 300, 40); ctx.fill();
  // floor
  ctx.fillStyle = '#1a0f08'; ctx.fillRect(-400, 1330, VW + 800, 900);
}
function tvSet(ctx, x, y, w, h, reflect) { // black CRT TV in foreground, with reflection callback
  ctx.save();
  ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#2a2420'], [1, '#0a0806']]); ctx.beginPath(); ctx.roundRect(x - 30, y - 30, w + 60, h + 90, 26); ctx.fill();
  ctx.fillStyle = '#060606'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 40); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 40); ctx.clip();
  if (reflect) { ctx.globalAlpha = 0.28; reflect(ctx); ctx.globalAlpha = 1; }
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rg(ctx, x + w * 0.3, y + h * 0.25, 0, w * 0.6, [[0, 'rgba(255,220,170,0.18)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x, y, w, h);
  ctx.restore(); ctx.restore();
}

// ================= STREET + BUS STOP (night rain, panel blocks) =================
// world: X along street (meters), Z depth (sidewalk at Z ~ 6), road Z 6..12 (we look across), buildings Z 18+
function street(ctx, cm, t, o = {}) {
  const warm = o.warm ?? 1, empty = o.empty || 0;
  const sky = mix(hex('#0b1a2c'), hex('#1a1520'), warm * 0.5);
  ctx.fillStyle = lg(ctx, 0, -200, 0, 1300, [[0, rgba(sky)], [1, rgba(mix(hex('#24304a'), hex('#4a3226'), warm))]]); ctx.fillRect(-600, -600, VW + 1200, VH + 1200);
  const P = (X, Y, Z) => cm.p(X, Y, Z);
  // far panel buildings Z=40
  const R = rng(5);
  for (let i = -6; i < 14; i++) {
    const X0 = i * 14 - 20, w = 12, hgt = 30 + (i % 3) * 6, Z = 40 + (i % 2) * 8;
    const a = P(X0, 0, Z), b = P(X0 + w, hgt, Z);
    ctx.fillStyle = rgba(mix(hex('#141c26'), hex('#1e1a1a'), warm * 0.6)); ctx.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
    const cols = 6, rows = Math.floor(hgt / 2.8);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const lit = R() < 0.35; if (!lit) continue;
      const wx = P(X0 + 0.8 + c * 1.9, 1.5 + r * 2.8, Z), sz = cm.s(Z);
      ctx.fillStyle = rgba(R() < 0.8 ? hex('#ffc070') : hex('#bfe0ff'), 0.6 + R() * 0.3); ctx.fillRect(wx[0], wx[1], sz * 1.0, sz * 1.2);
    }
  }
  // haze
  ctx.fillStyle = lg(ctx, 0, P(0, 0, 40)[1] - 300, 0, P(0, 0, 40)[1], [[0, 'rgba(255,190,130,0)'], [1, rgba(mix(hex('#6a8aa8'), hex('#a07050'), warm), 0.35)]]); ctx.fillRect(-600, P(0, 0, 40)[1] - 300, VW + 1200, 300);
  // road surface (wet) Z 8..40
  const g0 = P(0, 0, 40)[1];
  ctx.fillStyle = lg(ctx, 0, g0, 0, VH + 200, [[0, '#14161c'], [1, '#07080a']]); ctx.fillRect(-600, g0, VW + 1200, VH + 800);
  // road markings
  ctx.fillStyle = 'rgba(200,200,190,0.25)'; for (let X = -40; X < 120; X += 6) { const a = P(X, 0, 11), b = P(X + 3, 0, 11.2); ctx.fillRect(a[0], a[1], b[0] - a[0], 4); }
  // curb & sidewalk Z 3..7
  const c0 = P(-200, 0.15, 7), c1 = P(400, 0, 7);
  ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-600, c0[1], VW + 1200, 12);
  ctx.fillStyle = lg(ctx, 0, c0[1], 0, VH + 200, [[0, '#262626'], [1, '#121214']]); ctx.fillRect(-600, c0[1] + 12, VW + 1200, VH + 800);
  // sidewalk tiles
  ctx.strokeStyle = 'rgba(80,80,85,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let X = Math.floor(cm.cx - 30); X < cm.cx + 30; X += 1) { const a = P(X, 0, 7), b = P(X, 0, 2.5); ctx.moveTo(...a); ctx.lineTo(...b); } ctx.stroke();
  // apartment block entrance (подъезд) at X = 26, Z 2.5 (behind sidewalk, near side) -> we put building facade at Z=4.6 behind the walk? keep at far side of sidewalk Z=2.5 is camera side; use facade at Z 8.5 beyond road? Simplify: entrance across the sidewalk at Z 7.6
  // streetlamps
  for (let X = -24; X <= 64; X += 11) streetLamp(ctx, cm, X, 6.6, t, warm);
  // reflections of lamps on wet road
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = C.fb(ctx, 8);
  for (let X = -24; X <= 64; X += 11) { const a = P(X + 0.6, 0, 9), s = cm.s(9); ctx.fillStyle = lg(ctx, 0, a[1], 0, a[1] + s * 2.5, [[0, rgba(hex('#ffb060'), 0.35 * warm + 0.1)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(a[0] - s * 0.15, a[1], s * 0.3, s * 2.5); }
  ctx.restore();
  return { P };
}
function streetLamp(ctx, cm, X, Z, t, warm) {
  const P = (x, y, z) => cm.p(x, y, z), s = cm.s(Z);
  const b = P(X, 0, Z), top = P(X, 6, Z), head = P(X + 0.9, 6.1, Z);
  ctx.strokeStyle = '#0c0d10'; ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.moveTo(...b); ctx.lineTo(...top); ctx.quadraticCurveTo(top[0], head[1] - s * 0.3, head[0], head[1]); ctx.stroke();
  const col = mix(hex('#d8f0ff'), hex('#ffb35a'), warm);
  ctx.fillStyle = '#16181c'; ctx.beginPath(); ctx.ellipse(head[0], head[1], s * 0.4, s * 0.12, 0, 0, 6.283); ctx.fill();
  glow(ctx, head[0], head[1] + s * 0.1, s * 1.6, col, 0.75);
  cone(ctx, head[0], head[1] + s * 0.1, 0, 0.45, s * 6.2, col, 0.16, s * 0.3);
  const fp = P(X + 0.9, 0, Z); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, fp[0], fp[1], 0, s * 2.4, [[0, rgba(col, 0.28)], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.ellipse(fp[0], fp[1], s * 2.4, s * 0.5, 0, 0, 6.283); ctx.fill(); ctx.restore();
  // rain in the lamp light
  ctx.save(); ctx.beginPath(); ctx.moveTo(head[0], head[1]); ctx.lineTo(head[0] + s * 3, fp[1]); ctx.lineTo(head[0] - s * 3, fp[1]); ctx.closePath(); ctx.clip();
  rain(ctx, t, X * 13 | 0, 60, [head[0] - s * 3, head[1], s * 6, fp[1] - head[1]], col, 0.45, s * 0.5, Math.max(1, s * 0.015), 0.05, s * 9); ctx.restore();
}
function busStop(ctx, cm, X, Z, t, warm = 1) {
  const P = (x, y, z) => cm.p(x, y, z), s = cm.s(Z);
  // shelter: back glass panel + roof + posts
  const a = P(X - 2, 0, Z + 0.8), b = P(X + 2, 2.5, Z + 0.8);
  ctx.fillStyle = rgba(mix(hex('#5a7a90'), hex('#8a6a50'), warm), 0.18); ctx.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
  ctx.strokeStyle = '#121418'; ctx.lineWidth = s * 0.08; ctx.strokeRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
  for (const x of [X - 2, X + 2]) { const p0 = P(x, 0, Z), p1 = P(x, 2.6, Z); ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); }
  const r0 = P(X - 2.2, 2.6, Z), r1 = P(X + 2.2, 2.75, Z + 0.9); ctx.fillStyle = '#16181c'; ctx.fillRect(r0[0], r1[1], r1[0] - r0[0], r0[1] - r1[1] + s * 0.1);
  // bench
  const be = P(X - 1.4, 0.48, Z + 0.6), be2 = P(X + 1.4, 0.48, Z + 0.6); ctx.fillStyle = '#2a2420'; ctx.fillRect(be[0], be[1], be2[0] - be[0], s * 0.08);
  // small light under roof
  const lp = P(X, 2.5, Z + 0.4); glow(ctx, lp[0], lp[1], s * 1.2, mix(hex('#d8f0ff'), hex('#ffd59a'), warm), 0.35);
}
function bus(ctx, cm, X, Z, doorOpen, warm = 1, lit = 1) {
  const P = (x, y, z) => cm.p(x, y, z), s = cm.s(Z);
  const a = P(X - 5.5, 0.3, Z), b = P(X + 5.5, 3.1, Z);
  const body = mix(hex('#c8c0a8'), hex('#d8b880'), warm * 0.4);
  ctx.save();
  ctx.fillStyle = lg(ctx, 0, b[1], 0, a[1], [[0, rgba(shade(body, 0.05))], [0.6, rgba(shade(body, -0.25))], [1, rgba(shade(body, -0.55))]]);
  ctx.beginPath(); ctx.roundRect(a[0], b[1], b[0] - a[0], a[1] - b[1], s * 0.4); ctx.fill();
  // windows band with warm interior
  const w0 = P(X - 5.1, 1.5, Z), w1 = P(X + 5.0, 2.7, Z);
  ctx.fillStyle = rgba(mix(hex('#5a8090'), hex('#c89a60'), warm), 0.8 * lit); ctx.fillRect(w0[0], w1[1], w1[0] - w0[0], w0[1] - w1[1]);
  ctx.fillStyle = rgba(shade(body, -0.3)); for (let i = 0; i < 6; i++) { const p = P(X - 5.1 + i * 2, 1.5, Z); ctx.fillRect(p[0], w1[1], s * 0.12, w0[1] - w1[1]); }
  glow(ctx, (w0[0] + w1[0]) / 2, (w0[1] + w1[1]) / 2, s * 4, mix(hex('#bfe6ff'), hex('#ffcf8a'), warm), 0.12 * lit);
  // door (middle)
  const d0 = P(X - 0.6, 0.35, Z), d1 = P(X + 0.6, 2.75, Z);
  ctx.fillStyle = rgba(mix(hex('#8fb0c0'), hex('#d8b080'), warm), 0.85 * lit); ctx.fillRect(d0[0], d1[1], d1[0] - d0[0], d0[1] - d1[1]);
  const half = (d1[0] - d0[0]) / 2 * (1 - doorOpen);
  ctx.fillStyle = rgba(shade(body, -0.2)); ctx.fillRect(d0[0], d1[1], half, d0[1] - d1[1]); ctx.fillRect(d1[0] - half, d1[1], half, d0[1] - d1[1]);
  // wheels
  for (const x of [X - 3.6, X + 3.6]) { const p = P(x, 0.45, Z - 0.05); ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(p[0], p[1], s * 0.5, 0, 6.283); ctx.fill(); ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(p[0], p[1], s * 0.22, 0, 6.283); ctx.fill(); }
  // headlight
  const hl = P(X + 5.45, 0.9, Z); glow(ctx, hl[0], hl[1], s * 1.4, hex('#fff1d0'), 0.8);
  ctx.restore();
  // reflection on wet road
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = C.fb(ctx, 10); ctx.fillStyle = rgba(mix(hex('#9fd0e0'), hex('#ffcf8a'), warm), 0.18 * lit); ctx.fillRect(w0[0], a[1] + s * 0.1, w1[0] - w0[0], s * 1.2); ctx.restore();
}
// apartment entrance & window (for Dima's arrival)
function entrance(ctx, cm, X, Z, winLit, warm = 1) {
  const P = (x, y, z) => cm.p(x, y, z), s = cm.s(Z);
  const a = P(X - 6, 0, Z), b = P(X + 6, 14, Z);
  ctx.fillStyle = '#1b1c22'; ctx.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
  // panel seams
  ctx.strokeStyle = 'rgba(60,60,70,0.6)'; ctx.lineWidth = 2; for (let y = 2.8; y < 14; y += 2.8) { const p = P(X - 6, y, Z), q = P(X + 6, y, Z); ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); }
  // windows
  const R = rng(X | 0);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
    const wp = P(X - 5 + c * 3, 1.0 + r * 2.8, Z), sz = cm.s(Z);
    const target = (r === 2 && c === 1);
    const lit = target ? winLit : (R() < 0.3 ? 0.8 : 0);
    ctx.fillStyle = lit > 0 ? rgba(hex('#ffc070'), 0.15 + 0.75 * lit) : '#0c0d12'; ctx.fillRect(wp[0], wp[1] - sz * 1.5, sz * 1.4, sz * 1.5);
    if (target && winLit > 0) glow(ctx, wp[0] + sz * 0.7, wp[1] - sz * 0.75, sz * 2.5, hex('#ffc070'), 0.5 * winLit);
  }
  // door + canopy light
  const d0 = P(X - 0.6, 0, Z - 0.02), d1 = P(X + 0.6, 2.1, Z - 0.02);
  ctx.fillStyle = '#2a2018'; ctx.fillRect(d0[0], d1[1], d1[0] - d0[0], d0[1] - d1[1]);
  const lp = P(X, 2.4, Z - 0.3); glow(ctx, lp[0], lp[1], s * 1.6, hex('#ffd08a'), 0.6);
}

// ================= OFFICE (present, cold) =================
function office(ctx, t, o = {}) {
  ctx.fillStyle = lg(ctx, 0, 0, 0, VH, [[0, '#061826'], [1, '#03080d']]); ctx.fillRect(-400, -400, VW + 800, VH + 800);
  // skyline through glass
  const R = rng(31);
  for (let i = 0; i < 26; i++) { const x = -300 + i * 70 + R() * 30, w = 50 + R() * 60, h = 300 + R() * 900; ctx.fillStyle = `rgba(${10 + R() * 10},${30 + R() * 20},${50 + R() * 20},1)`; ctx.fillRect(x, 1300 - h, w, h);
    for (let k = 0; k < h / 26; k++) for (let j = 0; j < w / 16; j++) if (R() < 0.3) { ctx.fillStyle = `rgba(150,220,255,${0.3 + R() * 0.5})`; ctx.fillRect(x + 4 + j * 16, 1300 - h + 8 + k * 26, 8, 10); } }
  // glass mullions
  ctx.fillStyle = '#02060a'; for (let x = -300; x < VW + 300; x += 360) ctx.fillRect(x, -400, 22, 2400);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg(ctx, 0, 0, VW, VH, [[0, 'rgba(120,200,255,0.10)'], [0.5, 'rgba(120,200,255,0)'], [0.55, 'rgba(160,220,255,0.08)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-400, -400, VW + 800, VH + 800); ctx.restore();
  // floor reflection
  ctx.fillStyle = lg(ctx, 0, 1300, 0, VH, [[0, '#0a1a24'], [1, '#020507']]); ctx.fillRect(-400, 1300, VW + 800, 1000);
}
// phone in hand with UI content cb
function phone(ctx, x, y, w, rot, screen, L = COLD, skin = hex('#e9b99a')) {
  const h = w * 2.05;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  // hand behind
  ctx.fillStyle = rgba(shade(skin, -0.2)); ctx.beginPath(); ctx.ellipse(-w * 0.1, h * 0.35, w * 0.62, h * 0.32, 0.1, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#0b0c0e'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.13); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08, w * 0.1); ctx.clip();
  ctx.translate(-w / 2 + w * 0.04, -h / 2 + w * 0.04); screen(ctx, w * 0.92, h - w * 0.08); ctx.restore();
  // fingers in front (thumb)
  ctx.fillStyle = rgba(skin); ctx.beginPath(); ctx.ellipse(w * 0.52, h * 0.15, w * 0.13, h * 0.12, -0.3, 0, 6.283); ctx.fill();
  ctx.fillStyle = rgba(skin); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-w * 0.53, h * (0.0 + i * 0.12), w * 0.1, h * 0.05, 0.2, 0, 6.283); ctx.fill(); }
  ctx.restore();
}
module.exports = { COLD, WARM, AMBER, ICE, stationWall, stationClock, departureBoard, pendantLamp, stationFloor, booth, boothFront, bench, suitcase, pocketWatch, cam3, hallway, HW, livingRoom, tvSet, street, streetLamp, busStop, bus, entrance, office, phone, quad };
