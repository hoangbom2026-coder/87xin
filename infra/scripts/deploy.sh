#!/bin/bash
# =============================================================================
# TC-GAMING DEPLOY SCRIPT — An toàn, tuần tự, zero-downtime (symlink)
# VPS: 4 CPU / 8 GB RAM
# Cách dùng: sudo bash /var/app/game/infra/scripts/deploy.sh
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# 0. Biến cấu hình
# ---------------------------------------------------------------------------
REPO_ROOT="/var/app/game"
RELEASES_DIR="/var/app/releases"
CURRENT_LINK="/var/app/current"
LOG_FILE="/var/log/tc-gaming-deploy.log"
NGINX_CONF="$REPO_ROOT/infra/nginx/tc-gaming.live.conf"
ECOSYSTEM="$REPO_ROOT/infra/ecosystem.production.cjs"
WEB_DIST="$REPO_ROOT/apps/frontend-web/dist"
API_HEALTH="http://127.0.0.1:8701/health"

# ---------------------------------------------------------------------------
# 1. Hàm tiện ích
# ---------------------------------------------------------------------------
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
err() { log "❌ ERROR: $*"; exit 1; }

require_cmd() { command -v "$1" &>/dev/null || err "Lệnh '$1' chưa được cài đặt."; }
require_cmd pm2
require_cmd nginx
require_cmd node
require_cmd npm

# ---------------------------------------------------------------------------
# 2. Kiểm tra tài nguyên trước khi deploy
# ---------------------------------------------------------------------------
log "🔍 Kiểm tra tài nguyên VPS..."

CPU_IDLE=$(top -bn1 | grep -E "^(%Cpu|Cpu)" | awk '{print $8}' | cut -d. -f1)
CPU_USAGE=$((100 - ${CPU_IDLE:-100}))
MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_USED=$(free -m  | awk '/^Mem:/{print $3}')
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))

log "  CPU đang dùng: ${CPU_USAGE}%  |  RAM: ${MEM_USED}/${MEM_TOTAL} MB (${MEM_PCT}%)"

if [ "$CPU_USAGE" -gt 70 ]; then
    log "⚠️  CPU cao (${CPU_USAGE}%) — đợi 2 phút cho hệ thống hạ nhiệt..."
    sleep 120
fi

if [ "$MEM_PCT" -gt 80 ]; then
    log "⚠️  RAM cao (${MEM_PCT}%) — đợi 1 phút..."
    sleep 60
fi

# ---------------------------------------------------------------------------
# 3. Tạo thư mục release mới (timestamp)
# ---------------------------------------------------------------------------
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"
mkdir -p "$RELEASE_DIR" "$RELEASES_DIR"
log "📁 Release mới: $RELEASE_DIR"

# ---------------------------------------------------------------------------
# 4. Build tuần tự (không song song) — 4a: Backend
# ---------------------------------------------------------------------------
log "▶ [1/3] Build backend..."
cd "$REPO_ROOT/apps/backend"
# Dùng npm ci --omit=dev để KHÔNG cài devDependencies (~80MB tiết kiệm)
# Nếu chưa có package-lock.json hợp lệ, fallback sang npm install
npm ci --omit=dev --prefer-offline --no-audit --loglevel=error 2>/dev/null || \
    npm install --omit=dev --prefer-offline --no-audit --loglevel=error
# Dev deps cần cho build (tsc, tsc-alias) — cài riêng tạm thời
npm install --save-dev typescript tsc-alias rimraf --prefer-offline --no-audit --loglevel=error 2>/dev/null || true
npm run build
# Copy build artifact vào release dir
cp -r dist/ "$RELEASE_DIR/api-dist/"
cp package.json package-lock.json "$RELEASE_DIR/"
log "✅ Backend build xong."

# ---------------------------------------------------------------------------
# 4b: Frontend-web
# ---------------------------------------------------------------------------
log "▶ [2/3] Build frontend-web..."
cd "$REPO_ROOT/apps/frontend-web"
npm install --prefer-offline --no-audit --loglevel=error
npm run build
log "✅ Frontend-web build xong."

# ---------------------------------------------------------------------------
# 4c: Admin-dashboard
# ---------------------------------------------------------------------------
log "▶ [3/3] Build admin-dashboard..."
cd "$REPO_ROOT/apps/admin-dashboard"
npm install --prefer-offline --no-audit --loglevel=error
npm run build
log "✅ Admin-dashboard build xong."

# ---------------------------------------------------------------------------
# 5. Reload nginx (kiểm tra trước)
# ---------------------------------------------------------------------------
log "🔗 Cập nhật Nginx config..."
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-available/tc-gaming.live
sudo ln -sf /etc/nginx/sites-available/tc-gaming.live /etc/nginx/sites-enabled/tc-gaming.live
sudo nginx -t || err "Nginx config lỗi — deploy bị hủy."
sudo nginx -s reload || sudo systemctl reload nginx
log "✅ Nginx đã reload."

# ---------------------------------------------------------------------------
# 6. Deploy API (pm2 reload — không restart, zero-downtime)
# ---------------------------------------------------------------------------
log "🚀 Reload PM2 API..."
cd "$REPO_ROOT"
pm2 startOrReload "$ECOSYSTEM" --update-env 2>&1 | tee -a "$LOG_FILE"

# ---------------------------------------------------------------------------
# 7. Health check API (retry 5 lần, mỗi lần cách 3s)
# ---------------------------------------------------------------------------
log "🏥 Kiểm tra health API..."
RETRY=0
until curl -sf "$API_HEALTH" > /dev/null; do
    RETRY=$((RETRY + 1))
    [ $RETRY -ge 5 ] && err "API không phản hồi sau 15s — rollback ngay!"
    log "  ↻ Chờ API sẵn sàng... lần $RETRY/5"
    sleep 3
done
log "✅ API health OK."

# ---------------------------------------------------------------------------
# 8. Cập nhật symlink /var/app/current → release mới
# ---------------------------------------------------------------------------
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
log "🔗 Symlink current → $RELEASE_DIR"

# ---------------------------------------------------------------------------
# 9. Xóa release cũ hơn 3 ngày (giữ tối thiểu 2 bản gần nhất)
# ---------------------------------------------------------------------------
RELEASE_COUNT=$(find "$RELEASES_DIR" -maxdepth 1 -type d | grep -c "[0-9]" || true)
if [ "$RELEASE_COUNT" -gt 2 ]; then
    find "$RELEASES_DIR" -maxdepth 1 -type d -mtime +3 -exec rm -rf {} \; 2>/dev/null || true
    log "🗑️  Đã dọn release cũ (giữ 2 bản gần nhất)."
fi

# ---------------------------------------------------------------------------
# 10. Tóm tắt
# ---------------------------------------------------------------------------
log "=================================================="
log "✅ DEPLOY THÀNH CÔNG — $TIMESTAMP"
log "   Frontend : https://tc-gaming.live"
log "   Admin    : https://admin.tc-gaming.live"
log "   API      : http://127.0.0.1:8701/health"
log "=================================================="
pm2 list
