#!/usr/bin/env bash
# =============================================================================
# start-all.sh — Khởi động toàn bộ hệ thống trên VPS
# VPS: 4 CPU / 8 GB RAM
#
# Stack thực tế:
#   Hermes     → systemd user service (hermes-gateway.service) — native tại /home/hermes
#   OmniRoute  → native Node process, port 20128
#   OpenViking → systemd: openviking.service, port 1933
#   Game 1     → PM2: tc-api (:8701) + tc-admin (:8781)
#   Game 2     → PM2: mbs-backend (:5000) + frontend (:5001) + admin (:5002) + hook (:9001)
#   Nginx      → reverse proxy, ports 80/443
#
# Chạy: sudo bash /var/app/game/infra/scripts/start-all.sh
# =============================================================================
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail() { echo -e "${RED}[FAIL]${NC}  $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 0. Swap check
# ---------------------------------------------------------------------------
log "Kiểm tra swap..."
SWAP=$(free -m | awk '/^Swap:/ { print $2 }')
if [[ "$SWAP" -lt 1000 ]]; then
    warn "Swap < 1GB (hiện tại: ${SWAP}MB). Đang tạo 2GB swapfile..."
    if [[ ! -f /swapfile ]]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
        ok "Swap 2GB đã được kích hoạt."
    else
        swapon /swapfile 2>/dev/null || true
        ok "Swap đã được kích hoạt lại."
    fi
else
    ok "Swap hiện tại: ${SWAP}MB — đủ dùng."
fi

# ---------------------------------------------------------------------------
# 1. OpenViking (systemd service)
# ---------------------------------------------------------------------------
log "Kiểm tra OpenViking (systemd: openviking.service)..."
if systemctl is-active --quiet openviking; then
    ok "OpenViking đang chạy (port 1933)."
else
    warn "OpenViking chưa chạy — khởi động..."
    systemctl start openviking
    sleep 2
    if systemctl is-active --quiet openviking; then
        ok "OpenViking đã khởi động."
    else
        warn "OpenViking không khởi động được. Xem: journalctl -u openviking -n 20"
    fi
fi

# ---------------------------------------------------------------------------
# 2. OmniRoute (native Node process)
# ---------------------------------------------------------------------------
log "Kiểm tra OmniRoute (native, port 20128)..."
if ss -tlnp | grep -q ':20128'; then
    ok "OmniRoute đang lắng nghe trên port 20128."
else
    warn "OmniRoute chưa chạy — thử khởi động..."
    if systemctl is-enabled --quiet omniroute 2>/dev/null; then
        systemctl start omniroute
        sleep 2
        ok "OmniRoute đã khởi động qua systemd."
    elif command -v omniroute &>/dev/null; then
        nohup omniroute > /var/log/omniroute.log 2>&1 &
        sleep 2
        ok "OmniRoute đã khởi động (background)."
    else
        warn "Không tìm thấy omniroute binary. Bỏ qua."
    fi
fi

# ---------------------------------------------------------------------------
# 3. Hermes Gateway (systemd --user, user hermes)
# ---------------------------------------------------------------------------
log "Kiểm tra Hermes gateway (systemd user: hermes-gateway.service)..."
HERMES_ACTIVE=$(systemctl --user -M hermes@ is-active hermes-gateway 2>/dev/null || echo "inactive")
if [[ "$HERMES_ACTIVE" == "active" ]]; then
    ok "Hermes gateway đang chạy (user: hermes)."
else
    warn "Hermes gateway chưa chạy — khởi động..."
    # Cần loginctl linger để user service chạy mà không cần login session
    loginctl enable-linger hermes 2>/dev/null || true
    # Khởi động service qua machinectl
    systemctl --user -M hermes@ start hermes-gateway 2>/dev/null || \
        su - hermes -c "hermes gateway start" 2>/dev/null || \
        warn "Không thể khởi động Hermes. Chạy thủ công: su - hermes -c 'hermes gateway start'"
    sleep 3
    ok "Hermes gateway đã được yêu cầu khởi động."
fi

# ---------------------------------------------------------------------------
# 4. Game 1 — tc-gaming.live (PM2)
# ---------------------------------------------------------------------------
log "Khởi động Game 1 (tc-gaming.live) với PM2..."
if ! command -v pm2 &>/dev/null; then
    fail "PM2 chưa được cài. Chạy: npm install -g pm2"
fi

mkdir -p /var/app/game/infra/logs

cd /var/app/game
pm2 startOrReload infra/ecosystem.production.cjs --update-env
ok "PM2 tc-gaming: tc-api (:8701) + tc-admin (:8781)."

# ---------------------------------------------------------------------------
# 5. Game 2 — MarinaBaySands (PM2)
# ---------------------------------------------------------------------------
log "Khởi động Game 2 (MarinaBaySands) với PM2..."
mkdir -p /var/app/sands/infra/logs 2>/dev/null || true

cd /var/app/sands
pm2 startOrReload ecosystem.config.js --update-env
ok "PM2 sands: mbs-backend (:5000) + mbs-frontend (:5001) + mbs-admin (:5002) + deploy-hook (:9001)."

pm2 save
ok "PM2 process list đã được lưu."

# ---------------------------------------------------------------------------
# 6. Nginx
# ---------------------------------------------------------------------------
log "Kiểm tra và reload Nginx..."
if nginx -t 2>/dev/null; then
    nginx -s reload
    ok "Nginx đã reload."
else
    warn "Nginx config có lỗi. Chạy 'nginx -t' để xem chi tiết."
fi

# ---------------------------------------------------------------------------
# Tổng kết
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🎉  Toàn bộ hệ thống đã khởi động!                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Hermes         → native systemd user (hermes-gateway)       ║${NC}"
echo -e "${GREEN}║  OmniRoute      → native Node :20128                         ║${NC}"
echo -e "${GREEN}║  OpenViking     → systemd openviking.service :1933           ║${NC}"
echo -e "${GREEN}║  tc-gaming.live → Nginx → PM2 :8701 (API) :8781 (Admin)     ║${NC}"
echo -e "${GREEN}║  159.223.81.157 → Nginx → PM2 :5000 :5001 :5002             ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Kiểm tra Hermes : su - hermes -c 'hermes gateway status'    ║${NC}"
echo -e "${GREEN}║  Kiểm tra PM2    : pm2 list                                  ║${NC}"
echo -e "${GREEN}║  Kiểm tra ports  : ss -tlnp | grep -E '8701|8781|5000|1933|20128' ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
