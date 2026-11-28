"""Audio: places the voices and the music on the shared timeline, synthesises the SFX,
then mixes with ffmpeg (voice processing, music ducked under the voices, loudness -14 LUFS).

Usage: python3 -I mix.py <motion_dir>   ->  out/mix.wav (+ stems in out/stems)
"""
import json, os, sys, subprocess
import numpy as np
import librosa
import soundfile as sf
from scipy import signal

D = sys.argv[1]
M, O = os.path.join(D, 'media'), os.path.join(D, 'out')
ST = os.path.join(O, 'stems'); os.makedirs(ST, exist_ok=True)
TL = json.load(open(os.path.join(M, 'timeline.json')))
SR = 48000
DUR = TL['duration']
N = int(DUR * SR)
rng = np.random.default_rng(7)
BEAT = 60 / 172 * 2


def T(t): return int(round(t * SR))


def fade(x, a=.008, b=.008):
    x = x.copy(); na, nb = min(len(x), int(a * SR)), min(len(x), int(b * SR))
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


def place(bus, x, t, gain=1.0):
    i = T(t)
    if i < 0: x = x[-i:]; i = 0
    j = min(len(bus), i + len(x))
    if j > i: bus[i:j] += x[:j - i] * gain


# ---------------- voices ----------------
def voice_stem(name, file, segs_filter=None):
    y, _ = librosa.load(os.path.join(M, file), sr=SR)
    bus = np.zeros(N)
    for k, (a, b, dst) in enumerate(TL['segs'][name]):
        if segs_filter and k not in segs_filter: continue
        place(bus, fade(y[T(a):T(b)], .006, .02), dst)
    return bus


narr = voice_stem('narr', 'voice_narrator.wav')
gpt = voice_stem('gpt', 'voice_chatgpt.wav')
grok1 = voice_stem('grok', 'voice_grok.wav', {0})
grok2 = voice_stem('grok', 'voice_grok.wav', {1})
for n, x in [('narr', narr), ('gpt', gpt), ('grok1', grok1), ('grok2', grok2)]:
    sf.write(os.path.join(ST, n + '.wav'), x.astype(np.float32), SR)

# ---------------- music ----------------
song, _ = librosa.load(os.path.join(M, 'music.mp3'), sr=SR, mono=False)
mus = np.zeros((2, N))
# Music from the very first frame: the intro is a repeating 8-bar phrase (11.100 s at ~173 BPM),
# so we restart the intro once at a bar line (song 11.17 s -> 0.07 s) to gain 11.1 s, which keeps
# the song's drop (22.215 s) exactly on Grok's "Я вцеплюсь" (video 29.0 s).
LOOP_A, LOOP_P = 11.17, 11.10
xf = T(.015)
partA = song[:, :T(LOOP_A) + xf].copy(); partB = song[:, T(LOOP_A - LOOP_P):].copy()
partA[:, -xf:] *= np.linspace(1, 0, xf); partB[:, :xf] *= np.linspace(0, 1, xf)
ext = np.concatenate([partA[:, :-xf], partA[:, -xf:] + partB[:, :xf], partB[:, xf:]], axis=1)
extDrop = TL['dropSong'] + LOOP_P
off = extDrop - TL['drop']                      # ext time shown at video 0
body = ext[:, T(off):T(off) + N].copy()
body[:, :T(.25)] *= np.linspace(0, 1, T(.25))
# under the last line the music keeps going, muffled (low-pass) and lower, instead of silence
mOut = TL['musicOut']
lpf = signal.sosfiltfilt(signal.butter(4, 380, 'low', fs=SR, output='sos'), body, axis=1)
tt_ = np.arange(N) / SR
k = np.interp(tt_, [mOut - .15, mOut + .35, 43.0, 43.25], [0, 1, 1, 1])       # crossfade to muffled
g = np.interp(tt_, [mOut - .15, mOut + .35, 42.7, 43.25, 43.3], [1, .55, .55, 0, 0])
g[tt_ < mOut - .15] = 1
mix_b = (body * (1 - k) + lpf * k) * g
mix_b[:, tt_ >= 43.3] = 0
# finale: full-force drop hit, then sit the music under Grok's voice
fin = np.interp(tt_, [0, 29.35, 29.8, 38.6, 38.75], [1, 1, .6, .6, 1])
mix_b *= fin
mus += mix_b
# end card: the drop again
endAt = TL['endDrop']
s2 = song[:, T(TL['dropSong'] - .01):T(TL['dropSong'] - .01) + T(DUR - endAt + .01)].copy()
fo0, fo1 = T(46.0 - endAt), T(DUR - endAt)
env = np.ones(s2.shape[1]); env[fo0:] = np.linspace(1, 0, s2.shape[1] - fo0) ** 1.5
s2 *= env
mus[:, T(endAt - .01):T(endAt - .01) + s2.shape[1]] += s2[:, :N - T(endAt - .01)]
sf.write(os.path.join(ST, 'music.wav'), mus.T.astype(np.float32), SR)

# ---------------- SFX synthesis ----------------
def noise(d): return rng.standard_normal(T(d))
def env_exp(d, k): return np.exp(-np.arange(T(d)) / SR * k)
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, f1, f2, o=2): return signal.sosfilt(signal.butter(o, [f1, f2], 'band', fs=SR, output='sos'), x)
def sweep_lp(x, f0, f1):  # time varying one-pole lowpass
    n = len(x); fc = np.geomspace(f0, f1, n); a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros(n); s = 0.0
    for i in range(n): s = a[i] * s + (1 - a[i]) * x[i]; y[i] = s
    return y
def sine_sweep(d, f0, f1, k=0):
    n = T(d); f = np.geomspace(f0, f1, n); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * (env_exp(d, k) if k else 1)

sfx = np.zeros((2, N))
def put(x, t, g=1.0, pan=0.0):
    l, r = np.sqrt((1 - pan) / 2) * 1.414, np.sqrt((1 + pan) / 2) * 1.414
    i = T(t)
    if i < 0: x = x[-i:]; i = 0
    j = min(N, i + len(x))
    sfx[0, i:j] += x[:j - i] * g * l; sfx[1, i:j] += x[:j - i] * g * r

def boom(d=1.6, f0=95, f1=32, k=2.6):
    x = sine_sweep(d, f0, f1, k) + .35 * lp(noise(d), 180) * env_exp(d, 7)
    x[:T(.004)] *= np.linspace(0, 1, T(.004)); return x / np.abs(x).max()
def whoosh(d, f0, f1, shape='swell'):
    x = sweep_lp(noise(d), f0, f1); n = len(x); u = np.linspace(0, 1, n)
    e = np.sin(np.pi * u) ** 1.5 if shape == 'swell' else (u ** 2 if shape == 'rise' else (1 - u) ** 2)
    x = x * e; return x / (np.abs(x).max() + 1e-9)
def debris(d, density=40, bright=3000):
    x = np.zeros(T(d))
    for _ in range(int(density * d)):
        s = rng.integers(0, max(1, len(x) - T(.06))); g = rng.uniform(.2, 1) * np.exp(-s / len(x) * 2)
        grain = bp(noise(.05), rng.uniform(400, bright * .5), bright) * env_exp(.05, rng.uniform(60, 140))
        x[s:s + len(grain)] += grain * g
    return x / (np.abs(x).max() + 1e-9)
def creak(d, f=160, rough=.4):
    n = T(d); fm = f * (1 + .25 * np.sin(np.linspace(0, 3 * np.pi, n)) + .1 * np.cumsum(rng.standard_normal(n)) / np.sqrt(n))
    ph = 2 * np.pi * np.cumsum(fm) / SR
    x = signal.sawtooth(ph) * (1 + rough * rng.standard_normal(n))
    pulses = (np.sin(ph * .5) > .6).astype(float)  # stick-slip
    x = bp(x * (.4 + .6 * pulses), 250, 2400) * np.sin(np.linspace(0, np.pi, n)) ** .6
    return x / (np.abs(x).max() + 1e-9)
def thump(d=.25, f=55, k=18):
    return sine_sweep(d, f * 1.6, f, k)
def metal(d, parts=(3120, 4870, 7310, 9800), k=6):
    x = sum(np.sin(2 * np.pi * p * np.arange(T(d)) / SR) * np.exp(-np.arange(T(d)) / SR * k * (1 + i * .4)) for i, p in enumerate(parts))
    return x / len(parts)
def tick(f=1800, d=.035):
    x = signal.square(2 * np.pi * f * np.arange(T(d)) / SR) * env_exp(d, 70); return lp(x, 6000)

# wind bed: whole film, level automation
wind = bp(noise(DUR), 120, 1400, 2) * .5 + bp(noise(DUR), 900, 5000, 2) * .25
tt = np.arange(N) / SR
gust = .55 + .45 * np.sin(tt * .6) * np.sin(tt * .23 + 1)
lvl = np.interp(tt, [0, 1.2, 6.7, 7.0, 12.6, 22.6, 28.0, 29.0, 34.95, 37.73, 38.7, 39.5, 43.2, 43.4, 47.5],
                [.0, .9, .75, .35, .3, .35, .5, .3, .05, .3, .3, .8, .7, .25, 0])
wind = wind * gust * lvl
sfx[0] += wind * .17; sfx[1] += np.roll(wind, 900) * .17
# drone before the music
drn = (np.sin(2 * np.pi * 41.2 * tt) + .5 * np.sin(2 * np.pi * 61.7 * tt) + .25 * np.sin(2 * np.pi * 82.4 * tt)) * np.interp(tt, [0, 1.5, 6.5, 6.9], [0, .9, 1, 0])
sfx += drn * .04

# --- intro
put(whoosh(1.6, 300, 4000, 'swell'), 0.0, .5)                 # dive through clouds
put(boom(2.2, 70, 30, 1.6), 1.55, .45)                        # "800"
put(debris(.5, 60, 4500), 4.40, .55, -.2)                     # hold crumbles
put(whoosh(2.4, 2500, 250, 'swell'), 4.45, .45, .2)           # slow-mo fall
put(debris(1.2, 25, 3000), 4.6, .3, .3)
put(boom(1.4, 110, 38, 3.2), 6.785, .9)                       # rope snaps taut (music in)
put(creak(.7, 140), 6.80, .55)
put(lp(noise(.12), 900) * env_exp(.12, 30), 6.785, .8)
for t0 in (7.05, 7.6, 8.05, 8.5):                             # dragged toward the edge
    put(debris(.35, 70, 2500), t0, .4, -.3); put(creak(.4, 120), t0, .3)
put(debris(.9, 18, 3500), 8.6, .3, .4)                        # gravel over the edge
# --- knife
put(whoosh(.35, 600, 5000, 'rise'), 9.62, .35)
put(whoosh(.5, 5000, 400, 'fall'), 9.9, .3)
put(metal(.09, (4200, 6100, 8800), 60), 10.29, .55); put(hp(noise(.09), 3000) * env_exp(.09, 80), 10.29, .4)   # flick
put(metal(1.2, (3120, 4870, 7310, 9800), 4.5), 10.36, .22)                                      # shing
put(creak(1.1, 210, .2), 11.25, .25)
for hb in (11.75, 12.1): put(thump(.3, 50, 14), hb, .8)
# --- ChatGPT
put(tick(1200), 12.66, .25); put(tick(1800), 12.74, .25); put(tick(2400, .05), 12.8, .2)
for i in range(14): put(tick(2600 + 200 * (i % 3), .02), 13.62 + i * .12, .08, .4)
put(tick(900, .08), 15.42, .18); put(tick(900, .08), 17.97, .18)
put(whoosh(.45, 800, 6000, 'rise'), 19.5, .3)
put(hp(noise(.05), 2500) * env_exp(.05, 90), 19.92, .9)                     # the cut
put(sine_sweep(.7, 220, 120, 7) * .6, 19.92, .5)                             # rope twang
put(boom(1.2, 80, 30, 4), 19.92, .35)
put(whoosh(2.3, 1800, 150, 'fall'), 20.05, .45, .2)                          # fall away
# --- rewind
rw = whoosh(.6, 500, 6000, 'rise')[::-1]
put(rw, 22.6, .5); put(sine_sweep(.6, 900, 90) * np.linspace(1, 0, T(.6)), 22.6, .18)
put(bp(noise(.6), 2000, 7000) * (np.sin(np.arange(T(.6)) / SR * 2 * np.pi * 35) > 0) * .5, 22.6, .2)
# --- Grok
put(boom(1.0, 60, 30, 5), 23.2, .45); put(metal(.9, (2600, 3900, 5850), 5), 23.22, .08)
put(creak(.6, 130), 24.4, .35); put(creak(.7, 120), 27.59, .45); put(thump(.3, 60, 12), 27.62, .6)
for hb in (28.22, 28.58): put(thump(.32, 48, 12), hb, 1.0)
# --- drop
put(boom(2.0, 120, 30, 2.2), 29.0, 1.0)
put(debris(.9, 90, 5000), 29.0, .6, -.2)
put(lp(noise(.2), 2500) * env_exp(.2, 18), 29.0, .7)
for k in range(9):                                                            # hand-over-hand pulls
    t0 = 31.43 + k * BEAT
    put(creak(.42, 150 + 15 * (k % 3), .3), t0, .5, -.15 if k % 2 else .15)
put(boom(1.1, 70, 30, 4), 33.66, .55)                                         # "в кровь"
put(whoosh(.5, 300, 5000, 'rise'), 32.1, .3)
# --- flashback & return
put(whoosh(1.0, 200, 3000, 'swell'), 34.75, .4)
proj = bp(noise(2.8), 1500, 5000) * (np.sin(2 * np.pi * 18 * np.arange(T(2.8)) / SR) > .7) * .3
put(proj * np.interp(np.arange(len(proj)), [0, T(.4), T(2.4), T(2.8)], [0, 1, 1, 0]), 34.95, .25)
put(whoosh(.6, 4000, 300, 'fall'), 37.6, .4)
put(thump(.2, 90, 25), 37.84, .7); put(lp(noise(.08), 1200) * env_exp(.08, 40), 37.84, .5)    # hand slaps the edge
put(creak(.8, 140), 38.3, .35)
# --- music out: warm pad under the last line
pad_d = 4.9; pt = np.arange(T(pad_d)) / SR
pad = sum(np.sin(2 * np.pi * f * pt + np.sin(pt * .7 + i) * .3) for i, f in enumerate((110, 164.8, 220, 261.6)))
pad = lp(pad, 1200) * np.interp(pt, [0, 1.2, 3.8, pad_d], [0, 1, 1, 0])
put(pad / np.abs(pad).max(), 38.6, .12)
put(whoosh(.6, 300, 5000, 'rise'), 42.85, .35)
# --- end card
put(boom(2.2, 120, 28, 2), 43.4, 1.0)
put(boom(1.2, 140, 40, 3.5), 43.4 + BEAT, .55)
put(whoosh(.5, 3000, 600, 'fall'), 44.55, .25)

sfx = np.clip(sfx, -4, 4)
sf.write(os.path.join(ST, 'sfx.wav'), (sfx.T * .5).astype(np.float32), SR)

# ---------------- mix with ffmpeg ----------------
S = lambda n: os.path.join(ST, n + '.wav')
fc = (
    "[0:a]highpass=f=70,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,volume=1.0[narr];"
    "[1:a]highpass=f=120,equalizer=f=2600:t=q:w=1.2:g=3,aecho=0.85:0.5:11:0.22,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,volume=1.4[gpt];"
    "[2:a]rubberband=pitch=0.944:formant=preserved,highpass=f=60,equalizer=f=140:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3.5:attack=6:release=120:makeup=2,volume=1.0[g1];"
    "[3:a]rubberband=pitch=0.944:formant=preserved,highpass=f=60,equalizer=f=140:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3.5:attack=6:release=120:makeup=2,"
    "aecho=0.8:0.55:70|140|230:0.22|0.14|0.08,volume=2.1[g2];"
    "[narr][gpt][g1][g2]amix=inputs=4:normalize=0,pan=stereo|c0=c0|c1=c0,volume=1.45,asplit=2[vox][key];"
    "[4:a]volume=0.55[mus0];"
    "[mus0][key]sidechaincompress=threshold=0.06:ratio=2.5:attack=20:release=350:makeup=1[mus];"
    "[5:a]volume=1.0[fx];"
    "[vox][mus][fx]amix=inputs=3:normalize=0,alimiter=limit=0.89:attack=3:release=60,loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000[out]"
)
cmd = ['ffmpeg', '-v', 'error', '-y'] + sum([['-i', S(n)] for n in ('narr', 'gpt', 'grok1', 'grok2', 'music', 'sfx')], []) + \
      ['-filter_complex', fc, '-map', '[out]', '-ar', '48000', '-ac', '2', os.path.join(O, 'mix.wav')]
subprocess.run(cmd, check=True)
y, _ = sf.read(os.path.join(O, 'mix.wav'))
print('mix', y.shape, 'dur', len(y) / SR, 'peak', np.abs(y).max())
