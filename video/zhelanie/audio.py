# Music + SFX + voice mix for "Сквозь пол". Output: build/mix.wav (48 kHz stereo)
import numpy as np, subprocess, os, json
from scipy.signal import lfilter, butter, sosfilt, fftconvolve
SR = 48000
DUR = 131.6
import sys; sys.path.insert(0, 'assets')
from timeline import V, CUTS, clip_starts
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


def duck_region(bus, a, b, fade=.3, depth=0.0):
    ia, ib, nf = int(a * SR), int(b * SR), int(fade * SR)
    g = np.ones(N); g[ia:ib] = depth
    g[max(0, ia - nf):ia] = np.linspace(1, depth, min(nf, ia))
    bus *= g[:, None]
CL = clip_starts()
section(0, 4.4, 'suspense', ['Am', 'F'], 1.0)
section(4.4, 25.9, 'happy', ['C', 'G', 'Am', 'F'])
section(25.9, 29.4, 'suspense', ['Am', 'E'], 1.0)
section(29.87, 41.5, 'fall', ['Am', 'F', 'Dm', 'E'])
section(42.8, 45.9, 'dark', ['Am', 'E'], .9)
section(45.9, 48.4, 'quirky', ['C', 'G'])
section(48.4, 51.5, 'suspense', ['Am', 'E'])
section(51.5, 64.82, 'sneaky', ['Am', 'Am', 'Dm', 'E'])
section(64.82, 76.9, 'fall', ['Am', 'F', 'C', 'G'], .9)
section(76.9, 84.36, 'sneaky', ['Am', 'Dm'], .8)
section(87.4, 101.7, 'quirky', ['Am', 'E'])
section(101.7, 109.2, 'dark', ['Am', 'F'], .7)
section(109.2, 114.0, 'suspense', ['F', 'C'], .7)
section(114.0, 122.1, 'suspense', ['Am', 'E'])
section(122.1, DUR, 'happy', ['C', 'G', 'Am', 'F'], .9)
duck_region(music, 41.55, 42.8, fade=.12)   # тишина
duck_region(music, 29.4, 29.87, fade=.15)   # "И…"
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


def buzz(d=.9, g=.35): t = tt(d); return np.sign(np.sin(2 * np.pi * 150 * t)) * (np.sin(2 * np.pi * 9 * t) > 0) * lp(np.ones(len(t)), 50) * g
def crackle(d, g=.25):
    s = np.zeros(int(d * SR))
    for _ in range(int(d * 40)): i = int(rng.random() * (len(s) - 2000)); s[i:i + 600] += hp(noise(600 / SR), 2000) * np.exp(-tt(600 / SR) * 120) * rng.random()
    return (s + lp(noise(d), 500) * .5) * g
def fail(g=.3): t = tt(.5); return np.sign(np.sin(2 * np.pi * 110 * t)) * ((t % .25) < .18) * g
def siren(d=1.3, g=.3): t = tt(d); f = 700 + 250 * np.sign(np.sin(2 * np.pi * 2 * t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * g
def snap(g=.5): return hp(noise(.06), 1500) * np.exp(-tt(.06) * 70) * g
def tick(g=.3): return wood(2200, g)
def beepbeep(g=.3): return np.concatenate([beep(.18, g), np.zeros(int(.1 * SR)), beep(.18, g)])
def rattle(d=.8, g=.4): t = tt(d); return bp(noise(d), 300, 2500) * (np.sin(2 * np.pi * 28 * t) > 0) * np.exp(-t * 2) * g
def party(g=.3): t = tt(.5); return (np.sign(np.sin(2 * np.pi * np.cumsum(500 + 300 * t) / SR)) * .5 + bp(noise(.5), 1000, 4000)) * np.exp(-t * 4) * g
def chime(g=.2):
    s = np.zeros(int(.9 * SR))
    for i, n in enumerate(['C6', 'E6', 'G6', 'C7']): b_ = bell(nm(n), .6, 1); j = int(i * .07 * SR); s[j:j + len(b_)] += b_[:len(s) - j]
    return s * g
def boink(g=.4): return sweep(200, 700, .25) * np.exp(-tt(.25) * 8) * g
# transitions whooshes
for tw_ in [4.4, 17.45, 33.07, 37.15, 51.5, 64.82, 71.3, 76.9, 101.7, 109.2, 114.0, 123.1]: add(sfx, tw_ - .18, whoosh(.36, 400, 4000, .4))
add(sfx, 0, boom(.45)); add(sfx, .05, popfx(.3)); add(sfx, 2.6, stamphit(.5))
for k in range(4): add(sfx, k * .5 + .25, beep(.08, .05))
add(sfx, 5.5, buzz(1.1, .3)); add(sfx, 6.2, whoosh(.5, 300, 3000, .45))
for tt_ in [7.16, 8.04, 10.52, 12.48, 15.68, 16.76]: add(sfx, tt_, popfx(.35))
add(sfx, 7.16, party(.3)); add(sfx, 15.68, stamphit(.35)); add(sfx, 16.76, stamphit(.4))
add(sfx, 18.84, popfx(.3)); add(sfx, 19.5, whoosh(.3, 600, 2000, .3))
for k in range(4): add(sfx, 20.0 + k * .32, kick(.15))
add(sfx, 21.6, popfx(.3)); add(sfx, 23.1, sweep(300, 600, .4) * .1)
add(sfx, 25.1, popfx(.35)); add(sfx, 25.5, chime(.3))
for tt_ in [26.32, 27.68, 28.8]: add(sfx, tt_, tick(.5)); add(sfx, tt_, stamphit(.25))
add(sfx, 29.87, boom(.6)); add(sfx, 29.9, crackle(11.5, .2)); add(sfx, 30.0, whoosh(.5, 200, 3000, .4))
for k in range(3): add(sfx, 33.3 + k * .35 + .65, clank(.35), pan=-.3 + k * .3)
for k in range(6): add(sfx, 33.1 + k * .5, kick(.2))
add(sfx, 34.6, lp(noise(2.5), 120) * np.exp(-tt(2.5) * 1.2) * .8); add(sfx, 34.7, sum(seagull(.1) for _ in range(1)), pan=.4)
add(sfx, 35.44, stamphit(.6)); add(sfx, 37.4, popfx(.3))
add(sfx, 40.4, chime(.3))
add(sfx, 42.2, popfx(.15))
add(sfx, 43.6, stamphit(.5)); add(sfx, 45.9, bell(nm('E6'), 1.2, .15))
for tt_ in [45.96, 46.92, 47.56]: add(sfx, tt_, ding(nm('G6'), .2)); add(sfx, tt_, popfx(.2))
add(sfx, 48.4, whoosh(.3, 300, 2500, .35)); add(sfx, 49.2, sweep(1200, 200, .5) * np.exp(-tt(.5) * 3) * .3); add(sfx, 49.65, kick(.5))
add(sfx, 50.32, stamphit(.6))
for tt_ in [52.8, 53.6]: add(sfx, tt_, popfx(.3))
add(sfx, 56.17, boink(.4)); add(sfx, 56.4, fail(.18)); add(sfx, 56.93, boink(.35)); add(sfx, 57.1, fail(.18)); add(sfx, 57.95, fail(.2))
add(sfx, 60.4, popfx(.3)); add(sfx, 63.6, chime(.3))
add(sfx, 64.85, popfx(.3)); add(sfx, 65.6, lp(noise(1.1), 300) * .15)
add(sfx, 66.75, popfx(.5)); add(sfx, 66.8, boom(.35))
add(sfx, 68.98, stamphit(.6)); add(sfx, 70.1, stamphit(.5))
for k in range(12): add(sfx, 70.1 + k * .5, beep(.12, .06), pan=(-.3 if k % 2 else .3))
for tt_ in [72.38, 72.86, 73.84]: add(sfx, tt_, chime(.2))
add(sfx, 74.2, fail(.2))
add(sfx, 77.0, beepbeep(.15)); add(sfx, 80.1, popfx(.3)); add(sfx, 82.15, popfx(.2))
for k in range(10): add(sfx, 84.4 + k * .3, tick(.35))
add(sfx, 87.4, popfx(.35)); add(sfx, 87.5, siren(1.4, .3))
add(sfx, 90.24, snap(.7)); add(sfx, 91.6, popfx(.3)); add(sfx, 92.6, boink(.3)); add(sfx, 93.4, popfx(.3))
add(sfx, 97.3, whoosh(.4, 300, 2000, .4)); add(sfx, 97.9, splash(.25))
add(sfx, 98.85, whoosh(.4, 300, 2000, .4)); add(sfx, 99.45, clank(.6))
add(sfx, 100.4, lp(noise(1.2), 200) * .3); add(sfx, 100.6, beepbeep(.2))
add(sfx, 102.57, bell(nm('A7'), .3, .1))
add(sfx, 104.0, popfx(.25)); add(sfx, 108.09, rattle(.8, .5)); add(sfx, 108.09, stamphit(.6))
add(sfx, 111.2, popfx(.25)); add(sfx, 112.5, whoosh(.6, 2000, 400, .25)); add(sfx, 112.9, popfx(.2))
add(sfx, 113.85, buzz(.8, .3))
for tt_ in [114.56, 117.36]: add(sfx, tt_, popfx(.35))
add(sfx, 122.1, boom(.7)); add(sfx, 122.1, stamphit(.6))
add(sfx, 123.1, lp(noise(8.5), 180) * (0.7 + .3 * np.sin(2 * np.pi * 1.1 * tt(8.5))) * .22)
for k in range(6): add(sfx, 124.1 + k * .22, popfx(.15))
for tt_ in [127.04, 127.6, 128.1, 128.9]: add(sfx, tt_ - .1, popfx(.3))
# ---------- voice + clips ----------
vo = load('assets/voice.wav')
voice = np.zeros((N, 2))
pos = 0.0; off = 0.0
for (c, r, L), cs in zip(CUTS, clip_starts()):
    add(voice, pos + off, vo[int(pos * SR):int(c * SR)])
    off += (c + .05 + L + .15) - r; pos = r
add(voice, pos + off, vo[int(pos * SR):])
clipfiles = ['assets/clip_3385eb16.mp3', 'assets/clip_09eeeec9.mp3', 'assets/clip_8216186f.mp3']
for cs, f in zip(clip_starts(), clipfiles):
    cl = load(f); cl = cl / (np.sqrt(np.mean(cl[np.abs(cl) > 1e-4] ** 2)) + 1e-9) * np.sqrt(np.mean(vo[np.abs(vo) > 1e-4] ** 2)) * 1.15
    add(voice, cs, cl)
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
