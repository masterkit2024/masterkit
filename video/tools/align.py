"""Выравнивание текста сценария по паузам в озвучке (без ASR-модели).
voice.wav + script.txt -> words.json [{w,s,e}]"""
import json, re, sys, numpy as np, soundfile as sf
wav, txt, out = sys.argv[1:4]
x, sr = sf.read(wav); hop = int(sr*0.01)
rms = np.sqrt(np.convolve(x**2, np.ones(hop*3)/(hop*3), 'same')[::hop])
db = 20*np.log10(rms+1e-9); thr = max(db.max()-42, np.percentile(db, 10)+8)
sp = db > thr
# silences >= 0.18 s
sil=[]; i=0; N=len(sp)
while i<N:
    if not sp[i]:
        j=i
        while j<N and not sp[j]: j+=1
        if (j-i)>=18 or i==0 or j==N: sil.append((i/100, j/100))
        i=j
    else: i+=1
if sil[0][0]>0: sil.insert(0,(0,0))
if sil[-1][1]<N/100: sil.append((N/100,N/100))
lead, tail = sil[0], sil[-1]; inner = sil[1:-1]
words = open(txt,encoding='utf8').read().split()
V = set('аеёиоуыэюяАЕЁИОУЫЭЮЯ')
syl = np.array([max(1,sum(c in V for c in w))+0.6 for w in words])
punct = [ (2 if re.search(r'[.!?…]$',w) else 1 if re.search(r'[,:—]$',w) else 0) for w in words]
for k in range(len(words)-1):
    if words[k+1] in ('—',): punct[k]=max(punct[k],1)
W=len(words); cs=np.concatenate([[0],np.cumsum(syl)])
starts=[lead[1]]+[s[1] for s in inner]; ends=[s[0] for s in inner]+[tail[0]]
speech=sum(e-s for s,e in zip(starts,ends))
rate=speech/cs[-1]
def bcost(k,L):
    p=punct[k]; return [3.0+6*L,0.4,0.0][p] - (0.3*L if p==2 else 0)
n=len(inner); INF=1e18
# dp over silences; state = word index after which silence placed (k: words 0..k before)
# allow skipping a silence (merged) with cost
for it in range(3):
    dp=np.full((n+1,W),INF); bp=np.full((n+1,W,2),-1,int)
    # virtual start: silence -1 after word -1
    def seg(a,b,t0,t1):  # words a..b inclusive spoken in t0..t1
        if b<a: return INF
        d=t1-t0; e=rate*(cs[b+1]-cs[a]); return 4*np.log(max(d,0.05)/e)**2
    prev={(-1,-1):0.0}; prev_t={}
    # straightforward: f[i][k] silence i placed after word k; previous placed silence p<i
    best=[dict() for _ in range(n)]
    for i,(s0,s1) in enumerate(inner):
        L=s1-s0
        for k in range(W-1):
            c0=bcost(k,L); cands=[]
            # previous placed = start
            skipc=sum(1.0+8*(inner[m][1]-inner[m][0]) for m in range(0,i))
            if skipc<50: cands.append((seg(0,k,lead[1],s0)+skipc+c0,(-1,-1)))
            for p in range(max(0,i-4),i):
                skipc=sum(1.0+8*(inner[m][1]-inner[m][0]) for m in range(p+1,i))
                for kk,v in best[p].items():
                    if kk<k: cands.append((v+seg(kk+1,k,inner[p][1],s0)+skipc+c0,(p,kk)))
            if cands:
                v,b=min(cands); best[i][k]=v; bp[i,k]=b
        # prune
        if best[i]:
            m=min(best[i].values()); best[i]={k:v for k,v in best[i].items() if v<m+25}
    fin=[]
    for p in range(max(0,n-5),n):
        skipc=sum(1.0+8*(inner[m][1]-inner[m][0]) for m in range(p+1,n))
        for kk,v in best[p].items():
            fin.append((v+seg(kk+1,W-1,inner[p][1],tail[0])+skipc,(p,kk)))
    tot,(p,kk)=min(fin)
    chain=[]
    while p>=0: chain.append((p,kk)); p,kk=bp[p,kk]
    chain=chain[::-1]
    # build chunks
    bounds=[(-1,lead[1])]+[(k,inner[p][0],inner[p][1]) for p,k in chain]
    chunks=[]; a=0; t0=lead[1]
    for p,k in chain:
        chunks.append((a,k,t0,inner[p][0])); a=k+1; t0=inner[p][1]
    chunks.append((a,W-1,t0,tail[0]))
    rate=sum(c[3]-c[2] for c in chunks)/cs[-1]
out_w=[]
for a,b,t0,t1 in chunks:
    tot=cs[b+1]-cs[a]; t=t0
    for k in range(a,b+1):
        d=(t1-t0)*syl[k]/tot; out_w.append({"w":words[k],"s":round(t,2),"e":round(t+d,2)}); t+=d
json.dump(out_w,open(out,'w'),ensure_ascii=False,indent=0)
print("cost",round(tot,1),"chunks",len(chunks),"silences",n,"rate",round(rate,3))
for a,b,t0,t1 in chunks: print(f"{t0:6.2f}-{t1:6.2f} r={(t1-t0)/(cs[b+1]-cs[a]):.3f} | {' '.join(words[a:b+1])}")
