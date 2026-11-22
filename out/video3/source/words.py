import json,re,difflib,numpy as np,soundfile as sf
TXT="""Мама. | Твой первый друг. | Ты его даже | не ^помнишь. | Она знала тебя ^раньше, | чем ты открыл глаза. | Слышала твоё ^сердце. | Говорила с тобой, | когда ты ещё | не мог ответить. | ^Первая, кто тебя увидела. | ^Первая, кто обняла. | ^Первая, кто сказала: | «Всё ^хорошо». | Хотя сама | очень ^боялась. | Что она умеет? | ^Всё. | Ночью она ^врач. | Днём ^повар. | Когда упал: | «До свадьбы ^заживёт», | и правда заживало. | Она знает, что ты ^голодный, | по твоим шагам. | Знает, что ^соврал, | по голосу. | Знает, что тебе ^плохо, | когда ты говоришь | ^«нормально». | Она учила тебя ^ходить. | Держала за руку. | А потом ^отпустила. | Хотя ей было ^страшно. | Но ты ^вырос. | «Мам, отстань». | «Я сам». | «Потом». | Она ^кивала. | ^Улыбалась. | И уходила на кухню. | Ждать, пока ты | захочешь ^поговорить. | Ты уходишь, | она ^ждёт. | Опаздываешь, | она не ^спит. | Ты не звонишь, | а она смотрит на ^экран. | Друзья приходят | и уходят. | Любовь бывает | и заканчивается. | А она ^единственный человек, | который будет ^ждать тебя | каждый раз, | когда ты уходишь. | Всю ^жизнь. | Она ^ничего не просит. | Только чтобы ты ^вернулся."""
A=json.load(open("words_cut.json"))
A=[a for a in A if not (a[2].startswith("Мама") and 52<a[0]<53)]   # ASR hallucination
norm=lambda w: re.sub(r"[^а-яё0-9]","",w.lower().replace("ё","е"))
can=[]
for ci,ch in enumerate(TXT.split("|")):
    for w in ch.split(): can.append(dict(w=w.lstrip("^"),hl=w.startswith("^") or w.startswith("^«"),chunk=ci))
for c in can:
    if c["w"].startswith("^"): c["w"]=c["w"][1:]
ca=[norm(c["w"]) for c in can]; aa=[norm(a[2]) for a in A]
sm=difflib.SequenceMatcher(a=ca,b=aa,autojunk=False); tm=[None]*len(can)
for tag,i1,i2,j1,j2 in sm.get_opcodes():
    if i2-i1==j2-j1:
        for d in range(i2-i1): tm[i1+d]=A[j1+d][:2]
    elif j2>j1 and i2>i1:
        s,e=A[j1][0],A[j2-1][1]
        for d in range(i2-i1): tm[i1+d]=[s+(e-s)*d/(i2-i1),s+(e-s)*(d+1)/(i2-i1)]
for i in range(len(tm)):
    if tm[i] is None: p=tm[i-1][1]; tm[i]=[p,p+0.25]
x,sr=sf.read("voice_cut.wav");hop=sr//100
e=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x)-hop,hop)]);db=20*np.log10(e);m=db>db.max()-44
for c,(s,e_) in zip(can,tm):
    i=int(s*100)
    if not m[max(0,i-2):i+3].any():
        while i<len(m)-1 and not m[i]: i+=1
        s=min(i/100,e_-0.08)
    c["s"]=round(s,3); c["e"]=round(max(e_,s+0.1),3)
# runs of the cut voice
rr=[];i=0
while i<len(m):
    if m[i]:
        j=i
        while j<len(m) and m[j]: j+=1
        rr.append([i/100,j/100]); i=j
    else: i+=1
oo=[rr[0]]
for a,b in rr[1:]:
    if a-oo[-1][1]<0.2: oo[-1][1]=b
    else: oo.append([a,b])
RS=[a for a,b in oo if b-a>0.1]
prev=-1
groups=[]
for c in can:
    if not groups or groups[-1][0]["chunk"]!=c["chunk"]: groups.append([])
    groups[-1].append(c)
for g in groups:
    s0=g[0]["s"]; cand=[r for r in RS if s0-1.0<=r<=s0+1.3 and r>prev+0.3]
    if cand:
        ns=min(cand,key=lambda r:abs(r-s0)); d=ns-s0
        for w in g: w["s"]=round(w["s"]+d,3); w["e"]=round(w["e"]+d,3)
    prev=g[0]["s"]
chunks=[]
for c in can:
    if not chunks or chunks[-1][0]["chunk"]!=c["chunk"]: chunks.append([])
    chunks[-1].append(c)
json.dump(dict(words=can,chunks=[dict(words=ch) for ch in chunks]),open("timeline.json","w"),ensure_ascii=False,indent=0)
for ch in chunks: print(f"{ch[0]['s']:6.2f} "+" ".join(("*"+w["w"]+"*") if w["hl"] else w["w"] for w in ch))
