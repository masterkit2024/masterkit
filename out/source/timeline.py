import numpy as np,soundfile as sf,json,re
SR=48000
T={
"L1":"Поезд через час. | Хочешь, верну | ^один ^час твоей жизни? | ^Любой.",
"D1":"^Серьёзно?! | Тогда день, когда | я открыл свою ^компанию!",
"L2":"Его ты и так ^помнишь.",
"L3b":"Возьмём обычную ^пятницу. | Двадцать три сорок семь. | Тебе ^девятнадцать.",
"D3":"^Пятницу?.. | Зачем?",
"L4":"Ты в ^наушниках. | Мама в ^пятый раз | просто вышла за водой, | греет суп в ^третий. | Папа смотрит | ^выключенный телевизор.",
"D4":"^Выключенный…",
"L5":"Ты бросил: | «Мам, ^отстань, мне не пять». | А она говорила тебе в спину | ещё ^сорок ^секунд. | Хочешь ^услышать?",
"D5":"^Да.",
"M":"Мне просто ^страшно, | когда тебя нет. | ^Поешь. | Ты у нас ^самый ^лучший. | Только ^звони, ладно? | Хоть иногда.",
"D6":"Я даже не снял ^наушники…",
"L7":"А знаешь, кто каждую пятницу | встречал тебя на ^остановке? | ^Папа. | Шёл в ^двадцати ^метрах сзади, | чтобы ты не заметил.",
"D7":"Я думал, он ^спит…",
"L8":"Теперь у тебя ^бизнес. | Ты присылаешь им ^деньги. | Они пишут: | «Приезжай, мы ^скучаем». | Ты ставишь | ^сердечко.",
"L9":"А папа по пятницам | всё равно выходит | на ^остановку. | Вдруг ты ^приедешь. | И мама не выключает | ^свет в коридоре.",
"D8":"Они до сих пор ^ждут…",
"D9":"^Пап?.. | Не выходи. | Я уже ^еду.",
"L11":"Кто-то сегодня тоже | ждёт тебя на ^остановке. | ^Позвони.",
}
SPK={k:("keeper" if k[0]=="L" else "dima" if k[0]=="D" else "mama") for k in T}
WARM={"L4","D4","L5","D5","M","D6","L7","D7","L9","L11"}
V="аеёиоуыэюяАЕЁИОУЫЭЮЯ"
dur=json.load(open("clips/dur.json"))
def vmask(x,rel=42,hop=480):
    e=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x),hop)])
    db=20*np.log10(e); return db>db.max()-rel
def runs(m):
    r=[];i=0
    while i<len(m):
        if m[i]:
            j=i
            while j<len(m) and m[j]: j+=1
            r.append([i/100,j/100]); i=j
        else: i+=1
    # merge gaps < 0.12
    o=[r[0]]
    for a,b in r[1:]:
        if a-o[-1][1]<0.12: o[-1][1]=b
        else: o.append([a,b])
    return o
def align(k):
    x=sf.read(f"clips/{k}.wav")[0]; R=runs(vmask(x,50 if k in("D4","D8","D9","L11") else 42))
    R=[r for r in R if r[1]-r[0]>=0.1] or R
    words=[]
    for ci,ch in enumerate(T[k].split("|")):
        for w in ch.split():
            hl=w.startswith("^"); w=w.lstrip("^")
            words.append(dict(w=w,hl=hl,chunk=ci,syl=sum(c in V for c in w)))
    tot=sum(b-a for a,b in R); n=len(words)
    wts=np.array([max(1,wd["syl"])+0.5 for wd in words]); cw=np.concatenate([[0],np.cumsum(wts)])/wts.sum()*tot
    P=[i+1 for i,wd in enumerate(words[:-1]) if re.search(r"[.,!?…:»]$",wd["w"])]
    G=[]; acc=0
    for i in range(len(R)-1):
        acc+=R[i][1]-R[i][0]; G.append((acc,R[i+1][0]-R[i][1]))
    # DP match gaps to punctuation boundaries
    INF=1e9; nP,nG=len(P),len(G)
    D=np.full((nP+1,nG+1),INF); D[0,0]=0; bk={}
    for i in range(nP+1):
        for j in range(nG+1):
            if D[i,j]>=INF: continue
            if i<nP and D[i,j]+0.15<D[i+1,j]: D[i+1,j]=D[i,j]+0.15; bk[(i+1,j)]=(i,j,0)
            if j<nG:
                c=D[i,j]+0.1+G[j][1]*1.5
                if c<D[i,j+1]: D[i,j+1]=c; bk[(i,j+1)]=(i,j,0)
            if i<nP and j<nG:
                c=D[i,j]+abs(G[j][0]-cw[P[i]])
                if c<D[i+1,j+1]: D[i+1,j+1]=c; bk[(i+1,j+1)]=(i,j,1)
    i,j=nP,nG; M=[]
    while (i,j)!=(0,0):
        pi,pj,m=bk[(i,j)]
        if m: M.append((P[i-1],j-1))
        i,j=pi,pj
    M=sorted(M)
    # anchors in voiced-time: word index -> voiced pos
    anc=[(0,0.0)]+[(w,G[g][0]) for w,g in M]+[(n,tot)]
    vb=np.zeros(n+1)
    for (w0,v0),(w1,v1) in zip(anc,anc[1:]):
        seg=cw[w0:w1+1]; seg=(seg-seg[0])/(seg[-1]-seg[0]+1e-9)
        vb[w0:w1+1]=v0+seg*(v1-v0)
    matched={w for w,g in M}
    def v2t(v,end=False):
        acc=0
        for a,b in R:
            d=b-a
            if (v<acc+d-1e-6) or (end and v<=acc+d+1e-6): return a+(v-acc)
            acc+=d
        return R[-1][1]
    for i,wd in enumerate(words):
        wd["s"]=round(v2t(vb[i]),3); wd["e"]=round(v2t(vb[i+1],end=True),3)
    return words,R
ORDER=["L1","D1","L2","L3b","D3","L4","D4","L5","D5","M","D6","L7","D7","L8","L9","D8","D9","L11"]
W={k:align(k) for k in ORDER}
# сердечко offset
srd=[w for w in W["L8"][0] if w["w"].startswith("сердечко")][0]["s"]
# anchors: (index, start)
start={}
def seg(keys,t0,t1,weights=None,fix_end=False):
    tot=sum(dur[k] for k in keys); n=len(keys)-1+(1 if not fix_end else 0)
    slack=(t1-t0)-tot; w=np.array(weights if weights else [1]*n,float); g=slack*w/w.sum()
    t=t0
    for i,k in enumerate(keys):
        start[k]=t; t+=dur[k]+(g[i] if i<len(g) else 0)
seg(["L1","D1","L2"],0.25,17.0)
seg(["L3b","D3","L4","D4","L5","D5"],17.0,44.0,[1,1,1,0.8,1,1.3])
L8s=71.55-srd
seg(["M","D6","L7","D7"],44.0,L8s,[1.4,0.9,1,1])
start["L8"]=L8s
t9=L8s+dur["L8"]
seg(["L9","D8","D9","L11"],t9+0.0,88.55,[0.35,0.45,0.45,0.7],fix_end=True)
# gap before L9 = slack piece 0 (seg handles gap after, so shift): recompute properly
keys=["L9","D8","D9","L11"]; wts=[0.35,0.45,0.45,0.7]
slack=88.55-t9-sum(dur[k] for k in keys); g=np.array(wts)/sum(wts)*slack; t=t9
for k,gg in zip(keys,g): t+=gg; start[k]=t; t+=dur[k]
out=[]
print(f"{'реплика':6} {'старт':>7} {'конец':>7} {'зазор':>6}  текст")
prev=None
for k in ORDER:
    s=start[k]; e=s+dur[k]; gap=(s-prev) if prev is not None else 0; prev=e
    txt=T[k].replace("^","").replace(" | "," ")
    print(f"{k:6} {s:7.2f} {e:7.2f} {gap:6.2f}  {txt}")
    words=[dict(w,s=round(w["s"]+s,3),e=round(w["e"]+s,3)) for w in W[k][0]]
    out.append(dict(id=k,spk=SPK[k],start=round(s,3),end=round(e,3),warm=k in WARM,italic=k=="M",words=words,runs=[[round(a+s,3),round(b+s,3)] for a,b in W[k][1]]))
json.dump(out,open("timeline.json","w"),ensure_ascii=False,indent=1)
sw=[w for w in out[13]["words"] if w["w"].startswith("сердечко")][0]
print("сердечко:",sw["s"],sw["e"]," L3b start",start["L3b"]," M start",start["M"]," L11 end",round(start["L11"]+dur["L11"],2))
