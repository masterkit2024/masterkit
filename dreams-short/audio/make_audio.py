"""Original score + sound design for the black-hole short, mixed under the voiceover.
Usage: python3 make_audio.py voice.wav out_dir
Writes music.wav, sfx.wav, mix.wav (48 kHz stereo)."""
import sys, os, subprocess
import numpy as np
T_LET,T_PUT,T_VST,T_OTL,T_BOD,T_GIP,T_ISC,T_MIN=5.98,6.60,8.18,20.76,23.05,25.35,33.98,36.76

SR = 48000
DUR = 46.5
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
# D lydian dream: music box + soft pads; morning alarm; slow sleep waves; music-box return
STEP=60/76/2
Dmaj9=[nm('D3'),nm('A3'),nm('C#4'),nm('E4'),nm('F#4')]; Gmaj7=[nm('G2'),nm('D3'),nm('F#3'),nm('B3')]; Emaj=[nm('E3'),nm('B3'),nm('G#4'),nm('D#4')]
Bm=[nm('B2'),nm('F#3'),nm('B3'),nm('D4')]; Em9=[nm('E3'),nm('B3'),nm('D4'),nm('F#4'),nm('G4')]
box=[nm('F#5'),nm('A5'),nm('D6'),nm('G#5'),nm('E6'),nm('A5'),nm('C#6'),nm('A5')]
def mbox(t0,t1,amp=0.05):
    i=0;t=t0
    while t<t1-0.05: bell(box[i%len(box)],t,amp,1.8,0.5*np.sin(i*1.3)); t+=STEP; i+=1
# 0-11.5 dream
pad(Dmaj9,0.0,5.0,amp=0.15,cutoff=1600,a=1.2,r=0.8); pad(Gmaj7,5.0,8.2,amp=0.15,cutoff=1800,a=0.6,r=0.8); pad(Emaj,8.2,11.5,amp=0.14,cutoff=1800,a=0.6,r=0.6)
sub(midi(nm('D2')),0.0,11.5,0.08,a=1.5)
mbox(0.4,11.4,0.045)
for t0 in (T_LET,T_PUT,T_VST): whoosh(t0-0.3,0.6,0.10,500,4000); bell(nm('D6'),t0,0.05,2.0)
glass(nm('A6'),4.9,3.0,0.012)
# 11.6 morning: alarm clock ring, dream shatters
for k in range(10): t=T(0.08); put(sfx,12.2+k*0.12,(np.sin(2*np.pi*2400*t)+0.5*np.sin(2*np.pi*3150*t))*np.exp(-t*20),0.09,0.2*(-1)**k)
pad([nm('A3'),nm('D4'),nm('E4'),nm('A4')],11.8,14.4,amp=0.12,cutoff=2600,a=0.6,r=0.4)
riser(13.0,13.6,0.06,2000,8000)
for i in range(14): bell(nm(['A6','F#6','D6','E6'][i%4]),13.6+i*0.07,0.02,0.6,rng.uniform(-0.7,0.7))
# 14.6-29 brain at night: deep slow waves
whoosh(14.45,0.6,0.15,300,2500)
pad(Bm,14.6,20.6,amp=0.14,cutoff=900,a=1.0,r=0.6); pad(Gmaj7,20.6,25.3,amp=0.14,cutoff=1000,a=0.8,r=0.6); pad(Em9,25.3,29.0,amp=0.14,cutoff=1400,a=0.6,r=0.6)
sub(midi(nm('B1')),14.6,29.0,0.10,a=1.0)
t=T(14.4); sw=np.sin(2*np.pi*55*t)*(0.5+0.5*np.sin(2*np.pi*0.35*t-1.6)); put(music,14.6,lp_fast(sw,200)*np.minimum(1,t/1.0)*np.minimum(1,(14.4-t)/0.8),0.10)
arp([nm('B4'),nm('F#5'),nm('D5'),nm('A5')],15.0,28.8,STEP*2,amp=0.025,dec=0.8,bright=0.5)
bell(nm('F#5'),T_OTL,0.04,2.5); bell(nm('A5'),T_BOD,0.05,2.5)
riser(T_GIP-0.9,T_GIP,0.10,300,3000); bell(nm('E6'),T_GIP,0.08,3.5); bell(nm('B5'),T_GIP+0.05,0.05,3.5,0.3)
# 29.2 waking
whoosh(29.0,0.8,0.14,250,3000)
pad([nm('D3'),nm('F#3'),nm('A3'),nm('D4'),nm('E4')],29.2,35.0,amp=0.15,cutoff=2600,a=0.6,r=0.6)
sub(midi(nm('D2')),29.2,35.0,0.08,a=0.6)
for k,m in enumerate(['D5','F#5','A5','E5']): piano(nm(m),29.4+k*0.6,0.05,2.5,0.3*np.sin(k))
riser(T_ISC-0.6,T_ISC+0.1,0.06,1500,8000)
for i in range(16): bell(nm(['A6','E6','C#6','F#6'][i%4]),T_ISC+0.1+i*0.06,0.018,0.7,rng.uniform(-0.8,0.8))
# 35-39.4 minutes: clock ticks, panels vanish
pad([nm('B2'),nm('F#3'),nm('A3'),nm('D4')],35.1,39.3,amp=0.12,cutoff=1200,a=0.5,r=0.5)
for k in range(int((39.2-35.2)/0.5)): tick(35.2+k*0.5,0.05,1500+300*(k%2))
for i in range(4): glass(nm(['A5','F#5','D5','A4'][i]),T_MIN-0.2+i*0.65,1.0,0.025)
# 39.4-46.5 finale: music box returns, bubbles pop into stars
pad(Gmaj7,39.4,42.4,amp=0.15,cutoff=1600,a=0.8,r=0.6); pad(Dmaj9,42.4,46.4,amp=0.16,cutoff=1800,a=0.6,r=1.2)
sub(midi(nm('D2')),39.4,46.3,0.08,a=1.0,r=1.0)
mbox(39.6,45.8,0.04)
for i in range(9):
    tp=39.6+i*0.55+3.2*0.9
    if tp<46.3: t=T(0.1); put(sfx,tp,np.sin(2*np.pi*(900+600*t/0.1)*t)*np.exp(-t*40),0.05,rng.uniform(-0.6,0.6))

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
