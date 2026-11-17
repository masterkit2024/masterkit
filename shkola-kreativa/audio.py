"""Score + sound design for «Школа креатива». Everything synthesised, locked to cues.json.
Jazzy pizzicato / xylophone bed at 120 BPM (1 beat = 12 frames) + cartoon SFX.
Writes audio.wav (48 kHz stereo, -14 LUFS integrated, true peak <= -1.5 dBTP)."""
import json, numpy as np, os, sys
from scipy import signal
from scipy.ndimage import minimum_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, 'cues.json')))
SR = 48000; DUR = 10.0; N = int(SR * DUR)
FPS = CUE['fps']; BEAT = 60 / CUE['bpm']
fr = lambda f: f / FPS
rng = np.random.default_rng(7)
dry = np.zeros((2, N)); verb = np.zeros((2, N))

def midi(name):
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = names[name[0]]; i = 1
    while name[i] in '#b': n += 1 if name[i] == '#' else -1; i += 1
    return 12 * (int(name[i:]) + 1) + n
hz = lambda name: 440 * 2 ** ((midi(name) - 69) / 12)

def put(sig, t, gain=1.0, pan=0.0, rev=0.15):
    i = int(round(t * SR))
    if i >= N: return
    s = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    dry[0, i:i + len(s)] += s * l * 1.414; dry[1, i:i + len(s)] += s * r * 1.414
    verb[0, i:i + len(s)] += s * l * rev; verb[1, i:i + len(s)] += s * r * rev

T = lambda d: np.arange(int(d * SR)) / SR
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(d * SR))

# ---------------- instruments ----------------
def pizz(f0, d=0.9, bright=1.0, decay=0.55):
    t = T(d); x = np.zeros_like(t)
    for n in range(1, 16):
        if f0 * n > 12000: break
        amp = np.sin(n * np.pi * 0.17) / n ** (1.25 - 0.25 * bright)
        tau = decay / (1 + 0.55 * n)
        x += amp * np.sin(2 * np.pi * f0 * n * t * (1 + 0.0004 * n * n)) * np.exp(-t / tau)
    x += 0.4 * lp(noise(d), 1800) * np.exp(-t / 0.008)  # finger snap of the pluck
    return x * np.minimum(1, t / 0.002) / 2.0

def xylo(f0, d=0.8, hard=1.0):
    t = T(d); x = np.zeros_like(t)
    for ratio, a, tau in [(1, 1, .34), (3.0, .32 * hard, .11), (6.1, .12 * hard, .05), (9.8, .05 * hard, .025)]:
        x += a * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / tau)
    x += 0.25 * hard * bp(noise(d), 2500, 9000) * np.exp(-t / 0.004)
    return x * np.minimum(1, t / 0.0015) * 0.8

def bell(f0, d=1.6):
    t = T(d); x = np.zeros_like(t)
    for ratio, a, tau in [(1, 1, .9), (2.76, .45, .35), (5.4, .25, .16), (8.93, .12, .08)]:
        x += a * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / tau)
    return x * np.minimum(1, t / 0.001) * 0.6

def kick(d=0.35):
    t = T(d); ph = 2 * np.pi * np.cumsum(55 + 90 * np.exp(-t / 0.03)) / SR
    return np.sin(ph) * np.exp(-t / 0.13)

def brush(d=0.28, swish=0.06):
    t = T(d); return bp(noise(d), 900, 7000) * np.exp(-t / swish) * np.minimum(1, t / 0.012) * 0.6

def ride(d=0.7):
    t = T(d); x = hp(noise(d), 6500) * np.exp(-t / 0.035) * 0.5
    for f in [3150, 4410, 5730, 6990, 8120]: x += 0.07 * np.sin(2 * np.pi * f * t + f) * np.exp(-t / 0.35)
    return x

def crash(d=2.5):
    t = T(d); return (hp(noise(d), 3500) * 0.7 + bp(noise(d), 1500, 5000) * 0.4) * np.exp(-t / 0.6) * np.minimum(1, t / 0.002)

# ---------------- SFX ----------------
def whoosh(d, f_from, f_to, peak=0.5):
    t = T(d); n = noise(d); out = np.zeros_like(t); seg = 1024
    fc = np.geomspace(f_from, f_to, len(t))
    for i in range(0, len(t), seg):  # piecewise band-pass sweep
        c = fc[i]; out[i:i + seg] = bp(n[max(0, i - 2048):i + seg], c * 0.6, min(c * 1.6, 20000))[-len(out[i:i + seg]):]
    env = np.where(t < peak * d, (t / (peak * d)) ** 2, np.exp(-(t - peak * d) / (d * 0.22)))
    return out * env

def scribble(d, speed=None):
    t = T(d); x = bp(noise(d), 1800, 7000) * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 23 * t + 3 * np.sin(2 * np.pi * 5 * t))))
    grain = (rng.random(len(t)) > 0.996) * rng.standard_normal(len(t)) * 3; x += hp(grain, 2000)
    env = np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.03)
    if speed is not None: env *= speed(t / d)
    return x * env * 0.5

def tick():
    t = T(0.08); return (hp(noise(0.08), 2500) * np.exp(-t / 0.006) + 0.6 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.02))

def pop(f_hi=1100, f_lo=180, d=0.16):
    t = T(d); f = f_lo + (f_hi - f_lo) * np.exp(-t / 0.018)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) + 0.3 * hp(noise(d), 3000) * np.exp(-t / 0.003)

def boing(d=0.5):
    t = T(d); f = 140 + 320 * (1 - np.exp(-t / 0.05)) + 60 * np.sin(2 * np.pi * 17 * t) * np.exp(-t / 0.2)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR); x = np.tanh(2.2 * x) * np.exp(-t / 0.17)
    return x * np.minimum(1, t / 0.003) * 0.7

def thump(d=0.3):
    t = T(d); return np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-t / 0.04)) / SR) * np.exp(-t / 0.09) + 0.3 * lp(noise(d), 600) * np.exp(-t / 0.03)

def tok(f0=900):
    t = T(0.12); return (np.sin(2 * np.pi * f0 * t) + .4 * np.sin(2 * np.pi * f0 * 2.7 * t)) * np.exp(-t / 0.025) * 0.6

def splat(d=0.45):
    t = T(d); drop = np.sin(2 * np.pi * np.cumsum(500 + 1300 * (t / 0.06).clip(0, 1)) / SR) * np.exp(-t / 0.05)
    wet = bp(noise(d), 400, 3500) * np.exp(-t / 0.09) * np.minimum(1, t / 0.004)
    return 0.6 * drop + 0.7 * wet

def slide_whistle(d, f0=320, f1=1500):
    t = T(d); u = t / d; f = f0 * (f1 / f0) ** (u ** 1.6) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.15 * np.sin(4 * np.pi * np.cumsum(f) / SR) + 0.05 * bp(noise(d), 1000, 4000)
    return x * np.minimum(1, t / 0.05) * (0.35 + 0.65 * u)

def squeak(d):
    t = T(d); f = 900 + 300 * np.sin(2 * np.pi * 11 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) * 0.18 * np.minimum(1, t / 0.1)

def poof(d=1.4):
    t = T(d); body = lp(noise(d), 900, 3) * np.exp(-t / 0.22) * np.minimum(1, t / 0.006)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.3)
    air = hp(noise(d), 2500) * np.exp(-t / 0.08) * 0.5
    return 1.1 * body + 1.0 * boom + air

# ---------------- score ----------------
b = lambda n: n * BEAT  # beat -> seconds (beat 0 at t=0)
SW = 2 / 3 * BEAT       # swung offbeat
CHORDS = [  # (start beat, end beat, voicing)
    (1, 4, ['A3', 'C4', 'E4']), (4, 6, ['F#3', 'C4', 'E4']), (6, 8, ['F3', 'Bb3', 'D4']),
    (8, 11.66, ['E3', 'Bb3', 'D4']),
]
BASS = [(1, 'F2'), (2, 'A2'), (3, 'C3'), (4, 'D2'), (5, 'F#2'), (6, 'G2'), (7, 'Bb2'),
        (8, 'C2'), (9, 'E2'), (10, 'G2'), (11, 'Bb2')]
for beat, n in BASS: put(pizz(hz(n), 0.9, 0.8, 0.6), b(beat), 0.95, -0.1, 0.08)

# comping pizz chords on swung offbeats + downbeat stabs
for s, e, voic in CHORDS:
    beat = s
    while beat < e:
        for k, n in enumerate(voic):
            put(pizz(hz(n), 0.35, 1.0, 0.18), b(beat) + SW + k * 0.004, 0.32, 0.35 - 0.2 * k, 0.2)
        beat += 1

# drums (brush kit), swung ride, until the choke
choke_t = fr(CUE['choke'])
for beat in range(1, 12):
    t0 = b(beat)
    put(ride(), t0, 0.32, 0.45, 0.12)
    if t0 + SW < choke_t: put(ride(0.3), t0 + SW, 0.18, 0.45, 0.1)
    if beat % 2 == 0: put(brush(), t0, 0.55, -0.25, 0.15)
    if beat % 2 == 1: put(kick(), t0, 0.6, 0, 0.02)
# snare roll crescendo into the burst
t = fr(CUE['inflate'][0]); k = 0
while t < choke_t - 0.01:
    put(brush(0.12, 0.03), t, 0.12 + 0.5 * (t - fr(CUE['inflate'][0])), -0.2 + 0.4 * (k % 2), 0.15)
    t += 0.0625 if t < 5.4 else 0.0417; k += 1

# xylophone melody — answers the character's moves
MEL = [(fr(CUE['ting']), 'A6', .9), (1.5, 'C6', .7), (1.5 + SW, 'A5', .5),
       (2.0, 'F#5', .6), (2.0 + SW, 'A5', .5), (2.5, 'C6', .65), (3.0, 'Bb5', .6), (3.0 + SW, 'D6', .55), (3.5, 'G5', .7),
       (4.0, 'E5', .55), (4.0 + SW, 'G5', .5)]
for t, n, g in MEL: put(xylo(hz(n)), t, g, 0.25, 0.22)
# ta-da gliss at landing (4.5 s)
for i, n in enumerate(['C5', 'E5', 'G5', 'Bb5', 'C6', 'E6', 'G6', 'C7']): put(xylo(hz(n), 0.5, .8), fr(CUE['tadaLand']) + i * 0.028, 0.35 + 0.03 * i, -0.4 + 0.1 * i, 0.25)
# tension tremolo during inflate (C7 chord, getting faster)
t = fr(CUE['inflate'][0]) + 0.05; i = 0
while t < choke_t - 0.02:
    n = ['E6', 'Bb6', 'G6', 'C7'][i % 4]; put(xylo(hz(n), 0.25, .6), t, 0.12 + 0.25 * (t - 5), 0.3 * (1 if i % 2 else -1), 0.2)
    t += max(0.045, 0.11 - 0.07 * (t - 5)); i += 1

# BURST at 6.0: tutti hit (F6/9) + crash
tb = fr(CUE['burst'])
for n in ['F2', 'C3']: put(pizz(hz(n), 1.6, 1.2, 1.0), tb, 1.0, 0, 0.1)
for k, n in enumerate(['A3', 'D4', 'G4', 'C5']): put(pizz(hz(n), 0.8, 1.2, 0.4), tb + k * 0.006, 0.4, -0.3 + 0.2 * k, 0.25)
for k, n in enumerate(['F5', 'A5', 'C6', 'G6']): put(xylo(hz(n), 1.0, 1.2), tb + k * 0.012, 0.45, -0.3 + 0.2 * k, 0.3)
put(crash(1.6), tb, 0.42, 0.3, 0.22); put(kick(0.5), tb, 0.9, 0, 0.05)
# sparks shimmer (seeded random glock grains, thinning out)
for i in range(26):
    t = tb + 0.07 + 0.55 * (i / 26) ** 1.4 + rng.random() * 0.02
    n = ['F6', 'G6', 'A6', 'C7', 'D7', 'F7'][rng.integers(6)]
    put(bell(hz(n), 0.6), t, 0.10 * (1 - i / 30), rng.uniform(-0.8, 0.8), 0.4)
# light groove under the letters (bar 3), half-time
for beat in [13, 14, 15]:
    put(ride(0.4), b(beat), 0.18, 0.45, 0.12); put(pizz(hz(['A2', 'C3', 'E3'][beat - 13]), 0.8, .8, .5), b(beat), 0.55, -0.1, 0.08)
# letter plinks — one bell per letter, ascending F-major pentatonic
PENT = ['C5', 'D5', 'F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6', 'C7', 'D7', 'F7']
for i, f in enumerate(CUE['letters']): put(bell(hz(PENT[i]), 1.0), fr(f), 0.5, -0.6 + 1.2 * i / 12, 0.25); put(xylo(hz(PENT[i]), 0.3, 1.2), fr(f), 0.22, -0.6 + 1.2 * i / 12, 0.1)

# END: the O comes alive (8.0) — Fmaj9 roll + bass, ring out
to = fr(CUE['oPop'])
put(pop(1400, 300, 0.18), to, 0.55, 0, 0.1)
put(pizz(hz('F2'), 2.0, 1.0, 1.2), to, 1.0, 0, 0.1); put(pizz(hz('F1'), 2.0, 1.0, 1.2), to, 0.5, 0, 0.05)
for k, n in enumerate(['F4', 'A4', 'C5', 'E5', 'G5', 'A5', 'C6']):
    put(xylo(hz(n), 1.6, .9), to + k * 0.035, 0.38, -0.5 + k * 0.16, 0.35)
put(crash(2.0), to, 0.25, -0.3, 0.3); put(kick(0.4), to, 0.6, 0, 0.03)
put(ride(1.2), b(17), 0.12, 0.45, 0.2); put(ride(1.2), b(18), 0.1, 0.45, 0.2)

# ---------------- SFX on the cue sheet ----------------
put(whoosh(0.3, 6000, 900, 0.35), fr(CUE['whooshIn']), 0.75, 0.6, 0.1)
put(tick(), fr(CUE['tick']), 0.7, 0.1, 0.1)
s0, s1 = fr(CUE['scribble'][0]), fr(CUE['scribble'][1])
put(scribble(s1 - s0 + 0.02, lambda u: 0.4 + 0.6 * np.sin(np.pi * u)), s0, 0.55, 0.0, 0.08)
put(pop(), fr(CUE['pop']), 0.8, 0, 0.12)
put(whoosh(0.22, 1200, 6000, 0.4), fr(CUE['whooshOut']), 0.55, 0.7, 0.1)
put(boing(), fr(CUE['launch']), 0.55, 0, 0.12)
put(thump(), fr(CUE['land']), 0.8, 0, 0.05)
for i, f in enumerate(CUE['hops']): put(tok([780, 980, 1170][i]), fr(f), 0.4, [-0.4, 0.4, -0.3][i], 0.1)
put(splat(), fr(CUE['bigLand']), 0.6, 0, 0.12); put(thump(), fr(CUE['bigLand']), 0.5, 0, 0.05)
put(whoosh(0.5, 500, 3500, 0.55), fr(CUE['spinWhoosh']), 0.5, -0.3, 0.15)
put(whoosh(0.25, 2500, 700, 0.5), fr(CUE['spinSmear']), 0.45, 0.3, 0.15)
put(splat(), fr(CUE['tadaLand']), 0.6, 0, 0.12); put(thump(), fr(CUE['tadaLand']), 0.55, 0, 0.05)
i0, i1 = fr(CUE['inflate'][0]), choke_t
put(slide_whistle(i1 - i0), i0, 0.32, 0, 0.15); put(squeak(i1 - i0), i0, 1.0, 0.2, 0.1)
put(poof(), tb, 1.0, 0, 0.18)
put(whoosh(0.3, 5000, 1000, 0.4), fr(CUE['pencilIn']), 0.45, 0.6, 0.1)
u0, u1 = fr(CUE['underline'][0]), fr(CUE['underline'][1])
put(scribble(u1 - u0 + 0.02, lambda u: 0.5 + 0.5 * np.sin(np.pi * u)), u0, 0.45, 0.2, 0.08)
tbl = fr(CUE['blink'])
put(bell(hz('A6'), 0.8), tbl, 0.18, -0.1, 0.4); put(bell(hz('E7'), 0.8), tbl + 0.09, 0.14, 0.1, 0.4)
# small sparkle twinkles on the end card
for k, t in enumerate([8.3, 8.55, 9.6]): put(bell(hz(['C7', 'G7', 'D7'][k]), 0.5), t, 0.07, [-0.6, 0.6, -0.3][k], 0.5)

# choke: hold breath before the burst (gate everything that's already written)
gate = np.ones(N); a, z = int(choke_t * SR), int(tb * SR)
gate[a:z] = np.linspace(1, 0, z - a) ** 6
dry *= gate; verb *= gate
put(slide_whistle(tb - choke_t, 1500, 1900) * 0.6, choke_t, 0.3, 0, 0.1)  # whistle keeps rising through the gap

# ---------------- reverb (decorrelated stereo noise IR) ----------------
irl = 1.4; ti = T(irl)
IR = [lp(rng.standard_normal(len(ti)), 6000) * np.exp(-ti / 0.32) for _ in range(2)]
IR = [ir / np.sqrt(np.sum(ir ** 2)) for ir in IR]
mix = dry.copy()
for c in range(2): mix[c] += signal.fftconvolve(verb[c], IR[c])[:N] * 0.9
mix = hp(mix, 28)  # rumble filter (applied per channel along last axis)

# ---------------- mastering: BS.1770 loudness + true-peak limiter ----------------
def lufs(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=1), axis=1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([np.sum(np.mean(y[:, i:i + blk] ** 2, axis=1)) for i in range(0, y.shape[1] - blk + 1, hop)])
    L = -0.691 + 10 * np.log10(ms + 1e-12)
    g1 = ms[L > -70]; rel = -0.691 + 10 * np.log10(np.mean(g1)) - 10
    return -0.691 + 10 * np.log10(np.mean(ms[(L > -70) & (L > rel)]))
def true_peak(x): return 20 * np.log10(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=1))) + 1e-12)
def limiter(x, ceil_db=-1.6, look=0.002, rel=0.06):
    thr = 10 ** (ceil_db / 20); up = np.abs(signal.resample_poly(x, 4, 1, axis=1)).max(axis=0)
    pk = up.reshape(-1, 4).max(axis=1)[:x.shape[1]]
    g = np.minimum(1, thr / (pk + 1e-12)); L = int(look * SR)
    g = minimum_filter1d(g, size=2 * L + 1, origin=0); g = np.concatenate([g[L:], np.ones(L)])
    out = np.empty_like(g); cur = 1.0; k = np.exp(-1 / (rel * SR))
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else k * cur + (1 - k) * g[i]; out[i] = cur
    gs = np.convolve(out, np.ones(L) / L, mode='same'); gs = np.minimum(gs, out)
    return x * gs
fade = np.ones(N); fl = int(0.35 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2
mix *= fade
x = mix / np.max(np.abs(mix))
g0 = None
for it in range(5):
    x = x * 10 ** ((-14.0 - lufs(x)) / 20)
    if it == 0: print('pre-limiter true peak at -14 LUFS: %.2f dBTP' % true_peak(x))
    x = limiter(x)
print('integrated LUFS %.2f  true peak %.2f dBTP' % (lufs(x), true_peak(x)))
from scipy.io import wavfile
wavfile.write(os.path.join(HERE, 'audio.wav'), SR, (np.clip(x, -1, 1).T * 32767).astype(np.int16))
