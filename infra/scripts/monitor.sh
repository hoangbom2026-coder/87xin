#!/bin/bash
# =============================================================================
# TC-GAMING MONITOR SCRIPT — Giam sat realtime CPU/RAM/PM2/Port
# =============================================================================
set -euo pipefail

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
API_HEALTH="http://127.0.0.1:8701/health"
CPU_ALERT_THRESHOLD=75
RAM_ALERT_THRESHOLD=80
LOG_FILE="/var/log/tc-gaming-monitor.log"

send_alert() {
    local MSG="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $MSG" | tee -a "$LOG_FILE"
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=[TC-Gaming VPS] $MSG" \
            -d "parse_mode=Markdown" > /dev/null || true
    fi
}

echo "========================================"
echo "  TC-GAMING MONITOR — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

CPU_IDLE=$(top -bn1 | grep -E "^(%Cpu|Cpu)" | awk '{print $8}' | cut -d. -f1)
CPU_USAGE=$((100 - ${CPU_IDLE:-100}))

MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_USED=$(free -m  | awk '/^Mem:/{print $3}')
MEM_FREE=$(free -m  | awk '/^Mem:/{print $4}')
MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))

SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')
SWAP_USED=$(free -m  | awk '/^Swap:/{print $3}')

echo "[TAI NGUYEN]"
echo "   CPU:  ${CPU_USAGE}% (nguong: ${CPU_ALERT_THRESHOLD}%)"
echo "   RAM:  ${MEM_USED}MB / ${MEM_TOTAL}MB (${MEM_PCT}%) | Free: ${MEM_FREE}MB"
echo "   SWAP: ${SWAP_USED}MB / ${SWAP_TOTAL}MB"

if [ "$CPU_USAGE" -ge "$CPU_ALERT_THRESHOLD" ]; then
    send_alert "CPU cao: ${CPU_USAGE}%"
fi
if [ "$MEM_PCT" -ge "$RAM_ALERT_THRESHOLD" ]; then
    send_alert "RAM cao: ${MEM_PCT}% (${MEM_USED}MB/${MEM_TOTAL}MB)"
fi

DISK_INFO=$(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')
DISK_PCT=$(df / | awk 'NR==2{gsub(/%/,"",$5); print $5}')
echo "   DISK: $DISK_INFO"
if [ "$DISK_PCT" -ge 85 ]; then
    send_alert "Disk day: ${DISK_PCT}%"
fi

echo ""
echo "[PM2 PROCESSES]"
pm2 jlist 2>/dev/null | node -e "
const list = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
list.forEach(p => {
    const status = p.pm2_env.status;
    const ram = Math.round((p.monit.memory || 0) / 1024 / 1024);
    const cpu = p.monit.cpu;
    const mark = status === 'online' ? '[ONLINE]' : '[OFFLINE]';
    console.log('   ' + mark.padEnd(10) + ' ' + p.name.padEnd(20) + ' status=' + status.padEnd(10) + ' RAM=' + ram + 'MB  CPU=' + cpu + '%');
});" 2>/dev/null || pm2 list --no-color

echo ""
echo "[CONG DICH VU]"
for PORT in 80 8701 8781; do
    if ss -tlnp 2>/dev/null | grep -q ":${PORT} " || \
       netstat -tlnp 2>/dev/null | grep -q ":${PORT} "; then
        echo "   [OK] :${PORT} mo"
    else
        echo "   [FAIL] :${PORT} KHONG mo!"
        send_alert "Cong :${PORT} khong mo tren VPS!"
    fi
done

echo ""
echo "[API HEALTH]"
HEALTH_RESP=$(curl -sf --max-time 5 "$API_HEALTH" 2>/dev/null || echo "FAIL")
if echo "$HEALTH_RESP" | grep -q '"status":"ok"'; then
    echo "   [OK] API online"
else
    echo "   [FAIL] API KHONG PHAN HOI!"
    send_alert "API /health khong phan hoi — kiem tra ngay!"
fi

echo "========================================"
