"""Original score + sound design for the black-hole short, mixed under the voiceover.
Usage: python3 make_audio.py voice.wav out_dir
Writes music.wav, sfx.wav, mix.wav (48 kHz stereo)."""
import sys, os, subprocess
import numpy as np
T_ISC,T_TEM,T_OTR,T_SLB,T_NKL,T_KLM,T_UCH,T_PTS,T_MCH,T_VAZ=2.70,9.21,11.49,20.09,29.99,32.30,42.33,43.00,44.16,47.37

SR = 48000
DUR = 54.0
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
# C minor / Eb major space score: wonder -> loss -> ocean pulse -> axis wobble -> warm return
STEP=60/84/2
Cm=[nm('C3'),nm('G3'),nm('C4'),nm('D#4')]; Ab=[nm('G#2'),nm('D#3'),nm('G#3'),nm('C4')]; Eb=[nm('D#3'),nm('A#3'),nm('D#4'),nm('G4')]; Bb=[nm('A#2'),nm('F3'),nm('A#3'),nm('D4')]
Fm=[nm('F2'),nm('C3'),nm('F3'),nm('G#3')]; Gs=[nm('G2'),nm('D3'),nm('G3'),nm('C4')]
# 0-6.2 orbit + vanish
pad(Cm,0.0,6.2,amp=0.15,cutoff=1300,a=1.0,r=0.6); sub(midi(nm('C2')),0.0,6.2,0.10,a=1.0)
arp([nm('C5'),nm('G5'),nm('D#5'),nm('G5')],0.3,2.6,STEP,amp=0.035,dec=0.5)
riser(1.7,T_ISC,0.15,300,3500); boom(T_ISC,0.45,120,40,1.4)
t=T(0.6); put(sfx,T_ISC,bp_fast(noise(0.6),2000,9000)*np.exp(-t*6),0.10)
for i in range(10): bell(nm(['G6','D#6','C6','G5'][i%4]),T_ISC+0.05+i*0.07,0.02,0.6,rng.uniform(-0.7,0.7))
glass(nm('D5'),3.0,3.0,0.02)
# 6.2-13.5 night landscape: calm then darker
whoosh(6.0,0.5,0.12,300,2500)
pad(Ab,6.2,9.2,amp=0.13,cutoff=1500,a=0.6,r=0.6); pad(Fm,9.2,13.4,amp=0.12,cutoff=900,a=0.4,r=0.5)
sub(midi(nm('G#1')),6.2,13.4,0.09,a=0.6)
for k,m in enumerate(['D#5','G5','C6','G5','D#5']): piano(nm(m),6.6+k*0.5,0.04,2.5,0.3*np.sin(k))
t=T(1.0); put(sfx,T_TEM-0.5,lp_fast(noise(1.0),600)*np.sin(np.pi*np.linspace(0,1,len(t)))**2,0.10)
bell(nm('G5'),T_OTR,0.05,2.0); bell(nm('C6'),T_OTR+0.6,0.04,2.0,0.3)
# 13.5-15.5 "only the beginning"
riser(12.9,13.55,0.15,400,4000); boom(13.6,0.4,110,45,1.1)
pad(Eb,13.6,15.5,amp=0.15,cutoff=2200,a=0.1,r=0.3)
# 15.5-25.6 ocean: wave pulse following the tide (period 2.6 s), weaker after "слабее"
whoosh(15.35,0.5,0.12,500,3000)
pad(Cm,15.5,20.0,amp=0.13,cutoff=1300,a=0.5,r=0.5); pad(Ab,20.0,23.4,amp=0.12,cutoff=1100,a=0.4,r=0.5); pad(Bb,23.4,25.6,amp=0.12,cutoff=1100,a=0.4,r=0.4)
sub(midi(nm('C2')),15.5,25.6,0.09,a=0.5)
tt=T(5.6); amp_w=0.6+0.4*np.sin(2*np.pi*tt/2.6); sea=lp_fast(noise(5.6),900)*amp_w; put(sfx,15.5,sea*np.minimum(1,tt/0.5)*np.minimum(1,(5.6-tt)/0.4),0.07)
arp([nm('C5'),nm('D#5'),nm('G5'),nm('A#5')],15.6,25.4,STEP*2,amp=0.025,dec=0.6,bright=0.5)
bell(nm('A#5'),T_SLB,0.05,2.0)
whoosh(20.85,0.5,0.12,2500,400)
bell(nm('G5'),21.2,0.05,2.5); t=T(1.2); f=220*np.exp(-t*1.2); put(sfx,23.4,np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*2),0.10)
# 25.6-27.8 "even more interesting"
riser(25.0,25.7,0.12,400,4000); boom(25.72,0.35,120,45,1.0); pad(Eb,25.7,27.8,amp=0.14,cutoff=2200,a=0.1,r=0.3)
# 27.8-37 axis: stable, then wobble (detuned, unstable)
pad(Fm,27.8,T_KLM,amp=0.13,cutoff=1400,a=0.4,r=0.6); sub(midi(nm('F1')),27.8,37.0,0.09,a=0.6)
arp([nm('F5'),nm('G#5'),nm('C6'),nm('G#5')],28.0,T_KLM,STEP,amp=0.03,dec=0.4)
bell(nm('C6'),T_NKL,0.05,2.5)
tt=T(36.9-T_KLM); wob=np.sin(2*np.pi*(nm('C4') and midi(nm('C4')))*tt*(1+0.03*np.sin(2*np.pi*0.35*tt))); 
put(music,T_KLM,wob*np.minimum(1,tt/1.5)*np.minimum(1,(36.9-T_KLM-tt)/0.6),0.05)
pad(Gs,T_KLM,37.0,amp=0.14,cutoff=1000,a=1.0,r=0.4)
# 37-45.6 humans: nostalgic piano
whoosh(36.85,0.5,0.12,300,2500)
pad(Ab,37.0,41.0,amp=0.13,cutoff=1600,a=0.6,r=0.6); pad(Eb,41.0,45.5,amp=0.14,cutoff=1800,a=0.6,r=0.6)
sub(midi(nm('G#1')),37.0,45.5,0.08,a=0.8)
for k,m in enumerate(['C5','D#5','G5','F5','D#5','C5','G4','A#4','C5','D#5']): piano(nm(m),37.3+k*0.8,0.045,3.0,0.4*np.sin(k))
for tp,m in ((T_UCH,'G5'),(T_PTS,'A#5'),(T_MCH,'D#6')): bell(nm(m),tp,0.04,2.0)
# 45.6-54 warm return
boom(45.75,0.35,110,45,1.2); riser(45.0,45.75,0.12,300,3500)
pad([nm('D#3'),nm('A#3'),nm('D#4'),nm('F4'),nm('G4')],45.75,49.5,amp=0.16,cutoff=2400,a=0.3,r=0.6)
pad([nm('G#2'),nm('D#3'),nm('G#3'),nm('C4'),nm('D#4')],49.5,53.6,amp=0.16,cutoff=2400,a=0.4,r=1.5)
sub(midi(nm('D#2')),45.75,53.5,0.09,a=0.5,r=1.2)
arp([nm('D#5'),nm('G5'),nm('A#5'),nm('D#6'),nm('A#5'),nm('G5')],46.0,53.0,STEP,amp=0.03,dec=0.5)
bell(nm('G6'),T_VAZ,0.05,2.5); bell(nm('D#6'),49.65,0.06,3.0)

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
