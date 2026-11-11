import json, numpy as np, wave
from scipy import signal
SR = 48000
rng = np.random.default_rng(7)
ev = json.load(open('ev.json'))
TL = json.load(open('timeline.json'))
DUR = ev['dur'] + 0.5
N = int(DUR * SR)

def rd(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768; return a
voice = rd('voice.wav'); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]

def t(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None, curve=4):
    n = int(d * SR); x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4))
    e *= np.exp(-x * curve / max(d, 1e-3)) if r is None else np.clip(1 - (x - (d - r)) / r, 0, 1)
    return e
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2)); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def sweep(f0, f1, d, kind='exp'):
    x = t(d); f = f0 * (f1 / f0) ** (x / d) if kind == 'exp' else f0 + (f1 - f0) * x / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
IR = None
def reverb(x, dur=2.5, mix=.35, damp=3000):
    global IR
    n = int(dur * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 6.9 / dur); ir = lp(ir, damp); ir /= np.sqrt((ir ** 2).sum())
    y = signal.fftconvolve(x, ir)[:len(x) + n]
    out = np.zeros(len(y)); out[:len(x)] += x * (1 - mix); out += y * mix
    return out

# ---------------- SFX ----------------
def s_hit():
    d = 1.6; x = sweep(90, 38, d) * env(d, .002, curve=5) * .9
    n = lp(noise(.25), 900) * env(.25, .001, curve=12) * .5; x[:len(n)] += n
    return reverb(x, 2.2, .3)
def s_boom():
    d = 3.0; x = sweep(70, 28, d) * env(d, .003, curve=4) * 1.0 + lp(noise(d), 300) * env(d, .002, curve=6) * .6
    return reverb(x, 3.5, .45, 1800)
def s_boomlow():
    d = 4.0; x = sweep(48, 26, d) * env(d, .05, curve=3) * 1.0 + lp(noise(d), 160) * env(d, .1, curve=3) * .8
    return reverb(x, 4, .4, 900)
def s_boomwarm():
    d = 3.5; x = sweep(80, 40, d) * env(d, .01, curve=4) * .6
    for f in (261.6, 329.6, 392, 523.2): x += np.sin(2 * np.pi * f * t(d)) * env(d, .3, curve=3) * .06
    return reverb(x, 3.5, .5)
def s_stamp():
    x = sweep(160, 60, .18) * env(.18, .001, curve=10) * .9
    p = bp(noise(.09), 900, 4000) * env(.09, .001, curve=10) * .6; x[:len(p)] += p
    return reverb(x, .6, .15)
def s_stampbig():
    a = s_stamp(); b = s_hit(); n = max(len(a), len(b)); o = np.zeros(n); o[:len(a)] += a; o[:len(b)] += b * .7; return o
def s_strike():
    d = .35; n = bp(noise(d), 1800, 7000) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t(d))) * env(d, .02, curve=3); return n * .45
def s_click(): return hp(noise(.012), 2000) * env(.012, .0005, curve=8) * .7 + np.sin(2 * np.pi * 2600 * t(.012)) * env(.012, .0005, curve=8) * .2
def s_type(d):
    o = np.zeros(int((d + .3) * SR)); tt = 0
    while tt < d:
        k = s_click() * (0.6 + rng.random() * .5); thud = lp(noise(.03), 400) * env(.03, .001, curve=10) * .5
        i = int(tt * SR); o[i:i + len(k)] += k; o[i:i + len(thud)] += thud
        tt += .055 + rng.random() * .07
    return o * .8
def s_tick(d):
    o = np.zeros(int((d + .3) * SR)); n = 26
    for k in range(n):
        u = k / n; tt = d * (1 - (1 - u) ** 2.2); c = s_click() * .6; i = int(tt * SR); o[i:i + len(c)] += c
        b = np.sin(2 * np.pi * 900 * t(.02)) * env(.02, .001, curve=8) * .08; o[i:i + len(b)] += b
    return o
def s_tickone():
    y = np.zeros(int(.4 * SR)); c = s_click() * .5; y[:len(c)] += c; b = np.sin(2 * np.pi * 1100 * t(.12)) * env(.12, .001, curve=8) * .1; y[:len(b)] += b
    return reverb(y, .8, .25)
def s_drop():
    x = sweep(120, 55, .25) * env(.25, .001, curve=9) * .7; p = bp(noise(.2), 600, 5000) * env(.2, .001, curve=7) * .35; x[:len(p)] += p; return reverb(x, .5, .15)
def s_whoosh(d=.7, rev=False):
    x = noise(d); f = np.linspace(0, 1, len(x)); bell = np.sin(np.pi * f) ** 2
    out = np.zeros(len(x)); seg = 2048
    for i in range(0, len(x), seg):
        u = i / len(x); fc = 300 + 3500 * np.sin(np.pi * u) ** 1.5
        out[i:i + seg] = bp(x[i:i + seg], max(80, fc * .5), min(18000, fc * 1.6), 1)
    out = lp(out, 7000) * bell * .9
    return out[::-1] if rev else out
def s_zoomwhoosh():
    a = s_whoosh(.9, True); b = s_hit() * .6; o = np.zeros(len(a) + len(b)); o[:len(a)] += a; o[len(a) - 2000:len(a) - 2000 + len(b)] += b; return o
def s_flash():
    d = .5; whine = sweep(2500, 7000, .35) * np.linspace(0, 1, int(.35 * SR)) * .05
    o = np.zeros(int(1.4 * SR)); o[:len(whine)] += whine
    pop = (hp(noise(.05), 1500) * env(.05, .0005, curve=10) * .8); i = int(.33 * SR); o[i:i + len(pop)] += pop
    thump = sweep(200, 60, .15) * env(.15, .001, curve=10) * .5; o[i:i + len(thump)] += thump
    return reverb(o, 1.2, .3)
def s_paper(d=.8):
    x = noise(d); crack = (rng.random(len(x)) < .004).astype(float); crack = np.convolve(crack, np.ones(80), 'same')
    y = bp(x, 1500, 8000) * (0.2 + crack) * np.sin(np.pi * np.linspace(0, 1, len(x))) * .35
    return y
def s_glitch():
    d = .45; o = np.zeros(int(d * SR)); i = 0
    while i < len(o):
        L = int(rng.integers(300, 3000)); kind = rng.random()
        seg = np.sign(np.sin(2 * np.pi * rng.uniform(80, 1500) * np.arange(L) / SR)) * .15 if kind < .5 else rng.standard_normal(L) * .2
        seg = np.round(seg * 6) / 6; o[i:i + L] += seg[:len(o) - i]; i += L + int(rng.integers(0, 2500))
    return o
def s_siren(d):
    x = t(d); f = 720 + 230 * np.sin(2 * np.pi * x / 3.2); s = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    s = lp(s, 2000) * np.minimum(1, x / 1.5) * np.minimum(1, (d - x) / 1.5) * .07
    return reverb(s, 2.5, .6)
def s_crowd(d):
    x = noise(d); y = bp(x, 250, 1800) * (0.6 + .4 * np.abs(np.sin(2 * np.pi * x.cumsum() * 0 + 2 * np.pi * t(d) * .3)))
    # footsteps
    st = np.zeros(len(x)); tt = 0
    while tt < d - .1:
        c = lp(noise(.04), 1500) * env(.04, .001, curve=10) * .5; i = int(tt * SR); st[i:i + len(c)] += c; tt += .25 + rng.random() * .3
    e = np.minimum(1, t(d) / 1.2) * np.minimum(1, (d - t(d)) / 1.2)
    return (y * .05 + st * .25) * e
def s_swell(d):
    x = t(d); u = x / d; s = lp(noise(d), 600) * u ** 2 * .25 + np.sin(2 * np.pi * 41 * x) * u ** 2 * .35
    s *= np.minimum(1, (d - x) / .4)
    return s
def s_scan(d):
    o = np.zeros(int(d * SR)); tt = 0
    while tt < d - .1:
        f = rng.choice([1320, 1760, 2093, 1568]); b = np.sin(2 * np.pi * f * t(.05)) * env(.05, .002, curve=6) * .06; i = int(tt * SR); o[i:i + len(b)] += b; tt += .09 + rng.random() * .12
    return o
def s_car(d):
    x = t(d); u = x / d; g = np.exp(-((u - .5) / .18) ** 2); s = lp(noise(d), 500) * g * .35 + np.sin(2 * np.pi * np.cumsum(70 + 20 * (u < .5)) / SR) * g * .1
    return s
def s_phone(d):
    x = t(d); s = (np.sin(2 * np.pi * 440 * x) + np.sin(2 * np.pi * 480 * x)) * (np.sin(2 * np.pi * 20 * x) > 0) * .05
    gate = ((x % 3) < 1.6).astype(float); return reverb(lp(s * gate, 3000), 1.0, .3)
def s_papers(d):
    o = np.zeros(int((d + 1) * SR)); tt = 0
    while tt < d:
        p = s_paper(.25 + rng.random() * .2) * (0.5 + rng.random()); i = int(tt * SR); o[i:i + len(p)] += p; tt += .04 + rng.random() * .07
    return o * .7
def s_creak(d):
    x = t(d); f = 90 + 40 * np.sin(2 * np.pi * x * .7) + rng.standard_normal(len(x)).cumsum() * .0
    s = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (0.5 + .5 * (rng.random(len(x)) < .3)) ; s = bp(s, 200, 1800) * np.sin(np.pi * x / d) * .08
    return s
def s_door():
    a = sweep(110, 50, .4) * env(.4, .002, curve=7) * .8; c = hp(noise(.03), 2500) * env(.03, .001, curve=10) * .4
    o = np.zeros(int(.8 * SR)); o[:len(a)] += a; i = int(.12 * SR); o[i:i + len(c)] += c; return reverb(o, 1.5, .35)
def s_crack(d):
    o = np.zeros(int((d + .5) * SR)); tt = 0
    while tt < d:
        c = lp(noise(.06), 900 + rng.random() * 2000) * env(.06, .001, curve=8) * (.3 + rng.random() * .4); i = int(tt * SR); o[i:i + len(c)] += c; tt += .03 + rng.random() * .12
    o[:int(d * SR)] += lp(noise(d), 120) * np.linspace(0, 1, int(d * SR)) * .3
    return reverb(o, 1.5, .3)
def s_build(d):
    o = np.zeros(int((d + .6) * SR))
    for k in range(9):
        f = 180 + k * 18; b = (np.sin(2 * np.pi * f * t(.2)) + .4 * np.sin(2 * np.pi * f * 2.7 * t(.2))) * env(.2, .001, curve=9) * .25; i = int(d * k / 9 * SR); o[i:i + len(b)] += b
    return reverb(o, 1.2, .3)
def s_card():
    a = s_whoosh(.4) * .5; b = sweep(140, 70, .15) * env(.15, .001, curve=9) * .4; o = np.zeros(len(a) + len(b)); o[:len(a)] += a; o[int(.3 * SR):int(.3 * SR) + len(b)] += b; return o
def s_snip():
    o = np.zeros(int(.15 * SR)); c = s_click(); o[:len(c)] += c; o[int(.06 * SR):int(.06 * SR) + len(c)] += c * .8; return o * .7
def s_redact(): return s_whoosh(.25)[::-1] * .35
def s_thread(): return bp(noise(.5), 3000, 9000) * np.sin(np.pi * np.linspace(0, 1, int(.5 * SR))) * .08

SFX = {'hit': s_hit, 'boom': s_boom, 'boomlow': s_boomlow, 'boomwarm': s_boomwarm, 'stamp': s_stamp, 'stampbig': s_stampbig, 'strike': s_strike, 'tickone': s_tickone,
       'drop': s_drop, 'whoosh': lambda: s_whoosh(.7), 'zoomwhoosh': s_zoomwhoosh, 'flash': s_flash, 'paper': lambda: s_paper(.9), 'glitch': s_glitch, 'door': s_door,
       'card': s_card, 'click': lambda: s_click() * 1.2, 'snip': s_snip, 'redact': s_redact, 'thread': s_thread}
SFXD = {'type': s_type, 'tick': s_tick, 'siren': s_siren, 'crowd': s_crowd, 'drone_swell': s_swell, 'scan': s_scan, 'car': s_car, 'phone': s_phone, 'papers': s_papers, 'creak': s_creak, 'crack': s_crack, 'build': s_build}
GAIN = {'hit': .55, 'boom': .7, 'boomlow': .8, 'boomwarm': .6, 'stamp': .55, 'stampbig': .6, 'strike': .5, 'tickone': .5, 'drop': .45, 'whoosh': .35, 'zoomwhoosh': .45,
        'flash': .5, 'paper': .45, 'glitch': .3, 'door': .5, 'card': .4, 'click': .4, 'snip': .4, 'redact': .3, 'thread': .5, 'type': .35, 'tick': .35, 'siren': .8,
        'crowd': .9, 'drone_swell': .5, 'scan': .5, 'car': .5, 'phone': .7, 'papers': .5, 'creak': .6, 'crack': .5, 'build': .5}
sfx = np.zeros(N + SR * 6)
silences = []
cache = {}
for e in ev['events']:
    k = e['type']; i = int(e['t'] * SR)
    if k == 'silence': silences.append((e['t'], e['t'] + e['d'])); continue
    if k in SFX:
        if k not in cache or k in ('glitch', 'paper', 'hit'): cache[k] = SFX[k]()
        x = cache[k]
    elif k in SFXD: x = SFXD[k](e.get('d', 1.0))
    else: print('unknown', k); continue
    x = np.asarray(x, dtype=np.float64) * GAIN.get(k, .5)
    sfx[i:i + len(x)] += x[:len(sfx) - i]
sfx = sfx[:N]

# ---------------- MUSIC ----------------
x = np.arange(N) / SR
def note(n): return 440 * 2 ** ((n - 69) / 12)
# chord plan per scene: list of chords (midi) cycling every `bar` seconds
A = [45, 52, 57, 60]; F_ = [41, 48, 53, 57]; Dm = [38, 50, 53, 57]; E_ = [40, 47, 52, 56]; C_ = [36, 48, 52, 55]; G_ = [43, 50, 55, 59]; Am = A; Bb = [46, 53, 58, 62]; Gm = [43, 50, 55, 58]
scenes = TL['scenes']
plan = [(0, [Am, F_, Dm, E_]), (scenes[1]['t0'], [Am, Dm, Am, E_]), (scenes[2]['t0'], [Dm, Bb, Gm, A]), (scenes[3]['t0'], [Am, F_, Dm, E_]),
        (scenes[4]['t0'], [Gm, Dm, Bb, A]), (scenes[5]['t0'], [Dm, Bb, Gm, A]), (scenes[6]['t0'], [Am, F_, C_, G_]), (scenes[6]['t0'] + 30, [C_, G_, Am, F_]),
        (scenes[7]['t0'], [Am, F_, Dm, E_]), (scenes[7]['t0'] + 105, [F_, C_, G_, Am])]
bar = 9.6
pad = np.zeros(N)
fade = int(2.5 * SR)
for pi, (st, chords) in enumerate(plan):
    en = plan[pi + 1][0] if pi + 1 < len(plan) else DUR
    k = 0; tt = st
    while tt < en:
        ch = chords[k % len(chords)]; d = min(bar, en - tt) + 2.5
        i0 = int(tt * SR); n = int(d * SR); xx = np.arange(n) / SR
        e = np.minimum(1, xx / 2.5) * np.minimum(1, (d - xx) / 2.5)
        s = np.zeros(n)
        for j, m in enumerate(ch):
            f = note(m + 12 if j else m)
            for dt in (-0.12, 0.12):
                ff = f * 2 ** (dt / 12)
                s += (np.sin(2 * np.pi * ff * xx + j) + .3 * np.sin(4 * np.pi * ff * xx) + .12 * np.sin(6 * np.pi * ff * xx)) * (.5 if j == 0 else .28)
        s *= e * (0.85 + .15 * np.sin(2 * np.pi * xx / 7 + k))
        pad[i0:i0 + n] += s[:N - i0]
        tt += bar; k += 1
pad = lp(pad, 1400) * .05
# drone
drone = (np.sin(2 * np.pi * 55 * x) + .5 * np.sin(2 * np.pi * 55.3 * x) + .3 * np.sin(2 * np.pi * 82.4 * x)) * (0.7 + .3 * np.sin(2 * np.pi * x / 23))
drone = lp(drone, 300) * .07
wind = lp(bp(rng.standard_normal(N), 100, 1200, 1), 900) * (0.5 + .5 * np.sin(2 * np.pi * x / 17)) * .025
# heartbeat pulse in tense windows
pulse = np.zeros(N)
tense = [(scenes[2]['t0'] + 46, scenes[2]['t0'] + 62), (scenes[2]['t0'] + 66, scenes[2]['t0'] + 85), (scenes[3]['t0'] + 58, scenes[3]['t0'] + 70), (scenes[5]['t0'] + 20, scenes[5]['t0'] + 55),
         (scenes[7]['t0'] + 25, scenes[7]['t0'] + 33), (scenes[7]['t0'] + 52, scenes[7]['t0'] + 75), (scenes[0]['t0'] + 35, scenes[0]['t0'] + 52)]
hb = sweep(60, 40, .18) * env(.18, .002, curve=8)
for a, b in tense:
    tt = a; k = 0
    while tt < b:
        g = min(1, (tt - a) / 3, (b - tt) / 2) * .22
        for off, gg in ((0, 1), (.28, .6)):
            i = int((tt + off) * SR); pulse[i:i + len(hb)] += hb[:max(0, N - i)] * g * gg
        tt += 60 / 66
music = pad + drone + wind + pulse
# intro: let drone start from black; outro boost
# silences: kill music
gm = np.ones(N)
for a, b in silences:
    i0, i1 = int((a - .25) * SR), int((b + .1) * SR)
    ramp = np.linspace(1, 0, int(.25 * SR)); gm[i0:i0 + len(ramp)] = np.minimum(gm[i0:i0 + len(ramp)], ramp); gm[i0 + len(ramp):i1] = 0
    up = np.linspace(0, 1, int(1.5 * SR)); gm[i1:i1 + len(up)] = np.minimum(gm[i1:i1 + len(up)], up)
# gap between scenes 7 and 8: silence
a = scenes[6]['t1'] + .3; b = scenes[7]['t0'] - .2
i0, i1 = int(a * SR), int(b * SR); gm[i0:i1] = np.minimum(gm[i0:i1], np.linspace(1, 0, i1 - i0) ** 3)
# duck under voice
venv = np.abs(voice); k = int(.25 * SR); venv = np.convolve(venv, np.ones(k) / k, 'same'); venv = venv / (venv.max() + 1e-9)
duck = 1 - .55 * np.clip(venv * 8, 0, 1); duck = np.convolve(duck, np.ones(int(.3 * SR)) / int(.3 * SR), 'same')
music = music * gm * duck
sfx_d = sfx * (1 - .25 * np.clip(venv * 8, 0, 1))
# end fade
fo = int(3 * SR); music[-fo:] *= np.linspace(1, 0, fo); sfx_d[-fo:] *= np.linspace(1, 0, fo)
np.save('music.npy', music.astype(np.float32)); np.save('sfx.npy', sfx_d.astype(np.float32)); print('saved')
