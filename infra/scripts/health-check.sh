#!/usr/bin/env bash
# =============================================================================
# health-check.sh — Kiểm tra sức khỏe toàn bộ VPS stack
# Chạy bất kỳ lúc nào: bash /var/app/game/infra/scripts/health-check.sh
# =============================================================================
set -euo pipefail
export PM2_HOME=/root/.pm2

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; }
fail() { echo -e "  ${RED}✗${NC}  $*"; FAIL_COUNT=$((FAIL_COUNT+1)); }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; WARN_COUNT=$((WARN_COUNT+1)); }
section() { echo -e "\n${BOLD}${CYAN}▶ $*${NC}"; }

FAIL_COUNT=0
WARN_COUNT=0

# ---------------------------------------------------------------------------
# 1. Hermes Gateway (native systemd user)
# ---------------------------------------------------------------------------
section "Hermes Gateway"

GW_JSON="/home/hermes/.hermes/gateway_state.json"
if [[ -f "$GW_JSON" ]]; then
    GW_STATE=$(python3 -c "
import json, os
d = json.load(open('$GW_JSON'))
pid = d.get('pid',0)
state = d.get('gateway_state','?')
ver = d.get('code_version','?')
plat = ', '.join(
    f\"{k}:{v.get('state','?')}\" for k,v in d.get('platforms',{}).items()
)
try: os.kill(pid, 0); alive='alive'
except: alive='DEAD'
print(f'{state}|{pid}|{alive}|{ver}|{plat}')
" 2>/dev/null)

    IFS='|' read -r STATE PID ALIVE VER PLATFORMS <<< "$GW_STATE"
    if [[ "$STATE" == "running" && "$ALIVE" == "alive" ]]; then
        ok "Gateway running  pid=$PID  v$VER"
        [[ -n "$PLATFORMS" ]] && ok "Platforms: $PLATFORMS"
    else
        fail "Gateway state=$STATE  pid=$PID  process=$ALIVE"
    fi
else
    fail "gateway_state.json không tồn tại"
fi

# Kiểm tra systemd service đã enabled chưa
SVC_ENABLED=$(sudo -u hermes bash -c '
    export HOME=/home/hermes XDG_RUNTIME_DIR=/run/user/1000
    export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
    systemctl --user is-enabled hermes-gateway 2>/dev/null
' 2>/dev/null || echo "unknown")
if [[ "$SVC_ENABLED" == "enabled" ]]; then
    ok "hermes-gateway.service: enabled (auto-start after reboot)"
else
    fail "hermes-gateway.service: $SVC_ENABLED — KHÔNG tự khởi động sau reboot!"
fi

# Linger
LINGER=$(loginctl show-user hermes 2>/dev/null | grep '^Linger=' | cut -d= -f2)
if [[ "$LINGER" == "yes" ]]; then
    ok "loginctl linger: enabled"
else
    fail "loginctl linger: disabled — gateway sẽ chết khi logout!"
fi

# ---------------------------------------------------------------------------
# 2. OmniRoute (native Node, port 20128)
# ---------------------------------------------------------------------------
section "OmniRoute"

if ss -tlnp 2>/dev/null | grep -q ':20128'; then
    OMNI_PID=$(ss -tlnp | grep ':20128' | grep -oP 'pid=\K[0-9]+' | head -1)
    OMNI_MEM=$(ps -p "$OMNI_PID" -o rss= 2>/dev/null | awk '{printf "%.0fMB", $1/1024}')
    ok "Listening on :20128  pid=$OMNI_PID  mem=$OMNI_MEM"
else
    fail "OmniRoute KHÔNG lắng nghe trên port 20128!"
fi

# Watchdog crontab
if crontab -l 2>/dev/null | grep -q 'omniroute_watchdog'; then
    ok "Watchdog crontab: active (*/2 * * * *)"
else
    warn "Watchdog crontab không tìm thấy"
fi

# Cloudflare tunnel (optional — chỉ warn nếu không tìm thấy bất kỳ cloudflared nào)
if ps aux | grep -q '[c]loudflared'; then
    ok "Cloudflare tunnel: running"
else
    warn "Cloudflare tunnel: không tìm thấy (optional)"
fi

# ---------------------------------------------------------------------------
# 3. OpenViking (PM2, port 1933)
# ---------------------------------------------------------------------------
section "OpenViking"

# PM2 output có ký tự box-drawing unicode (│) — convert sang | rồi parse bằng awk
# columns: [2]=id [3]=name [6]=mode [7]=pid [8]=uptime [9]=restarts [10]=status
_pm2_status() {
    PM2_HOME=/root/.pm2 pm2 list --no-color 2>/dev/null \
    | grep "$1" \
    | sed 's/│/|/g' \
    | awk -F'|' '{print $10}' \
    | tr -d ' '
}
_pm2_col() {
    PM2_HOME=/root/.pm2 pm2 list --no-color 2>/dev/null \
    | grep "$1" \
    | sed 's/│/|/g' \
    | awk -F'|' "{print \$$2}" \
    | tr -d ' '
}
OV_STATUS=$(_pm2_status 'openviking')
OV_RESTARTS=$(_pm2_col 'openviking' 9)
OV_UPTIME=$(_pm2_col 'openviking' 8)
OV_PID=$(ss -tlnp 2>/dev/null | grep '127.0.0.1:1933' | grep -oP 'pid=\K[0-9]+' | head -1)
if [[ "$OV_STATUS" == "online" ]]; then
    ok "PM2 status: online  pid=$OV_PID  uptime=$OV_UPTIME"
    if [[ "${OV_RESTARTS:-0}" -gt 50 ]]; then
        warn "Restart count: $OV_RESTARTS lần (OpenRouter 404 — không ảnh hưởng nếu port 1933 ok)"
    else
        ok "Restarts: $OV_RESTARTS"
    fi
else
    fail "OpenViking PM2: ${OV_STATUS:-không tìm thấy}"
fi

if ss -tlnp 2>/dev/null | grep -qF '1933'; then
    ok "Port 1933: listening"
else
    fail "Port 1933: KHÔNG lắng nghe!"
fi

# openviking.service — phải disabled để không conflict với PM2
OV_SVC=$(systemctl is-enabled openviking 2>/dev/null; echo "${OV_SVC:-disabled}")
OV_SVC=$(systemctl is-enabled openviking 2>/dev/null || true)
OV_SVC="${OV_SVC:-disabled}"
if [[ "$OV_SVC" == "disabled" || "$OV_SVC" == "not-found" || -z "$OV_SVC" ]]; then
    ok "openviking.service: disabled (PM2 source of truth ✓)"
else
    warn "openviking.service=${OV_SVC}: conflict với PM2! Fix: systemctl disable openviking"
fi

# ---------------------------------------------------------------------------
# 4. PM2 (game services + autostart)
# ---------------------------------------------------------------------------
section "PM2 Game Services"

# pm2-root.service
PM2_SVC=$(systemctl is-active pm2-root 2>/dev/null || echo "inactive")
if [[ "$PM2_SVC" == "active" ]]; then
    ok "pm2-root.service: active (auto-resurrect after reboot)"
else
    fail "pm2-root.service: $PM2_SVC — PM2 sẽ KHÔNG tự khởi động sau reboot!"
fi

for SVC in mbs-backend mbs-frontend mbs-admin mbs-deploy-hook omniroute openviking; do
    STATUS=$(_pm2_status "$SVC")
    PORT_HINT=""
    case "$SVC" in
        mbs-backend)     PORT_HINT=":5000" ;;
        mbs-frontend)    PORT_HINT=":5001" ;;
        mbs-admin)       PORT_HINT=":5002" ;;
        mbs-deploy-hook) PORT_HINT=":9001" ;;
        omniroute)       PORT_HINT=":20128" ;;
        openviking)      PORT_HINT=":1933" ;;
    esac
    if [[ "$STATUS" == "online" ]]; then
        ok "PM2 $SVC${PORT_HINT}: online"
    else
        fail "PM2 $SVC${PORT_HINT}: ${STATUS:-không tìm thấy}"
    fi
done

# ---------------------------------------------------------------------------
# 5. Nginx
# ---------------------------------------------------------------------------
section "Nginx"

if nginx -t 2>/dev/null; then
    ok "Config syntax: OK"
else
    fail "Config syntax: LỖI!"
fi

if systemctl is-active --quiet nginx; then
    ok "nginx.service: active"
else
    fail "nginx.service: không chạy!"
fi

# Kiểm tra ports
for PORT in 80 443; do
    if ss -tlnp | grep -q ":${PORT}[^0-9]"; then
        ok "Port $PORT: listening"
    else
        warn "Port $PORT: không lắng nghe"
    fi
done

# ---------------------------------------------------------------------------
# 6. Tài nguyên hệ thống
# ---------------------------------------------------------------------------
section "System Resources"

RAM_FREE=$(free -m | awk '/^Mem:/{print $7}')
RAM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
RAM_USED=$(free -m | awk '/^Mem:/{print $3}')
RAM_PCT=$(( RAM_USED * 100 / RAM_TOTAL ))
SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')
SWAP_USED=$(free -m | awk '/^Swap:/{print $3}')
CPU_LOAD=$(cut -d' ' -f1 /proc/loadavg)
DISK_PCT=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')

[[ "$RAM_PCT" -lt 80 ]] && ok "RAM: ${RAM_USED}/${RAM_TOTAL}MB (${RAM_PCT}%)" \
                         || warn "RAM cao: ${RAM_USED}/${RAM_TOTAL}MB (${RAM_PCT}%)"
[[ "$SWAP_TOTAL" -gt 0 ]] && ok "Swap: ${SWAP_USED}/${SWAP_TOTAL}MB" \
                            || warn "Swap chưa được cấu hình!"
[[ "$DISK_PCT" -lt 85 ]] && ok "Disk /: ${DISK_PCT}%" \
                          || warn "Disk /: ${DISK_PCT}% — sắp đầy!"
ok "Load average (1m): ${CPU_LOAD}"

# ---------------------------------------------------------------------------
# Tổng kết
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ "$FAIL_COUNT" -eq 0 && "$WARN_COUNT" -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}  ✓ Tất cả systems healthy — không có vấn đề.${NC}"
elif [[ "$FAIL_COUNT" -eq 0 ]]; then
    echo -e "${YELLOW}${BOLD}  ⚠ ${WARN_COUNT} cảnh báo, không có lỗi nghiêm trọng.${NC}"
else
    echo -e "${RED}${BOLD}  ✗ ${FAIL_COUNT} LỖI, ${WARN_COUNT} cảnh báo — cần xử lý!${NC}"
    echo -e "${YELLOW}  Fix: bash /var/app/game/infra/scripts/start-all.sh${NC}"
fi
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
