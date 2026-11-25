#!/usr/bin/env bash
# Create a ready-to-render Remotion project with the style engine.
# usage: bash <skill>/templates/scripts/setup.sh <project_dir> [new_video_name]
#   new_video_name: also creates src/videos/<name>/video.ts from the time machine example (registered in Root.tsx by hand)
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="${1:?project dir}"; NAME="${2:-}"
mkdir -p "$DIR/src/engine" "$DIR/src/videos" "$DIR/scripts" "$DIR/public/materials" "$DIR/out" "$DIR/audio"
cp -n "$SKILL/templates/project/package.json" "$SKILL/templates/project/tsconfig.json" "$DIR/"
cp -n "$SKILL/templates/project/src/index.ts" "$SKILL/templates/project/src/Root.tsx" "$DIR/src/"
cp "$SKILL/templates/engine/"* "$DIR/src/engine/"
cp -rn "$SKILL/templates/videos/"* "$DIR/src/videos/"
cp "$SKILL/templates/scripts/"* "$DIR/scripts/"
cp -n "$SKILL/templates/audio/"* "$DIR/audio/"
if [ -n "$NAME" ] && [ ! -e "$DIR/src/videos/$NAME" ]; then
  mkdir -p "$DIR/src/videos/$NAME" && cp "$SKILL/templates/videos/timemachine/video.ts" "$DIR/src/videos/$NAME/video.ts"
fi
cd "$DIR"
npm install --no-audit --no-fund
npx tsc --noEmit
echo "OK: project ready in $DIR"
echo "Smoke test: node scripts/stills.mjs TimeMachine out/test_ 40,140,225 0.5   (compare with <skill>/references/frames/timemachine/)"
