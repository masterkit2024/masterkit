# music bed + SFX for the full film, rendered from the same cue list the picture uses (sfx.json)
import numpy as np, wave, json, sys
SR=48000; DUR=float(sys.argv[3]); N=int(SR*DUR); rng=np.random.default_rng(11)
cues=json.load(open(sys.argv[1]))
def fft_filt(x,lo=0,hi=None):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); m=np.ones_like(f)
    if hi: m*=1/(1+(f/hi)**4)
    if lo: m*=1/(1+(lo/np.maximum(f,1))**4)
    return np.fft.irfft(X*m,len(x))
def ar(n,a=.002,d=.2): x=np.arange(n)/SR; return np.minimum(x/a,1)*np.exp(-x/d)
def tone(f,dur,d=.2,h=(1,.5,.25)):
    n=int(dur*SR); x=np.arange(n)/SR; return sum(a*np.sin(2*np.pi*f*(k+1)*x)*np.exp(-x/(d/(k+1))) for k,a in enumerate(h))*np.minimum(x/.002,1)
def xylo(f,dur=.6):
    n=int(dur*SR); x=np.arange(n)/SR
    return (np.sin(2*np.pi*f*x)*np.exp(-x/.25)+.35*np.sin(2*np.pi*f*3.93*x)*np.exp(-x/.04)+.2*np.sin(2*np.pi*f*9.2*x)*np.exp(-x/.012))*np.minimum(x/.001,1)
def noise(n): return rng.standard_normal(n)
def sweep(f0,f1,dur,shape=1):
    n=int(dur*SR); x=np.arange(n)/SR; f=f0+(f1-f0)*(x/dur)**shape; return np.sin(2*np.pi*np.cumsum(f)/SR)
nt=lambda m:440*2**((m-69)/12)
M=np.zeros((N,2)); S=np.zeros((N,2))
def add(B,sig,at,pan=0.,g=1.):
    i=int(at*SR)
    if i>=N: return
    s=sig[:N-i]*g; B[i:i+len(s),0]+=s*np.sqrt(.5-pan/2); B[i:i+len(s),1]+=s*np.sqrt(.5+pan/2)
# ---- music: 120 bpm swung pizzicato walking bass + xylophone comping + brush ticks ----
beat=.5; prog=[(48,[64,67,69,72]),(45,[61,64,67,70]),(50,[65,69,72,74]),(43,[65,67,71,74])]
walk=[[0,4,7,9],[0,3,4,7],[0,2,3,5],[0,4,5,6]]
nb=int(DUR/beat)
for b in range(nb):
    bar=b//4; root,ch=prog[bar%4]; at=b*beat
    add(M,tone(nt(root-12+walk[bar%4][b%4]),.6,.18,(1,.6,.3)),at,-.2,.5)
    sw=at+beat*.66
    if b%2==1: [add(M,xylo(nt(m)),sw+k*.01,.25,.07) for k,m in enumerate(ch[:3])]
    if b%8==7: add(M,xylo(nt(ch[3]+12)),sw,.4,.08)
    add(M,fft_filt(noise(int(.05*SR)),lo=6000)*ar(int(.05*SR),.001,.015),at,.5,.05)
    add(M,fft_filt(noise(int(.04*SR)),lo=7000)*ar(int(.04*SR),.001,.01),sw,.5,.03)
# ---- SFX library ----
def sfx(k,d):
    n=lambda s:int(s*SR)
    if k=='whoosh': x=np.arange(n(.35))/SR; return fft_filt(noise(n(.35)),lo=400,hi=3000)*np.sin(np.pi*x/.35)**2*1.2
    if k=='impact':
        x=np.arange(n(.5))/SR; return np.sin(2*np.pi*(55+90*np.exp(-x/.04))*x)*np.exp(-x/.14)+.5*noise(n(.5))*np.exp(-x/.015)
    if k in('poof','wipe'): x=np.arange(n(.6))/SR; return fft_filt(noise(n(.6)),hi=900)*np.exp(-x/.17)*np.minimum(x/.02,1)*(2.2 if k=='poof' else 1.5)
    if k=='tap': x=np.arange(n(.2))/SR; return (np.sin(2*np.pi*850*x)+.4*np.sin(2*np.pi*2300*x)*np.exp(-x/.01))*np.exp(-x/.035)
    if k=='slide': x=np.arange(n(.34))/SR; return sweep(1400,350,.34,.5)*np.sin(np.pi*x/.34)*.6
    if k=='thud': x=np.arange(n(.4))/SR; return np.sin(2*np.pi*(45+60*np.exp(-x/.03))*x)*np.exp(-x/.12)+fft_filt(noise(n(.4)),hi=600)*np.exp(-x/.1)
    if k=='pop': x=np.arange(n(.15))/SR; return sweep(400,1200,.15,.3)*np.exp(-x/.04)*.7
    if k=='boing': x=np.arange(n(.5))/SR; f=180*(1+.25*np.sin(2*np.pi*14*x)*np.exp(-x/.15)); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x/.18)
    if k=='sparkle':
        out=np.zeros(n(.9))
        for i in range(5): s=xylo(nt(96+[0,4,7,12,16][i]),.4)*.5; o=n(i*.07); out[o:o+len(s)]+=s[:len(out)-o]
        return out
    if k=='score':
        out=np.zeros(n(1.2)); x=np.arange(n(.25))/SR; out[:n(.25)]+=sweep(600,2200,.25,2)*np.sin(np.pi*x/.25)*.4
        b=sfx('boing',0); out[n(.25):n(.25)+len(b)]+=b*.8
        for i,m in enumerate([72,76,79,84]): s=xylo(nt(m)); o=n(.25+i*.083); out[o:o+len(s)]+=s[:len(out)-o]*.6
        return out
    if k=='stamp': x=np.arange(n(.3))/SR; return np.sin(2*np.pi*90*x)*np.exp(-x/.06)+.8*fft_filt(noise(n(.3)),hi=2500)*np.exp(-x/.03)
    if k=='ding': return xylo(nt(88),1.2)*.8+xylo(nt(95),1.2)*.3
    if k=='ring':
        x=np.arange(n(d))/SR; bell=sum(a*np.sin(2*np.pi*f*x) for f,a in [(1870,1),(2740,.6),(4130,.4),(5560,.25)])
        tr=(0.5+0.5*np.sign(np.sin(2*np.pi*18*x)))*np.exp(-((x*18)%1)*3); return bell*tr*np.minimum((d-x)/.05,1)*.35
    if k=='engine': x=np.arange(n(d))/SR; return fft_filt(np.sign(np.sin(2*np.pi*(38+10*x)*x))+.3*noise(n(d)),hi=400)*np.minimum(x/.2,1)*np.minimum((d-x)/.3,1)*.8
    if k=='beep': x=np.arange(n(.12))/SR; return np.sign(np.sin(2*np.pi*1250*x))*.25*np.minimum((.12-x)/.01,1)
    if k=='printer': x=np.arange(n(d))/SR; return fft_filt(noise(n(d)),lo=300,hi=2000)*(0.6+0.4*np.sign(np.sin(2*np.pi*11*x)))*np.minimum((d-x)/.1,1)*.5
    if k=='scrape': x=np.arange(n(d))/SR; return fft_filt(noise(n(d)),lo=200,hi=1500)*np.abs(np.sin(np.pi*x/.4))*.5
    if k=='rattle': x=np.arange(n(d))/SR; return fft_filt(noise(n(d)),lo=800,hi=5000)*(np.sin(2*np.pi*14*x)>0.3)*.45
    if k=='door': x=np.arange(n(d))/SR; return np.sin(2*np.pi*np.cumsum(220+120*np.sin(2*np.pi*.8*x))/SR)*(.5+.5*np.sign(np.sin(2*np.pi*35*x)))*np.sin(np.pi*x/d)*.35
    if k=='cartroll': x=np.arange(n(d))/SR; return fft_filt(noise(n(d)),lo=1500,hi=6000)*(np.sin(2*np.pi*9*x)>0.6)*.4
    if k=='steps':
        out=np.zeros(n(d))
        for i in range(int(d/.22)): s=sfx('tap',0)*.4; s=fft_filt(s,hi=600); o=n(i*.22); out[o:o+len(s)]+=s[:len(out)-o]
        return out
    if k=='whistle': x=np.arange(n(.7))/SR; return np.sin(2*np.pi*np.cumsum(2900+120*np.sign(np.sin(2*np.pi*22*x)))/SR)*np.minimum(x/.02,1)*np.minimum((.7-x)/.05,1)*.4
    if k=='meow': x=np.arange(n(.5))/SR; f=600+300*np.sin(np.pi*x/.5); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*x/.5)*(1+.5*np.sin(2*np.pi*3*np.cumsum(f)/SR))*.35
    if k=='heart':
        out=np.zeros(n(1.0))
        for i,m in enumerate([72,76,79]): s=tone(nt(m),.8,.3); o=n(i*.06); out[o:o+len(s)]+=s[:len(out)-o]*.4
        return out
    if k=='fight':
        out=fft_filt(noise(n(d)),hi=500)*.6*np.minimum(np.arange(n(d))/SR/.1,1)
        for i in range(int(d*5)):
            s=[sfx('impact',0)*.5,sfx('tap',0)*.5,sfx('pop',0)][i%3]; o=n(i*.2+rng.random()*.08)
            if o<len(out): out[o:o+len(s)]+=s[:len(out)-o]
        return out*np.minimum((d-np.arange(n(d))/SR)/.3,1)
    return np.zeros(10)
G={'whoosh':.5,'impact':.9,'poof':.6,'wipe':.35,'tap':.6,'slide':.35,'thud':.7,'pop':.45,'boing':.5,'sparkle':.35,'score':.6,'stamp':.7,'ding':.45,
   'ring':.6,'engine':.5,'beep':.4,'printer':.5,'scrape':.4,'rattle':.4,'door':.5,'cartroll':.4,'steps':.5,'whistle':.5,'meow':.6,'heart':.6,'fight':.6}
for t,k,d in cues: add(S,sfx(k,d),t,float(rng.uniform(-.35,.35)),G.get(k,.5))
# music: settle at the end on a tonic chord
for k,m in enumerate([48,60,64,67,71,74]): add(M,tone(nt(m),2.0,.7,(1,.4)),148.53+k*.02,0,.18)
fade=np.minimum(1,(N-np.arange(N))/(.4*SR))[:,None]; M*=fade
for name,B in (('music',M),('sfx',S)):
    B=B/np.abs(B).max()*.8
    with wave.open(f"{sys.argv[2]}_{name}.wav",'wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((B*32767).astype('<i2').tobytes())
