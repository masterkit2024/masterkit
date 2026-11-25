# Ручные правки выравнивания: (первое слово, последнее слово, начало, конец)
import json
V=set('аеёиоуыэюяАЕЁИОУЫЭЮЯ')
w=json.load(open('voice/words.json'))
FIX=[(207,210,102.40,104.61),(211,213,105.10,106.50),(214,219,106.97,108.81)]
for a,b,t0,t1 in FIX:
    syl=[max(1,sum(c in V for c in w[k]['w']))+0.6 for k in range(a,b+1)]; tot=sum(syl); t=t0
    for k,s in zip(range(a,b+1),syl):
        d=(t1-t0)*s/tot; w[k]['s']=round(t,2); w[k]['e']=round(t+d,2); t+=d
json.dump(w,open('voice/words.json','w'),ensure_ascii=False,indent=0)
