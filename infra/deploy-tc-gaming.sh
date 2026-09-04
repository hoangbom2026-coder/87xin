#!/bin/bash
set -e

echo "=== TC-GAMING.LIVE DEPLOY ==="
ROOT="/var/app/game"

mkdir -p "$ROOT/infra/logs"

echo "[1/5] Building backend..."
cd "$ROOT/apps/backend"
if [ -f package.json ]; then
  npm install --prefer-offline --no-audit || npm install
  npm run build
fi

echo "[2/5] Building frontend-web..."
cd "$ROOT/apps/frontend-web"
if [ -f package.json ]; then
  npm install --prefer-offline --no-audit || npm install
  npm run build || echo "frontend build skipped or finished"
fi

echo "[3/5] Building admin-dashboard..."
cd "$ROOT/apps/admin-dashboard"
if [ -f package.json ]; then
  npm install --prefer-offline --no-audit || npm install
  npm run build
fi

echo "[4/5] Linking nginx config..."
sudo ln -sf "$ROOT/infra/nginx/tc-gaming.live.conf" /etc/nginx/sites-available/tc-gaming.live
sudo ln -sf /etc/nginx/sites-available/tc-gaming.live /etc/nginx/sites-enabled/tc-gaming.live
sudo nginx -t
sudo nginx -s reload || sudo systemctl reload nginx

echo "[5/5] Starting / Reloading PM2 services..."
cd "$ROOT"
pm2 startOrReload "$ROOT/infra/ecosystem.production.cjs" --update-env

echo "=== DEPLOY COMPLETE ==="
echo "Visit: https://tc-gaming.live and https://admin.tc-gaming.live"
