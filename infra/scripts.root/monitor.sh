#!/bin/bash
# =============================================================================
# TC-GAMING MONITOR SCRIPT — Giám sát realtime CPU/RAM/PM2/Port
# Cách dùng:
#   bash /var/app/game/infra/scripts/monitor.sh          # chạy 1 lần
#   watch -n 10 bash /var/app/game/infra/scripts/monitor.sh  # lặp 10s
# Cài cảnh báo Telegram: đặt biến TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
# =============================================================================
set -euo pipefail

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
API_HEALTH="http://127.0.0.1:8701/health"
CPU_ALERT_THRESHOLD=75
RAM_ALERT_THRESHOLD=80
LOG_FILE="/var/log/tc-gaming-monitor.log"

# ---------------------------------------------------------------------------
# Hàm gửi cảnh báo Telegram
# ---------------------------------------------------------------------------
send_alert() {
    local MSG="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $MSG" | tee -a "$LOG_FILE"
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=🚨 [TC-Gaming VPS] $MSG" \
            -d "parse_mode=Markdown" > /dev/null || true
    fi
}

# ---------------------------------------------------------------------------
# 1. CPU & RAM
# ---------------------------------------------------------------------------
echo "========================================"
echo "  TC-GAMING MONITOR — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

CPU_IDLE=$(top -bn1 | grep -E "^(%Cpu|Cpu)" | awk '{print $8}' | cut -d. -f1)
CPU_USAGE=$((100 - ${CPU_IDLE:-100}))

MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_USED=$(free -m  | awk '/^Mem:/{print $3}')
MEM_FREE=$(free -m  | awk '/^Mem:/{print $4}')
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))
SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')
SWAP_USED=$(free -m  | awk '/^Swap:/{print $3}')

echo ""
echo "📊 TÀI NGUYÊN:"
echo "   CPU  : ${CPU_USAGE}%"
echo "   RAM  : ${MEM_USED}/${MEM_TOTAL} MB (${MEM_PCT}%)  Free: ${MEM_FREE} MB"
echo "   SWAP : ${SWAP_USED}/${SWAP_TOTAL} MB"

[ "$CPU_USAGE" -gt "$CPU_ALERT_THRESHOLD" ] && \
    send_alert "CPU quá tải: *${CPU_USAGE}%* (ngưỡng ${CPU_ALERT_THRESHOLD}%)"

[ "$MEM_PCT" -gt "$RAM_ALERT_THRESHOLD" ] && \
    send_alert "RAM quá tải: *${MEM_PCT}%* — ${MEM_USED}/${MEM_TOTAL} MB"

# ---------------------------------------------------------------------------
# 2. Disk
# ---------------------------------------------------------------------------
DISK_INFO=$(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')
DISK_PCT=$(df / | awk 'NR==2{gsub(/%/,"",$5); print $5}')
echo "   DISK : $DISK_INFO"
[ "$DISK_PCT" -gt 85 ] && send_alert "Disk gần đầy: *${DISK_PCT}%*"

# ---------------------------------------------------------------------------
# 3. PM2 processes
# ---------------------------------------------------------------------------
echo ""
echo "⚙️  PM2 PROCESSES:"
pm2 jlist 2>/dev/null | \
    node -e "
const ps = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
ps.forEach(p => {
    const status = p.pm2_env.status;
    const ram = (p.monit.memory/1024/1024).toFixed(0);
    const cpu = p.monit.cpu;
    const icon = status === 'online' ? '🟢' : '🔴';
    console.log(\`   \${icon} \${p.name.padEnd(20)} status=\${status.padEnd(10)} RAM=\${ram}MB  CPU=\${cpu}%\`);
});" 2>/dev/null || pm2 list --no-color

# ---------------------------------------------------------------------------
# 4. Kiểm tra cổng dịch vụ
# ---------------------------------------------------------------------------
echo ""
echo "🔌 CỔNG DỊCH VỤ:"
for PORT in 80 8701 8781; do
    if ss -tlnp 2>/dev/null | grep -q ":${PORT} " || \
       netstat -tlnp 2>/dev/null | grep -q ":${PORT} "; then
        echo "   ✅ :${PORT} mở"
    else
        echo "   ❌ :${PORT} KHÔNG mở!"
        send_alert "Cổng :${PORT} không mở trên VPS!"
    fi
done

# ---------------------------------------------------------------------------
# 5. Health check API
# ---------------------------------------------------------------------------
echo ""
echo "🏥 API HEALTH:"
HEALTH_RESP=$(curl -sf --max-time 5 "$API_HEALTH" 2>/dev/null || echo "FAIL")
if echo "$HEALTH_RESP" | grep -q '"status":"ok"'; then
    DB_STATUS=$(echo "$HEALTH_RESP" | node -e \
        "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
         console.log(d.database||'unknown');" 2>/dev/null || echo "unknown")
    echo "   ✅ API online  |  DB: $DB_STATUS"
else
    echo "   ❌ API KHÔNG PHẢN HỒI!"
    send_alert "API /health không phản hồi — kiểm tra ngay!"
fi

# ---------------------------------------------------------------------------
# 6. MongoDB
# ---------------------------------------------------------------------------
echo ""
echo "🗄️  DATABASE:"
if nc -z -w2 127.0.0.1 27017 2>/dev/null; then
    echo "   ✅ MongoDB :27017 OK"
else
    echo "   ❌ MongoDB OFFLINE!"
    send_alert "MongoDB :27017 không kết nối được!"
fi

# ---------------------------------------------------------------------------
# 7. Nginx
# ---------------------------------------------------------------------------
echo ""
echo "🌐 NGINX:"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "   ✅ Nginx đang chạy"
else
    echo "   ❌ Nginx không chạy!"
    send_alert "Nginx không chạy — khởi động lại ngay!"
fi

echo ""
echo "========================================"
