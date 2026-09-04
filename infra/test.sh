#!/bin/bash
# =============================================================================
# TC-GAMING SMOKE TEST — Kiểm tra toàn hệ thống sau deploy
# Cách dùng: bash /var/app/game/infra/test.sh
# Exit code: 0 = tất cả pass, 1 = có lỗi
# =============================================================================
set -euo pipefail

# ── Màu ──────────────────────────────────────────────────────────────────────
GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[1;33m"; BLUE="\033[0;34m"; NC="\033[0m"

# ── Đọc .env.production nếu tồn tại (fallback về defaults) ───────────────────
ENV_FILE="$(dirname "$0")/../.env.production"
[ -f "$ENV_FILE" ] && set -o allexport && source "$ENV_FILE" && set +o allexport 2>/dev/null || true

# ── Biến cấu hình (từ env hoặc default) ─────────────────────────────────────
API_PORT="${PORT:-8701}"
ADMIN_PORT="${ADMIN_PREVIEW_PORT:-8781}"
API_LOCAL="http://127.0.0.1:${API_PORT}"
FRONTEND_DIST="${FRONTEND_DIST_PATH:-/var/app/game/apps/frontend-web/dist}"
ADMIN_DIST="${ADMIN_DIST_PATH:-/var/app/game/apps/admin-dashboard/dist}"
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
CURL_TIMEOUT=10

# ── Bộ đếm ───────────────────────────────────────────────────────────────────
PASS=0; FAIL=0; WARN=0

ok()   { echo -e "${GREEN}✅ PASS${NC}  $*"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ FAIL${NC}  $*"; FAIL=$((FAIL+1)); }
warn() { echo -e "${YELLOW}⚠️  WARN${NC}  $*"; WARN=$((WARN+1)); }
info() { echo -e "${BLUE}ℹ️  INFO${NC}  $*"; }
hr()   { echo "────────────────────────────────────────────────────────────"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TC-GAMING SMOKE TEST — $(date '+%Y-%m-%d %H:%M:%S')      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── CHECK 1: PM2 Processes ───────────────────────────────────────────────────
hr; info "CHECK 1: PM2 Processes"
if command -v pm2 &>/dev/null; then
    PM2_JSON=$(pm2 jlist 2>/dev/null || echo "[]")
    for PROC in "tc-api" "tc-admin"; do
        STATUS=$(echo "$PM2_JSON" | node -e \
            "try{const ps=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
             const p=ps.find(x=>x.name==='${PROC}'); \
             console.log(p?p.pm2_env.status:'not_found');}catch(e){console.log('error');}" \
            2>/dev/null || echo "error")
        if [ "$STATUS" = "online" ]; then
            ok "PM2 $PROC → online"
        else
            fail "PM2 $PROC → $STATUS (kỳ vọng: online)"
        fi
    done
else
    warn "pm2 không được cài — bỏ qua kiểm tra PM2"
fi

# ── CHECK 2: Ports ───────────────────────────────────────────────────────────
hr; info "CHECK 2: Ports đang lắng nghe"
for PORT_NUM in 80 "${API_PORT}" "${ADMIN_PORT}"; do
    if ss -tlnp 2>/dev/null | grep -q ":${PORT_NUM} " || \
       ss -tlnp 2>/dev/null | grep -q ":${PORT_NUM}$"; then
        ok "Port :${PORT_NUM} đang mở"
    else
        fail "Port :${PORT_NUM} không mở"
    fi
done

# ── CHECK 3: MongoDB ─────────────────────────────────────────────────────────
hr; info "CHECK 3: MongoDB kết nối"
if nc -z -w3 127.0.0.1 27017 2>/dev/null; then
    ok "MongoDB :27017 reachable"
    # Thử query đơn giản nếu có mongosh/mongo
    if command -v mongosh &>/dev/null; then
        PING_RESULT=$(mongosh --quiet --eval "db.adminCommand('ping').ok" \
            "${DATABASE_URL:-mongodb://127.0.0.1:27017/tc-gaming}" 2>/dev/null || echo "0")
        [ "$PING_RESULT" = "1" ] && ok "MongoDB ping OK" || warn "MongoDB ping không phản hồi"
    elif command -v mongo &>/dev/null; then
        PING_RESULT=$(mongo --quiet --eval "db.adminCommand('ping').ok" \
            "${DATABASE_URL:-mongodb://127.0.0.1:27017/tc-gaming}" 2>/dev/null || echo "0")
        [ "$PING_RESULT" = "1" ] && ok "MongoDB ping OK" || warn "MongoDB ping không phản hồi"
    fi
else
    fail "MongoDB :27017 không kết nối được — kiểm tra: sudo systemctl status mongod"
fi

# ── CHECK 4: Redis ───────────────────────────────────────────────────────────
hr; info "CHECK 4: Redis"
if command -v redis-cli &>/dev/null; then
    REDIS_HOST=$(echo "${REDIS_URL:-redis://127.0.0.1:6379}" | sed 's|redis://||' | cut -d: -f1)
    REDIS_PORT_NUM=$(echo "${REDIS_URL:-redis://127.0.0.1:6379}" | sed 's|redis://||' | cut -d: -f2)
    REDIS_PORT_NUM="${REDIS_PORT_NUM:-6379}"

    PONG=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT_NUM" --no-auth-warning ping 2>/dev/null || echo "FAIL")
    if [ "$PONG" = "PONG" ]; then
        ok "Redis ping → PONG (${REDIS_HOST}:${REDIS_PORT_NUM})"
    else
        warn "Redis không phản hồi (response: $PONG) — hệ thống dùng in-memory fallback"
    fi
else
    warn "redis-cli không được cài — bỏ qua kiểm tra Redis trực tiếp"
fi

# ── CHECK 5: API /health ─────────────────────────────────────────────────────
hr; info "CHECK 5: API Health endpoint"
HEALTH_RESP=$(curl -sf --max-time "${CURL_TIMEOUT}" "${API_LOCAL}/health" 2>/dev/null || echo "CURL_FAIL")

if [ "$HEALTH_RESP" = "CURL_FAIL" ]; then
    fail "API /health không phản hồi tại ${API_LOCAL}/health (timeout ${CURL_TIMEOUT}s)"
else
    # Kiểm tra status field (hỗ trợ cả format cũ "ok" và mới)
    HTTP_STATUS_VAL=$(echo "$HEALTH_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$HTTP_STATUS_VAL" = "ok" ] || [ "$HTTP_STATUS_VAL" = "degraded" ]; then
        # Parse chi tiết từ format mới (services) hoặc cũ (database/redis flat)
        DB_DETAIL=$(echo "$HEALTH_RESP" | \
            node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
            const s=d.services?.database; \
            console.log(s?s.status+'('+s.latency_ms+'ms)':d.database||'?');}catch(e){console.log('?');}" \
            2>/dev/null || echo "?")
        REDIS_DETAIL=$(echo "$HEALTH_RESP" | \
            node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
            const s=d.services?.redis; \
            console.log(s?s.status+'('+s.latency_ms+'ms)':d.redis||'?');}catch(e){console.log('?');}" \
            2>/dev/null || echo "?")
        MEM_HEAP=$(echo "$HEALTH_RESP" | \
            node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
            console.log(d.memory?.heapUsed||'?');}catch(e){console.log('?');}" \
            2>/dev/null || echo "?")

        if [ "$HTTP_STATUS_VAL" = "ok" ]; then
            ok "API /health → ok  db=$DB_DETAIL  redis=$REDIS_DETAIL  heap=$MEM_HEAP"
        else
            warn "API /health → degraded  db=$DB_DETAIL  redis=$REDIS_DETAIL"
        fi
    else
        fail "API /health trả về status không hợp lệ: '$HTTP_STATUS_VAL' (body: ${HEALTH_RESP:0:200})"
    fi
fi

# ── CHECK 6: API /api/health ─────────────────────────────────────────────────
hr; info "CHECK 6: API /api/health (redundant route)"
if curl -sf --max-time "${CURL_TIMEOUT}" "${API_LOCAL}/api/health" > /dev/null 2>&1; then
    ok "/api/health phản hồi HTTP 200"
else
    fail "/api/health không phản hồi"
fi

# ── CHECK 7: Auth endpoint (kiểm tra route tồn tại) ──────────────────────────
hr; info "CHECK 7: Auth endpoint POST /api/auth/login"
AUTH_BODY='{"username":"__smoke_test_user__","password":"__smoke_test_pass__"}'
AUTH_RESP=$(curl -sf --max-time "${CURL_TIMEOUT}" -X POST \
    -H "Content-Type: application/json" \
    -d "$AUTH_BODY" \
    "${API_LOCAL}/api/auth/login" 2>/dev/null || echo "CURL_FAIL")

if [ "$AUTH_RESP" = "CURL_FAIL" ]; then
    fail "POST /api/auth/login không phản hồi"
elif echo "$AUTH_RESP" | grep -qE '"message"|"success"|"code"'; then
    ok "POST /api/auth/login phản hồi (401/400 là bình thường cho smoke test)"
else
    warn "POST /api/auth/login response không rõ: ${AUTH_RESP:0:100}"
fi

# ── CHECK 8: Frontend dist files ─────────────────────────────────────────────
hr; info "CHECK 8: Frontend static files"
if [ -f "${FRONTEND_DIST}/index.html" ]; then
    JS_COUNT=$(find "${FRONTEND_DIST}/assets" -name "*.js" 2>/dev/null | wc -l)
    ok "frontend-web dist/index.html tồn tại (JS chunks: ${JS_COUNT})"
else
    fail "frontend-web dist/index.html THIẾU — chạy: npm run build -w apps/frontend-web"
fi

if [ -f "${ADMIN_DIST}/index.html" ]; then
    ok "admin-dashboard dist/index.html tồn tại"
else
    fail "admin-dashboard dist/index.html THIẾU — chạy: npm run build -w apps/admin-dashboard"
fi

# ── CHECK 9: Nginx ───────────────────────────────────────────────────────────
hr; info "CHECK 9: Nginx"
if systemctl is-active --quiet nginx 2>/dev/null; then
    ok "Nginx đang chạy"
    if sudo nginx -t > /dev/null 2>&1; then
        ok "Nginx config hợp lệ"
    else
        fail "Nginx config lỗi — chạy: sudo nginx -t"
    fi
else
    fail "Nginx không chạy — chạy: sudo systemctl start nginx"
fi

# ── CHECK 10: Response time ───────────────────────────────────────────────────
hr; info "CHECK 10: Response time API /health"
RESP_TIME=$(curl -o /dev/null -s -w "%{time_total}" \
    --max-time "${CURL_TIMEOUT}" "${API_LOCAL}/health" 2>/dev/null || echo "9999")
RESP_MS=$(echo "$RESP_TIME" | awk '{printf "%d", $1*1000}')
if [ "${RESP_MS:-9999}" -lt 500 ]; then
    ok "Response time: ${RESP_MS}ms (< 500ms)"
elif [ "${RESP_MS:-9999}" -lt 1000 ]; then
    warn "Response time: ${RESP_MS}ms (chậm, nên < 500ms)"
else
    fail "Response time: ${RESP_MS}ms — quá chậm!"
fi

# ── CHECK 11: WebSocket (nếu có wscat hoặc curl hỗ trợ upgrade) ──────────────
hr; info "CHECK 11: WebSocket / Socket.IO handshake"
# Socket.IO polling handshake — không cần wscat, chỉ cần HTTP GET
WS_RESP=$(curl -sf --max-time "${CURL_TIMEOUT}" \
    "${API_LOCAL}/socket.io/?EIO=4&transport=polling" 2>/dev/null || echo "CURL_FAIL")
if [ "$WS_RESP" = "CURL_FAIL" ]; then
    warn "Socket.IO polling handshake không phản hồi (có thể Nginx block direct port)"
elif echo "$WS_RESP" | grep -qE '"sid"|"upgrades"'; then
    ok "Socket.IO polling handshake OK"
else
    warn "Socket.IO response không rõ: ${WS_RESP:0:80}"
fi

# ── CHECK 12: System resources ───────────────────────────────────────────────
hr; info "CHECK 12: System resources"
CPU_IDLE=$(top -bn1 2>/dev/null | grep -E "^(%Cpu|Cpu)" | awk '{print $8}' | cut -d. -f1 || echo "0")
CPU_USAGE=$((100 - ${CPU_IDLE:-0}))
MEM_TOTAL=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "1")
MEM_USED=$(free -m  2>/dev/null | awk '/^Mem:/{print $3}' || echo "0")
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))
DISK_PCT=$(df /var/app 2>/dev/null | awk 'NR==2{gsub(/%/,"",$5); print $5}' || echo "0")

info "CPU: ${CPU_USAGE}%  |  RAM: ${MEM_USED}/${MEM_TOTAL}MB (${MEM_PCT}%)  |  Disk: ${DISK_PCT}%"
[ "${CPU_USAGE:-0}" -lt 80 ]  && ok "CPU bình thường (${CPU_USAGE}%)"  || fail "CPU cao: ${CPU_USAGE}%"
[ "${MEM_PCT:-0}"   -lt 85 ]  && ok "RAM bình thường (${MEM_PCT}%)"    || fail "RAM cao: ${MEM_PCT}%"
[ "${DISK_PCT:-0}"  -lt 85 ]  && ok "Disk bình thường (${DISK_PCT}%)"  || fail "Disk gần đầy: ${DISK_PCT}%"

# ── Kiểm tra backend .env ─────────────────────────────────────────────────────
hr; info "CHECK 13: Backend .env"
BACKEND_ENV="/var/app/game/apps/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    if grep -q "CHANGE_ME" "$BACKEND_ENV"; then
        warn ".env có CHANGE_ME placeholder — nhớ thay JWT_SECRET và password trước khi live!"
    else
        ok ".env tồn tại, không có CHANGE_ME"
    fi
else
    fail ".env THIẾU tại $BACKEND_ENV — copy từ .env.production: cp /var/app/game/.env.production $BACKEND_ENV"
fi

# ── KẾT QUẢ ─────────────────────────────────────────────────────────────────
hr
echo ""
echo -e "${BLUE}╔══════════════════════════════════╗${NC}"
echo -e "${BLUE}║         KẾT QUẢ SMOKE TEST       ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════╣${NC}"
printf "${BLUE}║${NC}  ✅ PASS : ${GREEN}%-4s${NC}                  ${BLUE}║${NC}\n" "$PASS"
printf "${BLUE}║${NC}  ❌ FAIL : ${RED}%-4s${NC}                  ${BLUE}║${NC}\n" "$FAIL"
printf "${BLUE}║${NC}  ⚠️  WARN : ${YELLOW}%-4s${NC}                  ${BLUE}║${NC}\n" "$WARN"
echo -e "${BLUE}╚══════════════════════════════════╝${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}❌ SMOKE TEST THẤT BẠI — $FAIL lỗi cần xử lý trước khi nhận traffic.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ SMOKE TEST THÀNH CÔNG — Hệ thống sẵn sàng phục vụ.${NC}"
    exit 0
fi
