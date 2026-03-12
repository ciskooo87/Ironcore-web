#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/openclaw/.openclaw/workspace/Ironcore-web"
SERVICE="ironcore-web.service"
HEALTH_URL="http://127.0.0.1:3001/"
TIMEOUT_SECONDS=45

cd "$APP_DIR"

echo "[deploy] git rev: $(git rev-parse --short HEAD)"
echo "[deploy] building production bundle..."
npm run build

echo "[deploy] reloading systemd units..."
sudo systemctl daemon-reload

echo "[deploy] restarting ${SERVICE}..."
sudo systemctl restart "$SERVICE"

started_at=$(date +%s)
while true; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "[deploy] healthcheck ok: $HEALTH_URL"
    break
  fi

  now=$(date +%s)
  if (( now - started_at >= TIMEOUT_SECONDS )); then
    echo "[deploy] healthcheck failed after ${TIMEOUT_SECONDS}s" >&2
    sudo systemctl status "$SERVICE" --no-pager || true
    exit 1
  fi

  sleep 1
done

echo "[deploy] done"
