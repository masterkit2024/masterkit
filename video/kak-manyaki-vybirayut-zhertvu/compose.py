import json,numpy as np,wave,re
T=json.load(open('timing.json'))
SR=48000
def rd(p):
    w=wave.open(p); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768; return a
LEAD=1.2; GAP={1:1.3,2:1.3,3:1.4,4:1.4,5:1.4,6:1.4,7:3.2}; TAIL=13.0
# pauses: (scene, sentence startswith) -> seconds
PAUSE={(3,'Убийства продолжились'):1.4,(6,'Примерно через полчаса'):1.3,(8,'Ответ оказался простым'):1.6,(4,'Совпало'):0.6,(8,'Совпало'):0.6}
out=[];voice=[];t=LEAD;words=[];sents=[];scenes=[]
voice.append(np.zeros(int(LEAD*SR),np.float32))
for s in T:
    a=rd(f"a{s['scene']}.wav")
    # cut points
    cuts=[]
    for k,x in enumerate(s['sents']):
        for (sc,st),d in PAUSE.items():
            if sc==s['scene'] and x['text'].startswith(st):
                prev=s['sents'][k-1]['t1'] if k>0 else 0
                cuts.append(((prev+x['t0'])/2,d))
    cuts.sort()
    def shift(tt):
        return sum(d for c,d in cuts if c<=tt)
    pos=0
    for c,d in cuts:
        voice.append(a[int(pos*SR):int(c*SR)]); voice.append(np.zeros(int(d*SR),np.float32)); pos=c
    voice.append(a[int(pos*SR):])
    total=s['dur']+sum(d for c,d in cuts)
    scenes.append({'n':s['scene'],'t0':round(t,3),'t1':round(t+total,3)})
    for x in s['sents']: sents.append({'s':s['scene'],'text':x['text'],'t0':round(t+x['t0']+shift(x['t0']),3),'t1':round(t+x['t1']+shift(x['t0']),3)})
    for w in s['words']: words.append({'s':s['scene'],'w':w['w'],'t0':round(t+w['t0']+shift(w['t0']),3),'t1':round(t+w['t1']+shift(w['t0']),3)})
    t+=total
    g=GAP.get(s['scene'],TAIL)
    voice.append(np.zeros(int(g*SR),np.float32)); t+=g
v=np.concatenate(voice)
v=(np.clip(v,-1,1)*32767).astype(np.int16)
w=wave.open('voice.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(v.tobytes()); w.close()
D=len(v)/SR
json.dump({'dur':round(D,3),'scenes':scenes,'sents':sents,'words':words},open('timeline.json','w'),ensure_ascii=False)
open('timeline.js','w').write('window.TL='+json.dumps({'dur':round(D,3),'scenes':scenes,'sents':sents,'words':words},ensure_ascii=False)+';')
print(D,scenes)
