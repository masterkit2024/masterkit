#!/bin/bash
# renders each scene to its own segment (2 parallel workers). usage: render_all.sh outdir [scene indices...]
cd "$(dirname "$0")/.."
OUT=$1; shift; mkdir -p $OUT
BOUNDS=(0 3.72 10.02 13.27 19.10 23.20 28.05 34.62 39.45 53.30 63.40 71.45 76.0)
SC=${@:-0 1 2 3 4 5 6 7 8 9 10 11}
job(){ i=$1; a=$(python3 -c "import math;print(math.ceil(${BOUNDS[$i]}*60-1e-6))"); b=$(python3 -c "import math;print(math.ceil(${BOUNDS[$((i+1))]}*60-1e-6))"); node tools/render.js $OUT/seg$(printf %02d $i).mp4 $a $b; }
export -f job; export OUT; export BOUNDS_STR="${BOUNDS[*]}"
for i in $SC; do echo $i; done | xargs -P 2 -I{} bash -c 'BOUNDS=($BOUNDS_STR); i={}; a=$(python3 -c "import math;print(math.ceil(${BOUNDS[$i]}*60-1e-6))"); b=$(python3 -c "import math;print(math.ceil(${BOUNDS[$((i+1))]}*60-1e-6))"); node tools/render.js $OUT/seg$(printf %02d $i).mp4 $a $b'
