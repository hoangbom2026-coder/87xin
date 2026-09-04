#!/bin/bash
# =============================================================================
# TC-GAMING SMOKE TEST — Kiểm tra toàn bộ hệ thống sau deploy
# Cách dùng: bash /var/app/game/infra/test.sh
# Exit code 0 = tất cả pass; khác 0 = có lỗi.
# =============================================================================
set -euo pipefail

PASS=0
FAIL=0
DOMAIN="tc-gaming.live"
ADMIN_DOMAIN="admin.tc-gaming.live"
API_LOCAL="http://127.0.0.1:8701"

GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[1;33m"; NC="\033[0m"
ok()   { echo -e "${GREEN}✅ PASS${NC}  $*"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ FAIL${NC}  $*"; FAIL=$((FAIL+1)); }
info() { echo -e "${YELLOW}ℹ️  INFO${NC}  $*"; }

echo "========================================"
echo "  TC-GAMING SMOKE TEST — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# ---------------------------------------------------------------------------
# 1. PM2 — kiểm tra process đang chạy
# ---------------------------------------------------------------------------
echo "--- [1] PM2 Processes ---"
PM2_JSON=$(pm2 jlist 2>/dev/null)

for PROC in "tc-api" "tc-admin"; do
    STATUS=$(echo "$PM2_JSON" | node -e \
        "const ps=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
         const p=ps.find(x=>x.name==='${PROC}'); \
         console.log(p ? p.pm2_env.status : 'not_found');" 2>/dev/null || echo "error")
    if [ "$STATUS" = "online" ]; then
        ok "PM2 $PROC → $STATUS"
    else
        fail "PM2 $PROC → $STATUS"
    fi
done

# ---------------------------------------------------------------------------
# 2. Cổng dịch vụ
# ---------------------------------------------------------------------------
echo ""
echo "--- [2] Cổng dịch vụ ---"
for PORT in 80 8701 8781; do
    if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
        ok "Port :$PORT mở"
    else
        fail "Port :$PORT không mở"
    fi
done

# ---------------------------------------------------------------------------
# 3. MongoDB
# ---------------------------------------------------------------------------
echo ""
echo "--- [3] MongoDB ---"
if nc -z -w2 127.0.0.1 27017 2>/dev/null; then
    ok "MongoDB :27017 kết nối OK"
else
    fail "MongoDB :27017 không kết nối được"
fi

# ---------------------------------------------------------------------------
# 4. API Health check (local)
# ---------------------------------------------------------------------------
echo ""
echo "--- [4] API Health ---"
HEALTH=$(curl -sf --max-time 5 "$API_LOCAL/health" 2>/dev/null || echo "FAIL")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    DB_ST=$(echo "$HEALTH" | node -e \
        "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
         console.log(d.database);" 2>/dev/null || echo "?")
    REDIS_ST=$(echo "$HEALTH" | node -e \
        "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
         console.log(d.redis);" 2>/dev/null || echo "?")
    MEM=$(echo "$HEALTH" | node -e \
        "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
         console.log(d.memory ? d.memory.heapUsed : '?');" 2>/dev/null || echo "?")
    ok "API /health  db=$DB_ST  redis=$REDIS_ST  heap=$MEM"
else
    fail "API /health không trả về status:ok (response: $HEALTH)"
fi

# ---------------------------------------------------------------------------
# 5. Nginx
# ---------------------------------------------------------------------------
echo ""
echo "--- [5] Nginx ---"
if systemctl is-active --quiet nginx 2>/dev/null; then
    ok "Nginx đang chạy"
else
    fail "Nginx không chạy"
fi

if sudo nginx -t 2>/dev/null; then
    ok "Nginx config hợp lệ"
else
    fail "Nginx config lỗi"
fi

# ---------------------------------------------------------------------------
# 6. Frontend tĩnh (file dist tồn tại)
# ---------------------------------------------------------------------------
echo ""
echo "--- [6] Frontend dist ---"
FE_DIST="/var/app/game/apps/frontend-web/dist/index.html"
ADMIN_DIST="/var/app/game/apps/admin-dashboard/dist/index.html"

[ -f "$FE_DIST" ]    && ok "frontend-web dist/index.html tồn tại" \
                      || fail "frontend-web dist/index.html THIẾU"
[ -f "$ADMIN_DIST" ] && ok "admin-dashboard dist/index.html tồn tại" \
                      || fail "admin-dashboard dist/index.html THIẾU"

# ---------------------------------------------------------------------------
# 7. Kiểm tra thời gian phản hồi API (phải < 500ms)
# ---------------------------------------------------------------------------
echo ""
echo "--- [7] Response time ---"
RESP_TIME=$(curl -o /dev/null -s -w "%{time_total}" --max-time 5 "$API_LOCAL/health" 2>/dev/null || echo "9999")
RESP_MS=$(echo "$RESP_TIME" | awk '{printf "%d", $1*1000}')
if [ "$RESP_MS" -lt 500 ]; then
    ok "API response time: ${RESP_MS}ms (< 500ms)"
else
    fail "API response time: ${RESP_MS}ms — quá chậm!"
fi

# ---------------------------------------------------------------------------
# 8. Tài nguyên hệ thống (cảnh báo nếu cao)
# ---------------------------------------------------------------------------
echo ""
echo "--- [8] System resources ---"
CPU_IDLE=$(top -bn1 | grep -E "^(%Cpu|Cpu)" | awk '{print $8}' | cut -d. -f1)
CPU_USAGE=$((100 - ${CPU_IDLE:-100}))
MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_USED=$(free -m  | awk '/^Mem:/{print $3}')
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))
DISK_PCT=$(df / | awk 'NR==2{gsub(/%/,"",$5); print $5}')

info "CPU: ${CPU_USAGE}%  |  RAM: ${MEM_USED}/${MEM_TOTAL}MB (${MEM_PCT}%)  |  DISK: ${DISK_PCT}%"
[ "$CPU_USAGE" -lt 80 ] && ok "CPU bình thường (${CPU_USAGE}%)"   || fail "CPU cao: ${CPU_USAGE}%"
[ "$MEM_PCT"   -lt 85 ] && ok "RAM bình thường (${MEM_PCT}%)"     || fail "RAM cao: ${MEM_PCT}%"
[ "$DISK_PCT"  -lt 85 ] && ok "Disk bình thường (${DISK_PCT}%)"   || fail "Disk gần đầy: ${DISK_PCT}%"

# ---------------------------------------------------------------------------
# Tổng kết
# ---------------------------------------------------------------------------
echo ""
echo "========================================"
echo -e "  PASS: ${GREEN}${PASS}${NC}  |  FAIL: ${RED}${FAIL}${NC}"
echo "========================================"

[ "$FAIL" -eq 0 ] && echo -e "${GREEN}✅ TẤT CẢ KIỂM TRA ĐỀU PASS${NC}" && exit 0
echo -e "${RED}❌ CÓ $FAIL KIỂM TRA THẤT BẠI — xem chi tiết ở trên${NC}"
exit 1
