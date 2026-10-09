#!/bin/sh
# og/icon.html → favicon.png (64) + apple-touch-icon.png (180), via one 512px render and sips
cd "$(dirname "$0")/.." && d=$(mktemp -d) && \
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$d" --window-size=512,512 --virtual-time-budget=4000 --screenshot="$d/icon.png" "file://$PWD/og/icon.html" >/dev/null 2>&1
sips -z 64 64 "$d/icon.png" --out favicon.png >/dev/null && sips -z 180 180 "$d/icon.png" --out apple-touch-icon.png >/dev/null
rm -rf "$d"; ls -la favicon.png apple-touch-icon.png
