"""Звук ролика: эффекты + чиптюн 110 bpm + микс с голосом и мем-звуком.
python3 tools/audio.py  ->  out/mix.wav (48 kHz стерео)"""
import json, subprocess, numpy as np, soundfile as sf
from scipy import signal

SR = 48000
ROOT = "/home/user/masterkit/video/"
W = json.load(open(ROOT + "src/words.json"))
S = lambda i: W[i]["s"]
E = lambda i: W[i]["e"]
DUR = 137.5
N = int(DUR * SR)
rng = np.random.default_rng(7)

# ---- times (must mirror src/timing.ts) ----
T = dict(
    press1=S(1), tired1=S(10) - 0.05, stamp2=S(19) - 0.05, s3=8.72, slow3=S(31), deaf3=S(41),
    s4=18.45, walk4=S(45), fast4=S(52), plane4=S(57) - 0.1, wall4=S(60), clothes4=S(62), stamp4=S(64) + 0.2,
    s5=28.27, drop5=S(77), bars5=S(85) - 0.1, mem5=S(98), s6=45.95, crack6=S(102), tog6a=S(105), tog6b=S(107), tog6c=S(110),
    press6=S(115), s7=54.9, fart7=S(138) + 0.1, run7=S(147), beep7=S(152), leave7=S(154), s8=73.0, dash8=S(166), eat8=S(169),
    text8=S(170), s9=80.3, rustam9=S(204), meme9=E(204) + 0.05, flip9=S(205), s10=108.3, snap10a=S(215), snap10b=S(218),
    snap10c=S(225), s10b=115.6, draw10=S(229), grid10=S(231), s11=119.9, you11=S(246), scream11=S(250), back11=129.05,
    tea11=E(264),
)

def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.05):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def noise(d): return rng.standard_normal(int(d * SR))
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), "low"); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), "high"); return signal.lfilter(b, a, x)
def bp(x, f1, f2, o=2): b, a = signal.butter(o, [f1 / (SR / 2), f2 / (SR / 2)], "band"); return signal.lfilter(b, a, x)
def sweep(f0, f1, d, kind="sin"):
    t = tt(d); f = np.geomspace(max(f0, 1), max(f1, 1), len(t)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if kind == "sin" else np.sign(np.sin(ph))
def reverb(x, dec=1.2, mix=0.4):
    n = int(dec * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 6 / dec); ir = lp(ir, 5000)
    w = signal.fftconvolve(x, ir)[: len(x) + n]; w /= np.max(np.abs(w)) + 1e-9
    out = np.zeros(len(x) + n); out[: len(x)] += x * (1 - mix); out[: len(w)] += w * mix * np.max(np.abs(x))
    return out
def norm(x, p=1.0): return x / (np.max(np.abs(x)) + 1e-9) * p

# ---- SFX library ----
def click(): return norm(hp(noise(0.03), 2000) * np.exp(-tt(0.03) * 200) + 0.6 * np.sin(2 * np.pi * 1800 * tt(0.03)) * np.exp(-tt(0.03) * 150))
def toggle_click(): return norm(np.concatenate([click() * 0.8, np.zeros(int(0.04 * SR)), click()]))
def tick(f=2600): d = 0.04; return norm(np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) * 120) + 0.3 * hp(noise(d), 3000) * np.exp(-tt(d) * 200))
def ticktock(d, period):
    out = np.zeros(int(d * SR)); k = 0; t0 = 0.0
    while t0 < d - 0.05:
        s = tick(2600 if k % 2 == 0 else 1900); i = int(t0 * SR); out[i:i + len(s)] += s[: len(out) - i]; t0 += period; k += 1
    return out
def stamp():
    d = 0.35; t = tt(d)
    body = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18) + 0.8 * lp(noise(d), 900) * np.exp(-t * 30)
    slap = hp(noise(d), 1500) * np.exp(-t * 60)
    return norm(body + 0.5 * slap)
def whoosh(d=0.5, f0=300, f1=3000):
    x = noise(d); out = np.zeros_like(x); seg = 256; n = len(x)
    for i in range(0, n, seg):
        k = i / n; fc = f0 * (f1 / f0) ** np.sin(k * np.pi)
        out[i:i + seg] = bp(x[max(0, i - 2048):i + seg], max(80, fc * 0.6), min(20000, fc * 1.4), 2)[-len(x[i:i + seg]):]
    return norm(out * np.sin(np.linspace(0, np.pi, n)) ** 1.5)
def thud(): d = 0.4; t = tt(d); return norm(np.sin(2 * np.pi * np.cumsum(np.geomspace(120, 40, len(t))) / SR) * np.exp(-t * 10) + 0.5 * lp(noise(d), 300) * np.exp(-t * 15))
def puff(): d = 0.3; t = tt(d); return norm(bp(noise(d), 300, 2500) * np.exp(-t * 14) * (1 - np.exp(-t * 200)))
def wind(d):
    x = noise(d); t = tt(d); k = (t / d) ** 2
    lo = bp(x, 200, 900); hi = bp(x, 900, 4000)
    wob = 1 + 0.3 * np.sin(2 * np.pi * 0.7 * t)
    return norm((lo * (1 - k) + hi * k * 1.4) * (0.1 + 0.9 * k) * wob)
def glass():
    d = 1.0; t = tt(d); out = hp(noise(d), 3000) * np.exp(-t * 6) * 0.6
    for i in range(14):
        f = rng.uniform(2500, 7500); st = rng.uniform(0, 0.35); dd = 0.25
        s = np.sin(2 * np.pi * f * tt(dd)) * np.exp(-tt(dd) * rng.uniform(15, 30)); j = int(st * SR); out[j:j + len(s)] += s * 0.5
    out[: int(0.08 * SR)] += hp(noise(0.08), 1000) * np.exp(-tt(0.08) * 30) * 2
    return norm(out)
def bass_drop():
    d = 2.2; t = tt(d); f = 120 * np.exp(-t * 1.6) + 32
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.tanh(2.5 * np.sin(ph)) * np.exp(-t * 0.9)
    x[: int(0.05 * SR)] += lp(noise(0.05), 2000) * 0.8
    return norm(x)
def fart():
    d = 1.1; t = tt(d); f = 95 + 25 * np.sin(2 * np.pi * 7 * t) + 15 * np.sin(2 * np.pi * 23 * t) - 30 * t
    ph = 2 * np.pi * np.cumsum(f) / SR
    raw = np.sign(np.sin(ph)) * 0.6 + 0.4 * np.sin(ph * 2)
    raw = lp(raw, 700) * (1 + 0.5 * lp(noise(d), 40) * 3)
    e = np.minimum(1, t * 30) * np.exp(-t * 1.2) * (1 - (t / d) ** 6)
    return norm(reverb(norm(raw * e), 1.6, 0.45))
def beep(): d = 0.18; return norm(np.sign(np.sin(2 * np.pi * 1760 * tt(d))) * env(int(d * SR), 0.002, 0.02)) * 0.7
def ding():
    d = 1.0; t = tt(d); return norm((np.sin(2 * np.pi * 1568 * t) + 0.4 * np.sin(2 * np.pi * 3136 * t) + 0.2 * np.sin(2 * np.pi * 4704 * t)) * np.exp(-t * 4))
def chomp():
    out = np.zeros(int(0.45 * SR))
    for st in (0.0, 0.18):
        d = 0.12; s = lp(noise(d), 1800) * np.exp(-tt(d) * 30) + 0.5 * np.sin(2 * np.pi * 180 * tt(d)) * np.exp(-tt(d) * 40)
        j = int(st * SR); out[j:j + len(s)] += s
    return norm(out)
def snap():
    d = 0.08; t = tt(d); return norm(hp(noise(d), 1500) * np.exp(-t * 90) + 0.6 * np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 120))
def marker(d=0.6):
    t = tt(d); f = 2200 + 500 * np.sin(2 * np.pi * 9 * t)
    sq = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * t)) * 0.5 + 0.4 * bp(noise(d), 2000, 6000)
    return norm(sq * env(len(t), 0.02, 0.08))
def kettle_whistle(d=3.2):
    t = tt(d); f = np.minimum(1, t / 0.7) * 900 + 1500 + 15 * np.sin(2 * np.pi * 5 * t)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR)
    breath = bp(noise(d), 1500, 5000) * 0.25
    e = np.minimum(1, t / 0.5) * np.where(t > d - 0.8, (d - t) / 0.8, 1)
    return norm((tone + breath) * e)
def hum_slow(d):
    t = tt(d); f = 110 * (1 - 0.6 * t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return norm(lp(x, 500) * env(len(t), 0.05, 0.6))
def beep200(d): t = tt(d); return norm(np.sin(2 * np.pi * 200 * t) * env(len(t), 0.05, 0.05))
def drop_tone(d=0.6): t = tt(d); return norm(sweep(200, 20, d) * env(len(t), 0.005, 0.1))
def pum(): d = 0.5; t = tt(d); return norm(np.sin(2 * np.pi * np.cumsum(np.geomspace(220, 110, len(t))) / SR) * np.exp(-t * 7))
def boil(d):
    x = lp(noise(d), 1200) * 0.6; t = tt(d)
    for _ in range(int(d * 14)):
        st = rng.uniform(0, d - 0.05); dd = 0.03; s = np.sin(2 * np.pi * rng.uniform(300, 900) * tt(dd)) * np.exp(-tt(dd) * 80)
        j = int(st * SR); x[j:j + len(s)] += s * 0.8
    return norm(x * np.minimum(1, t / 2))
def steps(d, period=0.42):
    out = np.zeros(int(d * SR)); t0 = 0
    while t0 < d - 0.1:
        dd = 0.08; s = lp(noise(dd), 600) * np.exp(-tt(dd) * 60); j = int(t0 * SR); out[j:j + len(s)] += s; t0 += period
    return norm(out)

sfx = np.zeros(N + SR * 4)
def put(x, t0, db=0.0):
    i = int(t0 * SR); x = x * 10 ** (db / 20)
    sfx[i:i + len(x)] += x[: len(sfx) - i]

pre = 1 / 30
# S1
put(click(), T["press1"] - pre, -4)
put(hum_slow(T["tired1"] - T["press1"]), T["press1"], -14)
put(ticktock(0.7, 0.09), T["tired1"], -10)
# S2
put(stamp(), T["stamp2"] - pre, -2)
# S3
put(whoosh(0.35), T["s3"] - 0.05, -12)
put(beep200(T["slow3"] - T["s3"] - 0.3), T["s3"] + 0.3, -26)
put(drop_tone(0.6), T["slow3"], -18)
put(toggle_click(), T["deaf3"] - pre, -8)
# S4
put(whoosh(0.35), T["s4"] - 0.05, -12)
put(steps(T["fast4"] - T["walk4"], 0.42), T["walk4"], -16)
put(wind(T["wall4"] - T["walk4"] + 0.2), T["walk4"], -10)
put(whoosh(0.9, 200, 5000), T["plane4"], -8)
put(thud(), T["wall4"] - pre, -2)
put(puff(), T["clothes4"] - pre, -6)
put(stamp(), T["stamp4"] - pre, -5)
# S5
put(whoosh(0.35), T["s5"] - 0.05, -12)
put(whoosh(1.2, 2000, 400), T["drop5"], -6)
put(tick(2000), T["bars5"], -8); put(tick(2400), T["bars5"] + 0.3, -8)
put(pum(), T["mem5"], -6)
# S6
put(glass(), T["crack6"] - pre, -3)
for k in ("tog6a", "tog6b", "tog6c"): put(toggle_click(), T[k] - pre, -6)
put(bass_drop(), T["press6"] - pre, 0)
put(click(), T["press6"] - pre, -6)
put(whoosh(0.3), T["s7"] - 0.05, -12)
# S7
put(steps(1.6, 0.4), T["s7"], -16)
put(whoosh(1.4, 400, 3500), T["run7"], -7)
put(fart(), T["fart7"] - pre, 0)
put(beep(), T["beep7"] - pre, -6)
put(whoosh(0.6), T["leave7"], -9)
# S8
put(whoosh(0.4), T["dash8"] - pre, -7)
put(chomp(), T["eat8"] - pre, -3)
put(ding(), T["text8"], -16)
# S9
put(ticktock(T["rustam9"] - T["s9"], 0.5), T["s9"], -20)
put(ticktock(T["s10"] - T["flip9"] - 0.2, 0.5), T["flip9"], -22)
# S10
for k in ("snap10a", "snap10b", "snap10c"): put(snap(), T[k] - 0.1, -3)
put(whoosh(0.3), T["s10b"] - 0.05, -14)
put(marker(0.55), T["draw10"], -10)
put(ding(), T["grid10"], -16)
# S11
put(ticktock(T["you11"] - T["s11"], 0.11), T["s11"], -16)
put(boil(T["you11"] - T["s11"]), T["s11"], -26)
put(click(), T["tea11"] - pre, -4)
put(kettle_whistle(3.0), T["tea11"], -8)

# ---- music: chiptune 110 bpm, A minor ----
BPM = 110; beat = 60 / BPM
def note_f(m): return 440 * 2 ** ((m - 69) / 12)
def sq(f, d, duty=0.5, v=1.0):
    t = tt(d); ph = (f * t) % 1; x = np.where(ph < duty, 1.0, -1.0)
    return x * env(len(t), 0.003, min(0.04, d * 0.3)) * v
def tri(f, d, v=1.0):
    t = tt(d); ph = (f * t) % 1; x = 4 * np.abs(ph - 0.5) - 1
    return x * env(len(t), 0.003, 0.02) * v
def kick(): d = 0.18; t = tt(d); return np.sin(2 * np.pi * np.cumsum(np.geomspace(160, 45, len(t))) / SR) * np.exp(-t * 18)
def hat(): d = 0.05; return hp(noise(d), 7000) * np.exp(-tt(d) * 80) * 0.5
def snare(): d = 0.14; t = tt(d); return (bp(noise(d), 1500, 6000) * 0.8 + 0.4 * np.sin(2 * np.pi * 200 * t)) * np.exp(-t * 25)

prog = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [67, 72, 76]), (55, [67, 71, 74])]  # Am F C G
lead_pat = [[76, None, 74, 72, None, 72, 74, None], [72, None, 69, None, 72, 74, 76, None], [79, None, 76, 74, 72, None, 74, 76], [74, None, 71, None, 74, None, 79, None]]
bar = beat * 4; nbars = int(DUR / bar) + 1
mus = np.zeros(int((nbars + 1) * bar * SR))
for b in range(nbars):
    t0 = b * bar; root, ch = prog[b % 4]
    sec = (b // 8) % 2
    for k in range(8):  # eighths
        tk = t0 + k * beat / 2; i = int(tk * SR)
        # bass
        bn = root - 12 + (12 if k % 2 else 0)
        x = tri(note_f(bn), beat / 2 * 0.9, 0.55); mus[i:i + len(x)] += x
        # arp
        an = ch[k % 3] + (12 if sec and k % 4 == 3 else 0)
        x = sq(note_f(an), beat / 4 * 0.9, 0.25, 0.12); mus[i:i + len(x)] += x
        # lead (every other 4-bar block)
        if (b // 4) % 2 == 1:
            ln = lead_pat[b % 4][k]
            if ln:
                x = sq(note_f(ln), beat / 2 * 0.85, 0.5, 0.16); mus[i:i + len(x)] += x
        # drums
        if k in (0, 4): x = kick(); mus[i:i + len(x)] += x * 0.9
        if k in (2, 6): x = snare(); mus[i:i + len(x)] += x * 0.5
        x = hat(); mus[i:i + len(x)] += x * (0.5 if k % 2 else 0.3)
mus = lp(mus, 9000)[:N]
mus = mus / np.sqrt(np.mean(mus ** 2))  # rms 1

# ---- voice ----
voice, vsr = sf.read(ROOT + "voice/voice_ed.wav")
if vsr != SR: voice = signal.resample_poly(voice, SR, vsr)
voice = np.concatenate([voice, np.zeros(N - len(voice))])[:N] if len(voice) < N else voice[:N]
# echo on the scream line
a, b = int(T["scream11"] * SR), int((T["scream11"] + 1.6) * SR)
seg = voice[a:b].copy()
for dl, gg in [(0.22, 0.4), (0.44, 0.22), (0.66, 0.12)]:
    j = a + int(dl * SR); voice[j:j + len(seg)] += seg * gg
vr = np.sqrt(np.mean(voice[np.abs(voice) > 0.01] ** 2))

# ---- music gain envelope (dB relative to voice rms) ----
g = np.full(N, -22.0); tsec = np.arange(N) / SR
g[(tsec >= T["s3"]) & (tsec < T["s6"])] = -30
g[(tsec >= T["s6"]) & (tsec < T["press6"])] = -22
g[(tsec >= T["press6"]) & (tsec < T["s7"])] = -16
g[(tsec >= T["rustam9"]) & (tsec < T["meme9"] + 1.75)] = -120
g[tsec >= T["you11"]] = -120
# smooth gain (in linear domain), fast 60 ms
lin = 10 ** (g / 20); k = int(0.06 * SR); lin = np.convolve(lin, np.ones(k) / k, "same")
music = mus * vr * lin * 10 ** (3 / 20)

# meme sound
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", ROOT + "voice/meme.mp3", "-ar", str(SR), "-ac", "1", "/tmp/claude-0/meme.wav"], check=True)
meme, _ = sf.read("/tmp/claude-0/meme.wav")
memer = np.sqrt(np.mean(meme[np.abs(meme) > 0.01] ** 2))
meme_track = np.zeros(N); i = int(T["meme9"] * SR); meme_track[i:i + len(meme)] = meme * (vr / memer) * 10 ** (2 / 20)

sfx_t = sfx[:N] * vr * 10 ** (-1 / 20) / 0.35
mix_mono_parts = dict(voice=voice, music=music, sfx=sfx_t, meme=meme_track)
mix = voice + music + sfx_t + meme_track
# low-pass "deaf" moment
a, b = int(T["deaf3"] * SR), int((T["deaf3"] + 1.5) * SR)
seg = mix[a - 2000:b + 2000]; f = lp(seg, 500, 4)
xf = np.ones(len(seg)); r = 4000; xf[:r] = np.linspace(0, 1, r); xf[-r:] = np.linspace(1, 0, r)
mix[a - 2000:b + 2000] = seg * (1 - xf) + f * xf * 1.3

# stereo: sfx slightly wide
L = mix.copy(); R = mix.copy()
sf.write("/tmp/claude-0/premix.wav", np.stack([L, R], 1) / (np.max(np.abs(mix)) * 1.05), SR, subtype="FLOAT")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/tmp/claude-0/premix.wav", "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", str(SR), "-t", str(DUR), ROOT + "out/mix.wav"], check=True)
print("done", DUR)
