# sheet.sh dir out.png (до 25 кадров)
d=$1; out=$2; files=$(ls $d/*.png | head -25); n=$(echo "$files" | wc -l)
args=$(echo "$files" | sed 's/^/-i /' | tr '\n' ' '); fc=""; inp=""
for k in $(seq 0 $((n-1))); do fc="$fc[$k:v]scale=324:576,drawtext=fontfile=assets/Montserrat.ttf:text='$k':x=6:y=6:fontsize=22:fontcolor=red[v$k];"; inp="$inp[v$k]"; done
lay=$(python3 -c "print('|'.join(f'{(k%5)*324}_{(k//5)*576}' for k in range($n)))")
ffmpeg -hide_banner -loglevel error -y $args -filter_complex "${fc}${inp}xstack=inputs=$n:layout=$lay:fill=white" -frames:v 1 $out
