CUTS=[(29.82,31.55,3.05),(38.08,40.04,1.83),(61.19,62.26,1.84)]
def V(v):
    off=0
    for c,r,L in CUTS:
        D=(c+.05+L+.15)-r
        if v>c and v<r: v=r
        if v>=r: off+=D
    return v+off
def clip_starts():
    out=[]; off=0
    for c,r,L in CUTS:
        out.append(c+off+.05); off+=(c+.05+L+.15)-r
    return out
