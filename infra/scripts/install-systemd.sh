#!/bin/bash
# =============================================================================
# TC-GAMING — Cài đặt systemd services cho swap và resource limits
# Cách dùng: sudo bash /var/app/game/infra/scripts/install-systemd.sh
# =============================================================================
set -euo pipefail

# ── Kiểm tra quyền root ───────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
    echo "❌ Script này phải chạy với quyền root."
    echo "   Chạy: sudo bash $(basename "$0")"
    exit 1
fi

# ── Biến ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_SRC="${SCRIPT_DIR}/../systemd"
SYSTEMD_DEST="/etc/systemd/system"
GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[1;33m"; NC="\033[0m"
ERRORS=0

ok()   { echo -e "${GREEN}✅${NC} $*"; }
fail() { echo -e "${RED}❌ LỖII${NC} $*"; ERRORS=$((ERRORS+1)); }
warn() { echo -e "${YELLOW}⚠️${NC}  $*"; }
info() { echo -e "   $*"; }

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  TC-Gaming systemd Installer"
echo "  Thời gian: $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════"
echo ""

# ── Kiểm tra systemd có sẵn không ────────────────────────────────────────────
if ! command -v systemctl &>/dev/null; then
    fail "systemctl không tìm thấy — hệ thống không dùng systemd?"
    exit 1
fi
ok "systemd tìm thấy: $(systemctl --version | head -1)"

# ── Kiểm tra file nguồn tồn tại ──────────────────────────────────────────────
echo ""
echo "── Kiểm tra file nguồn ───────────────────────────────────────"
for REQUIRED in "swap-setup.service" "resource-limits.conf"; do
    if [ -f "${SYSTEMD_SRC}/${REQUIRED}" ]; then
        ok "Tìm thấy: ${SYSTEMD_SRC}/${REQUIRED}"
    else
        fail "Thiếu file: ${SYSTEMD_SRC}/${REQUIRED}"
    fi
done

if [ "$ERRORS" -gt 0 ]; then
    echo ""
    fail "Thiếu file cần thiết — không thể tiếp tục."
    exit 1
fi

# ── Bước 1: Copy swap-setup.service ─────────────────────────────────────────
echo ""
echo "── Bước 1: Cài swap-setup.service ───────────────────────────"
cp -v "${SYSTEMD_SRC}/swap-setup.service" "${SYSTEMD_DEST}/swap-setup.service"
chmod 644 "${SYSTEMD_DEST}/swap-setup.service"
ok "Đã copy: ${SYSTEMD_DEST}/swap-setup.service"

# ── Bước 2: Copy resource-limits.conf (dropin cho PM2/custom services) ───────
echo ""
echo "── Bước 2: Cài resource-limits.conf ─────────────────────────"

# Tạo dropin directory cho mọi service PM2 thông thường
for SERVICE in "pm2-root.service" "pm2-hermes.service"; do
    DROP_DIR="${SYSTEMD_DEST}/${SERVICE}.d"
    if systemctl list-unit-files "${SERVICE}" &>/dev/null 2>&1 | grep -q "${SERVICE}"; then
        mkdir -p "$DROP_DIR"
        cp -v "${SYSTEMD_SRC}/resource-limits.conf" "${DROP_DIR}/resource-limits.conf"
        ok "Đã copy dropin: ${DROP_DIR}/resource-limits.conf"
    else
        warn "Service ${SERVICE} chưa tồn tại — bỏ qua dropin cho service này"
    fi
done

# Cài vào system.conf.d để áp dụng toàn cục cho tất cả service
SYSCONF_DIR="/etc/systemd/system.conf.d"
mkdir -p "$SYSCONF_DIR"
# Chỉ copy phần [Service] thực sự hợp lệ cho system.conf.d
cat > "${SYSCONF_DIR}/tc-gaming-limits.conf" << 'EOF'
# TC-Gaming global resource limits
# Áp dụng cho tất cả service trên hệ thống
[Manager]
DefaultLimitNOFILE=65536
DefaultLimitNPROC=4096
DefaultLimitCORE=0
EOF
ok "Đã tạo: ${SYSCONF_DIR}/tc-gaming-limits.conf"

# ── Bước 3: systemctl daemon-reload ──────────────────────────────────────────
echo ""
echo "── Bước 3: Reload systemd daemon ────────────────────────────"
if systemctl daemon-reload; then
    ok "systemctl daemon-reload thành công"
else
    fail "systemctl daemon-reload thất bại"
fi

# ── Bước 4: Enable + start swap-setup.service ────────────────────────────────
echo ""
echo "── Bước 4: Enable và start swap-setup.service ───────────────"
if systemctl enable swap-setup.service; then
    ok "swap-setup.service đã enable (tự chạy khi boot)"
else
    fail "Không thể enable swap-setup.service"
fi

if systemctl start swap-setup.service; then
    ok "swap-setup.service đã start"
else
    fail "swap-setup.service start thất bại — xem: journalctl -u swap-setup.service"
fi

# ── Bước 5: Kiểm tra kết quả ─────────────────────────────────────────────────
echo ""
echo "── Bước 5: Kiểm tra trạng thái ──────────────────────────────"
STATUS=$(systemctl is-active swap-setup.service 2>/dev/null || echo "unknown")
if [ "$STATUS" = "active" ]; then
    ok "swap-setup.service: active"
else
    warn "swap-setup.service status: $STATUS (Type=oneshot nên inactive là bình thường sau khi chạy xong)"
fi

# Kiểm tra swap có hoạt động không
if swapon --show | grep -q swapfile 2>/dev/null; then
    SWAP_SIZE=$(swapon --show --bytes | grep swapfile | awk '{printf "%.1fGB", $3/1073741824}')
    ok "Swap đang hoạt động: $SWAP_SIZE"
else
    warn "Swap chưa hoạt động — có thể đã có swap khác, hoặc /swapfile chưa được tạo"
    info "Kiểm tra: swapon --show && free -h"
fi

# Kiểm tra sysctl
SWAPPINESS=$(sysctl -n vm.swappiness 2>/dev/null || echo "?")
CACHE_PRESSURE=$(sysctl -n vm.vfs_cache_pressure 2>/dev/null || echo "?")
info "vm.swappiness = $SWAPPINESS (kỳ vọng: 10)"
info "vm.vfs_cache_pressure = $CACHE_PRESSURE (kỳ vọng: 50)"
[ "$SWAPPINESS" = "10" ] && ok "vm.swappiness OK" || warn "vm.swappiness = $SWAPPINESS (không phải 10)"
[ "$CACHE_PRESSURE" = "50" ] && ok "vm.vfs_cache_pressure OK" || warn "vm.vfs_cache_pressure = $CACHE_PRESSURE (không phải 50)"

# ── Tổng kết ─────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}❌ Cài đặt hoàn thành với $ERRORS lỗi — xem chi tiết ở trên${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Cài đặt systemd thành công!${NC}"
    echo ""
    info "Các file đã cài:"
    info "  ${SYSTEMD_DEST}/swap-setup.service"
    info "  ${SYSCONF_DIR}/tc-gaming-limits.conf"
    echo ""
    info "Lệnh hữu ích:"
    info "  systemctl status swap-setup.service"
    info "  swapon --show && free -h"
    info "  sysctl vm.swappiness vm.vfs_cache_pressure"
fi
echo "════════════════════════════════════════════════════════════"
echo ""
