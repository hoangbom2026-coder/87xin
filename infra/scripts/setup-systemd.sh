#!/usr/bin/env bash
# =============================================================================
# setup-systemd.sh — Cài đặt systemd service cho AI Stack
# Chạy 1 lần với quyền root sau khi triển khai lần đầu.
#
# Thực hiện:
#   1. Cài service file tc-hermes-stack.service
#   2. Enable PM2 startup (tự khởi động sau reboot)
#   3. Hướng dẫn bước tiếp theo
#
# Chạy: sudo bash /var/app/game/infra/scripts/setup-systemd.sh
# =============================================================================
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }

if [[ $EUID -ne 0 ]]; then
    echo "Script này cần chạy với quyền root: sudo bash $0"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

# ---------------------------------------------------------------------------
# 1. tc-hermes-stack.service (Docker Compose AI Stack)
# ---------------------------------------------------------------------------
log "Cài đặt tc-hermes-stack.service..."
cp "${INFRA_DIR}/systemd/tc-hermes-stack.service" /etc/systemd/system/tc-hermes-stack.service
chmod 644 /etc/systemd/system/tc-hermes-stack.service

systemctl daemon-reload
systemctl enable tc-hermes-stack.service
ok "tc-hermes-stack.service đã được enable (tự khởi động sau reboot)."

# ---------------------------------------------------------------------------
# 2. PM2 startup
# ---------------------------------------------------------------------------
log "Cấu hình PM2 startup..."
# Detect user chạy PM2 (thường là user deploy, không phải root)
PM2_USER="${SUDO_USER:-$(logname 2>/dev/null || echo 'root')}"
warn "PM2 sẽ được cấu hình cho user: ${PM2_USER}"

# Chạy pm2 startup với đúng user
PM2_STARTUP=$(su - "$PM2_USER" -c "pm2 startup | tail -1" 2>/dev/null || echo "")
if [[ -n "$PM2_STARTUP" ]]; then
    eval "$PM2_STARTUP"
    ok "PM2 startup đã được cấu hình."
else
    warn "Không thể tự động cấu hình PM2 startup. Chạy thủ công:"
    warn "  pm2 startup"
    warn "  (copy và chạy lệnh mà pm2 in ra)"
fi

# ---------------------------------------------------------------------------
# Tổng kết
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✅  Setup hoàn tất!                           ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Bước tiếp theo:                                    ║${NC}"
echo -e "${GREEN}║  1. Chỉnh .env:                                     ║${NC}"
echo -e "${GREEN}║     nano /var/app/game/infra/hermes-stack/.env      ║${NC}"
echo -e "${GREEN}║  2. Khởi động tất cả:                               ║${NC}"
echo -e "${GREEN}║     sudo bash /var/app/game/infra/scripts/start-all.sh ║${NC}"
echo -e "${GREEN}║  3. Kiểm tra sau reboot:                            ║${NC}"
echo -e "${GREEN}║     sudo systemctl status tc-hermes-stack           ║${NC}"
echo -e "${GREEN}║     pm2 list                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
