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

def W(i,pre=None,k='s'):
    c=[c for c in TL if c['id']==i][0]
    if pre is None: return c['start'] if k=='s' else c['end']
    import re
    for w in c['words']:
        if re.sub(r'[^а-яё0-9:]','',w['w'].lower()).startswith(pre): return w[k]
    raise KeyError(i+pre)
# ---------- voices ----------
WET={"L1":.14,"L2":.14,"L3":.13,"L4":.03,"L5":.03,"L7":.04,"L8":.10,"L9":.06,"L11":.12}
LV={"keeper":-18,"dima":-18,"mama":-17.5}
QUIET={"D6":-2,"D7":-2.5,"D8":-3,"D9":-1,"L11":-1.5,"D4":-1}
voice=np.zeros((N+SR*2,2)); vmask=np.zeros(N+SR*2)
for c in TL:
    x,_=sf.read(f"clips2/{c['id']}.wav")
    if c['spk']=="mama": x=bp(x,90,None); x=x+0.15*bp(x,150,400)
    if c['spk']=="dima": x=bp(x,80,None)
    if c['id'] in WET: x=reverb(x,IR_ST if c['id'] not in ("L4","L5","L7") else IR_ROOM,WET[c['id']])
    l=meter.integrated_loudness(np.pad(x,(0,max(0,int(0.6*SR)-len(x)))))
    place(voice,x*db(LV[c['spk']]+QUIET.get(c['id'],0)-l),c['start'],1.0)
    for a_,b_ in c['runs']: vmask[int(a_*SR):int(b_*SR)]=1
# muffled mama behind the closed door (her voice through his headphones) from the slam to "Да."
slam=W('L5','пять')+0.62
mx,_=sf.read("clips2/M.wav"); dd=W('D5')+0.3-slam; mx=mx[:int(dd*SR)]
beat=np.zeros(int(dd*SR))
for k in np.arange(0,dd,0.5):
    i=int(k*SR); m_=int(0.12*SR); tk=np.arange(m_)/SR
    if i+m_<len(beat): beat[i:i+m_]+=np.sin(2*np.pi*(60+80*np.exp(-tk*40))*tk)*np.exp(-tk*25)*0.9
beat=bp(beat,None,500,4)
mb=bp(mx,None,400,4)*3.0+beat*0.5; mb=fade(mb,0.5,0.3)
mb=mb/ (np.sqrt(np.mean(mb**2))+1e-9)*db(-36)
place(voice,mb,slam,1.0)
voice=voice[:N]; vmask=vmask[:N]
# ---------- music ----------
m,_=sf.read("audio/music.wav"); m=m[:N]; m=np.pad(m,((0,N-len(m)),(0,0)))
mL=meter.integrated_loudness(m)
act=np.convolve(vmask,np.ones(int(0.22*SR)),'same')>0
ref=LV['keeper']
gdb=np.where(act,ref-14-mL,ref-6-mL).astype(float)
def setr(a,b,val): gdb[int(a*SR):int(b*SR)]=val-mL
setr(W('D4')-0.05,W('D4','выключенный','e')+0.9,ref-34)    # comedic silence
setr(W('D6',None,'e')+0.02,W('L7')-0.02,ref-48)            # silence after headphones
pk0=W('L8','скучаем','e'); pk1=W('L9')
gdb[int(pk0*SR):int(pk1*SR)]=np.maximum(gdb[int(pk0*SR):int(pk1*SR)],ref-9-mL)
setr(W('L8',None,'e')+0.02,W('L9')-0.02,ref-3)              # bloom right after "сердечко"
def smooth(x,att,rel):
    y=np.empty_like(x); a_=np.exp(-1/(att*SR)); r_=np.exp(-1/(rel*SR)); v=x[0]
    for i in range(0,len(x),48):
        tg=x[i]; c_=a_ if tg<v else r_; v=tg+(v-tg)*c_**48; y[i:i+48]=v
    return y
mus=m*db(smooth(gdb,0.08,0.35))[:,None]
mus[-int(1.2*SR):]*=np.linspace(1,0,int(1.2*SR))[:,None]**1.5
# ---------- SFX keyed to the voice ----------
fx=np.zeros((N,2))
def bed(gen,a,b,g,fi=0.6,fo=0.6,pan=0): x=fade(gen(b-a),fi,fo); place(fx,x/np.std(x)*0.1,a,db(g),pan)
def tick(t,g=-26,pan=0.3,f=3200):
    n=int(0.03*SR); tk=np.arange(n)/SR; x=(np.sin(2*np.pi*f*tk)+0.5*R.standard_normal(n))*np.exp(-tk*300); place(fx,x*0.3,t,db(g),pan)
def click(t,g=-22,pan=0): x=bp(noise(0.02),1500,None)*np.exp(-np.arange(int(0.02*SR))/SR*250); place(fx,x*0.5,t,db(g),pan)
def chime(t,g=-26,f=1320):
    tk=np.arange(int(2.5*SR))/SR; x=sum(a*np.sin(2*np.pi*f*h*tk)*np.exp(-tk*(1.6+h)) for h,a in [(1,1),(2.01,0.4),(3.02,0.2),(4.2,0.1)]); place(fx,x*0.25,t,db(g),0.2)
def whoosh(t,d,g=-24,rev=False,up=True,pan=0):
    x=pink(d); tk=np.linspace(0,1,len(x)); e=np.sin(np.pi*tk)**2 if not rev else tk**3
    y=(bp(x,300,1200)*(1-(tk if up else 1-tk))+bp(x,1500,7000)*(tk if up else 1-tk))*e; place(fx,y*0.2,t,db(g),pan)
def step(t,g=-28,pan=0,soft=False,hard=False):
    n=int(0.09*SR); tk=np.arange(n)/SR; x=bp(noise(0.09),80,1500 if not soft else 700)*np.exp(-tk*(55 if not hard else 35)); x+=np.sin(2*np.pi*90*tk)*np.exp(-tk*40)*0.5; place(fx,x*0.4,t,db(g),pan)
def thump(t,g=-18,f=55,d=0.5): tk=np.arange(int(d*SR))/SR; x=np.sin(2*np.pi*(f+30*np.exp(-tk*12))*tk)*np.exp(-tk*7); place(fx,x*0.6,t,db(g))
def pop(t,g=-20): tk=np.arange(int(0.08*SR))/SR; x=np.sin(2*np.pi*(900-600*tk/0.08)*tk)*np.exp(-tk*50); place(fx,x*0.4,t,db(g))
def clink(t,g=-26,f=2400,pan=0): tk=np.arange(int(0.6*SR))/SR; x=sum(np.sin(2*np.pi*f*h*tk)*np.exp(-tk*(9+h*3))/h for h in (1,1.53,2.7)); place(fx,x*0.25,t,db(g),pan)
def breath(t,d=0.8,g=-30,inhale=True): x=bp(noise(d),400,3000); tk=np.linspace(0,1,len(x)); e=(tk**1.5 if inhale else (1-tk)**1.5)*np.sin(np.pi*tk); place(fx,x*e*0.1,t,db(g))
def pshh(t,d=0.6,g=-24): x=bp(noise(d),2500,9000); e=env(len(x),0.01,d*0.35); place(fx,x*e*0.2,t,db(g),-0.1)
def busPass(a,b,g=-24,arrive=True):
    x=brown(b-a)*0.6+bp(pink(b-a),200,2500)*0.4; tk=np.linspace(0,1,len(x)); e=(np.sin(np.pi*np.minimum(tk*1.6,1)/2) if arrive else 1-tk)
    place(fx,(x+bp(noise(b-a),3000,9000)*0.25)*e*0.1,a,db(g),0.0)
def vib(t,d=1.0,g=-22): tk=np.arange(int(d*SR))/SR; x=bp(np.sin(2*np.pi*150*tk)*(np.sin(2*np.pi*2.5*tk)>0),100,1200); place(fx,x*0.2,t,db(g))
def ring(t,g=-26):
    for f,dt in [(880,0),(1175,0.18),(1047,0.36)]: tk=np.arange(int(0.3*SR))/SR; place(fx,np.sin(2*np.pi*f*tk)*np.exp(-tk*8)*0.2,t+dt,db(g))
def pad(a,b,g=-30,chord=(220,277.2,329.6,440)):
    d=b-a; tk=np.arange(int(d*SR))/SR; x=sum(np.sin(2*np.pi*f*tk+np.sin(tk*0.7+i)*0.5) for i,f in enumerate(chord)); place(fx,fade(x,d*0.5,1.0)*0.05,a,db(g))
mem0=W('L4')-0.1; mem1=W('L8')-0.05; st2=W('D8')-0.05
# S1 station: hum, rain on glass, watch
bed(lambda d: bp(brown(d),30,220),0,mem0,-25,0.6,0.4); bed(lambda d: bp(pink(d),2000,9000)*0.6+bp(pink(d),400,1500)*0.4,0,mem0,-31,0.6,0.4,0.2)
bed(lambda d: bp(brown(d),30,220),st2,89,-26,0.5,1.0); bed(lambda d: bp(pink(d),2000,9000),st2,89,-33,0.5,1.0,0.2)
click(0.35,-20); chime(0.5,-27)
for t in np.arange(0.9,W('L3'),0.5): tick(t,-30)
for t in (2.2,2.9,3.6): step(t,-37,-0.6)
whoosh(W('D1','тогда')-0.4,1.0,-26); pop(W('D1','компанию'),-24)
for t in np.arange(W('D1','компанию'),W('D1','компанию')+0.6,0.08): tick(t,-29,0.1,2400)
# S2 rewind on the drop
whoosh(W('L3'),2.0,-22,rev=True)
for i in range(26): tick(W('L3')+0.15+i*0.11,-28,0.0,2800)
for i in range(2): click(W('L3','пятницу')+i*0.1,-24,(i-1)*0.2)
for i in range(5): click(W('L3','23')+i*0.1,-24,(i-2)*0.15)
chime(W('L3','19'),-30,990)
whoosh(W('D3','зачем')+0.4,mem0-W('D3','зачем')-0.3,-20,up=True); chime(mem0-0.05,-28,1760)
# S3 hallway
click(mem0+0.05,-22,-0.3)
for i in range(4): step(mem0+0.2+i*0.42,-30,-0.3+i*0.1)
for i in range(5): step(W('L4','мама')+i*0.34,-33,0.2,soft=True)
clink(W('L4','водой'),-30,3100,0.3)
bed(lambda d: bp(pink(d),150,900)*(1+0.6*np.abs(np.sin(np.arange(int(d*SR))/SR*23))),W('L4','греет')-0.1,W('L4','папа'),-28,0.2,0.3,0.4)
clink(W('L4','третий'),-27,1900,0.4)
for i in range(4): step(W('L5','мам')+0.3+i*0.42,-31,0.2)
thump(slam,-16,70,0.35); click(slam+0.01,-18)
# S4 mama
breath(W('M')-0.55,0.5,-31); pad(W('M'),W('D6'),-31,(196,246.9,293.7,392))
clink(W('M','хоть')+0.3,-27,1300,-0.1); thump(W('M','хоть')+0.3,-30,120,0.15)
# S5 headphones hum then silence
bed(lambda d: bp(noise(d),80,300)+0.3*np.sin(2*np.pi*120*np.arange(int(d*SR))/SR),W('D6'),W('D6',None,'e'),-30,0.1,0.08)
# S6 street
s0=W('L7'); tE=W('L7','заметил')+0.4
bed(lambda d: bp(pink(d),1000,10000)*0.7+bp(pink(d),200,1000)*0.3,s0-0.1,W('L8')-0.05,-24,0.4,0.4)
busPass(s0,s0+1.5,-23); pshh(s0+1.4,0.6,-25); pshh(s0+2.5,0.5,-27); busPass(s0+2.9,s0+5.2,-25,arrive=False)
ds=np.arange(s0+1.9,tE,0.46)
for t in ds: step(t,-28,0.25,hard=True)
sync0=W('L7','шёл'); 
for t in np.arange(W('L7','папа')-0.3,W('L7','чтобы'),0.52):
    if not (sync0<=t<=sync0+1.0): step(t,-38,-0.35,soft=True)
for t in ds[(ds>=sync0)&(ds<=sync0+1.0)]: step(t+0.005,-37,-0.35,soft=True)
breath(tE+0.2,0.9,-32,inhale=False)
# S7 business
for t in np.arange(W('L8'),W('L8','ты')-0.1,0.11): click(t+R.uniform(0,0.04),-33,0.1)
tick(W('L8','деньги'),-22,0,1800); tick(W('L8','деньги')+0.07,-24,0,2600)
click(W('L8','ставишь')+0.15,-24); pop(W('L8','сердечко'),-22); thump(W('L8','сердечко')+0.01,-16,50,0.7)
# S8 parents now
p0=W('L9'); tv=W('L9','вдруг')
bed(lambda d: bp(pink(d),1000,10000),p0-0.05,W('L9','и'),-28,0.4,0.6)
busPass(p0,p0+1.2,-26); pshh(p0+1.2,0.6,-28); pshh(tv+0.2,0.5,-30); busPass(tv+0.6,tv+2.4,-28,arrive=False)
click(W('L9','свет'),-30,0.2)
# S9 call
vib(W('D8','ждут')+0.2,0.5,-24); ring(W('D9')-0.5,-28); breath(W('D9','не')-0.1,0.6,-30)
# S10 final
pad(W('D9','я')-0.1,89.0,-27,(220,277.2,329.6,440,554.4))
bed(lambda d: bp(brown(d),25,160),W('L11'),89,-24,2.0,1.2)
for t in np.arange(st2,88.6,0.5): tick(t,-30-max(0,t-W('L11'))*2.5)
click(W('L11','позвони')+0.4,-24); chime(W('L11','позвони')+0.45,-32,660)
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
sf.write("mix2.wav",mix.astype(np.float32),SR,subtype='FLOAT')
up=np.stack([resample_poly(mix[:,c],4,1) for c in range(2)],1)
print("LUFS",round(meter.integrated_loudness(mix),2),"TP dBTP",round(20*np.log10(np.abs(up).max()),2),"dur",len(mix)/SR)
sf.write("stem_voice2.wav",voice.astype(np.float32),SR,subtype='FLOAT')
