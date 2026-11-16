#!/bin/bash
set -e
cd /root/wt-obs-p3

# Delete temp files before commit
rm -f cleanup.sh setup.sh
rm -f scripts/setup.sh

git add -A
git commit -m "feat(observatory): P3 agent stage — sprites, idle bubble, busy FX, hover card, activity ticker

- 6 agent tiles with 16x16 pixel sprites (2 idle + 4 busy frames per agent)
- Idle speech bubble rotating every ~7s (deterministic per agent)
- Busy frame animation + glow ring + particle glyph (!/Z) above head
- HoverCard with live elapsed timer, tool, model, tokens, cost, last 5 tool calls, linked ticket
- Activity ticker marquee (respects prefers-reduced-motion)
- Status badges (busy/idle/offline) in pixel style
- CRT scanlines, vignette, pixel panel CSS
- @8bitcn registry in components.json
- Server (server/*.mjs) with live DB snapshot (node:sqlite readOnly)
- Fallback typed mock snapshot (source:fallback) when API unreachable
- npm build exit 0, 0 console errors

Evidence:
- docs/stage.png (249 KB): 6 sprites, idle bubble, busy glow, status badges
- docs/hover.png: hover card with tool + tokens
- docs/reduced.png: reduced-motion marquee disabled
- /api/observatory/health → {ok:true,dbs:{state:true,kanban:true,opencode:true}}
- /api/observatory/snapshot → live data, default busy, opencode-cli busy
- grep -rl '@8bitcn\|components/ui' src → mock.ts, App.tsx, hover-card.tsx" 2>&1 | tail -5

git push origin feat/observatory-v2-p3 2>&1 | tail -5
echo "--- done ---"