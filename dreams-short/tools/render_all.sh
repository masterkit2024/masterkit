#!/bin/bash
# usage: render_all.sh outdir  -> 3 parallel chunks then concat + mux
cd "$(dirname "$0")/.."; OUT=$1; mkdir -p $OUT
node tools/render.js $OUT/a.mp4 0 930 & node tools/render.js $OUT/b.mp4 930 1860 & node tools/render.js $OUT/c.mp4 1860 2790 & wait
printf "file 'a.mp4'\nfile 'b.mp4'\nfile 'c.mp4'\n" > $OUT/list.txt
