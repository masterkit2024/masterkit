import json,re,sys
sc=json.load(open('script.json'))
def sil(i):
    v=[float(x.split()[1]) for x in open(f'sil{i}.txt')]
    pairs=[(v[k],v[k+1] if k+1<len(v) else None) for k in range(0,len(v),2)]
    return pairs
import subprocess
def dur(i): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'a{i}.wav']))
out=[]
for si,s in enumerate(sc,1):
    D=dur(si); P=sil(si)
    gaps=[]  # internal gaps (start,end)
    lead=0; tail=D
    for a,b in P:
        if b is None: b=D
        if a<=0.01: lead=b; continue
        if b>=D-0.01: tail=a; continue
        gaps.append((a,b))
    text=' '.join(s['paras'])
    # sentences, keep paragraph breaks as strong boundaries
    sents=[]
    for pi,p in enumerate(s['paras']):
        for x in re.split(r'(?<=[.!?…])\s+',p):
            if x.strip(): sents.append(x.strip())
    N=len(sents)
    w=[len(re.sub(r'[^\wё]','',x,flags=re.I))+3 for x in sents]
    tot=sum(w); cum=[sum(w[:k+1])/tot for k in range(N)]
    # speech-time mapping
    def sp(t):
        r=t-lead
        for a,b in gaps:
            if b<=t: r-=(b-a)
            elif a<t: r-=(t-a)
        return r
    S=sp(tail)
    G=len(gaps)
    gs=[sp(a) for a,b in gaps]; gd=[b-a for a,b in gaps]
    INF=1e18
    # dp[i][j]: boundary i (after sentence i) assigned to gap j ; or j=-1 none
    # allow boundaries with no gap -> 'virtual' with penalty
    import functools
    sys.setrecursionlimit(10000)
    import math
    @functools.lru_cache(None)
    def f(i,j,prev):
        # prev: speech-time of previous boundary (rounded) or None
        if i==N-1:
            c=sum(gd[j:])*1.5
            if prev is not None:
                d=S-prev; e=w[i]/tot*S
                c+=10*math.log(max(d,0.05)/e)**2
            return (c,())
        best=(INF,())
        exp=cum[i]*S
        c,p=f(i+1,j,None); c+=8.0
        if c<best[0]: best=(c,(None,)+p)
        skip=0.0
        for k in range(j,G):
            if gs[k]-exp>15: break
            cost=((gs[k]-exp)/1.5)**2*0.5 + skip - gd[k]*1.5
            if prev is not None or i==0:
                pv=prev if prev is not None else 0.0
                d=gs[k]-pv; e=w[i]/tot*S
                cost+=10*math.log(max(d,0.05)/e)**2
            c,p=f(i+1,k+1,round(gs[k],3)); c+=cost
            if c<best[0]: best=(c,(k,)+p)
            skip+=gd[k]*1.5
        return best
    c,assign=f(0,0,None)
    # build sentence times
    bounds=[]
    for i,k in enumerate(assign):
        if k is None: bounds.append(None)
        else: bounds.append(gaps[k])
    starts=[lead]; ends=[]
    for i in range(N-1):
        b=bounds[i]
        if b is None:
            # interpolate later
            ends.append(None); starts.append(None)
        else:
            ends.append(b[0]); starts.append(b[1])
    ends.append(tail)
    # fill None by proportional interpolation within known spans
    # simple fill: walk groups
    i=0
    while i<N:
        j=i
        while j<N-1 and ends[j] is None: j+=1
        # sentences i..j share span starts[i]..ends[j]
        t0,t1=starts[i],ends[j]; ww=sum(w[i:j+1]); acc=t0
        for k in range(i,j+1):
            d=(t1-t0)*w[k]/ww
            starts[k]=acc; ends[k]=acc+d; acc+=d
        i=j+1
    words=[]
    for k,x in enumerate(sents):
        toks=x.split()
        # internal gaps within sentence
        a0,a1=starts[k],ends[k]
        ig=[g for g in gaps if g[0]>a0+0.05 and g[1]<a1-0.05]
        segs=[];t=a0
        for g in ig: segs.append((t,g[0])); t=g[1]
        segs.append((t,a1))
        segl=sum(b-a for a,b in segs)
        cw=[len(re.sub(r'[^\wё]','',y,flags=re.I))+1.5 for y in toks]; T=sum(cw); acc=0
        def mp(fr):
            r=fr*segl
            for a,b in segs:
                if r<=b-a+1e-9: return a+r
                r-=b-a
            return segs[-1][1]
        for y,cc in zip(toks,cw):
            words.append({'w':y,'t0':round(mp(acc/T),3),'t1':round(mp((acc+cc)/T),3),'s':k}); acc+=cc
    out.append({'scene':si,'dur':D,'sents':[{'text':x,'t0':round(starts[k],3),'t1':round(ends[k],3)} for k,x in enumerate(sents)],'words':words,'unassigned':sum(1 for b in bounds if b is None),'gaps':G})
    print(si,'sents',N,'gaps',G,'nogap',sum(1 for b in bounds if b is None))
json.dump(out,open('timing.json','w'),ensure_ascii=False,indent=0)
