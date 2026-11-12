import json, numpy as np, wave, subprocess, os, sys
from scipy import signal
SR = 48000
rng = np.random.default_rng(11)
EV = json.load(open('ev.json')); TL = json.load(open('timeline.json'))
DUR = TL['dur']; N = int(round(DUR * SR))
SC = {s['n']: (s['t0'], s['t1']) for s in TL['scenes']}
def cue(s, phrase):
    import re
    norm = lambda x: re.sub(r'[^a-zа-я0-9]', '', x.lower().replace('ё', 'е'))
    toks = [norm(t) for t in phrase.split() if norm(t)]
    ws = [w for w in TL['words'] if w['s'] == s and norm(w['w'])]
    for i in range(len(ws) - len(toks) + 1):
        if all(norm(ws[i + j]['w']).startswith(toks[j]) for j in range(len(toks))): return ws[i]['t0']
    raise Exception('cue ' + phrase)
def rd(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
    return a
def wr(p, a, ch=1):
    a = np.clip(a, -1, 1); w = wave.open(p, 'wb'); w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a * 32767).astype(np.int16).tobytes()); w.close()
def t(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, curve=4):
    n = int(d * SR); x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x * curve / max(d, 1e-3))
def adsr(d, a, r):
    n = int(d * SR); x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.clip((d - x) / max(r, 1e-4), 0, 1)
def noise(d): return rng.standard_normal(int(d * SR))
def _fix(a, n): return a[:n] if len(a) >= n else np.pad(a, (0, n - len(a)))
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2)); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def sweep(f0, f1, d):
    x = t(d); f = f0 * (f1 / f0) ** (x / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
IRS = {}
def reverb(x, dur=1.8, mix=.3, damp=3500):
    k = (dur, damp)
    if k not in IRS:
        n = int(dur * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 6.9 / dur); ir = lp(ir, damp); IRS[k] = ir / np.sqrt((ir ** 2).sum())
    ir = IRS[k]; y = signal.fftconvolve(x, ir); out = np.zeros(len(y)); out[:len(x)] += x * (1 - mix); out += y * mix; return out
def add(buf, x, at, g=1.0):
    i = int(at * SR)
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n > 0: buf[i:i + n] += x[:n] * g
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ================= VOICE =================
def voice():
    parts = [np.zeros(int(7.0 * SR))]
    files = sorted(os.listdir('voice_src'))
    for f in files:
        a = rd('voice_src/' + f); src = 24000
        y = signal.resample_poly(a, SR, src); parts.append(y)
    v = np.concatenate(parts); v = np.pad(v, (0, max(0, N - len(v))))[:N]
    wr('voice_raw.wav', v)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voice_raw.wav', '-af',
                    'highpass=f=70,acompressor=threshold=-22dB:ratio=2.6:attack=6:release=90:makeup=2,equalizer=f=4000:t=q:w=1.1:g=2.5,deesser=i=0.35,loudnorm=I=-16:TP=-2:LRA=8',
                    '-ar', str(SR), '-ac', '1', 'voice_proc.wav'], check=True)
    v = rd('voice_proc.wav'); v = np.pad(v, (0, max(0, N - len(v))))[:N]; return v

# ================= INSTRUMENTS =================
def pluck(f, d=1.2, bright=1.0):
    x = t(d); s = np.zeros_like(x)
    for k in range(1, 9): s += np.sin(2 * np.pi * f * k * x * (1 + .0006 * k * k)) * np.exp(-x * (2 + k * 1.6 / bright)) / k ** 1.1
    nn = lp(noise(.02), 3000) * .3; s[:len(nn)] += nn[:len(s)]
    return s * np.minimum(1, x / .002) * .5
def marimba(f, d=.8):
    x = t(d); return (np.sin(2 * np.pi * f * x) * np.exp(-x * 6) + .35 * np.sin(2 * np.pi * f * 3.93 * x) * np.exp(-x * 18) + .12 * np.sin(2 * np.pi * f * 9.2 * x) * np.exp(-x * 40)) * np.minimum(1, x / .002) * .5
def piano(f, d=2.5, v=.5):
    x = t(d); s = np.zeros_like(x)
    for k, a in enumerate([1, .55, .3, .18, .1, .06], 1): s += a * np.sin(2 * np.pi * f * k * x * (1 + .0004 * k * k)) * np.exp(-x * (1.2 + k * .9))
    s += .3 * np.sin(2 * np.pi * f * 1.003 * x) * np.exp(-x * 1.5)
    return s * np.minimum(1, x / .003) * v * .45
def pad(fs, d, a=1.5, r=2.0, cutoff=1400, det=.12):
    x = t(d); s = np.zeros_like(x)
    for f in fs:
        for dt in (-det, det):
            ff = f * 2 ** (dt / 12)
            for k in range(1, 7): s += np.sin(2 * np.pi * ff * k * x + k) / k ** 1.4 * .25
    return lp(s, cutoff) * adsr(d, a, r) / max(1, len(fs))
def cello(f, d, vib=5.0):
    x = t(d); fm = f * (1 + .006 * np.sin(2 * np.pi * vib * x) * np.minimum(1, x / .6)); ph = 2 * np.pi * np.cumsum(fm) / SR
    s = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 10)); s = lp(s, 1800) + lp(noise(d), 1200) * .02
    return s * adsr(d, .35, .6) * .3
def bass(f, d=.6):
    x = t(d); return (np.sin(2 * np.pi * f * x) + .4 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 3.5) * np.minimum(1, x / .004) * .6
def guitar_strum(fs, d=1.6):
    out = np.zeros(int((d + .2) * SR))
    for i, f in enumerate(fs): add(out, pluck(f, d, 1.3) * .7, i * .018)
    return out
def kick(d=.35): return sweep(110, 45, d) * env(d, .002, 9) * .9
def shaker(d=.08): return hp(noise(d), 5000) * env(d, .004, 10) * .25
def tickc(d=.03): return hp(noise(d), 2500) * env(d, .0008, 12) * .4 + np.sin(2 * np.pi * 3000 * t(d)) * env(d, .0008, 12) * .1
def hb(d=.25): return sweep(70, 42, d) * env(d, .003, 9)
def metal(d=.6):
    x = t(d); return sum(np.sin(2 * np.pi * f * x) for f in (523, 1307, 2213, 3001)) * np.exp(-x * 7) * .08
def arp_note(f, d=.22):
    x = t(d); s = np.sign(np.sin(2 * np.pi * f * x)) * .5 + np.sin(2 * np.pi * f * 2 * x) * .3; return lp(s, 2600) * np.exp(-x * 9) * np.minimum(1, x / .002) * .3

# ================= MUSIC CLIPS =================
def music():
    M = np.zeros(N + SR * 4)
    def rngT(a, b, step):
        tt = a
        while tt < b: yield tt; tt += step
    # disclaimer: warm quiet pad
    add(M, pad([mtof(60), mtof(64), mtof(67)], 7.2, 1.5, 1.5, 1000) * .25, 0)
    # A: hook
    a0, a1 = SC[1]; tHow = cue(1, 'Как убийца выбирает')
    add(M, pad([mtof(38), mtof(45)], a1 - a0 + 1, 2, 1.0, 400) * .9, a0)
    bpm0, bpm1 = 60, 90; tt = a0
    while tt < a1 - .2:
        u = (tt - a0) / (a1 - a0); bpm = bpm0 + (bpm1 - bpm0) * u ** 1.5
        add(M, hb(), tt, .5 + .4 * u); add(M, hb() * .6, tt + .28, .5 + .4 * u); tt += 60 / bpm
    dm = [62, 65, 69, 72, 69, 65, 64, 62]
    for i, tt in enumerate(rngT(a0 + 2, a1 - 4, 60 / 75)):
        if i % 2 == 0: add(M, pluck(mtof(dm[(i // 2) % 8]), 1.0), tt, .32)
    for tt in rngT(a0, a1, .5): add(M, tickc(), tt, .5)
    add(M, s_riser(a1 - tHow + .3) * 1.0, tHow)
    # B: rule, marimba/pizzicato 110 bpm, major, cold at end
    b0, b1 = SC[2]; beat = 60 / 110; prog = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]]
    coldT = cue(2, 'Начнём с самого')
    for i, tt in enumerate(rngT(b0, coldT, beat / 2)):
        ch = prog[(i // 16) % 4]; n = ch[[0, 1, 2, 1, 0, 2, 1, 2][i % 8]] + 12
        add(M, marimba(mtof(n)), tt, .38 if i % 2 == 0 else .22)
        if i % 4 == 0: add(M, pluck(mtof(ch[0] - 12), .5, .7), tt, .35)
        if i % 2 == 1: add(M, shaker(), tt, .5)
    add(M, pad([mtof(57), mtof(60), mtof(64)], b1 - coldT + 2, 1.0, 1.5, 700) * .6, coldT)
    # C: Chikatilo, cold strings, sparse piano, metallic pulse 70
    c0, c1 = SC[3]; am = [[45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 59], [40, 47, 56, 59]]
    for i, tt in enumerate(rngT(c0, c1, 12)): add(M, pad([mtof(n) for n in am[i % 4]], 14, 3, 3, 900) * .7, tt)
    for i, tt in enumerate(rngT(c0 + 3, c1, 60 / 70)): add(M, metal(), tt, .35); add(M, hb(.2), tt, .2)
    pr = np.random.default_rng(3)
    for tt in rngT(c0 + 4, c1 - 2, 4.3): add(M, reverb(piano(mtof(int(pr.choice([69, 72, 76, 74, 64, 67]))), 3), 2.5, .45), tt + pr.random() * 1.2, .5)
    # D: Ridgway, cello + drone 65bpm + rain bed
    d0, d1 = SC[4]; add(M, pad([mtof(40), mtof(47)], d1 - d0, 2, 2, 350) * 1.0, d0)
    for tt in rngT(d0 + 2, d1, 60 / 65): add(M, hb(.22), tt, .25)
    phr = [52, 55, 59, 57, 55, 52, 50, 52]
    for i, tt in enumerate(rngT(d0 + 3, d1 - 3, 3.6)): add(M, reverb(cello(mtof(phr[i % 8] - 12), 3.4), 2.2, .35), tt, .55)
    # E: Bundy noir: walking bass 80 bpm, muted piano
    e0, e1 = SC[5]; walk = [36, 39, 41, 43, 44, 43, 41, 39]; beat = 60 / 80
    for i, tt in enumerate(rngT(e0, e1, beat)): add(M, bass(mtof(walk[i % 8])), tt, .7)
    for i, tt in enumerate(rngT(e0 + beat / 2, e1, beat * 2)):
        if i % 2 == 0: add(M, lp(piano(mtof([60, 63, 67, 70][i // 2 % 4]), 1.2, .5), 1600), tt, .55); add(M, lp(piano(mtof([63, 67][i // 2 % 2]), 1.2, .4), 1600), tt + .02, .45)
    for tt in rngT(e0, e1, beat): add(M, hp(noise(.05), 6000) * env(.05, .002, 8) * .12, tt + beat / 2)  # brushes
    # F: Dahmer, long low note, creaks
    f0, f1 = SC[6]; add(M, pad([mtof(33), mtof(40)], f1 - f0, 3, 3, 260) * 1.2, f0)
    for tt in rngT(f0 + 5, f1, 9.5): x = t(1.2); add(M, bp(np.sign(np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(x * 7)) / SR)) * .2, 300, 1500) * np.sin(np.pi * x / 1.2) * .5, tt)
    # G: defense, warm guitar + piano + light percussion 90 bpm
    g0, g1 = SC[7]; beat = 60 / 90; chords = [[55, 59, 62, 67], [50, 54, 57, 62], [52, 55, 59, 64], [48, 52, 55, 60]]
    gend = g1 - 2.0
    for i, tt in enumerate(rngT(g0, gend, beat)):
        ch = chords[(i // 4) % 4]
        if i % 2 == 0: add(M, guitar_strum([mtof(n) for n in ch], 1.4), tt, .55)
        else: add(M, guitar_strum([mtof(n) for n in ch[::-1]], .9), tt, .3)
        add(M, shaker(), tt + beat / 2, .7)
        if i % 4 == 0: add(M, kick(), tt, .35)
        if i % 8 == 0: add(M, piano(mtof(ch[-1] + 12), 2, .5), tt, .4)
    # H: finale
    h0, h1 = SC[8]; tAns = cue(8, 'Ответ оказался'); tCop = cue(8, 'Он сам был'); tNot = cue(8, 'И нашли его не'); tThink = cue(8, 'Задумайтесь')
    add(M, pad([mtof(38), mtof(45), mtof(50)], tAns - h0, 3, 1.0, 500) * .9, h0)
    for tt in rngT(h0 + 4, tCop - 1.7, 1.2): add(M, tickc(), tt, .35)
    # after the hit: investigation pulse 120 bpm + arps until "Задумайтесь"
    beat = 60 / 120; arpn = [57, 60, 64, 69, 64, 60, 62, 65]
    for i, tt in enumerate(rngT(tCop + .3, tThink, beat / 2)):
        add(M, tickc(), tt, .45)
        if i % 2 == 0: add(M, kick(.25), tt, .3 if i % 8 == 0 else .12)
        if tt > tNot - .2: add(M, arp_note(mtof(arpn[i % 8] + 12)), tt, .55)
    add(M, pad([mtof(45), mtof(52)], tThink - tCop, 1, 2, 600) * .6, tCop + .2)
    warm = [[48, 55, 60, 64], [53, 57, 60, 65], [55, 59, 62, 67], [48, 52, 55, 60]]
    for i, tt in enumerate(rngT(tThink - .5, h1 + 4, 6)): add(M, pad([mtof(n) for n in warm[i % 4]], 8, 2, 2.5, 1600) * .9, tt)
    for i, tt in enumerate(rngT(tThink + 2, h1 + 3, 1.5)): add(M, piano(mtof([72, 76, 79, 77, 76, 74, 72, 67][i % 8]), 2.5, .45), tt, .5)
    return M[:N]

# ================= SFX =================
def s_paper(d=.6): x = noise(d); cr = np.convolve((rng.random(len(x)) < .005).astype(float), np.ones(60), 'same'); return bp(x, 1500, 9000) * (.15 + cr) * np.sin(np.pi * np.linspace(0, 1, len(x))) * .35
def s_slap(): a = lp(noise(.08), 2500) * env(.08, .001, 10) * .7; b = s_paper(.3); o = np.zeros(len(b)); o[:len(a)] += a; return o + b * .6
def s_stamp(): x = sweep(160, 55, .2) * env(.2, .001, 10) * .9; p = bp(noise(.08), 900, 4000) * env(.08, .001, 10) * .6; x[:len(p)] += p; return reverb(x, .5, .15)
def s_hit(): x = sweep(95, 38, 1.4) * env(1.4, .002, 5) * .9; n = lp(noise(.2), 900) * env(.2, .001, 12) * .5; x[:len(n)] += n; return reverb(x, 1.6, .3)
def s_boom(): x = sweep(70, 28, 2.5) * env(2.5, .003, 4) + lp(noise(2.5), 300) * env(2.5, .002, 6) * .6; return reverb(x, 2.5, .4, 1800)
def s_boomlow(): x = sweep(50, 26, 3.5) * env(3.5, .03, 3) + lp(noise(3.5), 160) * env(3.5, .05, 3) * .8; return reverb(x, 3, .4, 900)
def s_boomwarm(): x = sweep(80, 40, 3) * env(3, .01, 4) * .6; x += sum(np.sin(2 * np.pi * f * t(3)) for f in (261.6, 329.6, 392)) * env(3, .3, 3) * .05; return reverb(x, 2.5, .45)
def s_whoosh(d=.6, rev=False):
    x = noise(d); u = np.linspace(0, 1, len(x)); out = np.zeros(len(x)); seg = 2400
    for i in range(0, len(x), seg): fc = 300 + 3500 * np.sin(np.pi * i / len(x)) ** 1.5; out[i:i + seg] = bp(x[i:i + seg], max(80, fc * .5), fc * 1.6, 1)
    out = out * np.sin(np.pi * u) ** 2 * .7; return out[::-1] if rev else out
def s_click(): return tickc() * 1.3
def s_marker(d=.35): return bp(noise(d), 1800, 7000) * (.6 + .4 * np.sin(2 * np.pi * 30 * t(d))) * adsr(d, .02, .1) * .35
def s_type(d, n):
    o = np.zeros(int((d + .3) * SR)); k = max(1, n)
    for i in range(k): tt = d * i / k + rng.random() * .01; c = lp(noise(.03), 400) * env(.03, .001, 10) * .4; c[:720] += hp(noise(.015), 2000) * env(.015, .0005, 8) * .6; add(o, c, tt)
    add(o, np.sin(2 * np.pi * 2093 * t(.6)) * env(.6, .002, 5) * .12, d)  # carriage bell
    return o
def s_tick(d):
    o = np.zeros(int((d + .3) * SR)); n = 26
    for k in range(n): u = k / n; add(o, tickc() * .7, d * (1 - (1 - u) ** 2.2))
    return o
def s_pop(): x = sweep(500, 900, .08) * env(.08, .002, 8) * .25; return x + s_paper(.15)[:len(x)] * .3
def s_drawer(): o = lp(noise(.7), 600) * adsr(.7, .05, .2) * .4; add(o, lp(noise(.08), 900) * env(.08, .001, 10) * .6, .6); return o
def s_drawerclose(): o = lp(noise(.4), 700) * adsr(.4, .02, .1) * .4; add(o, sweep(140, 60, .2) * env(.2, .001, 10) * .7, .35); return o
def s_flash(): o = np.zeros(int(1.2 * SR)); add(o, sweep(2500, 7000, .3) * np.linspace(0, 1, int(.3 * SR)) * .04, 0); add(o, hp(noise(.05), 1500) * env(.05, .0005, 10) * .8, .3); add(o, sweep(200, 60, .15) * env(.15, .001, 10) * .5, .3); return reverb(o, 1, .3)
def s_pageturn(): return s_paper(.7) * 1.4 + s_whoosh(.5)[:int(.7 * SR)].tolist() and s_paper(.7) * 1.4
def s_plane(): return s_whoosh(1.0) * .8
def s_tear(): x = noise(.7); cr = (rng.random(len(x)) < .03).astype(float); return bp(x * (.2 + np.convolve(cr, np.ones(40), 'same')), 800, 7000) * np.linspace(1, .3, len(x)) * .5
def s_crumple(): o = np.zeros(int(1.0 * SR)); [add(o, bp(noise(.04), 1000, 8000) * env(.04, .001, 8) * (.3 + rng.random() * .5), rng.random() * .9) for _ in range(60)]; return o
def s_folderflip(): o = s_whoosh(.5) * .6; add(o, lp(noise(.1), 800) * env(.1, .001, 10) * .7, .42); return o
def s_zoom(): a = s_whoosh(.9, True); o = np.zeros(int(1.5 * SR)); add(o, a, 0); add(o, s_hit() * .5, .8); return o
def s_mapunfold(): o = np.zeros(int(1.2 * SR)); [add(o, s_paper(.2) * 1.2, i * .13) for i in range(7)]; return o
def s_siren(d): x = t(d); f = 700 + 220 * np.sin(2 * np.pi * x / 3.0); s = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR); return reverb(lp(s, 1800) * np.minimum(1, x / 1.2) * np.minimum(1, (d - x) / 1.2) * .08, 2, .6)
def s_crowd(d): x = noise(d); y = bp(x, 250, 1800) * (.6 + .4 * np.sin(2 * np.pi * t(d) * .3)) * .05; o = y.copy(); tt = 0
def s_crowd(d):
    y = bp(noise(d), 250, 1800) * (.6 + .4 * np.sin(2 * np.pi * t(d) * .3)) * .05; tt = 0
    while tt < d - .1: add(y, lp(noise(.04), 1500) * env(.04, .001, 10) * .2, tt); tt += .23 + rng.random() * .3
    return y * np.minimum(1, t(d) / 1.2) * np.minimum(1, (d - t(d)) / 1.2)
def s_clock(d): o = np.zeros(int(d * SR)); [add(o, tickc() * .4, k) for k in np.arange(0, d - .05, 1.0)]; return o
def s_rain(d):
    y = lp(hp(noise(d), 400), 6000) * .05; m = (rng.random(len(y)) < .0015).astype(float); y += np.convolve(m, np.exp(-np.arange(300) / 40), 'same') * .05 * np.abs(rng.standard_normal(len(y)))
    return y * np.minimum(1, t(d) / 2) * np.minimum(1, (d - t(d)) / 2)
def s_sea(d): return lp(noise(d), 500) * (.5 + .5 * np.sin(2 * np.pi * t(d) / 2.5)) * .25 * adsr(d, .5, .8)
def s_car(d): x = t(d); u = x / d; g = np.exp(-((u - .5) / .2) ** 2); return lp(noise(d), 500) * g * .3
def s_scan(d): o = np.zeros(int(d * SR)); tt = 0
def s_scan(d):
    o = np.zeros(int((d + .2) * SR)); tt = 0
    while tt < d: add(o, np.sin(2 * np.pi * rng.choice([1320, 1760, 2093, 1568]) * t(.05)) * env(.05, .002, 6) * .06, tt); tt += .09 + rng.random() * .12
    return o
def s_shimmer(d): x = t(d); return sum(np.sin(2 * np.pi * f * x) * np.exp(-x * 1.2) for f in (1046, 1318, 1568, 2093)) * np.minimum(1, x / .05) * .04
def s_phone(d): x = t(d); s = (np.sin(2 * np.pi * 440 * x) + np.sin(2 * np.pi * 480 * x)) * (np.sin(2 * np.pi * 20 * x) > 0) * .04; return reverb(lp(s * ((x % 3) < 1.8), 3000), .8, .3)
def s_crutch(): o = np.zeros(int(.8 * SR)); [add(o, lp(noise(.05), 1800) * env(.05, .001, 10) * .6, k) for k in (0, .35)]; return reverb(o, .6, .25)
def s_papers(d): o = np.zeros(int((d + 1) * SR)); tt = 0
def s_papers(d):
    o = np.zeros(int((d + 1) * SR)); tt = 0
    while tt < d: add(o, s_paper(.25) * (.5 + rng.random()), tt); tt += .04 + rng.random() * .07
    return o * .7
def s_dissonance(d): x = t(d); return sum(np.sin(2 * np.pi * f * x) for f in (233, 247, 330, 349)) * adsr(d, .1, 1.5) * .03
def s_radio(d): x = noise(d); return bp(x, 600, 3000) * (rng.random(len(x)) < .7) * .03 * adsr(d, .1, .4)
def s_creak(d): x = t(d); s = signal.sawtooth(2 * np.pi * np.cumsum(90 + 40 * np.sin(2 * np.pi * x * .7)) / SR) * (.5 + .5 * (rng.random(len(x)) < .3)); return bp(s, 200, 1800) * np.sin(np.pi * x / d) * .06
def s_door(): o = np.zeros(int(1 * SR)); add(o, sweep(110, 50, .4) * env(.4, .002, 7) * .8, 0); add(o, hp(noise(.03), 2500) * env(.03, .001, 10) * .4, .12); return reverb(o, 1.2, .35)
def s_build(d): o = np.zeros(int((d + .6) * SR)); [add(o, (np.sin(2 * np.pi * (180 + k * 18) * t(.2)) + .4 * np.sin(2 * np.pi * (180 + k * 18) * 2.7 * t(.2))) * env(.2, .001, 9) * .22, d * k / 9) for k in range(9)]; return reverb(o, 1, .25)
def s_snip(): o = np.zeros(int(.15 * SR)); add(o, tickc() * 1.2, 0); add(o, tickc(), .06); return o
def s_lamp(): return tickc() * 1.2
def s_windows(d): o = np.zeros(int((d + 1) * SR)); [add(o, np.sin(2 * np.pi * f * t(.6)) * env(.6, .01, 4) * .05, i * d / 6) for i, f in enumerate((523, 659, 784, 880, 1046, 1318))]; return o
def s_endsoft(): return reverb(sum(np.sin(2 * np.pi * f * t(2.5)) for f in (261.6, 329.6, 392, 523)) * env(2.5, .02, 2.5) * .05, 2, .4)
def s_riser(d): x = t(d); n = len(x); u = x / d; return (_fix(lp(noise(d), 2500), n) * u ** 2 * .25 + _fix(sweep(200, 900, d), n) * u ** 2 * .08)
def s_hitcut(): return s_hit() * .8
def s_heartbeat(d, bpm0=60, bpm1=90): return np.zeros(int(d * SR))  # handled by music
SIMPLE = {'paper': lambda: s_paper(.6), 'paperslap': s_slap, 'stamp': s_stamp, 'stampbig': lambda: s_stampbig(), 'hit': s_hit, 'boom': s_boom, 'boomlow': s_boomlow, 'boomwarm': s_boomwarm,
          'whoosh': lambda: s_whoosh(.6), 'zoomwhoosh': s_zoom, 'flash': s_flash, 'pageturn': lambda: s_paper(.7) * 1.3, 'plane': s_plane, 'tear': s_tear, 'crumple': s_crumple, 'folderflip': s_folderflip, 'mapunfold': s_mapunfold,
          'pop': s_pop, 'marker': s_marker, 'thread': lambda: bp(noise(.5), 3000, 9000) * np.sin(np.pi * np.linspace(0, 1, int(.5 * SR))) * .08, 'drop': lambda: s_slap() * .8, 'pin': lambda: tickc() * .9, 'tickone': lambda: tickc() * .8,
          'tab': lambda: s_paper(.25), 'redact': lambda: s_tear()[:int(.3 * SR)] * .8, 'card': lambda: s_whoosh(.4) * .6 + 0, 'drawer': s_drawer, 'drawerclose': s_drawerclose, 'lampclick': s_lamp, 'door': s_door, 'snip': s_snip, 'crutch': s_crutch,
          'hitcut': s_hitcut, 'endsoft': s_endsoft}
def s_stampbig():
    a = s_stamp(); b = s_hit(); o = np.zeros(max(len(a), len(b))); o[:len(a)] += a; o[:len(b)] += b * .6; return o
DURED = {'type': lambda e: s_type(e['d'], e.get('n', 10)), 'tick': lambda e: s_tick(e['d']), 'siren': lambda e: s_siren(e['d']), 'crowd': lambda e: s_crowd(e['d']), 'clock': lambda e: s_clock(e['d']), 'rain': lambda e: s_rain(e['d']),
         'sea': lambda e: s_sea(e['d']), 'car': lambda e: s_car(e['d']), 'scan': lambda e: s_scan(e['d']), 'shimmer': lambda e: s_shimmer(e['d']), 'phone': lambda e: s_phone(e['d']), 'papers': lambda e: s_papers(e['d']),
         'dissonance': lambda e: s_dissonance(e['d']), 'radio': lambda e: s_radio(e['d']), 'creak': lambda e: s_creak(e['d']), 'build': lambda e: s_build(e['d']), 'windows': lambda e: s_windows(e['d']), 'riser': lambda e: s_riser(e['d']),
         'calendar': lambda e: s_papers(e['d']) * .5, 'nightamb': lambda e: lp(noise(e['d']), 300) * .04 * adsr(e['d'], 2, 2)}
GAIN = {'paper': .5, 'paperslap': .6, 'stamp': .7, 'stampbig': .75, 'hit': .6, 'boom': .75, 'boomlow': .85, 'boomwarm': .6, 'whoosh': .45, 'zoomwhoosh': .5, 'flash': .55, 'pageturn': .55, 'plane': .45, 'tear': .6, 'crumple': .6,
        'folderflip': .5, 'mapunfold': .5, 'pop': .5, 'marker': .55, 'thread': .5, 'drop': .55, 'pin': .4, 'tickone': .45, 'tab': .45, 'redact': .45, 'card': .45, 'drawer': .6, 'drawerclose': .6, 'lampclick': .5, 'door': .7, 'snip': .5,
        'crutch': .6, 'hitcut': .6, 'endsoft': .6, 'type': .5, 'tick': .45, 'siren': .7, 'crowd': .9, 'clock': .5, 'rain': .7, 'sea': .6, 'car': .6, 'scan': .55, 'shimmer': .7, 'phone': .7, 'papers': .55, 'dissonance': .8, 'radio': .7,
        'creak': .7, 'build': .55, 'windows': .6, 'riser': .7, 'calendar': .5, 'nightamb': 1.0}
MUSICAL = {'heartbeat', 'drone8', 'arp', 'warmstrings', 'pad', 'fadeTone', 'silence'}
def sfx():
    S = np.zeros(N + SR * 6); cache = {}
    for e in EV['events']:
        k = e['type']
        if k in MUSICAL: continue
        if k in SIMPLE:
            if k not in cache or k in ('crumple', 'papers', 'tear'): cache[k] = SIMPLE[k]()
            x = cache[k]
        elif k in DURED: x = DURED[k](e)
        else: print('unknown sfx', k); continue
        add(S, np.asarray(x, dtype=np.float64), e['t'], GAIN.get(k, .5))
    return S[:N]

if __name__ == '__main__':
    v = voice(); print('voice ok')
    m = music(); print('music ok')
    s = sfx(); print('sfx ok')
    np.save('a_voice.npy', v.astype(np.float32)); np.save('a_music.npy', m.astype(np.float32)); np.save('a_sfx.npy', s.astype(np.float32))
