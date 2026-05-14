#!/usr/bin/env bash
set -euo pipefail
cd /home/openclaw/.openclaw/workspace/Ironcore-web
npx next build --webpack
./scripts/ensure-next-artifacts.sh
sudo systemctl restart ironcore-web.service
sleep 5
systemctl --no-pager --full status ironcore-web.service | sed -n '1,20p'
