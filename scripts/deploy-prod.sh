#!/usr/bin/env bash
set -euo pipefail
cd /home/openclaw/.openclaw/workspace/Ironcore-web
npx next build --webpack
test -f .next/BUILD_ID
test -f .next/server/middleware-manifest.json
test -f .next/prerender-manifest.json
sudo systemctl restart ironcore-web.service
sleep 5
systemctl --no-pager --full status ironcore-web.service | sed -n '1,20p'
