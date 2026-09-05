#!/bin/bash
# =============================================================================
# TC-GAMING ROLLBACK SCRIPT
# Cách dùng: sudo bash /var/app/game/infra/scripts/rollback.sh [timestamp]
# Nếu không truyền timestamp, tự động chọn bản liền trước.
# =============================================================================
set -euo pipefail

RELEASES_DIR="/var/app/releases"
CURRENT_LINK="/var/app/current"
ECOSYSTEM="/var/app/game/infra/ecosystem.production.cjs"
LOG_FILE="/var/log/tc-gaming-deploy.log"
API_HEALTH="http://127.0.0.1:8701/health"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
err() { log "❌ ERROR: $*"; exit 1; }

# Xác định bản rollback target
if [ -n "${1:-}" ]; then
    TARGET="$RELEASES_DIR/$1"
    [ -d "$TARGET" ] || err "Không tìm thấy release: $TARGET"
else
    # Tìm bản liền trước bản hiện tại
    CURRENT_REAL=$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo "")
    mapfile -t RELEASES < <(find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d | sort -r)

    TARGET=""
    FOUND_CURRENT=false
    for R in "${RELEASES[@]}"; do
        if [ "$FOUND_CURRENT" = true ]; then
            TARGET="$R"
            break
        fi
        [ "$R" = "$CURRENT_REAL" ] && FOUND_CURRENT=true
    done

    [ -n "$TARGET" ] || err "Không tìm thấy bản release cũ hơn để rollback."
fi

log "⏪ Rollback về: $TARGET"
ln -sfn "$TARGET" "$CURRENT_LINK"

# Reload PM2 với bản cũ
cd /var/app/game
pm2 startOrReload "$ECOSYSTEM" --update-env 2>&1 | tee -a "$LOG_FILE"

# Health check
sleep 3
curl -sf "$API_HEALTH" > /dev/null || err "API không phản hồi sau rollback!"

log "✅ Rollback thành công về: $TARGET"
