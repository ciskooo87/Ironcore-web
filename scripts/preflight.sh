#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/10] Checking required files..."
for f in .env.example docs/RELEASE_CHECKLIST.md docs/GO_LIVE_QUICKSTART.md; do
  [[ -f "$f" ]] || { echo "Missing $f"; exit 1; }
done

if [[ ! -f .env ]]; then
  echo "WARN: .env not found (copy .env.example -> .env)"
fi

echo "[2/8] Node + npm versions"
node -v
npm -v

echo "[3/10] Install deps"
npm ci >/dev/null

echo "[4/10] Build"
npm run build >/dev/null
[[ -d .next ]] || { echo "Missing .next after build"; exit 1; }

echo "[5/10] Check migration files"
ls -1 db/migrations/*.sql

echo "[6/10] Validate required env vars"
required_missing=0
for key in DATABASE_URL APP_PUBLIC_URL; do
  if [[ -z "${!key:-}" ]]; then
    echo "ERROR: $key is empty"
    required_missing=$((required_missing+1))
  fi
done
(( required_missing == 0 )) || { echo "Required env vars missing: $required_missing"; exit 1; }

echo "[7/10] Validate optional integration env vars (non-blocking)"
missing=0
for key in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID WHATSAPP_WEBHOOK_URL SMTP_HOST SMTP_USER SMTP_PASS SMTP_TO; do
  if [[ -z "${!key:-}" ]]; then
    echo "WARN: $key is empty"
    missing=$((missing+1))
  fi
done

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[8/10] DB connectivity check"
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -c 'select now();' >/dev/null && echo "DB OK" || { echo "DB check failed"; exit 1; }
  else
    echo "WARN: psql not installed, skipping DB check"
  fi
else
  echo "[8/10] DB connectivity check skipped (DATABASE_URL missing)"
fi

echo "[9/10] Service path sanity (non-blocking)"
if command -v systemctl >/dev/null 2>&1; then
  systemctl cat ironcore-web.service >/tmp/ironcore-web.service.preflight 2>/dev/null || true
  if [[ -f /tmp/ironcore-web.service.preflight ]]; then
    grep -q '/home/openclaw/.openclaw/workspace/Ironcore-web' /tmp/ironcore-web.service.preflight \
      && echo "Service WorkingDirectory looks correct" \
      || echo "WARN: service file does not contain official Ironcore-web path"
  fi
fi

echo "[10/10] Summary"
echo "Preflight done. Missing optional integration env count: $missing"
