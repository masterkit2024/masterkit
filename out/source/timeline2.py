import numpy as np,soundfile as sf,json,re,difflib
SR=48000
T={
"L1":"Поезд через ^час. | Хочешь вернуть | ^один ^час твоей жизни? | ^Любой.",
"D1":"^Серьёзно?! | Тогда день, | когда я открыл | свою ^компанию!",
"L2":"Его ты и так ^помнишь.",
"L3":"Возьмём обычную ^пятницу. | ^23:47. | Тебе ^19.",
"D3":"В ^пятницу?.. | Зачем?",
"L4":"Ты в ^наушниках. | Мама в ^пятый раз | просто вышла за водой, | греет суп в ^третий. | Папа смотрит | ^выключенный телевизор.",
"D4":"^Выключенный…",
"L5":"Ты бросил: | «Мам, ^отстань, мне не пять». | А она говорила тебе | в спину ещё ^сорок ^секунд. | Хочешь ^услышать?",
"D5":"^Да.",
"M":"Мне просто ^страшно, | когда тебя нет. | ^Поешь. | Ты у нас ^самый ^лучший. | Только ^звони, ладно? | Хоть ^иногда.",
"D6":"Я даже не снял ^наушники…",
"L7":"А знаешь, кто каждую ^пятницу | встречал тебя на ^остановке? | ^Папа. | Шёл в двадцати метрах ^сзади, | чтобы ты не ^заметил.",
"D7":"Я думал, он ^спит…",
"L8":"Теперь у тебя ^бизнес. | Ты присылаешь им ^деньги. | Они пишут: | «Приезжай, мы ^скучаем». | Ты ставишь | ^сердечко.",
"L9":"А папа по пятницам | всё равно выходит | на ^остановку. | Вдруг ты ^приедешь. | И мама не выключает | ^свет в коридоре.",
"D8":"Они до сих пор ^ждут…",
"D9":"^Пап?.. | Не выходи. | Я уже ^еду.",
"L11":"Кто-то сегодня тоже | ждёт тебя на ^остановке. | ^Позвони.",
}
SPK={k:("keeper" if k[0]=="L" else "dima" if k[0]=="D" else "mama") for k in T}
WARM={"L4","D4","L5","D5","M","D6","L7","D7","L9","L11"}
dur=json.load(open("clips2/dur.json")); asr=json.load(open("clips2/asr.json"))
def runs_of(x,rel):
    hop=480; e=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x),hop)]); db=20*np.log10(e); m=db>db.max()-rel
    r=[];i=0
    while i<len(m):
        if m[i]:
            j=i
            while j<len(m) and m[j]: j+=1
            r.append([i/100,j/100]); i=j
        else: i+=1
    o=[r[0]]
    for a,b in r[1:]:
        if a-o[-1][1]<0.15: o[-1][1]=b
        else: o.append([a,b])
    return [x for x in o if x[1]-x[0]>0.1]
norm=lambda w: re.sub(r"[^а-яё0-9]","",w.lower().replace("ё","е"))
V="аеёиоуыэюяАЕЁИОУЫЭЮЯ"
def align(k):
    x=sf.read(f"clips2/{k}.wav")[0]; R=runs_of(x,50 if k=="D4" else 42)
    can=[]
    for ci,ch in enumerate(T[k].split("|")):
        for w in ch.split(): hl=w.startswith("^"); can.append(dict(w=w.lstrip("^"),hl=hl,chunk=ci))
    A=[[max(0,a[0]),a[1],a[2]] for a in asr[k]]
    M=[]
    for a in A:
        if M and (a[2].startswith(".") or a[2].startswith("-")): M[-1]=[M[-1][0],a[1],M[-1][2]+a[2]]
        else: M.append(a)
    A=M; n=len(can)
    ca=[norm(c["w"]) for c in can]; aa=[norm(a[2]) for a in A]
    sm=difflib.SequenceMatcher(a=ca,b=aa,autojunk=False); wt=[None]*n
    for tag,i1,i2,j1,j2 in sm.get_opcodes():
        if (i2-i1)==(j2-j1) and i2>i1:
            for d in range(i2-i1): wt[i1+d]=list(A[j1+d][:2])
        elif j2>j1 and i2>i1:
            s0,e0=A[j1][0],A[j2-1][1]
            for d in range(i2-i1): wt[i1+d]=[s0+(e0-s0)*d/(i2-i1),s0+(e0-s0)*(d+1)/(i2-i1)]
    for i in range(n):
        if wt[i] is None: p=wt[i-1][1] if i else 0; wt[i]=[p,p+0.2]
    # gaps between voiced runs
    G=[(R[j][1],R[j+1][0]) for j in range(len(R)-1)]
    B=[(wt[i-1][1]+wt[i][0])/2 for i in range(1,n)]   # whisper boundary time before word i
    P=[bool(re.search(r"[.,!?…:»]$",can[i-1]["w"])) for i in range(1,n)]
    INF=1e9; nb=len(B); ng=len(G)
    D=np.full((ng+1,nb+1),INF); D[0,0]=0; bk={}
    for j in range(ng+1):
        for i in range(nb+1):
            if D[j,i]>=INF: continue
            if i<nb and D[j,i]<D[j,i+1]: D[j,i+1]=D[j,i]; bk[(j,i+1)]=(j,i,0)       # boundary without gap
            if j<ng:
                gl=G[j][1]-G[j][0]; c=D[j,i]+gl*2.5
                if c<D[j+1,i]: D[j+1,i]=c; bk[(j+1,i)]=(j,i,0)                      # gap inside a word
                if i<nb:
                    cc=D[j,i]+abs(B[i]-(G[j][0]+G[j][1])/2)+(0 if P[i] else 0.25)
                    if cc<D[j+1,i+1]: D[j+1,i+1]=cc; bk[(j+1,i+1)]=(j,i,1)
    j,i=ng,nb; asg={}
    while (j,i)!=(0,0):
        pj,pi,m=bk[(j,i)]
        if m: asg[i]=j-1        # boundary index i (before word i+1... ) -> gap
        j,i=pj,pi
    # boundary index ii (0-based in B) means before word ii+1
    cuts=sorted(asg.items())
    spans=[]; w0=0; t0=R[0][0]
    for ii,gj in cuts:
        spans.append((w0,ii,t0,G[gj][0])); w0=ii; t0=G[gj][1]
    spans.append((w0,n,t0,R[-1][1]))
    out=[]
    for w0,w1,ta,tb in spans:
        rr=[[max(a,ta),min(b,tb)] for a,b in R if b>ta and a<tb]
        tot=sum(b-a for a,b in rr)
        wd=np.array([max(0.12,wt[i][1]-wt[i][0])*0.5+0.5*0.11*max(1,sum(c in V for c in can[i]["w"])) for i in range(w0,w1)])
        cum=np.concatenate([[0],np.cumsum(wd)])/wd.sum()*tot
        def v2t(v,end=False):
            acc=0
            for a,b in rr:
                d=b-a
                if v<acc+d-1e-6 or (end and v<=acc+d+1e-6): return a+(v-acc)
                acc+=d
            return rr[-1][1]
        for q,i in enumerate(range(w0,w1)):
            out.append(dict(can[i],s=round(v2t(cum[q]),3),e=round(v2t(cum[q+1],True),3)))
    return out,R
ORDER=["L1","D1","L2","L3","D3","L4","D4","L5","D5","M","D6","L7","D7","L8","L9","D8","D9","L11"]
W={k:align(k) for k in ORDER}
start={}
def place(keys,t0,t1,wts,tail_gap=True):
    tot=sum(dur[k] for k in keys); slack=(t1-t0)-tot; w=np.array(wts,float); g=slack*w/w.sum(); t=t0
    for i,k in enumerate(keys): start[k]=t; t+=dur[k]+(g[i] if i<len(g) else 0)
srd=[w for w in W["L8"][0] if w["w"].startswith("сердечко")][0]["s"]
place(["L1","D1","L2"],0.3,17.0,[1.3,1.4,1.3])
f3=[w for w in W["L3"][0]][0]["s"]
place(["L3","D3","L4","D4","L5","D5"],17.0-f3,44.5,[1,1,1,0.8,1,1.6])
L8s=71.5-srd
place(["M","D6","L7","D7"],44.5,L8s,[1.3,0.9,1,1]); start["L8"]=L8s
t9=L8s+dur["L8"]; keys=["L9","D8","D9","L11"]; wts=[0.35,0.5,0.5,0.75]
slack=88.55-t9-sum(dur[k] for k in keys); g=np.array(wts)/sum(wts)*slack; t=t9
for k,gg in zip(keys,g): t+=gg; start[k]=t; t+=dur[k]
out=[]; prev=None
for k in ORDER:
    s=start[k]; e=s+dur[k]; words=[dict(w,s=round(w["s"]+s,3),e=round(w["e"]+s,3)) for w in W[k][0]]
    print(f"{k:4} {s:6.2f}-{e:6.2f} gap {0 if prev is None else s-prev:4.2f} | "+" ".join(f"{w['w']}@{w['s']:.2f}" for w in words)); prev=e
    out.append(dict(id=k,spk=SPK[k],start=round(s,3),end=round(e,3),warm=k in WARM,italic=k=="M",words=words,runs=[[round(a+s,3),round(b+s,3)] for a,b in W[k][1]]))
json.dump(out,open("timeline.json","w"),ensure_ascii=False,indent=1)
