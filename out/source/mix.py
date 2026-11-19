import numpy as np,soundfile as sf,json,pyloudnorm as pyln
from scipy.signal import butter,sosfilt,sosfiltfilt,fftconvolve,resample_poly
SR=48000; DUR=89.0; N=int(DUR*SR)
R=np.random.default_rng(7)
TL=json.load(open("timeline.json"))
meter=pyln.Meter(SR)
def bp(x,lo=None,hi=None,o=2):
    if lo and hi: sos=butter(o,[lo,hi],'bandpass',fs=SR,output='sos')
    elif lo: sos=butter(o,lo,'highpass',fs=SR,output='sos')
    else: sos=butter(o,hi,'lowpass',fs=SR,output='sos')
    return sosfilt(sos,x)
def db(x): return 10**(x/20)
def env(n,a=0.005,r=0.1):
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))*np.exp(-np.maximum(0,t-a)/max(r,1e-4)); return e
def place(buf,x,t,g=1.0,pan=0.0):
    i=int(t*SR); 
    if i>=len(buf): return
    x=x[:len(buf)-i]; L=np.cos((pan+1)*np.pi/4); Rr=np.sin((pan+1)*np.pi/4)
    buf[i:i+len(x),0]+=x*g*L*1.414; buf[i:i+len(x),1]+=x*g*Rr*1.414
def noise(d): return R.standard_normal(int(d*SR))
def pink(d):
    n=int(d*SR); w=R.standard_normal(n); f=np.fft.rfft(w); k=np.arange(len(f)); k[0]=1; f/=np.sqrt(k); x=np.fft.irfft(f,n); return x/np.std(x)
def brown(d): x=np.cumsum(R.standard_normal(int(d*SR))); x=bp(x,20,None); return x/np.std(x)
def fade(x,fi=0.05,fo=0.05):
    n1=int(fi*SR); n2=int(fo*SR); x=x.copy()
    if n1: x[:n1]*=np.linspace(0,1,n1)
    if n2: x[-n2:]*=np.linspace(1,0,n2)
    return x
def norm(x,peak=1.0): return x/(np.max(np.abs(x))+1e-9)*peak
# ---------- reverb IR ----------
def ir(dec=0.9,pre=0.012):
    n=int(dec*SR); t=np.arange(n)/SR; x=R.standard_normal(n)*np.exp(-t*6.9/dec); x=bp(x,250,6000); x[:int(pre*SR)]=0
    for d,g in [(0.017,0.5),(0.029,0.35),(0.041,0.3),(0.057,0.22)]: x[int(d*SR)]+=g*8
    return x/np.sqrt(np.sum(x**2))
IR_ST=ir(1.1); IR_ROOM=ir(0.35)
def reverb(x,irr,wet):
    y=fftconvolve(x,irr); dry=np.concatenate([x,np.zeros(len(y)-len(x))])
    y=y/ (np.std(y)+1e-9)*np.std(x)
    return dry*(1-wet*0.5)+y*wet
# ---------- voices ----------
WET={"L1":.14,"L2":.14,"L3b":.13,"L4":.04,"L5":.04,"L7":.04,"L8":.11,"L9":.07,"L11":.12}
LV={"keeper":-18,"dima":-18,"mama":-17.5}
QUIET={"D6":-3,"D7":-3,"D8":-4,"D9":-1.5,"L11":-2,"D4":-1.5}
voice=np.zeros((N+SR*2,2)); vmask=np.zeros(N+SR*2)
for c in TL:
    x,_=sf.read(f"clips/{c['id']}.wav")
    if c['spk']=="mama": x=bp(x,90,None); x=x+0.15*bp(x,150,400)  # warm
    if c['spk']=="dima": x=bp(x,80,None)
    if c['id'] in WET: x=reverb(x,IR_ST if c['id'] not in ("L4","L5","L7") else IR_ROOM,WET[c['id']])
    try: l=meter.integrated_loudness(np.pad(x,(0,max(0,int(0.5*SR)-len(x)))))
    except Exception: l=-30
    g=db(LV[c['spk']]+QUIET.get(c['id'],0)-l)
    place(voice,x,c['start'],g)
    for a,b in c['runs']: vmask[int(a*SR):int(b*SR)]=1
# muffled mama behind the door (headphones POV) 35.2 -> 42.3, opening on "Да."
mx,_=sf.read("clips/M.wav"); mx=mx[:int(7.0*SR)]
muf=bp(mx,None,400,4)*db(-9); seg_t=35.25
n=len(muf); tt=np.arange(n)/SR
# headphone beat (tiny kick+hat through LPF)
beat=np.zeros(int(7.0*SR))
for k in np.arange(0,7.0,0.5):
    i=int(k*SR); m=int(0.12*SR); tk=np.arange(m)/SR
    beat[i:i+m]+=np.sin(2*np.pi*(60+80*np.exp(-tk*40))*tk)*np.exp(-tk*25)*0.9
    j=int((k+0.25)*SR); h=noise(0.04)*np.exp(-np.arange(int(0.04*SR))/SR*90)*0.25; beat[j:j+len(h)]+=bp(h,5000,None)
beat=bp(beat,None,500,4)*db(-6)
mb=np.zeros(int(7.0*SR)); mb[:len(muf)]+=muf; mb+=beat; mb=fade(mb,0.6,0.25)
place(voice,mb*db(LV['mama']-12-20*np.log10(np.std(mb)*3+1e-9)+0) ,seg_t,1.0)
voice=voice[:N]; vmask=vmask[:N]
# ---------- music ----------
m,_=sf.read("audio/music.wav"); m=m[:N]; m=np.pad(m,((0,N-len(m)),(0,0)))
mL=meter.integrated_loudness(m)
# duck envelope
act=vmask.copy()
k=int(0.22*SR); act=np.convolve(act,np.ones(k),'same')>0  # hold
ref=LV['keeper']
g_speech=ref-14-mL; g_pause=ref-6-mL
gdb=np.where(act,g_speech,g_pause).astype(float)
def setr(a,b,val): gdb[int(a*SR):int(b*SR)]=val-mL
setr(31.88,33.25,ref-34)          # comedic silence on "Выключенный…"
setr(54.55,55.1,ref-48)           # silence after headphones
gdb[int(70.55*SR):int(72.6*SR)]=np.maximum(gdb[int(70.55*SR):int(72.6*SR)],ref-8-mL)  # peak bloom
setr(72.12,72.5,ref-3)
# smooth: attack 80ms release 350ms (in dB domain)
def smooth(x,att,rel):
    y=np.empty_like(x); a=np.exp(-1/(att*SR)); r=np.exp(-1/(rel*SR)); v=x[0]
    for i in range(0,len(x),48):
        tgt=x[i]; c=a if tgt<v else r; v=tgt+(v-tgt)*c**48; y[i:i+48]=v
    return y
gs=smooth(gdb,0.08,0.35)
mus=m*db(gs)[:,None]
mus[-int(1.2*SR):]*=np.linspace(1,0,int(1.2*SR))[:,None]**1.5
# ---------- SFX ----------
fx=np.zeros((N,2))
def bed(gen,a,b,gdbv,fi=0.6,fo=0.6,pan=0): x=fade(gen(b-a),fi,fo); place(fx,x/np.std(x)*0.1,a,db(gdbv),pan)
def tick(t,g=-26,pan=0.3,f=3200):
    n=int(0.03*SR); tk=np.arange(n)/SR; x=(np.sin(2*np.pi*f*tk)+0.5*R.standard_normal(n))*np.exp(-tk*300); place(fx,x*0.3,t,db(g),pan)
def click(t,g=-22,pan=0): x=bp(noise(0.02),1500,None)*np.exp(-np.arange(int(0.02*SR))/SR*250); place(fx,x*0.5,t,db(g),pan)
def chime(t,g=-26,f=1320):
    d=2.5; tk=np.arange(int(d*SR))/SR; x=sum(a*np.sin(2*np.pi*f*h*tk)*np.exp(-tk*(1.6+h)) for h,a in [(1,1),(2.01,0.4),(3.02,0.2),(4.2,0.1)]); place(fx,x*0.25,t,db(g),0.2)
def whoosh(t,d,g=-24,rev=False,up=True,pan=0):
    x=pink(d); tk=np.linspace(0,1,len(x)); e=np.sin(np.pi*tk)**2 if not rev else tk**3
    lo=bp(x,300,1200); hi=bp(x,1500,7000); mixk=tk if up else 1-tk
    y=(lo*(1-mixk)+hi*mixk)*e; place(fx,y*0.2,t,db(g),pan)
def step(t,g=-28,pan=0,soft=False,hard=False):
    n=int(0.09*SR); tk=np.arange(n)/SR; x=bp(noise(0.09),80,1500 if not soft else 700)*np.exp(-tk*(55 if not hard else 35)); x+=np.sin(2*np.pi*90*tk)*np.exp(-tk*40)*0.5; place(fx,x*0.4,t,db(g),pan)
def thump(t,g=-18,f=55,d=0.5): tk=np.arange(int(d*SR))/SR; x=np.sin(2*np.pi*(f+30*np.exp(-tk*12))*tk)*np.exp(-tk*7); place(fx,x*0.6,t,db(g))
def pop(t,g=-20): tk=np.arange(int(0.08*SR))/SR; x=np.sin(2*np.pi*(900-600*tk/0.08)*tk)*np.exp(-tk*50); place(fx,x*0.4,t,db(g))
def clink(t,g=-26,f=2400,pan=0): tk=np.arange(int(0.6*SR))/SR; x=sum(np.sin(2*np.pi*f*h*tk)*np.exp(-tk*(9+h*3))/h for h in (1,1.53,2.7)); place(fx,x*0.25,t,db(g),pan)
def breath(t,d=0.8,g=-30,inhale=True): x=bp(noise(d),400,3000); tk=np.linspace(0,1,len(x)); e=(tk**1.5 if inhale else (1-tk)**1.5)*np.sin(np.pi*tk); place(fx,x*e*0.1,t,db(g))
def pshh(t,d=0.6,g=-24): x=bp(noise(d),2500,9000); e=env(len(x),0.01,d*0.35); place(fx,x*e*0.2,t,db(g),-0.1)
def busPass(a,b,g=-24,arrive=True):
    x=brown(b-a)*0.6+bp(pink(b-a),200,2500)*0.4; tk=np.linspace(0,1,len(x)); e=(np.sin(np.pi*np.minimum(tk*1.6,1)/2) if arrive else 1-tk); 
    hiss=bp(noise(b-a),3000,9000)*0.25; place(fx,(x+hiss)*e*0.1,a,db(g),0.0)
def vib(t,d=1.0,g=-22):
    tk=np.arange(int(d*SR))/SR; x=np.sin(2*np.pi*150*tk)*(np.sin(2*np.pi*2.5*tk)>0); x=bp(x,100,1200); place(fx,x*0.2,t,db(g))
def ring(t,g=-26):
    for i,(f,dt) in enumerate([(880,0),(1175,0.18),(1047,0.36)]):
        tk=np.arange(int(0.3*SR))/SR; x=np.sin(2*np.pi*f*tk)*np.exp(-tk*8); place(fx,x*0.2,t+dt,db(g))
def pad(a,b,g=-30,chord=(220,277.2,329.6,440)):
    d=b-a; tk=np.arange(int(d*SR))/SR; x=sum(np.sin(2*np.pi*f*tk+np.sin(tk*0.7+i)*0.5) for i,f in enumerate(chord)); x=fade(x,d*0.5,1.0); place(fx,x*0.05,a,db(g))
# station ambience + rain on glass
bed(lambda d: bp(brown(d),30,220),0,25.0,-25,0.8,0.4)
bed(lambda d: bp(pink(d),2000,9000)*0.6+bp(pink(d),400,1500)*0.4,0,25.0,-31,0.8,0.4,0.2)
bed(lambda d: bp(brown(d),30,220),79.3,89,-26,0.5,1.0)
bed(lambda d: bp(pink(d),2000,9000),79.3,89,-33,0.5,1.0,0.2)
for t in (3.4,4.25,5.1,5.95): step(t,-36,-0.6); step(t+0.09,-44,0.6)
# watch ticks
for t in np.arange(2.5,17.0,0.5): tick(t,-30 if t<9.4 else -27)
click(2.42,-20); chime(2.62,-27)
whoosh(10.3,1.0,-27); [tick(t,-28,0.1,2400) for t in np.arange(11.6,12.8,0.09)]
# S2 rewind
whoosh(17.0,2.2,-22,rev=True); [tick(17.25+ (i*0.16)*np.exp(-i*0.05),-28,0.0,2800) for i in range(30)]
for i in range(8): click(18.65+i*0.12,-26,(i-4)*0.1)
whoosh(24.2,0.9,-20,up=True); chime(24.75,-28,1760)
# S3 hallway
click(25.12,-22,-0.3); [step(25.25+i*0.45,-30,-0.2+i*0.05) for i in range(7)]
clink(26.95,-30,3100,0.3)
bed(lambda d: bp(pink(d),150,900)*(1+0.6*np.abs(np.sin(np.arange(int(d*SR))/SR*23))),27.85,29.65,-29,0.2,0.3,0.4)
clink(28.3,-28,1900,0.4)
for i in range(4): step(36.3+i*0.5,-31,0.2,soft=True)
thump(37.35,-17,70,0.35); click(37.36,-18)
# S4 mama
pad(44.0,53.4,-31,(196,246.9,293.7,392)); breath(43.6,0.7,-31)
clink(52.0,-27,1300,-0.1); thump(52.0,-30,120,0.15); bed(lambda d: bp(noise(d),1500,6000)*np.abs(np.sin(np.arange(int(d*SR))/SR*30)),52.35,52.8,-32,0.05,0.1)
# S5 headphone hum
bed(lambda d: bp(noise(d),80,300)+0.3*np.sin(2*np.pi*120*np.arange(int(d*SR))/SR),53.7,54.6,-30,0.1,0.08)
# S6 street
bed(lambda d: bp(pink(d),1000,10000)*0.7+bp(pink(d),200,1000)*0.3,55.35,64.8,-24,0.4,0.4)
busPass(55.4,57.1,-23); pshh(57.05,0.6,-25); pshh(58.3,0.5,-27); busPass(58.6,61.2,-25,arrive=False)
dsteps=np.arange(57.85,61.5,0.46)
for t in dsteps: step(t,-28,0.25,hard=True)
for t in np.arange(58.2,61.4,0.52): 
    if 60.0<=t<=61.0: continue
    step(t,-38,-0.35,soft=True)
for t in dsteps[(dsteps>=60.0)&(dsteps<=61.0)]: step(t+0.005,-37,-0.35,soft=True)  # one second in sync
breath(62.2,0.9,-32,inhale=False)
# S7 business
for t in np.arange(64.8,66.2,0.11)+R.uniform(0,0.04,13): click(t,-33,0.1)
tick(66.45,-22,0,1800); tick(66.52,-24,0,2600)
click(71.15,-24); pop(71.55,-22); thump(71.56,-16,50,0.7)
# S8 parents now
bed(lambda d: bp(pink(d),1000,10000),72.45,77.0,-28,0.4,0.6)
busPass(72.45,73.8,-26); pshh(73.75,0.6,-28); pshh(74.85,0.5,-30); busPass(75.1,77.2,-28,arrive=False)
for t in np.arange(75.7,77.0,0.62): step(t,-33,-0.1,soft=True)
for t in np.arange(77.2,79.2,0.7): step(t,-36,0.2,soft=True)
# S9 call
vib(81.9,1.2,-24); ring(82.3,-27); breath(82.85,0.6,-30)
# S10 final
bed(lambda d: bp(brown(d),25,160),84.8,89,-24,2.0,1.2)
pad(83.6,89.0,-27,(220,277.2,329.6,440,554.4))
for t in np.arange(79.5,88.6,0.5): tick(t,-30-(max(0,t-84.8))*2.5)
chime(86.0,-34,660)
# ---------- sum, loudness, limiter ----------
mix=voice+mus+fx
L=meter.integrated_loudness(mix); mix*=db(-14.3-L)
def limiter(x,thr_db=-1.3):
    thr=db(thr_db)
    up=np.stack([resample_poly(x[:,c],4,1) for c in range(2)],1); pk=np.abs(up).max(1).reshape(-1,4).max(1)[:len(x)]
    g=np.minimum(1,thr/(pk+1e-9))
    la=int(0.005*SR); g=np.minimum.accumulate(g[::-1])[::-1] if False else g
    gm=np.array([g[max(0,i-la):i+1].min() for i in range(0,len(g),48)]).repeat(48)[:len(g)]
    # lookahead: shift min window forward
    gl=np.minimum(gm,np.roll(gm,-la)); out=np.empty_like(gl); v=1.0; rel=np.exp(-1/(0.08*SR))
    for i in range(0,len(gl),48):
        tg=gl[i]; v=tg if tg<v else tg+(v-tg)*rel**48; out[i:i+48]=v
    return x*out[:,None]
mix=limiter(mix)
for _ in range(2):
    L=meter.integrated_loudness(mix); mix*=db(-14.0-L); mix=limiter(mix)
sf.write("draft_mix.wav",mix.astype(np.float32),SR,subtype='FLOAT')
up=np.stack([resample_poly(mix[:,c],4,1) for c in range(2)],1)
print("LUFS",round(meter.integrated_loudness(mix),2),"TP dBTP",round(20*np.log10(np.abs(up).max()),2),"dur",len(mix)/SR)
sf.write("stem_voice.wav",voice.astype(np.float32),SR,subtype='FLOAT')
