# python3 sfx.py cues.json out.wav DUR
import numpy as np, wave, json, sys
SR = 48000
cues = json.load(open(sys.argv[1])); OUT = sys.argv[2]; DUR = float(sys.argv[3])
N = int(SR * DUR); L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(7)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def add(sig, t0, pan=0., g=1.):
    i = int(t0 * SR); n = min(len(sig), N - i)
    if n > 0 and i >= 0: L[i:i+n] += sig[:n] * g * (1 - max(0, pan)); R[i:i+n] += sig[:n] * g * (1 + min(0, pan))
def sweep(f0, f1, dur, a=.003):
    n = int(dur * SR); f = np.linspace(f0, f1, n); return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, a, dur/3)
def kick(g=1., dec=9):
    n = int(.4 * SR); t = np.arange(n) / SR; f = 45 + 120 * np.exp(-t * 28)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t * dec) * g
def lp(x, c):
    o = np.zeros_like(x); y = 0.
    for i in range(len(x)): y += c * (x[i] - y); o[i] = y
    return o
def noise(dur, up=True):
    n = int(dur * SR); x = rng.standard_normal(n); c = np.linspace(.02, .35, n) if not up else np.linspace(.02, .35, n)
    if not up: c = c[::-1]
    o = np.zeros(n); y = 0
    for i in range(n): y += c[i] * (x[i] - y); o[i] = y
    return o * np.sin(np.pi * np.arange(n) / n) ** 2 * 1.2
def bell(f, d=1.2):
    n = int(2.5 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*f*t) + .4*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*3) + .2*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*6)) * env(n, .002, d)
def click(f=3000, d=.012):
    n = int(d*SR); return rng.standard_normal(n) * np.exp(-np.arange(n)/SR/(d/4))
SCALE = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98, 100, 103, 105]
for c in cues:
    t, s, i, p, g = c['t'], c['s'], c.get('i', 0), c.get('pan', 0.), c.get('g', 1.)
    if s == 'pop_neg': add(sweep(420 - i*25, 230, .17), t, p, .35*g)
    elif s == 'pop_pos': add(sweep(620 + i*110, 950 + i*140, .12), t, p, .28*g)
    elif s == 'click': add(sweep(1500, 950, .05), t, p, .1*g)
    elif s == 'whoosh_up': add(noise(c.get('d', .5), True), t, p, .45*g)
    elif s == 'whoosh_down': add(noise(c.get('d', .5), False), t, p, .35*g)
    elif s == 'step':
        f = mtof(SCALE[i % len(SCALE)]); add(sweep(f*.92, f, .14), t, p, .24*g); add(kick(.3)[:int(.12*SR)], t, 0, .5*g)
    elif s == 'note':
        f = mtof(SCALE[i % len(SCALE)] - 12); add(bell(f, .35)[:int(.6*SR)], t, p, .18*g)
    elif s == 'thud': add(kick(.6, 14)[:int(.25*SR)], t, p, .8*g)
    elif s == 'boom': add(kick(1., 6), t, 0, 1.0*g); add(lp(rng.standard_normal(int(.5*SR)), .05)*np.exp(-np.arange(int(.5*SR))/SR*8), t, 0, .5*g)
    elif s == 'slam':
        add(kick(1.2, 5), t, 0, 1.1*g); add(lp(rng.standard_normal(int(.7*SR)), .12)*np.exp(-np.arange(int(.7*SR))/SR*6), t, 0, .9*g)
        add(sweep(220, 110, .5), t, 0, .5*g)
    elif s == 'chime':
        for k, m in enumerate([84, 88, 91, 96]): add(bell(mtof(m)), t + k*.05, (k-1.5)*.25, .13*g)
    elif s == 'sparkle':
        for k in range(int(c.get('n', 24))): add(bell(mtof(96 + rng.integers(0, 14)), .12)[:int(.4*SR)], t + rng.random()*c.get('d', 1.5), rng.uniform(-.8, .8), .045*g)
    elif s == 'tick': add(sweep(2300, 2100, .025), t, p, .12*g)
    elif s == 'riser':
        d = c.get('d', 1.); n = int(d*SR); add(noise(d, True) * np.linspace(0, 1, n)**2, t, 0, .55*g)
        add(sweep(200, 900, d, a=d*.8) * np.linspace(0, 1, n), t, 0, .15*g)
    elif s == 'heart':
        add(kick(.9, 16)[:int(.2*SR)], t, 0, .9*g); add(kick(.6, 18)[:int(.2*SR)], t + .17, 0, .6*g)
    elif s == 'crack':
        for k in range(14): add(click(), t + k*.008 + rng.random()*.01, rng.uniform(-.5, .5), .35*g)
        add(sweep(3000, 1800, .08), t, 0, .12*g)
    elif s == 'shatter':
        for k in range(40): add(bell(mtof(100 + rng.integers(0, 10)), .05)[:int(.12*SR)], t + rng.random()*.35, rng.uniform(-.8, .8), .06*g)
        add(kick(.4, 20)[:int(.15*SR)], t, 0, .6*g)
    elif s == 'flip':
        n = int(.18*SR); x = lp(rng.standard_normal(n), .45) * np.sin(np.pi*np.arange(n)/n)**3; add(x, t, p, .35*g)
    elif s == 'stamp': add(kick(.8, 20)[:int(.2*SR)], t, 0, .8*g); add(click(), t, 0, .5*g)
    elif s == 'projector':
        d = c.get('d', 4.); k = 0.
        while k < d: add(click(1500, .006), t + k, .3, .05*g); k += 1/24
    elif s == 'burn':
        d = c.get('d', 3.); n = int(d*SR)
        for k in range(int(d*30)): add(click(), t + rng.random()*d, rng.uniform(-.6, .6), .08*g*rng.random())
        add(lp(rng.standard_normal(n), .03) * np.sin(np.pi*np.arange(n)/n), t, 0, .5*g)
    elif s == 'blip':
        for k in range(3): add(sweep(900, 900, .05), t + k*.12, p, .07*g)
for D, gg in [(.09, .22), (.19, .14), (.31, .08)]:
    d = int(D * SR); L[d:] += R[:-d] * gg; R[d:] += L[:-d] * gg * .9
pk = max(np.abs(L).max(), np.abs(R).max(), 1e-6)
L = np.tanh(L / pk * 1.1) * .9; R = np.tanh(R / pk * 1.1) * .9
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([L, R], 1) * 32767).astype(np.int16).tobytes())
print('ok', OUT)
