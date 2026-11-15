# dark tense score + SFX for the 3D film (same cue times as the picture)
import numpy as np, wave, sys
SR=48000; DUR=150.458; N=int(SR*DUR); rng=np.random.default_rng(5)
def filt(x,lo=0,hi=None):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); m=np.ones_like(f)
    if hi: m*=1/(1+(f/hi)**4)
    if lo: m*=1/(1+(lo/np.maximum(f,1))**4)
    return np.fft.irfft(X*m,len(x))
def nz(n): return rng.standard_normal(n)
def ns(s): return int(s*SR)
def ar(n,a,d): x=np.arange(n)/SR; return np.minimum(x/max(a,1e-4),1)*np.exp(-x/d)
nt=lambda m:440*2**((m-69)/12)
Mu=np.zeros((N,2)); Sx=np.zeros((N,2))
def add(B,sig,at,pan=0.,g=1.):
    i=int(at*SR)
    if i>=N or i<0: return
    s=sig[:N-i]*g; B[i:i+len(s),0]+=s*np.sqrt(.5-pan/2); B[i:i+len(s),1]+=s*np.sqrt(.5+pan/2)
t=np.arange(N)/SR
# ---------- score: A-minor dark pulse, 84 bpm ----------
drone=(np.sin(2*np.pi*55*t)+.5*np.sin(2*np.pi*82.41*t)+.25*np.sin(2*np.pi*110*t*1.002))*(0.6+0.4*np.sin(2*np.pi*t/9))
Mu[:,0]+=drone*.22; Mu[:,1]+=drone*.22
wind=filt(nz(N),lo=200,hi=900)*(0.5+0.5*np.sin(2*np.pi*t/13+1)); Mu[:,0]+=wind*.05; Mu[:,1]+=np.roll(wind,999)*.05
beat=60/84
for b in range(int(DUR/beat)):
    at=b*beat; x=np.arange(ns(.5))/SR
    kick=np.sin(2*np.pi*(42+60*np.exp(-x/.03))*x)*np.exp(-x/.22); add(Mu,kick,at,0,.55 if b%4==0 else .35)
    if b%2==1: add(Mu,filt(nz(ns(.06)),lo=5000)*ar(ns(.06),.001,.02),at,.4,.08)
    add(Mu,filt(nz(ns(.04)),lo=7000)*ar(ns(.04),.001,.008),at+beat/2,-.4,.05)
# low piano-ish ostinato
ost=[45,52,48,52, 45,52,50,52, 41,48,45,48, 40,47,44,47]
for b in range(int(DUR/(beat/2))):
    m=ost[b%16]; at=b*beat/2; n=ns(1.2); x=np.arange(n)/SR
    p=(np.sin(2*np.pi*nt(m)*x)+.4*np.sin(2*np.pi*nt(m)*2*x)*np.exp(-x/.3)+.15*np.sin(2*np.pi*nt(m)*3.01*x)*np.exp(-x/.15))*ar(n,.004,.45)
    add(Mu,p,at,.15*((b%2)*2-1),.16)
# braams on scene cuts
SC=[9.55,20.36,30.46,42.45,51.01,62.0,71.66,79.69,93.23,104.12,114.76,136.12]
def braam(d=1.8):
    n=ns(d); x=np.arange(n)/SR; s=sum(np.sign(np.sin(2*np.pi*f*x+k)) for k,f in enumerate([55,82.41,110,55.4]))
    return filt(s,hi=500)*ar(n,.02,.7)*.6
for c in SC: add(Mu,braam(),c,0,.7)
# riser before key hits
def riser(d=1.0):
    n=ns(d); x=np.arange(n)/SR; return filt(nz(n),lo=800,hi=6000)*(x/d)**3*.8
for h in [14.55,24.0,35.0,44.85,97.97,123.55,130.0,148.4]: add(Mu,riser(),h-1.0,0,.6)
add(Mu,braam(4.0),148.45,0,1.0)
fade=np.minimum(1,(N-np.arange(N))/(1.2*SR))[:,None]; Mu*=fade
# ---------- SFX ----------
def whoosh(): n=ns(.4); x=np.arange(n)/SR; return filt(nz(n),lo=300,hi=2500)*np.sin(np.pi*x/.4)**2*1.3
def impact(): n=ns(.6); x=np.arange(n)/SR; return np.sin(2*np.pi*(48+70*np.exp(-x/.04))*x)*np.exp(-x/.16)*1.2+filt(nz(n),hi=3000)*np.exp(-x/.03)*.7
def poof(): n=ns(.8); x=np.arange(n)/SR; return filt(nz(n),hi=700)*np.exp(-x/.22)*np.minimum(x/.02,1)*2.0
def tap(): n=ns(.18); x=np.arange(n)/SR; return (filt(nz(n),lo=500,hi=4000)*np.exp(-x/.02)*1.4+np.sin(2*np.pi*180*x)*np.exp(-x/.04))
def thud(): n=ns(.5); x=np.arange(n)/SR; return np.sin(2*np.pi*(40+50*np.exp(-x/.03))*x)*np.exp(-x/.14)+filt(nz(n),hi=500)*np.exp(-x/.1)
def ring(d):
    n=ns(d); x=np.arange(n)/SR; b=sum(a*np.sin(2*np.pi*f*x) for f,a in [(1870,1),(2740,.6),(4130,.4),(5560,.25)])
    return b*(0.5+0.5*np.sign(np.sin(2*np.pi*18*x)))*np.exp(-((x*18)%1)*3)*np.minimum((d-x)/.05,1)*.3
def sting():
    n=ns(1.6); x=np.arange(n)/SR; s=sum(np.sin(2*np.pi*nt(m)*x) for m in [57,64,69])*ar(n,.005,.6)*.35
    return s+np.sin(2*np.pi*(60+80*np.exp(-x/.05))*x)*np.exp(-x/.2)
def stamp(): n=ns(.35); x=np.arange(n)/SR; return np.sin(2*np.pi*85*x)*np.exp(-x/.07)+filt(nz(n),hi=2500)*np.exp(-x/.03)*.9
def tick(): n=ns(.08); x=np.arange(n)/SR; return np.sin(2*np.pi*1800*x)*np.exp(-x/.012)*.5
def ding(): n=ns(1.4); x=np.arange(n)/SR; return (np.sin(2*np.pi*1318*x)+.4*np.sin(2*np.pi*2637*x))*np.exp(-x/.5)*.5
def noise_loop(d,lo,hi,mod,g): n=ns(d); x=np.arange(n)/SR; return filt(nz(n),lo=lo,hi=hi)*(0.5+0.5*np.sign(np.sin(2*np.pi*mod*x)))*np.minimum((d-x)/.1,1)*np.minimum(x/.05,1)*g
def engine(d): n=ns(d); x=np.arange(n)/SR; return filt(np.sign(np.sin(2*np.pi*(36+12*x)*x))+.3*nz(n),hi=380)*np.minimum(x/.2,1)*np.minimum((d-x)/.3,1)*.7
def crash(): n=ns(1.6); x=np.arange(n)/SR; return filt(nz(n),hi=5000)*np.exp(-x/.35)*1.2+sum(np.sin(2*np.pi*f*x)*np.exp(-x/.5) for f in [210,347,523])*.3+np.sin(2*np.pi*(35+50*np.exp(-x/.05))*x)*np.exp(-x/.3)*1.5
def whistle(): n=ns(.7); x=np.arange(n)/SR; return np.sin(2*np.pi*np.cumsum(2900+120*np.sign(np.sin(2*np.pi*22*x)))/SR)*np.minimum(x/.02,1)*np.minimum((.7-x)/.05,1)*.4
def meow(): n=ns(.55); x=np.arange(n)/SR; f=550+300*np.sin(np.pi*x/.55); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*x/.55)*.35
def coins():
    o=np.zeros(ns(1.0))
    for i in range(10): s=np.sin(2*np.pi*(3000+rng.random()*2500)*np.arange(ns(.15))/SR)*np.exp(-np.arange(ns(.15))/SR/.03)*.3; k=ns(rng.random()*.6); o[k:k+len(s)]+=s
    return o
def fight(d):
    o=filt(nz(ns(d)),hi=450)*.5
    for i in range(int(d*5)):
        s=[impact()*.5,tap()*.6,whoosh()*.4][i%3]; k=ns(i*.2+rng.random()*.08)
        if k<len(o): o[k:k+len(s)]+=s[:len(o)-k]
    return o*np.minimum((d-np.arange(ns(d))/SR)/.3,1)
E=[]
e=lambda t,s,g=1,p=None:E.append((t,s,g,p))
e(10.25,ring(4.1),.8)
for L in [14.3,23.75,35.95,44.6,53.1,73.75,83.45,87.35,91.0,123.3]: e(L-.1,whoosh(),.6); e(L+.25,impact(),.9); e(L+.27,poof(),.5)
e(34.3,whoosh(),.8); e(35.0,crash(),1.0); e(30.5,engine(1.5),.8)
for x in [15.55,15.9,16.25,24.85,25.2,25.55,46.3,46.7,47.1,83.95,84.2,87.75,124.6,124.95]: e(x,tap(),.7)
for x in [16.6,27.9,38.25,84.3,88.0]: e(x,poof(),.7)
for x in [17.45,28.65,84.95,88.6,91.65,105.5,110.5,129.45]: e(x,thud(),.8)
e(54.3,noise_loop(2.6,300,2200,11,.45),1); e(71.7,noise_loop(1.6,800,5000,14,.4),1); e(74.9,noise_loop(1.4,100,900,3,.5),1); e(76.43,ding(),.8)
e(79.7,noise_loop(1.7,1500,6000,9,.35),1); e(81.4,noise_loop(1.8,800,5000,13,.45),1)
for x in [84.95,85.4,85.85]: e(x,np.sign(np.sin(2*np.pi*1250*np.arange(ns(.12))/SR))*.25,1)
e(87.62,ding(),.7); e(87.65,coins(),1); e(96.2,whistle(),.8); e(97.97,impact(),1.0); e(97.97,stamp(),.8); e(100.5,whoosh(),.7); e(100.85,impact(),.9); e(105.55,meow(),.7)
e(111.92,sting()*.6,.6); e(130.0,fight(6.0),.8); e(134.75,ding(),.6)
for x in [17.69,28.98,38.85,146.4]: e(x,sting(),.8)
for x in [37.03,44.75,53.4,73.95,105.6,110.6,130.83]: e(x,stamp(),.7)
for x in [0.2,10.25,20.4,30.5,42.5,51.05,62.05,71.7,79.7,93.3,104.2,114.8,136.2,108.3,125.3,102.47,26.07,55.94,57.88,67.21,76.43]+[138.2+i*.62 for i in range(10)]: e(x,tick(),.6)
for t0,s,g,p in E: add(Sx,s,t0,float(rng.uniform(-.3,.3)) if p is None else p,g)
for name,B in (('music',Mu),('sfx',Sx)):
    B=B/np.abs(B).max()*.8
    with wave.open(f"{sys.argv[1]}_{name}.wav",'wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((B*32767).astype('<i2').tobytes())
