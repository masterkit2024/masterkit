import json,re,numpy as np,soundfile as sf
W=json.load(open("words_raw.json"))
FIX={"грызнульками.":"грязнульками.","интерната":"интернета","через":"Через","Возвыпускает":"ВОЗ выпускает","снова":"с нового","00001.":"00:01.","спушь?":"спишь?","Пикап":"Пикап-гуру","10":"10"}
out=[]
for s,e,w,p in W:
    if w=="-гуру": continue
    if w=="-то": out[-1]["w"]+="-то"; out[-1]["e"]=e; continue
    if w=="через" and s>29: w="Через"
    w=FIX.get(w,w)
    if w=="грязнульками.": pass
    parts=w.split(" ")
    if len(parts)>1:
        d=(e-s)/len(parts)
        for i,pp in enumerate(parts): out.append(dict(w=pp,s=s+d*i,e=s+d*(i+1)))
    else: out.append(dict(w=w,s=s,e=e))
# snap starts that fall in silence to the next voiced run
x,sr=sf.read("audio/voice.wav");hop=sr//100
e=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x)-hop,hop)]);db=20*np.log10(e);m=db>db.max()-42
def voiced(t): i=int(t*100); return 0<=i<len(m) and m[max(0,i-2):i+3].any()
for wd in out:
    if not voiced(wd["s"]):
        i=int(wd["s"]*100)
        while i<len(m)-1 and not m[i]: i+=1
        wd["s"]=min(i/100,wd["e"]-0.08)
    wd["s"]=round(wd["s"],3); wd["e"]=round(wd["e"],3)
KEY=["пикап","полночь","24","грязнульк","миллиард","тиндер","падает","планировали","минута","пустеют","10","раз","чаевые","сердца","гуру","зал","методичк","50","парнем","ночи","очередь","понедельник","плачет","такой","второго","утро","мамы","где","работе","5","горит","бывшие","тебе","заблокировал","нового","полдень","воз","девять","роддом","вечер","лагеря","дома","лавочке","ноль","написал","мама","закончилось","вчера","помнит","телефон","00:01","спишь","рядом","читаешь","отвечаешь","притворяешься","комментариях","звонит","девушки"]
norm=lambda w: re.sub(r"[^а-яёa-z0-9:]","",w.lower())
# chunks: phrases at punctuation/pauses, long phrases split into balanced groups of 2-4 words
import math
phr=[];cur=[]
for i,wd in enumerate(out):
    cur.append(i)
    br=bool(re.search(r"[.,!?]$",wd["w"])) or (i+1<len(out) and out[i+1]["s"]-wd["e"]>0.4)
    if br: phr.append(cur); cur=[]
if cur: phr.append(cur)
chunks=[]
for p in phr:
    n=len(p); g=math.ceil(n/4)
    sizes=[n//g+(1 if k<n%g else 0) for k in range(g)]
    k=0
    for sz in sizes: chunks.append(p[k:k+sz]); k+=sz
CH=[]
for c in chunks:
    hl=next((j for j in c if re.search(r"\d",out[j]["w"])),None)
    for j in ([] if hl is not None else c):
        if any(norm(out[j]["w"]).startswith(k) for k in KEY): hl=j; break
    CH.append(dict(words=[dict(out[j],hl=(j==hl)) for j in c]))
json.dump(dict(words=out,chunks=CH),open("timeline.json","w"),ensure_ascii=False,indent=0)
for c in CH: print(f"{c['words'][0]['s']:6.2f} "+" ".join(("*"+w["w"].upper()+"*") if w["hl"] else w["w"] for w in c["words"]))
