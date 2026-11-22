"""Builds the full soundtrack: voice + KTK clip audio + synthesized music + SFX -> build/mix.wav
All event times are film seconds; voice-time events converted with W2T."""
import json, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
TL = json.load(open('timeline.json'))
DUR = TL['duration']
N = int(DUR * SR)
KS, KD = TL['ktkStart'], TL['ktkDur']
KE = KS + KD
W2T = lambda w: w if w < KS else w + KD
rng = np.random.default_rng(7)

def read_wav(p):
    with wave.open(p) as f:
        ch, n = f.getnchannels(), f.getnframes()
        a = np.frombuffer(f.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    return a.reshape(-1, ch)

def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)

def add(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    if i < 0: sig = sig[-i:]; i = 0
    j = min(len(buf), i + len(sig))
    if j > i: buf[i:j] += sig[:j - i] * gain

def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)

def midi(m): return 440 * 2 ** ((m - 69) / 12)

# ------------------------------------------------------------------ voice + KTK
voice = np.zeros((N, 2), np.float32)
v = read_wav('build/voice48.wav')[:, 0]
cut = int(KS * SR)
fade = lambda x, a, b: x * np.concatenate([np.linspace(0, 1, int(a * SR)), np.ones(len(x) - int(a * SR) - int(b * SR)), np.linspace(1, 0, int(b * SR))])
add(voice, fade(v[:cut], .005, .05), 0)
add(voice, fade(v[cut:], .05, .3), KE)
ktk = read_wav('build/ktk48.wav')
ktk = ktk[:int(KD * SR)] * 1.35
ktk = ktk * fade(np.ones(len(ktk)), .06, .35)[:, None]
clip = np.zeros((N, 2), np.float32); add(clip, ktk, KS)

# voice envelope for ducking
venv = np.abs(voice[:, 0])
k = int(.04 * SR); venv = np.convolve(venv, np.ones(k) / k, 'same')
venv = np.clip(venv / (np.percentile(venv[venv > 1e-3], 90) + 1e-6), 0, 1)
# smooth with fast attack / slow release
def follow(x, att=.03, rel=.45):
    step = 64; xs = x[::step]; y = np.zeros_like(xs); a_ = np.exp(-step / (att * SR)); r_ = np.exp(-step / (rel * SR)); c = 0
    for i, s in enumerate(xs):
        c = a_ * c + (1 - a_) * s if s > c else r_ * c + (1 - r_) * s
        y[i] = c
    return np.repeat(y, step)[:len(x)]
duck = 1 - .5 * follow(venv)

# ------------------------------------------------------------------ music
BPM = 90; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = [(50, [50, 57, 62, 65, 69]), (46, [46, 53, 58, 62, 65]), (41, [41, 48, 53, 57, 60]), (48, [48, 55, 60, 64, 67])]  # Dm Bb F C
music = np.zeros((N, 2), np.float32)

def saw(f, n, harm=10, det=(0, 0.06, -0.07)):
    t = np.arange(n) / SR; out = np.zeros(n, np.float32)
    for d in det:
        ff = f * 2 ** (d / 12)
        for h in range(1, harm + 1):
            if ff * h > 7000: break
            out += np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6.28)) / h ** 1.3
    return out / len(det)

def pad_section(t0, t1, gain=.12, bright=6, origin=0.0):
    """pad chords on the music grid that starts at `origin`"""
    chord_len = 2 * BAR
    k0 = int(np.floor((t0 - origin) / chord_len))
    t = origin + k0 * chord_len
    while t < t1:
        root, notes = PROG[k0 % 4]
        n = int((chord_len + 1.2) * SR)
        sig = np.zeros(n, np.float32)
        for m in notes:
            sig += saw(midi(m), n, harm=bright) * (1.0 if m < 60 else .7)
        e = np.minimum(1, np.arange(n) / SR / .9) * np.minimum(1, (n - np.arange(n)) / SR / 1.2)
        sig = lp(sig * e, 1800)
        st = np.stack([sig, np.roll(sig, int(.011 * SR))], 1)
        seg_s, seg_e = max(t, t0), min(t + chord_len + 1.2, t1)
        a = int((seg_s - t) * SR); b = int((seg_e - t) * SR)
        if b > a:
            part = st[a:b].copy(); L = len(part)
            fi = min(L, int(.6 * SR)); part[:fi] *= np.linspace(0, 1, fi)[:, None]
            fo = min(L, int(.8 * SR)); part[-fo:] *= np.linspace(1, 0, fo)[:, None]
            add(music, part, seg_s, gain)
        t += chord_len; k0 += 1

def kick(gain=.5):
    n = int(.5 * SR); t = np.arange(n) / SR
    f = 46 + 80 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7) + .3 * lp(rng.standard_normal(n), 2000) * np.exp(-t * 60)) * gain

def hat(gain=.08):
    n = int(.08 * SR); return hp(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR * 60) * gain

def pluck(f, gain=.12, dec=1.1):
    n = int(dec * 2.5 * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + .12 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6))
    return s * env_ad(n, .004, dec) * gain

def bass_pulse(f, gain=.22):
    n = int(BEAT / 2 * SR * .95); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)
    return lp(s * env_ad(n, .01, .18), 400) * gain

def groove(t0, t1, origin, kick_g=.45, hat_g=.05, bass_g=.2, pluck_g=0, kicks=(0, 2), fade_in=1.0):
    b = int(np.ceil((t0 - origin) / BEAT - 1e-6))
    while True:
        tb = origin + b * BEAT
        if tb >= t1: break
        bar_i = int(np.floor(b / 4)); beat_in = b % 4
        root, notes = PROG[(bar_i // 2) % 4]
        fi = min(1, (tb - t0) / fade_in + .15)
        if kick_g and beat_in in kicks: add(music, kick(kick_g * fi), tb)
        if hat_g: add(music, hat(hat_g * fi), tb + BEAT / 2, pan=.3)
        if bass_g:
            for h in (0, .5): add(music, bass_pulse(midi(root - 12), bass_g * fi), tb + h * BEAT)
        if pluck_g:
            seq = [notes[2] + 12, notes[3] + 12, notes[4] + 12, notes[3] + 12]
            add(music, pluck(midi(seq[beat_in]), pluck_g * fi), tb, pan=(-.3 if beat_in % 2 else .3))
            if beat_in == 1: add(music, pluck(midi(seq[0] + 7), pluck_g * .5 * fi), tb + BEAT / 2, pan=.5)
        b += 1

O1 = 0.0          # grid before KTK
O2 = KE           # grid after KTK (re-entry on downbeat)
# A
pad_section(0, 14.4, .10, 5, O1)
groove(2.78, 13.95, O1, kick_g=0, hat_g=0, bass_g=0, pluck_g=.07)
# B
pad_section(13.6, KS + .4, .11, 7, O1)
groove(14.0, KS - .1, O1, kick_g=.42, hat_g=.035, bass_g=.17, pluck_g=0)
# D
pad_section(KE, W2T(47.4), .10, 6, O2)
groove(KE + .1, W2T(47.3), O2, kick_g=.32, hat_g=.03, bass_g=.12, pluck_g=.055, kicks=(0,))
# E
pad_section(W2T(47.2), W2T(82.0), .10, 7, O2)
groove(W2T(47.3), W2T(81.9), O2, kick_g=.40, hat_g=.045, bass_g=.16, pluck_g=.06)
# F (drop): pad + drone + ticks
pad_section(W2T(81.8), W2T(96.3), .08, 4, O2)
n = int((W2T(96.3) - W2T(81.8)) * SR); t = np.arange(n) / SR
drone = lp(saw(midi(38), n, 6), 500) * np.minimum(1, t / 1.5) * np.minimum(1, (n / SR - t) / .6)
add(music, drone, W2T(81.8), .16)
b0 = int(np.ceil((W2T(81.9) - O2) / BEAT))
for b in range(b0, int((W2T(96.0) - O2) / BEAT)):
    tick = bp(rng.standard_normal(int(.03 * SR)), 2500, 6000) * np.exp(-np.arange(int(.03 * SR)) / SR * 150)
    add(music, tick, O2 + b * BEAT, .14, pan=(.4 if b % 2 else -.4))
# G (rising)
pad_section(W2T(96.0), W2T(127.2), .11, 8, O2)
groove(W2T(96.15), W2T(126.8), O2, kick_g=.46, hat_g=.05, bass_g=.19, pluck_g=.04, kicks=(0, 2), fade_in=.5)
groove(W2T(118.3), W2T(126.8), O2, kick_g=.25, hat_g=.03, bass_g=0, pluck_g=0, kicks=(1, 3))
# H: pad + pluck, final chord
pad_section(W2T(126.9), W2T(144.9), .10, 6, O2)
groove(W2T(127.0), W2T(134.3), O2, kick_g=0, hat_g=0, bass_g=.10, pluck_g=.05)
groove(W2T(134.4), W2T(144.7), O2, kick_g=.30, hat_g=.025, bass_g=.12, pluck_g=.05, kicks=(0,))
# final Dm chord swell & ring
tf = W2T(144.85); n = int((DUR - tf) * SR); t = np.arange(n) / SR
ch = sum(saw(midi(m), n, 6) for m in [38, 50, 57, 62, 65, 69])
ch = lp(ch, 1500) * np.minimum(1, t / .3) * np.exp(-t / 2.6)
add(music, ch, tf, .09)
for i, m in enumerate([62, 65, 69, 74]): add(music, pluck(midi(m), .09, 2.2), tf + .05 + i * .14, pan=(-.4 + i * .27))

# no music during KTK (fade out / in)
mg = np.ones(N, np.float32); tt = np.arange(N) / SR
mg *= np.clip(1 - (tt - (KS - .35)) / .7, 0, 1) + np.clip((tt - KE + .05) / .4, 0, 1) * (tt > KE - .2)
mg = np.clip(mg, 0, 1)
music *= (mg * duck)[:, None]

# ------------------------------------------------------------------ SFX
sfx = np.zeros((N, 2), np.float32)
def noise(n): return rng.standard_normal(n).astype(np.float32)
def whoosh(dur=.7, lo=300, hi=4000, gain=.25, up=True):
    n = int(dur * SR); x = noise(n); out = np.zeros(n, np.float32); seg = 1024
    for i in range(0, n, seg):
        k = i / n; fc = lo * (hi / lo) ** (k if up else 1 - k)
        out[i:i + seg] = lp(x[max(0, i - 4096):i + seg], min(fc, 18000))[-len(out[i:i + seg]):]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return out * e * gain
def boom(gain=.7, f0=55, dec=1.4):
    n = int(dec * 3 * SR); t = np.arange(n) / SR
    f = f0 + 70 * np.exp(-t * 18); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    s += lp(noise(n), 900) * np.exp(-t * 14) * .5 + hp(noise(n), 3000) * np.exp(-t * 40) * .25
    return s * gain
def thud(gain=.5):
    n = int(.6 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 9)
    s += bp(noise(n), 200, 1800) * np.exp(-t * 22) * .6
    return s * gain
def click(gain=.25, f=2600):
    n = int(.05 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + bp(noise(n), 2000, 9000) * np.exp(-t * 200) * .5) * gain
def chime(f=1760, gain=.12, dec=1.6):
    n = int(dec * 3 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * r * t) * np.exp(-t / (dec / r ** .5)) * a for r, a in [(1, 1), (2.76, .35), (5.4, .15)])
    return s * env_ad(n, .002, 10) * gain
def riser(dur=1.8, gain=.25):
    n = int(dur * SR); k = np.linspace(0, 1, n)
    s = whoosh(dur, 200, 9000, 1, True) * (k ** 2) / (np.sin(np.pi * k) ** 1.6 + 1e-3) * np.sin(np.pi * np.minimum(k, .97) / .97 * .5) ** 0
    s = np.clip(s, -3, 3) * k ** 1.5
    return s / (np.abs(s).max() + 1e-6) * gain
def rustle(dur=.8, gain=.2):
    n = int(dur * SR); x = bp(noise(n), 1500, 8000)
    am = np.abs(lp(noise(n), 30)); am /= am.max()
    return x * am * np.sin(np.pi * np.linspace(0, 1, n)) * gain
def metal(gain=.25):
    n = int(1.2 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(820, 6), (1330, 8), (2210, 10), (3170, 14)])
    return (s * .3 + bp(noise(n), 3000, 9000) * np.exp(-t * 50)) * gain

E = []  # (time, sig, gain, pan)
E += [(0.7, riser(2.0, .28), 1, 0), (2.76, boom(.9, 50, 1.6), 1, 0), (3.0, chime(1318, .09, 2.2), 1, .2), (3.35, whoosh(.5, 800, 6000, .08), 1, 0)]
E += [(8.2, click(.22), 1, -.5), (9.9, click(.22, 2900), 1, 0), (12.1, click(.22, 3200), 1, .5)]
E += [(13.5, whoosh(.9, 200, 6000, .35), 1, 0)]
# B
E += [(14.75, thud(.30), 1, -.3), (15.3, chime(1568, .07, 1.0), 1, -.3)]
for tb in (19.85, 22.8, 27.45): E += [(tb, whoosh(1.0, 250, 3500, .22), 1, .4)]
for i in range(6): E += [(20.55 + i * .11 + .25, thud(.14), 1, -.6 + i * .24)]
E += [(23.15, whoosh(.7, 400, 8000, .25, False), 1, .7), (23.9, metal(.12), 1, .2), (25.4, chime(2093, .08, 1.0), 1, .4)]
E += [(27.85, metal(.22), 1, -.3), (30.48, thud(.75), 1, 0), (30.48, boom(.35, 60, .6), 1, 0)]
E += [(30.9, riser(1.5, .25), 1, 0), (32.3, whoosh(.5, 3000, 300, .2, False), 1, 0)]
# C -> D
E += [(82.75, riser(.7, .2), 1, 0), (83.35, boom(.45, 58, .8), 1, 0)]
E += [(W2T(32.62) + .5, thud(.25), 1, -.2)]
E += [(W2T(43.1), whoosh(.6, 300, 5000, .18), 1, -.5), (W2T(44.3), whoosh(.35, 1500, 7000, .1), 1, 0), (W2T(45.25), click(.2, 2400), 1, .5)]
# transitions
for tt_ in (W2T(47.0), W2T(81.6), W2T(95.85)): E += [(tt_, whoosh(.9, 200, 7000, .32), 1, 0)]
# E
E += [(W2T(48.2), thud(.22), 1, 0)]
for ct in (50.55, 57.85, 62.5, 68.4): E += [(W2T(ct) - .05, whoosh(1.0, 300, 4000, .18), 1, .3), (W2T(ct) + .62, chime(1760, .06, 1.2), 1, .2)]
E += [(W2T(56.0), click(.2, 2200), 1, -.3), (W2T(56.9), click(.2, 2600), 1, .3), (W2T(70.6), whoosh(1.6, 200, 3000, .1), 1, 0)]
E += [(W2T(73.55), thud(.2), 1, -.4), (W2T(77.1), thud(.18), 1, .4)]
# F
E += [(W2T(81.95), rustle(1.0, .22), 1, 0), (W2T(89.55), rustle(.8, .14), 1, .2), (W2T(84.6), whoosh(4.9, 300, 2500, .05), 1, 0)]
E += [(W2T(92.6), chime(2349, .08, 1.4), 1, .3), (W2T(93.3), click(.2, 1800), 1, .4)]
# G
for rt in (96.15, 96.6, 106.75, 118.3): E += [(W2T(rt) + .1, thud(.5), 1, 0), (W2T(rt) + .1, boom(.25, 45, .9), 1, 0)]
for i, nt in enumerate((96.35, 104.0, 115.3, 122.6)): E += [(W2T(nt) + .05, boom(.35 + .1 * i, 52, 1.0), 1, 0), (W2T(nt) + .05, chime(1175 * 2 ** (i / 12 * 3), .05, 1.2), 1, 0)]
for w_ in (97.4, 100.1, 101.7, 107.6, 110.2, 112.1, 113.3, 119.4, 120.6): E += [(W2T(w_), click(.12, 3000), 1, .3)]
# H
E += [(W2T(126.8), whoosh(1.5, 1200, 150, .25, False), 1, 0), (W2T(126.9), boom(.2, 40, 1.2), 1, 0)]
for i in range(12):
    tt_ = W2T(133.6) + .75 * (1 - (1 - i / 12) ** 1.6)
    E += [(tt_, click(.12, 2000 + i * 120), 1, 0)]
E += [(W2T(134.35), boom(.75, 45, 2.2), 1, 0), (W2T(134.35), metal(.08), 1, 0), (W2T(137.3), whoosh(1.0, 2000, 200, .18, False), 1, 0)]
E += [(W2T(144.8), whoosh(.6, 400, 6000, .12), 1, 0)]
for t_, s_, g_, p_ in E: add(sfx, s_.astype(np.float32), t_, g_, p_)
sfx *= (0.75 + .25 * duck)[:, None]

# ------------------------------------------------------------------ mix
mix = voice * 1.0 + clip + music * .44 + sfx * .42
# soft limiter
peak = np.abs(mix).max(); print('pre-peak', peak)
mix = np.tanh(mix / 1.05) * 1.05 if peak > 1 else mix
mix /= max(1.0, np.abs(mix).max() / .97)
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open('build/mix.wav', 'w') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(out.tobytes())
for name, x in [('voice', voice), ("music", music * .44), ("sfx", sfx * .42), ('clip', clip)]:
    with wave.open(f'build/stem_{name}.wav', 'w') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok', N / SR)
