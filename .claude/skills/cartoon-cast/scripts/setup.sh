#!/usr/bin/env bash
# Разворачивает риг персонажей в проект.
#   bash setup.sh <папка-проекта> [--no-install]
# Создаёт <папка>/characters, remotion, preview и (если их нет) package.json/tsconfig.json.
# Существующие файлы персонажей перезаписываются только с флагом --force.
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?укажите папку проекта}"
INSTALL=1; FORCE=0
for a in "${@:2}"; do
  case "$a" in --no-install) INSTALL=0 ;; --force) FORCE=1 ;; esac
done
mkdir -p "$TARGET"
copy_dir() {
  local name="$1"
  if [ -d "$TARGET/$name" ] && [ "$FORCE" = 0 ]; then
    echo "• $name/ уже есть — пропускаю (используйте --force для перезаписи)"
  else
    mkdir -p "$TARGET/$name" && cp -R "$SKILL_DIR/assets/$name/." "$TARGET/$name/"
    echo "✓ $name/"
  fi
}
copy_dir characters
copy_dir remotion
copy_dir preview
for f in package.json tsconfig.json .gitignore; do
  if [ -f "$TARGET/$f" ]; then
    echo "• $f уже есть — не трогаю (нужны зависимости: react, react-dom, esbuild, typescript, @types/react; для Remotion — remotion)"
  else
    cp "$SKILL_DIR/assets/$f" "$TARGET/$f" && echo "✓ $f"
  fi
done
if [ "$INSTALL" = 1 ] && [ -f "$TARGET/package.json" ]; then
  (cd "$TARGET" && npm install --silent && echo "✓ npm install")
fi
echo "Готово. Превью: (cd $TARGET && npm run preview && node preview/check.cjs)"
