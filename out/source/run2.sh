W=$1; H=$2; OUT=$3; CRF=${4:-18}; TOT=2670; N=8; STEP=$(( (TOT+N-1)/N ))
seq 0 $((N-1)) | xargs -P 2 -I{} bash -c 'i={}; a=$((i*'$STEP')); b=$(( (i+1)*'$STEP' )); [ $b -gt '$TOT' ] && b='$TOT'; node --max-old-space-size=1500 render2.js '$W' '$H' raw $a $b 2>/dev/null | ffmpeg -v error -y -f rawvideo -pix_fmt rgba -s '$W'x'$H' -r 30 -i - -c:v libx264 -preset medium -crf '$CRF' -pix_fmt yuv420p -threads 2 seg$i.mp4'
: > segs.txt; for i in $(seq 0 $((N-1))); do echo "file 'seg$i.mp4'" >> segs.txt; done
ffmpeg -v error -y -f concat -safe 0 -i segs.txt -i ../mix2.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -t 89 -movflags +faststart $OUT
