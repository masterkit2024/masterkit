"""Original score + sound design for the black-hole short, mixed under the voiceover.
Usage: python3 make_audio.py voice.wav out_dir
Writes music.wav, sfx.wav, mix.wav (48 kHz stereo)."""
import sys, os, subprocess
import numpy as np

SR = 48000
DUR = 76.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

def T(sec): return np.arange(int(sec * SR)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def nm(s):  # 'D3' -> midi
    name, octv = s[:-1], int(s[-1]); return NOTE[name] + 12 * (octv + 1)

music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

def put(buf, t0, x, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if x.ndim == 1:
        l = np.sqrt(0.5 * (1 - pan)); r = np.sqrt(0.5 * (1 + pan))
        x = np.stack([x * l, x * r], 1)
    if i0 < 0: x = x[-i0:]; i0 = 0
    n = min(len(x), N - i0)
    if n > 0: buf[i0:i0 + n] += x[:n] * gain

def env(n, a, r, sus=None):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2
    if nr < n: e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e

def lp(x, fc):  # one-pole lowpass, fc scalar or array
    fc = np.broadcast_to(np.asarray(fc, float), x.shape[:1])
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); z = np.zeros(x.shape[1:]) if x.ndim > 1 else 0.0
    for i in range(len(x)):
        z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y

def lp_fast(x, fc):
    # FFT brickwall-ish smooth lowpass (static cutoff), fast
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    H = 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X * (H[:, None] if x.ndim > 1 else H), n=len(x), axis=0)

def hp_fast(x, fc):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    H = 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * (H[:, None] if x.ndim > 1 else H), n=len(x), axis=0)

def bp_fast(x, lo, hi): return hp_fast(lp_fast(x, hi), lo)

def saw(f, t, ph=0.0):
    p = (f * t + ph) % 1.0; return 2 * p - 1

# ---------------- instruments ----------------
def pad(notes, t0, t1, amp=0.08, cutoff=1400, a=1.2, r=1.5, bright=0.0):
    dur = t1 - t0 + r; t = T(dur); n = len(t)
    out = np.zeros((n, 2))
    for m in notes:
        f = midi(m)
        for k, (det, pan) in enumerate([(-0.11, -0.7), (0.0, 0.0), (0.12, 0.7)]):
            ff = f * 2 ** (det / 12)
            vib = 1 + 0.0025 * np.sin(2 * np.pi * (0.18 + 0.05 * k) * t + k)
            x = saw(ff * vib, t, rng.random()) * 0.6 + np.sin(2 * np.pi * ff * t) * 0.6
            out[:, 0] += x * np.sqrt(0.5 * (1 - pan)); out[:, 1] += x * np.sqrt(0.5 * (1 + pan))
    out = lp_fast(out, cutoff * (1 + bright))
    e = env(n, a, r); e[int((t1 - t0) * SR):] *= 1  # release inside env
    hold = np.ones(n); rel0 = int((t1 - t0) * SR)
    if rel0 < n: hold[rel0:] = np.linspace(1, 0, n - rel0) ** 2
    att = np.minimum(1, t / a) ** 2
    out *= (att * hold)[:, None]
    put(music, t0, out, amp / len(notes))

def sub(f, t0, t1, amp=0.25, a=0.8, r=1.2):
    dur = t1 - t0 + r; t = T(dur); n = len(t)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    hold = np.ones(n); k = int((t1 - t0) * SR)
    if k < n: hold[k:] = np.linspace(1, 0, n - k) ** 2
    put(music, t0, x * np.minimum(1, t / a) ** 2 * hold, amp * 0.7)

def pluck(m, t0, amp=0.1, dec=0.9, pan=0.0, bright=1.0, buf=None):
    t = T(dec * 3); f = midi(m)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
         + 0.15 * bright * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 10))
    x *= np.exp(-t / dec * 2.5) * np.minimum(1, t / 0.004)
    put(music if buf is None else buf, t0, x, amp, pan)

def bell(m, t0, amp=0.12, dec=3.0, pan=0.0, buf=None):
    t = T(dec * 1.5); f = midi(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 2)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / dec * 3) * np.minimum(1, t / 0.002)
    x += 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
    put(music if buf is None else buf, t0, x, amp, pan)

def piano(m, t0, amp=0.12, dec=3.5, pan=0.0):
    t = T(dec); f = midi(m)
    x = sum((0.6 ** h) * np.sin(2 * np.pi * f * (h + 1) * (1 + 0.0004 * h * h) * t) * np.exp(-t * (1.2 + h * 0.9)) for h in range(6))
    x *= np.minimum(1, t / 0.003)
    put(music, t0, x, amp, pan)

def arp(seq, t0, t1, step, amp=0.06, dec=0.5, bright=0.8, pan_sw=0.5):
    i = 0; t = t0
    while t < t1 - 0.01:
        pluck(seq[i % len(seq)], t, amp, dec, pan=pan_sw * np.sin(i * 1.7), bright=bright)
        t += step; i += 1

def noise(sec): return rng.standard_normal(int(sec * SR))

def boom(t0, amp=0.9, f0=90, f1=32, dec=1.8):
    t = T(dec * 2)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / dec * 2.2)
    nz = lp_fast(noise(dec * 2), 900) * np.exp(-t * 9) * 0.8
    put(sfx, t0, (x + nz) * np.minimum(1, t / 0.003), amp)

def whoosh(t0, dur, amp=0.35, f0=300, f1=3000, pan0=-0.6, pan1=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(dur)
    # sweep by blending two bands
    lo = bp_fast(x, f0 * 0.5, f0 * 2); hi = bp_fast(x, f1 * 0.5, f1 * 1.5)
    k = np.linspace(0, 1, n)
    y = lo * (1 - k) + hi * k
    e = np.sin(np.pi * k) ** 2
    pan = pan0 + (pan1 - pan0) * k
    out = np.stack([y * e * np.sqrt(0.5 * (1 - pan)), y * e * np.sqrt(0.5 * (1 + pan))], 1)
    put(sfx, t0, out / (np.abs(y).max() + 1e-9), amp)

def riser(t0, t1, amp=0.3, f0=200, f1=1800):
    dur = t1 - t0; n = int(dur * SR); k = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** k; ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * 0.4 + bp_fast(noise(dur), 1500, 9000) * 0.6 * k
    put(sfx, t0, x * k ** 2.5, amp)

def tick(t0, amp=0.12, f=2400, pan=0.0):
    t = T(0.05); x = np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 300)
    put(sfx, t0, x, amp, pan)

def crackle(t0, t1, density=40, amp=0.12):
    n = int((t1 - t0) * density)
    for i in range(n):
        tt = t0 + rng.random() * (t1 - t0)
        d = 0.01 + rng.random() * 0.03; x = bp_fast(noise(d + 0.05), 2500, 9000)[:int(d * SR)]
        x *= np.exp(-np.linspace(0, 8, len(x)))
        put(sfx, tt, x, amp * (0.3 + rng.random()), pan=rng.uniform(-0.8, 0.8))

def bubble(t0, amp=0.08):
    d = 0.08 + rng.random() * 0.08; t = T(d); f0 = 400 + rng.random() * 600
    f = f0 * (1 + 2.5 * t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    put(sfx, t0, np.sin(ph) * np.sin(np.pi * t / d) ** 2, amp, rng.uniform(-0.6, 0.6))

def glass(m, t0, dur, amp=0.07):
    t = T(dur); f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.2 * np.sin(2 * np.pi * f * 3.02 * t)
    put(music, t0, x * env(len(t), 0.4, dur * 0.6), amp)

def wind(t0, t1, amp=0.1, lo=200, hi=900):
    x = np.stack([bp_fast(noise(t1 - t0), lo, hi), bp_fast(noise(t1 - t0), lo, hi)], 1)
    k = np.linspace(0, 1, len(x)); mod = 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * k * (t1 - t0) + 1)
    put(sfx, t0, x / np.abs(x).max() * (np.sin(np.pi * k) ** 0.6 * mod)[:, None], amp)

# ---------------- score ----------------
D2, D3 = nm('D2'), nm('D3')
Dm = [nm('D3'), nm('F3'), nm('A3'), nm('D4')]
Bb = [nm('A#2'), nm('D3'), nm('F3'), nm('A#3')]
F = [nm('F3'), nm('A3'), nm('C4'), nm('F4')]
C = [nm('C3'), nm('E3'), nm('G3'), nm('C4')]
Gm = [nm('G2'), nm('D3'), nm('G3'), nm('A#3')]
Am9 = [nm('A3'), nm('C4'), nm('E4'), nm('B4')]
DM = [nm('D3'), nm('F#3'), nm('A3'), nm('D4'), nm('E4')]
Dsus = [nm('D3'), nm('A3'), nm('D4'), nm('E4'), nm('A4')]
STEP = 60 / 92 / 2

# A: hook 0-2
pad(Dm, 0.0, 1.95, amp=0.20, cutoff=900, a=0.3, r=0.2)
sub(midi(D2), 0.0, 1.95, 0.12, a=0.2, r=0.1)
glass(nm('A5'), 0.0, 2.0, 0.025)
riser(0.7, 1.98, 0.32, 180, 2600)
# collapse
boom(2.0, 0.75, 110, 28, 2.4); whoosh(2.0, 1.4, 0.35, 2000, 200, 0.6, -0.6)
bell(nm('D5'), 2.02, 0.05, 4, 0.3)

# B: light travel 2-12.68
prog = [(Dm, 2.0), (Bb, 4.6), (F, 7.2), (C, 9.6)]
for i, (ch, t0) in enumerate(prog):
    t1 = prog[i + 1][1] if i + 1 < len(prog) else 12.6
    pad(ch, t0, t1, amp=0.16, cutoff=1100 + 200 * i, a=0.8, r=0.6)
sub(midi(D2), 2.0, 12.6, 0.16, a=1.0, r=0.2)
arp([nm('D4'), nm('A4'), nm('F4'), nm('A4'), nm('D5'), nm('A4'), nm('F4'), nm('E4')], 3.74, 12.6, STEP, amp=0.05, dec=0.45, bright=0.6)
for k in range(int((12.68 - 6.3) / 0.5)): tick(6.3 + k * 0.5, 0.06, 2600, 0.3 * (-1) ** k)
glass(nm('E6'), 3.7, 6.0, 0.012)
# sky: brighter hopeful layer
pad([nm('F4'), nm('A4'), nm('C5'), nm('E5')], 10.0, 12.6, amp=0.07, cutoff=2600, a=0.6, r=0.1)
riser(11.4, 12.66, 0.18, 400, 3000)
# lights out
boom(12.68, 0.8, 70, 30, 2.0)
bell(nm('A2'), 12.7, 0.05, 4)

# C: size/grid/year 13.27-28.05
pad(Gm, 13.27, 19.1, amp=0.13, cutoff=700, a=1.5, r=1.0)
sub(midi(nm('G1')), 13.27, 19.1, 0.12, a=1.5)
glass(nm('D6'), 13.6, 4.0, 0.01)
riser(15.3, 16.45, 0.22, 300, 4000)
whoosh(15.4, 1.1, 0.28, 400, 4000)
boom(16.45, 0.4, 140, 45, 1.2); bell(nm('A5'), 16.45, 0.06, 3, -0.2)
whoosh(17.4, 1.3, 0.28, 3000, 300, 0.5, -0.5)
pluck(nm('D4'), 17.6, 0.08, 0.8)
# grid: deep bend as the funnel deepens
t = T(3.5); f = 55 * (1 - 0.45 * np.clip((t - 0.6) / 1.4, 0, 1))
put(sfx, 19.3, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.5, 1.2), 0.28)
pad(Dm, 19.1, 23.2, amp=0.12, cutoff=800, a=1.0, r=0.8)
sub(midi(D2), 19.1, 28.0, 0.12, a=1.0)
bell(nm('A4'), 21.5, 0.06, 3)
pad(Bb, 23.2, 25.6, amp=0.13, cutoff=1300, a=0.6, r=0.6)
pad(F, 25.6, 28.0, amp=0.13, cutoff=1500, a=0.6, r=0.3)
arp([nm('F4'), nm('A#4'), nm('D5'), nm('A#4')], 23.3, 28.0, STEP, amp=0.045, dec=0.4, bright=0.7)
# day ticks follow the counter (smootherstep 23.45->27.0)
def smoother(x): x = np.clip(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10)
last = 0
for tt in np.arange(23.45, 27.0, 1 / SR * 240):
    d = int(365 * smoother((tt - 23.45) / 3.55) / 12)
    if d > last: tick(tt, 0.035, 3200, 0.4); last = d
bell(nm('D6'), 27.0, 0.09, 3.0, 0.1); bell(nm('A5'), 27.0, 0.05, 3.0, -0.3)

# D: darkness / freeze 28.05-34.62
boom(28.07, 0.35, 60, 30, 1.6)
wind(28.1, 35.0, 0.10, 150, 700)
pad(Am9, 28.6, 34.5, amp=0.08, cutoff=3000, a=2.0, r=0.6)
sub(midi(nm('A1')), 28.3, 34.6, 0.10, a=1.5)
t = T(2.2); f = 880 * 2 ** (-2.5 * np.clip(t / 2.0, 0, 1))
put(music, 29.4, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.1, 0.6), 0.04)
crackle(31.3, 34.4, 55, 0.10)

# E: moon 34.62-39.45
piano(nm('A4'), 34.8, 0.10, 3, -0.2); piano(nm('E5'), 35.3, 0.07, 3, 0.2)
glass(nm('E5'), 34.7, 1.4, 0.03)
pad([nm('A3'), nm('E4'), nm('B4')], 35.9, 39.3, amp=0.07, cutoff=2000, a=1.0, r=0.4)
for k, m in enumerate(['C5', 'B4', 'G4', 'E4', 'D5', 'B4']): piano(nm(m), 36.1 + k * 0.42, 0.06, 2.5, 0.4 * np.sin(k))
riser(36.1, 37.3, 0.07, 1500, 5000)
whoosh(38.25, 0.5, 0.12, 4000, 600)

# F: dance 39.45-53.3
riser(38.6, 39.45, 0.18, 300, 2400)
boom(39.47, 0.45, 100, 40, 1.2)
prog = [(Dm, 39.45), (Bb, 42.07), (F, 44.68), (C, 47.3), (Dm, 49.9)]
for i, (ch, t0) in enumerate(prog):
    t1 = prog[i + 1][1] if i + 1 < len(prog) else 53.0
    pad(ch, t0, t1, amp=0.15, cutoff=1300, a=0.5, r=0.8)
sub(midi(D2), 39.45, 53.0, 0.14, a=0.5, r=1.5)
seqs = [[nm('D4'), nm('F4'), nm('A4'), nm('D5'), nm('A4'), nm('F4')], [nm('D4'), nm('F4'), nm('A#4'), nm('D5'), nm('A#4'), nm('F4')],
        [nm('C4'), nm('F4'), nm('A4'), nm('C5'), nm('A4'), nm('F4')], [nm('C4'), nm('E4'), nm('G4'), nm('C5'), nm('G4'), nm('E4')], [nm('D4'), nm('F4'), nm('A4'), nm('D5'), nm('A4'), nm('F4')]]
for i, (ch, t0) in enumerate(prog):
    t1 = prog[i + 1][1] if i + 1 < len(prog) else 50.6
    arp(seqs[i], t0, min(t1, 50.6), STEP, amp=0.06, dec=0.45, bright=0.9)
bell(nm('E6'), 42.4, 0.11, 2.5, -0.4)   # Mercury
bell(nm('A5'), 44.65, 0.11, 3.0, 0.3)   # Earth
bell(nm('D4'), 46.85, 0.13, 4.0, -0.2)  # Neptune
whoosh(46.9, 1.4, 0.25, 2500, 250, -0.4, 0.4)
glass(nm('A5'), 49.0, 3.8, 0.02)
for k, m in enumerate(['A4', 'F4', 'D4']): piano(nm(m), 50.5 + k * 0.85, 0.06, 3.0)

# G: under ice 53.3-63.4
wind(53.3, 55.4, 0.08, 300, 1500)
whoosh(54.9, 1.2, 0.25, 3000, 200, 0, 0)
boom(55.25, 0.25, 160, 60, 0.8)
crackle(55.0, 55.8, 60, 0.12)
uw = lp_fast(noise(8.3), 220); uw = uw / np.abs(uw).max()
k = np.linspace(0, 1, len(uw)); put(sfx, 55.2, uw * np.minimum(1, k * 6) * np.minimum(1, (1 - k) * 4), 0.16)
pad([nm('D2') + 12, nm('A2') + 12, nm('E3') + 12], 55.2, 63.3, amp=0.10, cutoff=500, a=1.5, r=0.4)
sub(midi(D2), 57.6, 63.3, 0.16, a=1.0)
for i in range(40): bubble(55.4 + rng.random() * 7.6, 0.035)
pad([nm('F3'), nm('A3'), nm('C4'), nm('E4')], 59.6, 63.3, amp=0.11, cutoff=1400, a=1.2, r=0.3)
for i in range(18): bell(nm(['A5', 'C6', 'E6', 'G6'][i % 4]), 60.3 + i * 0.16 + rng.random() * 0.05, 0.018, 1.2, rng.uniform(-0.7, 0.7))

# H: punchline 63.47-71.45
boom(63.47, 0.45, 120, 50, 1.0); whoosh(63.1, 0.5, 0.18, 300, 3000)
pad(DM, 63.47, 67.2, amp=0.17, cutoff=2200, a=0.15, r=0.8)
sub(midi(D2), 63.47, 71.4, 0.14, a=0.2)
for k, m in enumerate(['D5', 'F#5', 'A5', 'F#5', 'E5', 'D5']): pluck(nm(m), 63.5 + k * STEP, 0.06, 0.4, 0.3 * np.sin(k), 1.0)
boom(65.32, 0.3, 160, 60, 0.6); bell(nm('D5'), 65.32, 0.06, 2)
pad([nm('B2'), nm('D3'), nm('F#3'), nm('B3')], 67.2, 68.95, amp=0.15, cutoff=1500, a=0.3, r=0.4)
arp([nm('B4'), nm('D5'), nm('F#5'), nm('D5')], 67.2, 68.9, STEP, amp=0.05, dec=0.35)
riser(68.4, 69.7, 0.28, 220, 3200)
boom(69.7, 0.55, 100, 30, 2.0); whoosh(69.7, 1.0, 0.2, 2000, 300)
pad([nm('G2'), nm('D3'), nm('G3'), nm('B3'), nm('D4')], 69.7, 71.4, amp=0.17, cutoff=2400, a=0.05, r=0.5)

# I: end 71.45-76
boom(71.48, 0.35, 90, 40, 1.2)
pad(Dsus, 71.48, 75.0, amp=0.16, cutoff=1800, a=0.3, r=1.0)
sub(midi(D2), 71.48, 75.0, 0.12, a=0.3, r=1.0)
bell(nm('A5'), 71.9, 0.08, 3.5, 0.2)
for k, m in enumerate(['D5', 'E5', 'A5', 'E5', 'D5', 'A4']): pluck(nm(m), 72.0 + k * STEP * 2, 0.045, 0.6, 0.4 * np.sin(k), 0.8)
t = T(0.12); put(sfx, 73.12, np.sin(2 * np.pi * (600 + 900 * t / 0.12) * t) * np.exp(-t * 30), 0.12)

# ---------------- reverb ----------------
def reverb(x, sec=2.8, wet=0.28, pre=0.02):
    n = int(sec * SR); t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-t * 6.9 / sec)[:, None]
    ir = lp_fast(ir, 6000); ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    L = len(x) + n; nfft = 1 << int(np.ceil(np.log2(L)))
    y = np.fft.irfft(np.fft.rfft(x, nfft, axis=0) * np.fft.rfft(ir, nfft, axis=0), nfft, axis=0)[:len(x)]
    return x * (1 - wet) + y * wet * 2.0

# simple ping-pong delay for music plucks/bells
def delay(x, d=STEP * 3, fb=0.35, mix=0.25):
    y = x.copy(); n = int(d * SR); tap = x.copy()
    for k in range(1, 5):
        tap = np.roll(tap, n, 0); tap[:n] = 0; tap = tap[:, ::-1] * fb
        y += tap * mix / fb ** 0
    return y

music = delay(music)
music = reverb(music, 3.2, 0.35)
sfx = reverb(sfx, 2.2, 0.22)

# ---------------- voice + ducking ----------------
voice_path, out_dir = sys.argv[1], sys.argv[2]
raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', voice_path, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True).stdout
v = np.frombuffer(raw, np.float32).astype(np.float64)
v = hp_fast(v, 70)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
vpk = np.abs(voice).max(); voice = voice / vpk * 0.75
# envelope for ducking
a_att, a_rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
x = np.abs(voice); envv = np.zeros(N); z = 0.0
# vectorized-ish: process in blocks of 48 samples
blk = 48; xb = x[:N // blk * blk].reshape(-1, blk).max(1); eb = np.zeros_like(xb)
aa, ar = np.exp(-blk / (0.03 * SR)), np.exp(-blk / (0.35 * SR))
for i, val in enumerate(xb):
    z = aa * z + (1 - aa) * val if val > z else ar * z + (1 - ar) * val
    eb[i] = z
envv[:len(eb) * blk] = np.repeat(eb, blk)
duck = 1 - 0.6 * np.clip(envv / 0.10, 0, 1)
bed = (music * 0.9 + sfx) * duck[:, None] * 0.52
# master
mix = bed + np.stack([voice, voice], 1)
# end fade
fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.89 / np.abs(mix).max()
os.makedirs(out_dir, exist_ok=True)
import wave
def wr(path, x):
    x = np.clip(x, -1, 1); d = (x * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
wr(os.path.join(out_dir, 'mix.wav'), mix)
wr(os.path.join(out_dir, 'bed.wav'), bed / np.abs(bed).max() * 0.8)
if os.environ.get('STEMS'):
    wr(os.path.join(out_dir, 'music.wav'), music / np.abs(music).max() * 0.8); wr(os.path.join(out_dir, 'sfx.wav'), sfx / np.abs(sfx).max() * 0.8)
print('ok', np.abs(mix).max(), 'voice rms', np.sqrt((voice ** 2).mean()), 'bed rms', np.sqrt((bed ** 2).mean()))
