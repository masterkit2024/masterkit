# Music + SFX + voice mix for "Сквозь пол". Output: build/mix.wav (48 kHz stereo)
import numpy as np, subprocess, os, json
from scipy.signal import lfilter, butter, sosfilt, fftconvolve
SR = 48000
DUR = 96.0
INS, DLY = 11.5, 6.9
V = lambda v: v if v < INS else v + DLY
rng = np.random.default_rng(7)
N = int(DUR * SR)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))
os.makedirs('build', exist_ok=True)

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
def add(bus, t, sig, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or len(sig) == 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i]
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        bus[i:i + len(sig), 0] += sig * gain * l * 1.414; bus[i:i + len(sig), 1] += sig * gain * r * 1.414
    else: bus[i:i + len(sig)] += sig * gain
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None, curve=6):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-t * curve / d) if r is None else e
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x)
def bp(x, f1, f2, o=2): return sosfilt(butter(o, [f1 / (SR / 2), min(f2, SR / 2 - 100) / (SR / 2)], 'band', output='sos'), x)
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def sweep(f0, f1, d, kind='exp'):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d) if kind == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def nm(s):  # 'A4' -> midi
    return NOTE[s[:-1]] + 12 * (int(s[-1]) + 1)
def sweepbp(x, f0, f1, q=4, blk=256):
    out = np.zeros_like(x); zi = None; n = len(x)
    for s in range(0, n, blk):
        k = s / n; fc = f0 * (f1 / f0) ** k; bw = fc / q
        b, a = butter(2, [max(20, fc - bw / 2) / (SR / 2), min(SR / 2 - 200, fc + bw / 2) / (SR / 2)], 'band')
        if zi is None: zi = np.zeros(max(len(a), len(b)) - 1)
        out[s:s + blk], zi = lfilter(b, a, x[s:s + blk], zi=zi)
    return out
def reverb(x, d=1.6, mix=.25):
    ir = noise(d) * np.exp(-tt(d) * 5 / d); ir = lp(ir, 6000); ir /= np.sqrt(np.sum(ir ** 2))
    out = np.zeros_like(x)
    for c in range(2): out[:, c] = fftconvolve(x[:, c], ir if c == 0 else np.roll(ir, 37), mode='full')[:len(x)]
    return x + out * mix

# ---------- instruments ----------
def kick(g=1): t = tt(.45); f = 45 + 110 * np.exp(-t * 28); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7); s[:200] += noise(200 / SR) * .3; return np.tanh(s * 1.6) * g
def snare(g=1): t = tt(.25); return (bp(noise(.25), 1500, 8000) * np.exp(-t * 18) * .9 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * .6) * g
def hat(g=1, open_=False): d = .25 if open_ else .06; return hp(noise(d), 7000) * np.exp(-tt(d) * (10 if open_ else 60)) * g
def clap(g=1):
    s = np.zeros(int(.3 * SR))
    for k, off in enumerate([0, .012, .024]): seg = bp(noise(.2), 900, 5000) * np.exp(-tt(.2) * (40 if k < 2 else 14)); i = int(off * SR); s[i:i + len(seg)] += seg[:len(s) - i]
    return s * g
def tom(m, g=1): t = tt(.6); f = mtof(m) * (1 + .6 * np.exp(-t * 20)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * g
def bass(m, d, g=1, cut=900):
    t = tt(d); f = mtof(m); s = 2 * ((t * f) % 1) - 1; s = lp(s, cut) * np.minimum(1, t / .005) * np.exp(-t * 2.5)
    s[-300:] *= np.linspace(1, 0, min(300, len(s))); return np.tanh(s * 1.5) * g
def pluck(m, d=.6, g=1, bright=.5):
    f = mtof(m); n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    buf = lp(buf, 2000 + bright * 8000) if p > 30 else buf
    # vectorized-ish Karplus-Strong
    y = np.zeros(n + p); y[:p] = buf
    for i in range(p, n + p): y[i] = .5 * (y[i - p] + y[i - p + 1]) * .996
    return y[p:] * g
def pizz(m, d=.25, g=1): t = tt(d); f = mtof(m); s = (np.sin(2 * np.pi * f * t) + .4 * np.sin(4 * np.pi * f * t) + .2 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 18); return s * g
def bell(m, d=1.2, g=1): t = tt(d); f = mtof(m); return sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3 + k * 2)) for k, a in [(1, 1), (2.76, .4), (5.4, .2)]) * g
def pad(ms, d, g=1, cut=2500):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.12, .0, .13): f = mtof(m + det); s += 2 * ((t * f + rng.random()) % 1) - 1
    s = lp(s, cut) / (len(ms) * 3); e = np.minimum(1, t / .4) * np.minimum(1, (d - t) / .5); return s * e * g
def wood(f=900, g=1): t = tt(.08); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t * 60) * g

CH = {'Am': ['A2', 'A3', 'C4', 'E4'], 'F': ['F2', 'F3', 'A3', 'C4'], 'C': ['C3', 'C4', 'E4', 'G4'], 'G': ['G2', 'G3', 'B3', 'D4'], 'Dm': ['D3', 'D4', 'F4', 'A4'], 'E': ['E2', 'E3', 'G#3', 'B3']}
BPM = 120; B = 60 / BPM

def section(t0, t1, style, prog, gain=1.0):
    bar = 4 * B; nb = int(np.ceil((t1 - t0) / bar))
    for bi in range(nb):
        ch = CH[prog[bi % len(prog)]]; root = nm(ch[0]); tones = [nm(x) for x in ch[1:]]
        for st in range(16):
            t = t0 + bi * bar + st * B / 4
            if t >= t1 - .02: break
            beat = st // 4; on = st % 4 == 0
            if style == 'playful':
                if on and beat in (0, 2): add(music, t, kick(.55), gain)
                if on and beat in (1, 3): add(music, t, snare(.28), gain)
                if st % 2 == 0: add(music, t, hat(.12), gain, pan=.3)
                if on: add(music, t, bass(root if beat % 2 == 0 else root + 7, B * .9, .45), gain)
                if st % 2 == 0: add(music, t, pluck(tones[(st // 2) % 3] + 12, .5, .28), gain, pan=-.25 + .5 * ((st // 2) % 2))
            elif style == 'suspense':
                if st % 2 == 0: add(music, t, bass(root - 12 + (0 if st % 4 == 0 else 12), B / 2 * .8, .38, cut=500), gain)
                if st % 4 == 2: add(music, t, hat(.09), gain, pan=.4)
                if st == 0: add(music, t, pad([tones[0], tones[1]], bar, .22, 1200), gain)
                if st in (6, 14): add(music, t, pizz(tones[2] + 12, .3, .18), gain, pan=-.4)
            elif style == 'fall':
                if on: add(music, t, kick(.8), gain)
                if on and beat in (1, 3): add(music, t, snare(.45), gain)
                add(music, t, hat(.1 if st % 2 else .14), gain, pan=.3)
                if st % 2 == 0: add(music, t, bass(root if st % 4 == 0 else root + 12, B / 2 * .9, .5, 1400), gain)
                if st == 0: add(music, t, pad(tones, bar, .3, 3000), gain)
                if st % 4 == 2: add(music, t, pluck(tones[(st // 4) % 3] + 24, .3, .2), gain, pan=-.3)
            elif style == 'dark':
                if st in (0, 3): add(music, t, kick(.7 if st == 0 else .45), gain)  # heartbeat
                if st == 0: add(music, t, pad([root, root + 7], bar, .3, 600), gain)
                if st == 8: add(music, t, bass(root - 12, B * 2, .35, 300), gain)
            elif style == 'epic':
                if on: add(music, t, kick(.85), gain)
                if on and beat in (1, 3): add(music, t, snare(.5), gain)
                if st in (14, 15): add(music, t, tom(nm('A2') - (st - 14) * 5, .5), gain, pan=-.3 + .6 * (st - 14))
                add(music, t, hat(.09), gain, pan=.35)
                if st % 2 == 0: add(music, t, bass(root, B / 2 * .9, .5, 1200), gain)
                if st == 0: add(music, t, pad(tones + [tones[0] + 12], bar, .42, 3500), gain)
                add(music, t, bell(tones[st % 3] + 24, .35, .07), gain, pan=-.5 + (st % 3) * .5)
            elif style == 'quirky':
                if st in (0, 8): add(music, t, wood(1000, .35), gain, pan=-.5)
                if st in (4, 12): add(music, t, wood(760, .35), gain, pan=.5)
                if st % 4 == 0: add(music, t, pizz(root + (0, 7, 12, 7)[beat], .3, .4), gain)
                if on and beat in (0, 2): add(music, t, kick(.45), gain)
                if st in (2, 10): add(music, t, pluck(tones[st % 3] + 12, .4, .2), gain)
            elif style == 'happy':
                if on: add(music, t, kick(.6), gain)
                if on and beat in (1, 3): add(music, t, clap(.4), gain)
                if st % 2 == 1: add(music, t, hat(.12), gain, pan=.3)
                if st % 2 == 0: add(music, t, bass(root if st % 8 < 4 else root + 7, B / 2 * .8, .45), gain)
                if st % 2 == 0: add(music, t, pluck(tones[(st // 2) % 3] + 12 + (12 if st % 8 == 6 else 0), .45, .26), gain, pan=-.3 + .6 * ((st // 2) % 2))
            elif style == 'sneaky':
                if st % 4 == 0: add(music, t, pizz((root, root + 3, root + 7, root + 6)[beat] , .22, .45), gain)
                if st in (2, 6, 10, 14): add(music, t, pizz(root + 12 + (st // 4) * 2, .15, .2), gain, pan=.4)
                if on and beat == 0: add(music, t, kick(.3), gain)
                if st in (4, 12): add(music, t, hat(.08), gain)

PLAY = ['Am', 'F', 'C', 'G']
section(0, 11.45, 'playful', PLAY)
add(music, 0, kick(.6))
section(18.35, 23.35, 'suspense', ['Am', 'Am', 'F', 'E'])
section(23.35, V(24.75), 'fall', ['Am', 'F', 'Dm', 'E'])
section(V(24.75), V(32.6), 'dark', ['Am', 'F', 'Dm', 'E'], .9)
section(V(40.85), V(55.4), 'epic', ['Am', 'F', 'C', 'G'])
section(V(57.05), V(64.1), 'quirky', ['Am', 'E'])
section(V(64.15), V(71.8), 'happy', ['C', 'G', 'Am', 'F'])
section(V(71.8), V(78.2), 'sneaky', ['Am', 'Am', 'Dm', 'E'], .9)
section(V(83.5), DUR, 'happy', ['C', 'G', 'Am', 'F'], .8)
# fade music tails at section ends (silences)
def duck_region(bus, a, b, fade=.3, depth=0.0):
    ia, ib, nf = int(a * SR), int(b * SR), int(fade * SR)
    g = np.ones(N); g[ia:ib] = depth
    g[max(0, ia - nf):ia] = np.linspace(1, depth, min(nf, ia))
    bus *= g[:, None]
duck_region(music, V(34.5), V(40.85), fade=1.3)   # "полная тишина": music dies out
duck_region(music, V(55.4), V(57.05), fade=.25)    # "секунда тишины"
duck_region(music, V(78.2), V(83.5), fade=.08)     # record scratch -> crickets

# ---------- SFX ----------
def whoosh(d=.5, f0=300, f1=3000, g=.5): x = sweepbp(noise(d), f0, f1, q=2.5); e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.5; return x * e * g
def phase(g=.5):
    d = 1.0; t = tt(d); s = sweep(260, 900, d) * np.exp(-t * 3) * .6 + np.sin(2 * np.pi * 1760 * t + 3 * np.sin(2 * np.pi * 7 * t)) * np.exp(-t * 4) * .25
    s += bp(noise(d), 2000, 9000) * np.exp(-t * 6) * .15; return s * g
def popfx(g=.4): return sweep(500, 1400, .09) * np.exp(-tt(.09) * 30) * g
def stamphit(g=.8): t = tt(.5); return (np.sin(2 * np.pi * np.cumsum(60 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 8) + lp(noise(.5), 3000) * np.exp(-t * 25) * .7) * g
def boom(g=1): t = tt(2.5); return np.tanh((np.sin(2 * np.pi * np.cumsum(32 + 80 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.6) + lp(noise(2.5), 400) * np.exp(-t * 2.5) * 1.2) * 1.3) * g
def splash(g=.8):
    t = tt(1.4); s = bp(noise(1.4), 500, 6000) * np.exp(-t * 3.2)
    for _ in range(10):
        d = sweep(900 + 600 * rng.random(), 2000, .06) * np.exp(-tt(.06) * 40); i = int(rng.random() * .9 * SR); s[i:i + len(d)] += d * .3
    return s * g
def slidewhistle(f0=1800, f1=250, d=.9, g=.35): t = tt(d); f = f0 * (f1 / f0) ** (t / d) * (1 + .02 * np.sin(2 * np.pi * 6 * t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .1) * g
def chaching(g=.4): return np.concatenate([bell(nm('E6'), .12, 1), bell(nm('B6'), .8, 1)]) * g + np.pad(hp(noise(.5), 6000) * np.exp(-tt(.5) * 9) * .4, (0, int(.42 * SR)))[:int(.92 * SR)] * g
def scratch(g=.6): d = .45; x = noise(d); t = tt(d); fc = 800 + 2500 * np.abs(np.sin(2 * np.pi * 3.2 * t)); s = sweepbp(x, 400, 4000, q=3) * (np.sin(2 * np.pi * 3.2 * t) ** 2); return s * g
def cricket(d, g=.12):
    t = tt(d); car = np.sin(2 * np.pi * 4600 * t); am = (np.sin(2 * np.pi * 30 * t) > .3) * ((t % .9) < .25); return car * am * g
def beep(d=.55, g=.3): t = tt(d); return np.sin(2 * np.pi * 1000 * t) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .01) * g
def seagull(g=.25): d = .5; t = tt(d); f = 1500 - 700 * t / d + 120 * np.sin(2 * np.pi * 14 * t); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * g
def alarm(d=.95, g=.18): t = tt(d); return np.sign(np.sin(2 * np.pi * 2100 * t)) * ((t * 8) % 1 < .5) * g
def clank(g=.4): t = tt(.6); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(523, 7), (1347, 9), (2210, 12), (3120, 15)]) * .3 * g
def click(g=.3): return hp(noise(.02), 2000) * np.exp(-tt(.02) * 200) * g
def heat(d, g=.25): t = tt(d); return lp(noise(d), 700) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3) * g
def wind(d, g=.3, f0=400, f1=1800): t = tt(d); return sweepbp(noise(d), f0, f1, q=1.5) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4) * g
def train(g=.5): d = 1.6; t = tt(d); rum = lp(noise(d), 250) * np.sin(np.pi * t / d) * 1.2; horn = (np.sign(np.sin(2 * np.pi * 311 * t)) + np.sign(np.sin(2 * np.pi * 370 * t))) * .12 * (t < .7) * np.minimum(1, t / .03); return (rum + lp(horn, 2500)) * g
def ding(m, g=.3): return bell(m, .7, g)

# timeline
add(sfx, 0, alarm())
add(sfx, .96, whoosh(.45, 300, 2500, .5)); add(sfx, 1.5, kick(.4))
add(sfx, .3, popfx(.3)); add(sfx, .4, popfx(.3), pan=.2)
add(sfx, 2.75, phase(.5)); add(sfx, 3.35, phase(.4), pan=.3)
add(sfx, 3.55, bell(nm('E6'), .8, .15))
for tw_ in [4.22, 5.78]: add(sfx, tw_ - .15, whoosh(.35, 400, 4000, .45))
add(sfx, 4.45, phase(.45), pan=-.2); add(sfx, 4.95, chaching(.35), pan=.3)
add(sfx, 6.7, phase(.45)); add(sfx, 7.62, stamphit(.6)); add(sfx, 7.65, ding(nm('C6'), .25))
add(sfx, 8.52 - .15, whoosh(.35, 300, 3000, .45))
add(sfx, 8.65, phase(.5)); add(sfx, 10.36, popfx(.35)); add(sfx, 10.4, bell(nm('A6'), .3, .1))
add(sfx, 11.45, whoosh(.4, 3000, 400, .55))
tf = load('assets/tf_audio.wav'); tf = tf[:int(6.42 * SR)]; tf[-int(.15 * SR):] *= np.linspace(1, 0, int(.15 * SR))
add(sfx, 11.55, tf, .55)
add(sfx, 17.95, whoosh(.4, 500, 5000, .55))
add(sfx, 18.62, stamphit(.8)); add(sfx, 18.62, boom(.35))
add(sfx, V(14.0), wind(2.6, .12, 150, 400))  # creeping floor glow
add(sfx, 23.35, slidewhistle(1600, 220, 1.0, .35)); add(sfx, 23.4, whoosh(.6, 200, 2500, .5))
add(sfx, 23.95, phase(.35)); add(sfx, 24.5, sweep(400, 120, 2.6) * np.exp(-tt(2.6) * 1.5) * .25)  # slow-mo groan
add(sfx, 26.0, bell(nm('E7'), .4, .12)); add(sfx, 26.3, bell(nm('C7'), .4, .1))  # spoon clink
add(sfx, 27.3, whoosh(.5, 200, 3000, .5)); add(sfx, 27.62, whoosh(.4, 300, 2000, .4), pan=-.3)
add(sfx, 27.9, train(.55), pan=-.3)
add(sfx, 28.6, wind(3.1, .35, 300, 2500))
add(sfx, 30.38, stamphit(.7))
add(sfx, 31.5, wind(5.0, .3, 2500, 500))
add(sfx, 31.65, boom(.3))
add(sfx, V(24.8), stamphit(.5)); add(sfx, V(28.25), stamphit(.65))
add(sfx, V(29.45) - .15, whoosh(.35, 400, 4000, .4))
add(sfx, V(29.6), bell(nm('A6'), 1.5, .08)); add(sfx, V(29.65), bell(nm('E7'), 1.5, .06))
add(sfx, V(31.25), whoosh(1.3, 2000, 150, .3))
for k in range(4): add(sfx, V(32.75) + k * .45, sweep(300, 180, .35) * np.exp(-tt(.35) * 6) * .2, pan=-.6 + k * .4)
add(sfx, V(36.2), lp(noise(4.5), 120) * np.minimum(1, tt(4.5) / 1.5) * np.minimum(1, (4.5 - tt(4.5)) / 1) * .12)  # faint void rumble
add(sfx, V(40.85), boom(1.0)); add(sfx, V(40.85), stamphit(.5))
add(sfx, V(41.0), wind(1.9, .25, 300, 1500))
add(sfx, V(43.25), whoosh(.3, 500, 3000, .35)); add(sfx, V(43.3), heat(2.3, .35))
add(sfx, V(44.2), stamphit(.5)); add(sfx, V(45.0), popfx(.3))
add(sfx, V(45.5), whoosh(.35, 3000, 300, .45)); add(sfx, V(45.6), wind(2.8, .45, 800, 3500))
add(sfx, V(46.72), stamphit(.55)); add(sfx, V(47.75), popfx(.3))
add(sfx, V(48.35), whoosh(.35, 3000, 300, .4))
add(sfx, V(51.7), whoosh(.3, 300, 3000, .4)); add(sfx, V(52.6), popfx(.3))
add(sfx, V(53.25), boom(.4)); add(sfx, V(53.4), splash(.9)); add(sfx, V(53.42), whoosh(.6, 300, 3000, .45))
add(sfx, V(54.28), stamphit(.55))
waves = lp(noise(3.6), 900) * (0.6 + .4 * np.sin(2 * np.pi * .5 * tt(3.6))) * np.minimum(1, tt(3.6) / .3) * np.minimum(1, (3.6 - tt(3.6)) / .3)
add(sfx, V(55.3), waves * .14)
add(sfx, V(55.6), seagull(.22), pan=.5); add(sfx, V(56.3), seagull(.2), pan=-.3)
add(sfx, V(57.05), slidewhistle(1500, 250, .9, .35)); add(sfx, V(58.12), splash(.8))
add(sfx, V(58.9), whoosh(.35, 400, 4000, .4))
for tt_, p in [(V(59.0), -.6), (V(59.6), .6)]: add(sfx, tt_, whoosh(.45, 300, 2500, .4), pan=p)
for k in range(10): add(sfx, V(60.4) + k * .22, whoosh(.18, 400, 2000, .15), pan=(-.5 if k % 2 else .5))
add(sfx, V(62.7), whoosh(.3, 300, 3000, .35)); add(sfx, V(62.92), stamphit(.55))
for k in range(4): add(sfx, V(62.75) + k * .62, wood(1100 if k % 2 == 0 else 800, .45), pan=(.4 if k % 2 else -.4))
add(sfx, V(64.05), whoosh(.3, 3000, 400, .4)); add(sfx, V(64.25), clank(.5))
add(sfx, V(64.9), whoosh(.3, 400, 3000, .35))
add(sfx, V(65.95), click(.5)); add(sfx, V(66.5), popfx(.3))
for k, tt_ in enumerate([V(68.08), V(68.72), V(69.2), V(69.92)]): add(sfx, tt_, ding(nm(['C6', 'E6', 'G6', 'C7'][k]), .28))
add(sfx, V(70.0), kick(.5))
add(sfx, V(71.0), stamphit(.5)); add(sfx, V(71.0), bell(nm('C7'), 1.2, .15)); add(sfx, V(71.05), bell(nm('G7'), 1.2, .1))
add(sfx, V(71.75), whoosh(.35, 400, 4000, .4))
add(sfx, V(73.9), popfx(.15))
add(sfx, V(75.1), phase(.5))
add(sfx, V(76.5), boom(.25))
add(sfx, V(78.2), scratch(.6))
add(sfx, V(78.6), cricket(5.0, .1), pan=.4); add(sfx, V(79.0), cricket(4.4, .07), pan=-.4)
add(sfx, V(79.62), stamphit(.6))
add(sfx, V(80.6), boom(.2))
add(sfx, V(81.5), sweep(900, 300, .5) * np.exp(-tt(.5) * 4) * .2)  # sock slide
add(sfx, V(82.2), kick(.3))
add(sfx, V(82.45), phase(.3))
add(sfx, V(83.46), beep(.6, .35)); add(sfx, V(83.46), stamphit(.5))
add(sfx, V(83.6), np.concatenate([bell(nm('C6'), .15, .1)]))
add(sfx, V(84.0), whoosh(.4, 300, 3000, .35))
for tt_ in [V(84.1), V(85.02), V(85.46)]: add(sfx, tt_ - .1, popfx(.3))
add(sfx, V(86.5), stamphit(.4)); add(sfx, V(86.5), bell(nm('E6'), .8, .15))

# ---------- voice ----------
vo = load('assets/voice.wav')
voice = np.zeros((N, 2)); cut = int(INS * SR)
add(voice, 0, vo[:cut]); add(voice, INS + DLY, vo[cut:])
# light voice EQ: high-pass + presence
for c in range(2): voice[:, c] = hp(voice[:, c], 80)
# ducking from voice envelope
vabs = np.abs(voice[:, 0]); win = int(.05 * SR); envv = np.convolve(vabs, np.ones(win) / win, mode='same')
envv = lfilter([1 - .9995], [1, -.9995], envv)  # smooth release
duck = 1 - .55 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 70) + 1e-9), 0, 1)
music *= duck[:, None]
music = reverb(music, 1.4, .18); sfx = reverb(sfx, 1.2, .15)
# levels
def rms(x): return np.sqrt(np.mean(x[np.abs(x) > 1e-5] ** 2) + 1e-12)
voice *= .22 / rms(voice[:, 0])
music *= .075 / rms(music)
sfx *= .6
mix = voice + music + sfx
mix[-int(.5 * SR):] *= np.linspace(1, 0, int(.5 * SR))[:, None]
peak = np.max(np.abs(mix)); print('peak', peak)
mix = mix / peak * .95
import wave
w = wave.open('build/mix_raw.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
for name, bus in [('music', music), ('sfx', sfx)]:
    w = wave.open(f'build/{name}.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(bus, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print('ok')
