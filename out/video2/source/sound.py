import numpy as np,soundfile as sf,json,re,pyloudnorm as pyln
from scipy.signal import butter,sosfilt,fftconvolve,resample_poly
SR=48000; DUR=113.0; N=int(DUR*SR); R=np.random.default_rng(3); meter=pyln.Meter(SR)
TL=json.load(open("timeline.json")); WS=TL["words"]
def W(pre,after=0.0,k="s"):
    for w in WS:
        if w["s"]>=after and re.sub(r"[^а-яё0-9:]","",w["w"].lower()).startswith(pre): return w[k]
    raise KeyError(pre)
def bp(x,lo=None,hi=None,o=2):
    sos=butter(o,[lo,hi],'bandpass',fs=SR,output='sos') if lo and hi else butter(o,lo or hi,'highpass' if lo else 'lowpass',fs=SR,output='sos'); return sosfilt(sos,x)
db=lambda d:10**(d/20)
tt=lambda d:np.arange(int(d*SR))/SR
def noise(d): return R.standard_normal(int(d*SR))
def add(buf,x,t,g=1.0,pan=0.0):
    i=int(t*SR)
    if i<0: x=x[-i:]; i=0
    if i>=len(buf): return
    x=x[:len(buf)-i]; buf[i:i+len(x),0]+=x*g*np.cos((pan+1)*np.pi/4)*1.414; buf[i:i+len(x),1]+=x*g*np.sin((pan+1)*np.pi/4)*1.414
def fade(x,a=0.01,b=0.05):
    x=x.copy(); n1=max(1,int(a*SR)); n2=max(1,int(b*SR)); x[:n1]*=np.linspace(0,1,n1); x[-n2:]*=np.linspace(1,0,n2); return x
# ---------- instruments ----------
def kick(): t=tt(0.45); f=45+110*np.exp(-t*30); return np.tanh(2.2*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7))
def clap():
    x=np.zeros(int(0.3*SR))
    for d in (0,0.011,0.022): n=bp(noise(0.25),900,3500)*np.exp(-tt(0.25)*(30 if d<0.02 else 14)); i=int(d*SR); m_=min(len(n),len(x)-i); x[i:i+m_]+=n[:m_]
    return x*0.6
def hat(o=False): d=0.25 if o else 0.05; return bp(noise(d),7000,None,4)*np.exp(-tt(d)*(12 if o else 90))*0.5
def b808(f,d): t=tt(d); x=np.sin(2*np.pi*f*t+0.8*np.sin(2*np.pi*f*t))*np.minimum(1,t*80)*np.exp(-t*1.4); return np.tanh(1.6*x)
def pluck(f,d=0.35): t=tt(d); x=sum(np.sin(2*np.pi*f*h*t)/h**1.2 for h in range(1,7))*np.exp(-t*9); return bp(x,None,3500)*0.35
def pad(fs,d): t=tt(d); x=sum(np.sin(2*np.pi*f*t+0.3*np.sin(2*np.pi*0.3*t+i))+0.5*np.sin(2*np.pi*f*1.005*t) for i,f in enumerate(fs)); return fade(x*0.06,d*0.3,d*0.3)
def piano(f,d=2.5): t=tt(d); x=sum(np.sin(2*np.pi*f*h*t*(1+0.0004*h*h))*np.exp(-t*(1.1+h*0.7))/h**1.1 for h in range(1,8)); return x*np.minimum(1,t*300)*0.35
NOTE=lambda n:440*2**((n-69)/12)
CH=[(57,[69,72,76]),(53,[65,69,72]),(48,[64,67,72]),(55,[67,71,74])]   # Am F C G
BPM=104; BEAT=60/BPM; BAR=4*BEAT; S16=BEAT/4
mus=np.zeros((N,2))
def beat(t0,t1,full=True,g=1.0):
    nb=int((t1-t0)/BAR)+1
    for b in range(nb):
        bt=t0+b*BAR
        if bt>=t1: break
        root,tri=CH[b%4]
        for st in range(16):
            t=bt+st*S16
            if t>=t1: break
            if full and st in (0,6,8,11): add(mus,kick(),t,0.9*g)
            if full and st in (4,12): add(mus,clap(),t,0.7*g,0.05)
            if st%2==0 or (b%2==1 and st>=12): add(mus,hat(st==14 and b%2==0),t,0.35*g*(0.7 if st%4 else 1),0.25)
            if full and st in (0,8,11): add(mus,b808(NOTE(root-12),BEAT*(1.5 if st==0 else 0.7)),t,0.55*g)
            add(mus,pluck(NOTE(tri[st%3]+(12 if st%8>=4 else 0))),t,0.32*g,-0.2+0.4*(st%2))
        add(mus,pad([NOTE(n-12) for n in tri],BAR),bt,0.6*g)
# intro riser 0..8.7, impact at "миллиарда" end
t=tt(8.7); rs=bp(noise(8.7),300,6000)*(t/8.7)**2*0.25; add(mus,rs,0.0); 
sw=np.sin(2*np.pi*np.cumsum(120+600*(t/8.7)**2)/SR)*(t/8.7)**2*0.15; add(mus,sw,0.0)
for k,bt in enumerate(np.arange(0,8.6,BAR)): add(mus,pad([NOTE(n-12) for n in CH[k%4][1]],BAR),bt,0.45)
B0=W("миллиард",5,"e")+0.25
beat(B0,W("через",28)+0.0)             # main groove until guru walks out
beat(W("методичк")+0.6,W("вечер"))       # groove back after the laugh/silence
# sad piano + rain for the evening
p0=W("вечер"); pe=W("полночь",80)
for k,bt in enumerate(np.arange(p0,pe-0.5,BAR*1.5)):
    root,tri=CH[k%4]; add(mus,piano(NOTE(root-12),4.0),bt,0.9); 
    for j,n in enumerate(tri): add(mus,piano(NOTE(n),3.0),bt+j*0.18+0.02,0.55)
    add(mus,piano(NOTE(tri[1]+12),2.0),bt+BAR*0.75,0.35)
# midnight: light groove again until the phone
beat(W("закончилось")+0.4,W("открываешь")-0.3,full=False,g=0.8)
# ---------- SFX ----------
fx=np.zeros((N,2))
def whoosh(t,d=0.35,g=1.0,up=True): x=noise(d); k=np.linspace(0,1,len(x)); y=(bp(x,400,1500)*(1-k)+bp(x,1500,8000)*k if up else bp(x,1500,8000)*(1-k)+bp(x,400,1500)*k)*np.sin(np.pi*k)**2; add(fx,y*0.5,t-d*0.6,g)
def pop(t,g=1.0): x=np.sin(2*np.pi*np.cumsum(np.linspace(1200,350,int(0.07*SR)))/SR)*np.exp(-tt(0.07)*40); add(fx,x*0.6,t,g)
def ding(t,f=1568,g=1.0): x=sum(np.sin(2*np.pi*f*h*tt(1.2))*np.exp(-tt(1.2)*(3+h*2))/h for h in (1,2.76,5.4)); add(fx,x*0.4,t,g)
def hit(t,g=1.0): x=kick()*1.2+bp(noise(0.45),60,400)*np.exp(-tt(0.45)*8)*0.8; add(fx,x,t,g)
def stamp(t,g=1.0): x=bp(noise(0.15),100,1500)*np.exp(-tt(0.15)*35)+np.sin(2*np.pi*80*tt(0.15))*np.exp(-tt(0.15)*25); add(fx,x*0.9,t,g)
def glitch(t,d=0.6,g=1.0):
    x=np.zeros(int(d*SR))
    for k in range(int(d*30)):
        i=int(R.uniform(0,d)*SR); n=int(R.uniform(0.01,0.04)*SR); seg_=np.sign(np.sin(2*np.pi*R.uniform(200,2000)*np.arange(n)/SR))*0.4
        m_=min(n,len(x)-i); x[i:i+m_]+=seg_[:m_]
    add(fx,x,t,g)
def siren(t,d=1.6,g=1.0): k=tt(d); f=700+250*np.sin(2*np.pi*1.6*k); add(fx,np.sin(2*np.pi*np.cumsum(f)/SR)*0.25*fade(np.ones(len(k)),0.1,0.3),t,g)
def kaching(t,g=1.0): ding(t,2093,0.7*g); ding(t+0.08,2637,0.7*g); add(fx,bp(noise(0.1),3000,9000)*np.exp(-tt(0.1)*30)*0.5,t,g)
def laugh(t,d=1.6,g=1.0):
    x=np.zeros(int(d*SR))
    for v in range(8):
        f0=R.uniform(180,320); ph=R.uniform(0,0.2)
        for k in np.arange(ph,d-0.15,R.uniform(0.13,0.18)):
            n=int(0.1*SR); y=bp(R.standard_normal(n),f0*2,f0*6)*np.sin(np.pi*np.linspace(0,1,n))*R.uniform(0.3,1); i=int(k*SR); m_=min(n,len(x)-i); x[i:i+m_]+=y[:m_]
    add(fx,fade(x,0.05,0.4)*0.35,t,g)
def gong(t,g=1.0): x=sum(np.sin(2*np.pi*f*tt(3))*np.exp(-tt(3)*dcy) for f,dcy in ((110,0.8),(163,1.2),(231,1.6),(297,2.2))); add(fx,x*0.25,t,g)
def sob(t,g=1.0):
    for k in range(3): f=np.linspace(520,330,int(0.35*SR)); add(fx,np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*np.linspace(0,1,len(f)))*0.25,t+k*0.42,g)
def bling(t,g=1.0): ding(t,1760,0.6*g); ding(t+0.09,2349,0.6*g)
def glass(t,g=1.0):
    x=bp(noise(0.8),2500,10000)*np.exp(-tt(0.8)*6)*0.5
    for k in range(14): ding(t+R.uniform(0,0.3),R.uniform(2500,6000),0.12*g)
    add(fx,x,t,g)
def dial(t,n=2,g=1.0):
    for k in range(n): add(fx,fade((np.sin(2*np.pi*425*tt(0.6))*0.3),0.01,0.02),t+k*1.0,g)
def keys(t,d=1.2,g=1.0):
    for k in np.arange(0,d,0.09): add(fx,bp(noise(0.03),1500,6000)*np.exp(-tt(0.03)*120)*0.6,t+k+R.uniform(0,0.03),g)
def rain(a,b,g=1.0): x=bp(noise(b-a),1200,9000)*0.12+bp(noise(b-a),300,1200)*0.06; add(fx,fade(x,0.8,0.8),a,g)
def ring(t,n=2,g=1.0):
    for k in range(n):
        for j,f in enumerate((988,1319,1175,1568)): add(fx,np.sin(2*np.pi*f*tt(0.18))*np.exp(-tt(0.18)*6)*0.3,t+k*1.1+j*0.16,g)
def tick(t,g=1.0): add(fx,bp(noise(0.03),2000,8000)*np.exp(-tt(0.03)*200)*0.8,t,g)
def exhale(t,g=1.0): x=bp(noise(1.2),300,2500); k=np.linspace(0,1,len(x)); add(fx,x*np.sin(np.pi*k)*(1-k)*0.25,t,g)
def vib(t,d=0.9,g=1.0): k=tt(d); add(fx,bp(np.sin(2*np.pi*170*k)*(np.sin(2*np.pi*3*k)>0),100,900)*0.4,t,g)
def stinger(t,g=1.0):
    k=tt(1.2); rev=bp(noise(1.2),400,6000)*(k/1.2)**3*0.4; add(fx,rev,t-1.2,g); hit(t,1.2*g)
    for n in (45,52,57,60): add(fx,np.sin(2*np.pi*NOTE(n)*tt(2.5))*np.exp(-tt(2.5)*1.2)*0.25,t,g)
def click(t,g=1.0): add(fx,bp(noise(0.02),1500,7000)*np.exp(-tt(0.02)*250)*0.9,t,g); pop(t+0.01,0.5*g)
# scene changes & stickers keyed to words (see scenes.js for the same anchors)
hit(W("полночь"),0.8); ding(W("полночь")+0.05,2093,0.5)
hit(B0-0.25,1.1)
SC=[("первые",0),("первая",0),("пикап",0),("три",37),("каждый",0),("утро",0),("бывшие",0),("полдень",0),("вечер",0),("полночь",80),("открываешь",0),("что",106)]
for p,a in SC: whoosh(W(p,a),0.4,0.9)
glitch(W("тиндер"),0.8); siren(W("тиндер")+0.3,1.8,0.8); bling(W("планировали")-0.4,0.8)
kaching(W("пустеют")); kaching(W("10",19)); ding(W("чаевые")); ding(W("сердца"),2349)
pop(W("зал")); laugh(W("зал")+0.1,1.7,1.0); pop(W("методичк")); pop(W("50")); pop(W("парнем"))
gong(W("ночи")); pop(W("очередь")); pop(W("понедельник")); sob(W("плачет"))
pop(W("такой")); bling(W("второго")-0.5); bling(W("сообщения")); glass(W("сообщения")+0.35)
for p,a in (("где",0),("работе",0),("5",55),("горит",0)): pop(W(p,a),0.8)
dial(W("мамы"),2,0.7)
keys(W("бывшие"),1.4,0.8); bling(W("тебе",60)); pop(W("заблокировал")); bling(W("нового"))
stamp(W("воз")+0.75,1.2); pop(W("девять")); 
rain(W("вторые"),W("полночь",80),0.9); pop(W("ноль"),0.6); ring(W("звонит"),2,0.8)
for k in np.arange(W("полночь",80)-0.6,W("закончилось"),0.25): tick(k,0.8)
hit(W("закончилось"),1.2); exhale(W("закончилось")+0.4,0.8); pop(W("вчера"))
vib(W("открываешь")+0.4,0.9,0.9); ding(W("00:01"),1568,0.6); vib(W("спишь")-0.3,0.6,0.8)
stinger(W("читаешь")+0.35,1.0)
click(W("отвечаешь")); click(W("притворяешься")); pop(W("комментариях"))
# ---------- voice + mix ----------
v,sr=sf.read("audio/voice.wav"); v=resample_poly(v,2,1); v=bp(v,70,None)
vL=meter.integrated_loudness(v); v*=db(-16-vL)
voice=np.zeros((N,2)); add(voice,v,0.0,1.0)
act=np.zeros(N); a_=np.abs(v); env=np.convolve(a_,np.ones(int(0.05*SR))/int(0.05*SR),'same'); act[:len(env)]=env>db(-40)
act=np.convolve(act,np.ones(int(0.3*SR)),'same')>0
mL=meter.integrated_loudness(mus+1e-9); fL=meter.integrated_loudness(fx+1e-9)
g=np.where(act,-16-22-mL,-16-17-mL)
# smooth with moving average (fast enough)
k=int(0.25*SR); gs=np.convolve(np.pad(g,(k,k),'edge'),np.ones(k)/k,'same')[k:-k]
mus*=db(gs)[:,None]; fx*=db(-16-14-fL+2)
mix=voice+mus+fx
L=meter.integrated_loudness(mix); mix*=db(-14.2-L)
def limit(mix,thr_db):
    up=np.stack([resample_poly(mix[:,c],4,1) for c in range(2)],1); pk=np.abs(up).max(1).reshape(-1,4).max(1)[:N]
    gl=np.minimum(1,db(thr_db)/(pk+1e-9)); la=int(0.004*SR)
    gm=np.minimum.reduceat(gl,np.arange(0,N,48)).repeat(48)[:N]; gm=np.minimum(gm,np.roll(gm,-la))
    out=np.empty(N); vv=1.0; rel=np.exp(-48/(0.08*SR))
    for i in range(0,N,48): tg=gm[i]; vv=tg if tg<vv else tg+(vv-tg)*rel; out[i:i+48]=vv
    return mix*out[:,None]
for _ in range(3):
    mix=limit(mix,-1.6); L=meter.integrated_loudness(mix); mix*=db(-14-L)
mix=limit(mix,-1.2)
sf.write("mix.wav",mix.astype(np.float32),SR,subtype='FLOAT')
up=np.stack([resample_poly(mix[:,c],4,1) for c in range(2)],1)
print("LUFS",round(meter.integrated_loudness(mix),2),"TP",round(20*np.log10(np.abs(up).max()),2),"dur",N/SR)
