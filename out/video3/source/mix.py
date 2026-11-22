import numpy as np,soundfile as sf,json,re,pyloudnorm as pyln
from scipy.signal import butter,sosfilt,resample_poly
SR=48000; DUR=97.6; N=int(DUR*SR); R=np.random.default_rng(5); meter=pyln.Meter(SR)
WS=json.load(open("timeline.json"))["words"]
def W(pre,after=0.0,k="s"):
    for w in WS:
        if w["s"]>=after and re.sub(r"[^а-яё0-9]","",w["w"].lower()).startswith(pre): return w[k]
    raise KeyError(pre)
def bp(x,lo=None,hi=None,o=2):
    sos=butter(o,[lo,hi],'bandpass',fs=SR,output='sos') if lo and hi else butter(o,lo or hi,'highpass' if lo else 'lowpass',fs=SR,output='sos'); return sosfilt(sos,x,axis=0)
db=lambda d:10**(d/20); tt=lambda d:np.arange(int(d*SR))/SR; noise=lambda d:R.standard_normal(int(d*SR))
def add(buf,x,t,g=1.0,pan=0.0):
    i=int(t*SR); x=x[:max(0,len(buf)-i)]; buf[i:i+len(x),0]+=x*g*np.cos((pan+1)*np.pi/4)*1.414; buf[i:i+len(x),1]+=x*g*np.sin((pan+1)*np.pi/4)*1.414
# voice
v,_=sf.read("voice_cut.wav"); v=bp(v,70,None); v=v+0.12*bp(v,180,450)   # warm
v*=db(-17-meter.integrated_loudness(v)); voice=np.zeros((N,2)); add(voice,v,0.0)
env=np.convolve(np.abs(v),np.ones(2400)/2400,'same'); act=np.zeros(N); act[:len(env)]=env[:N]>db(-42); act=np.convolve(act,np.ones(int(0.35*SR)),'same')>0
# music (extended "Gone Too Soon"), womb low-pass opening
m,_=sf.read("music_ext.wav"); m=m[:N]; m=np.pad(m,((0,N-len(m)),(0,0)))
mlp=bp(m,None,420,4); k=np.clip((np.arange(N)/SR-2.0)/7.0,0,1)[:,None]**1.5; m=mlp*(1-k)+m*k
mL=meter.integrated_loudness(m)
g=np.where(act,-17-15-mL,-17-9-mL).astype(float)
t=np.arange(N)/SR
g=np.where(t<0.6,-80,g); g=np.where((t>=0.6)&(t<2.6),g-20*(1-(t-0.6)/2.0),g)
s0=W("но",54)-0.25; s1=W("вырос",0,"e")+0.7; g=np.where((t>s0)&(t<s1),-80,g)          # music stops ~1 s on "Но ты вырос"
p0=W("друзья")-0.3; p1=W("заканчивается",0,"e")+0.5; g=np.where((t>p0)&(t<p1),np.maximum(g,-17-11-mL),g)  # piano/peak swells
kk=int(0.3*SR); gs=np.convolve(np.pad(g,(kk,kk),'edge'),np.ones(kk)/kk,'same')[kk:-kk]
# hard cut feel for the silence: faster edges
mus=m*db(gs)[:,None]
# SFX
fx=np.zeros((N,2))
def beat(t0,g=1.0):
    for d,a in ((0,1.0),(0.22,0.7)):
        x=np.sin(2*np.pi*(48+30*np.exp(-tt(0.35)*20))*tt(0.35))*np.exp(-tt(0.35)*9)*a; add(fx,bp(x,None,200),t0+d,g)
def whoosh(t0,d=0.6,g=1.0): x=noise(d); kx=np.linspace(0,1,len(x)); add(fx,bp(x,300,2500)*np.sin(np.pi*kx)**2*0.15,t0-d*0.5,g)
def chime(t0,f=1320,g=1.0): x=sum(a*np.sin(2*np.pi*f*h*tt(2))*np.exp(-tt(2)*(2+h)) for h,a in ((1,1),(2.01,0.3),(3.0,0.12))); add(fx,x*0.12,t0,g,0.2)
def clink(t0,f=2600,g=1.0): x=sum(np.sin(2*np.pi*f*h*tt(0.6))*np.exp(-tt(0.6)*(10+h*4))/h for h in (1,1.53,2.7)); add(fx,x*0.15,t0,g,0.3)
def beep(t0,g=1.0):
    for k_ in range(2): add(fx,np.sin(2*np.pi*3100*tt(0.08))*0.08,t0+k_*0.15,g)
def rip(t0,g=1.0): x=bp(noise(0.35),1500,7000)*np.abs(np.sin(np.arange(int(0.35*SR))/SR*90)); add(fx,x*0.12*np.linspace(1,0.2,len(x)),t0,g)
def step(t0,g=1.0): x=bp(noise(0.08),80,900)*np.exp(-tt(0.08)*50); add(fx,x*0.35,t0,g)
def tick(t0,g=1.0): add(fx,bp(noise(0.02),2000,7000)*np.exp(-tt(0.02)*250)*0.5,t0,g)
def door(t0,g=1.0): x=bp(noise(0.7),200,1200)*np.exp(-tt(0.7)*3)*0.15; f=np.sin(2*np.pi*np.cumsum(np.linspace(300,180,int(0.7*SR)))/SR)*0.05*np.exp(-tt(0.7)*2); add(fx,x+f,t0,g)
def crack(t0,g=1.0): add(fx,bp(noise(0.25),1200,6000)*np.exp(-tt(0.25)*18)*0.3,t0,g)
for b in (0.35,1.15): beat(b,1.3)
for k_ in range(3): beat(W("слышала")+k_*0.8,0.8)
beat(94.9,1.4)
chime(W("мама")+0.05,1046,0.7)
for tm in (W("твой")-0.15,W("она")-0.25,W("первая")-0.2,W("ночью")-0.15,W("днём")-0.15,W("когда",31)-0.15,W("она",37)-0.2,W("она",47)-0.2,W("и",64)-0.15,W("ты",68.5)-0.2,W("друзья")-0.25,W("а",82.5)-0.2): whoosh(tm,0.6,0.6)
chime(W("всё",26),1568,0.8); beep(W("врач")-0.1,0.7); clink(W("повар"),2600,0.7); rip(W("правда")+0.3,0.8)
for k_ in range(5): step(W("она",37)-0.1+k_*0.35,0.6)
door(W("и",64)+0.2,0.7)
for tm in (W("ты",68.5)-0.1,W("опаздываешь")-0.1,W("ты",74)-0.1): tick(tm,1.0); tick(tm+0.5,0.6)
crack(W("заканчивается")+0.3,0.8)
chime(W("вернулся",0,"e")+1.0,784,0.6)
fx*=db(-6)
mix=voice+mus+fx
def limit(x,thr):
    up=np.stack([resample_poly(x[:,c],4,1) for c in range(2)],1); pk=np.abs(up).max(1).reshape(-1,4).max(1)[:len(x)]
    gl=np.minimum(1,db(thr)/(pk+1e-9)); gm=np.minimum.reduceat(gl,np.arange(0,len(x),48)).repeat(48)[:len(x)]; gm=np.minimum(gm,np.roll(gm,-192))
    out=np.empty(len(x)); vv=1.0; rel=np.exp(-48/(0.08*SR))
    for i in range(0,len(x),48): tg=gm[i]; vv=tg if tg<vv else tg+(vv-tg)*rel; out[i:i+48]=vv
    return x*out[:,None]
for _ in range(3): mix=limit(mix,-1.6); mix*=db(-14-meter.integrated_loudness(mix))
mix=limit(mix,-1.2)
sf.write("mix.wav",mix.astype(np.float32),SR,subtype='FLOAT')
up=np.stack([resample_poly(mix[:,c],4,1) for c in range(2)],1)
print("LUFS",round(meter.integrated_loudness(mix),2),"TP",round(20*np.log10(np.abs(up).max()),2))
