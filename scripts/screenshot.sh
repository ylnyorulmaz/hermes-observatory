#!/bin/bash
set -e
cd /root/wt-obs-p3
mkdir -p docs
# Screenshot the running app (live data). Full viewport, wait for JS.
/usr/bin/google-chrome --headless=new --disable-gpu --no-sandbox \
  --hide-scrollbars --window-size=1440,1000 \
  --virtual-time-budget=6000 \
  --screenshot=/root/wt-obs-p3/docs/stage.png \
  http://localhost:5180/ 2>/tmp/chrome-shot.log || true
ls -la docs/stage.png
cat /tmp/chrome-shot.log | tail -5
