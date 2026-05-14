#!/usr/bin/env bash
set -euo pipefail
cd /home/openclaw/.openclaw/workspace/Ironcore-web
mkdir -p .next/server
[ -f .next/BUILD_ID ] || { echo 'missing .next/BUILD_ID'; exit 1; }
[ -f .next/prerender-manifest.json ] || { echo 'missing .next/prerender-manifest.json'; exit 1; }
[ -f .next/server/middleware-manifest.json ] || printf '{}' > .next/server/middleware-manifest.json
