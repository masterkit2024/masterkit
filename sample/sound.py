import numpy as np, wave, sys
SR=48000; T=5.0; N=int(SR*T); L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(7)
t=np.arange(N)/SR
def add(sig,at,pan=0.0,g=1.0):
    i=int(at*SR); s=sig[:max(0,N-i)]*g; L[i:i+len(s)]+=s*np.sqrt(.5-pan/2)*1.4; R[i:i+len(s)]+=s*np.sqrt(.5+pan/2)*1.4
def env(n,a=.003,d=.3):
    x=np.arange(n)/SR; return np.minimum(x/a,1)*np.exp(-x/d)
def pluck(f,dur=.5,d=.18,br=.5):
    n=int(dur*SR); x=np.arange(n)/SR
    s=np.sin(2*np.pi*f*x)+br*.5*np.sin(4*np.pi*f*x)*np.exp(-x/.05)+br*.25*np.sin(6*np.pi*f*x)*np.exp(-x/.03)
    return s*env(n,.002,d)
def xylo(f,dur=.6):
    n=int(dur*SR); x=np.arange(n)/SR
    return (np.sin(2*np.pi*f*x)*np.exp(-x/.25)+.35*np.sin(2*np.pi*f*3.93*x)*np.exp(-x/.04)+.2*np.sin(2*np.pi*f*9.2*x)*np.exp(-x/.012))*np.minimum(x/.001,1)
def noise(n): return rng.standard_normal(n)
def lp(x,a):  # one-pole
    y=np.zeros_like(x); s=0.0
    for i in range(len(x)): s+=a*(x[i]-s); y[i]=s
    return y
nt=lambda m:440*2**((m-69)/12)
# ---- bed: 120 bpm swung pizzicato walk + xylophone comping ----
bass=[45,48,50,52, 53,52,50,48, 45,47,48,50, 52,55,57,57]
for i,m in enumerate(bass[:10]):
    at=i*.5; add(pluck(nt(m),.6,.16,.8),at,-.15,.42)
    if i%2==1: add(pluck(nt(m+12),.3,.06,.3),at+.333,-.1,.12)
chords=[(64,67,72),(65,69,72),(64,67,71),(62,65,69)]
for b in range(0,7):
    c=chords[b%4]; at=b*.5+.25+ (.083 if b%2 else 0)
    if 1.0<at<3.4: continue  # leave room for the fight SFX
    for k,m in enumerate(c): add(xylo(nt(m)),at+k*.012,.2,.1)
# ---- SFX locked to picture cues ----
# alarm ring 0-1.04 (bell partials, 18Hz trill)
n=int(1.08*SR); x=np.arange(n)/SR
bell=sum(a*np.sin(2*np.pi*f*x) for f,a in [(1870,1),(2740,.6),(4130,.4),(5560,.25)])
trill=(0.5+0.5*np.sign(np.sin(2*np.pi*18*x)))*np.exp(-((x*18)%1)*3)
add(bell*trill*np.minimum(x/.01,1)*np.minimum((1.08-x)/.05,1),0,.35,.22)
# whoosh at launch (f24) 
n=int(.35*SR); x=np.arange(n)/SR; w=noise(n); w=w-lp(w,.05); w=lp(w,.35)*np.sin(np.pi*x/.35)**2
add(w,0.94,-.6,.9); add(w[::-1]*.0+w,1.0,.4,.5)
# impact at f26 = 1.083 : thud + crack + pop
n=int(.5*SR); x=np.arange(n)/SR
thud=np.sin(2*np.pi*(55+90*np.exp(-x/.04))*x)*np.exp(-x/.14)
crack=noise(n)*np.exp(-x/.015)
add(thud,26/24,0,1.0); add(crack,26/24,.2,.5); add(pluck(nt(84),.3,.05,1),26/24,.3,.3)
# poof (smoke)
n=int(.6*SR); x=np.arange(n)/SR; p=lp(noise(n),.08)*np.exp(-x/.18)*np.minimum(x/.02,1); add(p,26/24+.04,.3,.9)
add(lp(noise(n),.05)*np.exp(-x/.15)*np.minimum(x/.02,1),.98,-.5,.7)
# squeeze creak during choke
n=int(.6*SR); x=np.arange(n)/SR; cr=np.sin(2*np.pi*(300+80*np.sin(2*np.pi*3*x))*x)*(0.5+0.5*np.sign(np.sin(2*np.pi*40*x)))*np.sin(np.pi*x/.6)
add(lp(cr,.3),1.25,.2,.12)
# taps (woodblock)
for k,T_ in enumerate([1.9,2.25,2.6]):
    n=int(.2*SR); x=np.arange(n)/SR; wb=(np.sin(2*np.pi*(820+k*60)*x)+.4*np.sin(2*np.pi*2300*x)*np.exp(-x/.01))*np.exp(-x/.035)
    add(wb,T_,.25,.55); add(xylo(nt(76+k*3)),T_,.3,.12)
# give-up: descending slide whistle 2.72-3.0
n=int(.34*SR); x=np.arange(n)/SR; f=1400*np.exp(-x*3.2); ph=2*np.cumsum(np.pi*f)/SR
add(np.sin(ph)*np.sin(np.pi*x/.34)*(1+.15*np.sin(2*np.pi*7*x)),2.72,.2,.28)
# drop + land thud 3.38 + bonk
add(thud*.8,3.38,.4,.8); add(lp(noise(int(.6*SR)),.08)*np.exp(-np.arange(int(.6*SR))/SR/.2),3.4,.45,.8)
add(xylo(nt(55)),3.38,.4,.35)
# score: drop whistle-up 3.5 -> boing land 3.75 + arpeggio + sparkles
n=int(.25*SR); x=np.arange(n)/SR; f=600+1600*(x/.25)**2; add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*x/.25)*.5,3.5,-.4,.35)
n=int(.5*SR); x=np.arange(n)/SR; f=180*(1+.25*np.sin(2*np.pi*14*x)*np.exp(-x/.15)); add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x/.18),3.75,-.4,.6)
for k,m in enumerate([72,76,79,84]): add(xylo(nt(m)),3.75+k*.083,-.3+k*.15,.35)
for k,T_ in enumerate([3.75,3.9,4.05,4.2,4.4]):
    n=int(.4*SR); x=np.arange(n)/SR; add((np.sin(2*np.pi*(3520+k*440)*x)+.5*np.sin(2*np.pi*(5274+k*300)*x))*np.exp(-x/.09),T_,(-1)**k*.6,.12)
# final chord hold
for k,m in enumerate([60,64,67,71,74]): add(pluck(nt(m),1.3,.45,.4),4.2+k*.02,0,.15)
st=np.stack([L,R],1); st=st/np.abs(st).max()*.7
fade=np.minimum(1,(N-np.arange(N))/(.15*SR)); st*=fade[:,None]
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes())
