W=$1; H=$2; FPS=$3; OUT=$4; CRF=${5:-20}; N=$6; PAR=${7:-2}
export NODE_PATH=$(pwd)/../viz/node_modules
TOT=$(python3 -c "print(int(97.6*$FPS))"); STEP=$(( (TOT+N-1)/N ))
seq 0 $((N-1)) | xargs -P $PAR -I{} bash -c 'i={}; a=$((i*'$STEP')); b=$(( (i+1)*'$STEP' )); [ $b -gt '$TOT' ] && b='$TOT'; node --max-old-space-size=1800 render.js '$W' '$H' '$FPS' raw $a $b 2>/dev/null | ffmpeg -v error -y -f rawvideo -pix_fmt rgba -s '$W'x'$H' -r '$FPS' -i - -c:v libx264 -preset medium -crf '$CRF' -pix_fmt yuv420p -threads 2 seg$i.mp4'
: > segs.txt; for i in $(seq 0 $((N-1))); do echo "file 'seg$i.mp4'" >> segs.txt; done
ffmpeg -v error -y -f concat -safe 0 -i segs.txt -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -t 97.6 -movflags +faststart $OUT
