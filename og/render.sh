#!/bin/sh
# render og/card.html → og.png (1200x630), the image link previews show. run after the headline or numbers change.
cd "$(dirname "$0")/.." && d=$(mktemp -d) && \
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$d" --window-size=1200,630 --virtual-time-budget=4000 --screenshot=og.png "file://$PWD/og/card.html" >/dev/null 2>&1
rm -rf "$d"; ls -la og.png
