#!/bin/bash
# =============================================================================
# TC-GAMING VPS SETUP — Swap + Giới hạn tài nguyên hệ thống
# Chạy 1 lần khi khởi tạo VPS mới (hoặc sau reset).
# Cách dùng: sudo bash /var/app/game/infra/scripts/setup-vps.sh
# =============================================================================
set -euo pipefail

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ---------------------------------------------------------------------------
# 1. Swap 4 GB (nếu chưa có)
# ---------------------------------------------------------------------------
log "=== [1] Kiểm tra / Tạo Swap 4GB ==="
SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')
if [ "$SWAP_TOTAL" -lt 1024 ]; then
    log "  Swap chưa đủ ($SWAP_TOTAL MB). Đang tạo 4 GB swapfile..."
    fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    # Persistent qua reboot
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "  ✅ Swap 4GB đã tạo và kích hoạt."
else
    log "  ✅ Swap đã đủ: ${SWAP_TOTAL} MB — bỏ qua."
fi

# Giảm swappiness (ưu tiên RAM, chỉ dùng swap khi cần)
sysctl -w vm.swappiness=10 > /dev/null
grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
log "  vm.swappiness=10 đã áp dụng."

# ---------------------------------------------------------------------------
# 2. Giới hạn mở file & ulimit cho node
# ---------------------------------------------------------------------------
log ""
log "=== [2] Tăng ulimit nofile ==="
cat > /etc/security/limits.d/tc-gaming.conf << 'EOF'
# TC-Gaming — giới hạn file descriptor cho node/nginx
*    soft nofile 65535
*    hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF
log "  ✅ /etc/security/limits.d/tc-gaming.conf đã tạo."

# ---------------------------------------------------------------------------
# 3. Cài log rotation cho PM2 logs
# ---------------------------------------------------------------------------
log ""
log "=== [3] Logrotate cho PM2 logs ==="
mkdir -p /var/app/game/infra/logs
cat > /etc/logrotate.d/tc-gaming-pm2 << 'EOF'
/var/app/game/infra/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
log "  ✅ Logrotate /etc/logrotate.d/tc-gaming-pm2 đã tạo."

# ---------------------------------------------------------------------------
# 4. Cài logrotate cho Nginx logs
# ---------------------------------------------------------------------------
log ""
log "=== [4] Logrotate cho Nginx logs ==="
cat > /etc/logrotate.d/tc-gaming-nginx << 'EOF'
/var/app/game/infra/logs/tc-gaming-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        nginx -s reopen 2>/dev/null || true
    endscript
}
EOF
log "  ✅ Logrotate nginx logs đã tạo."

# ---------------------------------------------------------------------------
# 5. Cron giám sát mỗi 5 phút
# ---------------------------------------------------------------------------
log ""
log "=== [5] Cron giám sát ==="
CRON_JOB="*/5 * * * * bash /var/app/game/infra/scripts/monitor.sh >> /var/log/tc-gaming-monitor.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'monitor.sh'; echo "$CRON_JOB" ) | crontab -
log "  ✅ Cron monitor mỗi 5 phút đã đăng ký."

# ---------------------------------------------------------------------------
# 6. Tối ưu kernel net params
# ---------------------------------------------------------------------------
log ""
log "=== [6] Kernel network params ==="
cat >> /etc/sysctl.conf << 'EOF'

# TC-Gaming network tuning
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
EOF
sysctl -p > /dev/null 2>&1 || true
log "  ✅ Kernel network params áp dụng."

# ---------------------------------------------------------------------------
# 7. Tạo thư mục cần thiết
# ---------------------------------------------------------------------------
log ""
log "=== [7] Tạo thư mục hệ thống ==="
mkdir -p /var/app/releases /var/app/game/infra/logs
log "  ✅ /var/app/releases và infra/logs đã tạo."

# ---------------------------------------------------------------------------
# Hoàn tất
# ---------------------------------------------------------------------------
log ""
log "=================================================="
log "✅ VPS SETUP HOÀN TẤT"
log "   Swap       : $(free -h | awk '/^Swap:/{print $2}')"
log "   Swappiness : $(sysctl -n vm.swappiness)"
log "   Logrotate  : /etc/logrotate.d/tc-gaming-pm2"
log "=================================================="
