#!/usr/bin/env bash
# Render a composition to mp4 with the right GL backend / browser for this machine.
# usage: bash scripts/render.sh <CompositionId> <out.mp4> [extra remotion flags, e.g. --scale 1.3333 --frames 0-89]
set -euo pipefail
ID="${1:?composition id}"; OUT="${2:?out.mp4}"; shift 2
read -r GLB BROWSER < <(node scripts/env.mjs --print)
export REMOTION_TMP="${REMOTION_TMP:-$PWD/.rtmp}"; mkdir -p "$REMOTION_TMP"; export TMPDIR="$REMOTION_TMP" TEMP="$REMOTION_TMP" TMP="$REMOTION_TMP"
CONC="${CONCURRENCY:-$(( $(nproc 2>/dev/null || echo 4) > 4 ? 4 : $(nproc 2>/dev/null || echo 4) ))}"
npx remotion render src/index.ts "$ID" "$OUT" --codec h264 --crf 16 --concurrency "$CONC" --gl="$GLB" --timeout=300000 \
  ${BROWSER:+--browser-executable="$BROWSER"} "$@"
rm -rf "$REMOTION_TMP"/remotion-webpack-bundle-* 2>/dev/null || true
echo "rendered $OUT"
