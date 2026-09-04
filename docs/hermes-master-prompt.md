# Hermes Agent — Master Prompt: Fix + Git + CI/CD + Smoke Test

> **Đây là prompt toàn diện cuối cùng.**  
> Đọc toàn bộ file này trước khi làm bất kỳ việc gì.  
> Thực hiện đúng thứ tự các phase. Sau mỗi phase, commit git trước khi tiếp tục.

---

## Trạng thái hệ thống (đã verify thực tế)

### ✅ Đã hoàn thành — KHÔNG sửa lại
| File | Trạng thái |
|------|-----------|
| `apps/backend/src/routes.ts` | 57 routers mounted đầy đủ |
| `apps/backend/src/app.ts` | Health endpoint, CORS, Socket.IO |
| `apps/backend/src/config/index.ts` | agPay, GSC, JWT config |
| `apps/frontend-web/src/App.tsx` | 27 routes lazy-loaded |
| `apps/frontend-web/src/features/auth/authSaga.ts` | login/logout/fetchProfile |
| `apps/admin-dashboard/client/components/layout/adminSidebarData.ts` | 8 sections, 70+ items |
| `apps/admin-dashboard/client/lib/adminAuth.ts` | Token normalization đúng |
| `infra/scripts/deploy.sh` | Zero-downtime deploy |
| `infra/ecosystem.production.cjs` | PM2 tc-api + tc-admin |
| `infra/nginx/tc-gaming.live.conf` | Rate limit, gzip, proxy |

### ❌ Cần fix — danh sách cụ thể theo phase bên dưới

---

## PHASE 1 — Sửa lỗi cấu hình & wiring (Fix before anything else)

### Fix 1.1 — `.gitignore`: Thiếu `dist/` và các thư mục build

**Vấn đề:** `.gitignore` hiện tại chỉ ignore các path cũ (`frontend1/dist/`, `admin/dist/`, `frontend/dist/`).  
Build output thực tế của monorepo này (`apps/*/dist/`) sẽ bị commit lên git → repo bị nặng.

**File:** `game/.gitignore`

**Hành động:** Thêm các dòng sau vào cuối file (KHÔNG xóa gì hiện tại):
```
# Build outputs (monorepo apps)
apps/*/dist/
apps/backend/dist/
apps/frontend-web/dist/
apps/admin-dashboard/dist/

# pnpm
.pnpm-store/
pnpm-lock.yaml

# Coverage
coverage/
.nyc_output/
```

---

### Fix 1.2 — `vite.config.ts` admin: Hardcode domain sai

**Vấn đề:** `apps/admin-dashboard/vite.config.ts` dòng 27 hardcode `cuocbong99.live` thay vì `tc-gaming.live`.

**File:** `apps/admin-dashboard/vite.config.ts`

**Sửa dòng 27:**
```typescript
// TRƯỚC (sai):
'admin.cuocbong99.live,www.admin.cuocbong99.live,localhost,127.0.0.1'

// SAU (đúng):
'admin.tc-gaming.live,www.admin.tc-gaming.live,localhost,127.0.0.1'
```

---

### Fix 1.3 — `authService.ts`: Logic check token không nhất quán

**Vấn đề:** `apps/frontend-web/src/services/authService.ts` dòng 6 kiểm tra `response.data.accessToken` nhưng backend trả `{ user, token, tokens: { access: { token } } }`. Nếu backend trả `token` (không phải `accessToken`), đoạn normalization bị bỏ qua → `result.data.token` có thể undefined trong saga.

**File:** `apps/frontend-web/src/services/authService.ts`

**Sửa hàm `login` và `register`:**
```typescript
export const login = async (username: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> => {
  const response = await api.post<any, ApiResponse<any>>('/auth/login', { username, password })
  // Normalize: backend có thể trả token ở nhiều field khác nhau
  if (response.success && response.data) {
    const raw = response.data
    const resolved = raw?.token ?? raw?.accessToken ?? raw?.tokens?.access?.token
    if (resolved) response.data.token = resolved
  }
  return response
}

export const register = async (userData: any): Promise<ApiResponse<any>> => {
  const response = await api.post<any, ApiResponse<any>>('/auth/register', userData)
  if (response.success && response.data) {
    const raw = response.data
    const resolved = raw?.token ?? raw?.accessToken ?? raw?.tokens?.access?.token
    if (resolved) response.data.token = resolved
  }
  return response
}
```

---

### Fix 1.4 — `socket.ts`: Import `public-chat.service` (service đã biết missing)

**Vấn đề:** `apps/backend/src/socket.ts` import `publicChatService from '@main/services/public-chat.service'`.  
Service này KHÔNG tồn tại trong `src/main/services/` → build TypeScript fail.

**File:** `apps/backend/src/socket.ts`

**Hành động:** Đọc toàn bộ `socket.ts` trước. Sau đó thêm guard: nếu service không tồn tại, tạo stub tối thiểu:

Tạo file `apps/backend/src/main/services/public-chat.service.ts`:
```typescript
/**
 * Public chat service stub.
 * Cung cấp interface tối thiểu để socket.ts compile được.
 * TODO: Implement đầy đủ khi cần.
 */

const publicChatService = {
  async getRecentMessages(_roomId: string, _limit = 50): Promise<any[]> {
    return [];
  },
  async saveMessage(_data: { roomId: string; userId: string; message: string; role?: string }): Promise<any> {
    return null;
  },
};

export default publicChatService;
```

---

### Fix 1.5 — `main.tsx` frontend-web: Thiếu import CSS global

**Kiểm tra:** Đọc `apps/frontend-web/src/main.tsx`.  
Nếu không có `import './index.css'` hoặc `import './global.css'`, hãy kiểm tra file CSS nào tồn tại trong `src/` và thêm import đúng.

**Hành động:** Kiểm tra `apps/frontend-web/src/` có `index.css`, `global.css`, hay `app.css` không.  
Nếu có → đảm bảo `main.tsx` import nó.  
Nếu không có → tạo `apps/frontend-web/src/index.css` với nội dung tối thiểu:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Commit sau Phase 1

```bash
git -C /var/app/game add -A
git -C /var/app/game commit -m "fix: sửa lỗi cấu hình — gitignore, domain admin, authService token, public-chat stub"
```

---

## PHASE 2 — Chuẩn hóa & tối ưu

### Opt 2.1 — `package.json` root: Thêm script `build:sequential`

**Vấn đề:** `package.json` root hiện có `"build": "npm run build --workspaces --if-present"` — chạy **song song** tất cả workspace, dễ OOM trên VPS 4CPU/8GB.

**File:** `game/package.json`

**Sửa scripts:**
```json
{
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "build:seq": "npm run build -w apps/backend && npm run build -w apps/frontend-web && npm run build -w apps/admin-dashboard",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "typecheck:seq": "npm run typecheck -w apps/backend && npm run typecheck -w apps/frontend-web && npm run typecheck -w apps/admin-dashboard",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

---

### Opt 2.2 — `ecosystem.production.cjs`: Thêm env `NODE_OPTIONS` cho heap

**Vấn đề hiện tại:** `ecosystem.production.cjs` dùng `node_args` array nhưng PM2 đôi khi bỏ qua khi dùng `interpreter: 'node'`.  
Thêm `NODE_OPTIONS` vào `env` block để đảm bảo heap cap luôn được áp dụng.

**File:** `infra/ecosystem.production.cjs`

**Trong `env` block của `tc-api`, thêm:**
```javascript
env: {
  NODE_ENV: 'production',
  PORT: process.env.PORT || '8701',
  UV_THREADPOOL_SIZE: '8',
  NODE_OPTIONS: '--max-old-space-size=1024 --max-semi-space-size=64',
},
```

---

### Opt 2.3 — `deploy.sh`: Sửa lỗi comment trùng số dòng và thêm git pull

**Vấn đề:** `infra/scripts/deploy.sh` không có bước `git pull` → deploy script chạy trên VPS nhưng code không được cập nhật từ git.

**File:** `infra/scripts/deploy.sh`

**Thêm sau dòng `require_cmd npm` (sau bước kiểm tra lệnh), trước bước kiểm tra tài nguyên:**
```bash
# ---------------------------------------------------------------------------
# 1.5. Pull code mới nhất từ git
# ---------------------------------------------------------------------------
log "📥 Pull code mới nhất từ git..."
cd "$REPO_ROOT"
git fetch --all
git reset --hard origin/main
log "✅ Git pull xong. Commit: $(git rev-parse --short HEAD)"
```

---

### Commit sau Phase 2

```bash
git -C /var/app/game add -A
git -C /var/app/game commit -m "chore: tối ưu build scripts, ecosystem heap config, deploy git pull"
```

---

## PHASE 3 — GitHub Actions CI/CD Pipeline

### Yêu cầu GitHub Secrets (document trong workflow comments)
```
VPS_HOST       ← IP hoặc hostname VPS (ví dụ: 157.230.xxx.xxx)
VPS_USER       ← SSH user (root hoặc deploy)
VPS_SSH_KEY    ← Nội dung private key SSH (toàn bộ, bao gồm header/footer)
VPS_SSH_PORT   ← SSH port, mặc định 22 (optional)
```

---

### File 3.1: `.github/workflows/pr-check.yml`

Tạo file này với nội dung CHÍNH XÁC sau:

```yaml
# TC-Gaming — CI: Typecheck on Pull Request
# Chạy typecheck tuần tự cho 3 apps khi có PR vào main hoặc develop.
# Không build, không deploy — chỉ kiểm tra TypeScript.
name: PR Check

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'apps/**'
      - 'libs/**'
      - 'package.json'
      - 'package-lock.json'
      - 'tsconfig.base.json'

jobs:
  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Typecheck backend
        run: npm run typecheck -w apps/backend

      - name: Typecheck frontend-web
        run: npm run typecheck -w apps/frontend-web

      - name: Typecheck admin-dashboard
        run: npm run typecheck -w apps/admin-dashboard
```

---

### File 3.2: `.github/workflows/deploy.yml`

Tạo file này với nội dung CHÍNH XÁC sau:

```yaml
# TC-Gaming — CD: Build & Deploy to VPS on push to main
# Build tuần tự (không song song, tránh OOM CI runner).
# Deploy qua SSH: rsync dist → pm2 reload → health check.
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'apps/**'
      - 'libs/**'
      - 'infra/ecosystem.production.cjs'
      - 'package.json'
      - 'package-lock.json'

  # Cho phép chạy thủ công từ GitHub UI
  workflow_dispatch:

jobs:
  # ─────────────────────────────────────────────────────────────
  # JOB 1: Build (chạy trên GitHub runner — không tốn tài nguyên VPS)
  # ─────────────────────────────────────────────────────────────
  build:
    name: Build Apps
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install all dependencies
        run: npm ci --prefer-offline --no-audit

      # Build tuần tự — backend trước (tsc + tsc-alias)
      - name: Build backend
        run: npm run build -w apps/backend

      # Build frontend-web (vite)
      - name: Build frontend-web
        run: npm run build -w apps/frontend-web

      # Build admin-dashboard (vite)
      - name: Build admin-dashboard
        run: npm run build -w apps/admin-dashboard

      # Upload artifact để job deploy sử dụng
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          retention-days: 3
          path: |
            apps/backend/dist/
            apps/backend/package.json
            apps/backend/package-lock.json
            apps/frontend-web/dist/
            apps/admin-dashboard/dist/
            infra/ecosystem.production.cjs

  # ─────────────────────────────────────────────────────────────
  # JOB 2: Deploy (phụ thuộc build, chạy sau)
  # ─────────────────────────────────────────────────────────────
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: build
    timeout-minutes: 20
    environment: production

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output

      - name: Setup SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -p ${{ secrets.VPS_SSH_PORT || '22' }} ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts 2>/dev/null || true

      - name: Sync backend dist to VPS
        run: |
          rsync -avz --delete \
            -e "ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa" \
            apps/backend/dist/ \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/var/app/game/apps/backend/dist/

      - name: Sync frontend-web dist to VPS
        run: |
          rsync -avz --delete \
            -e "ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa" \
            apps/frontend-web/dist/ \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/var/app/game/apps/frontend-web/dist/

      - name: Sync admin-dashboard dist to VPS
        run: |
          rsync -avz --delete \
            -e "ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa" \
            apps/admin-dashboard/dist/ \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/var/app/game/apps/admin-dashboard/dist/

      - name: Sync PM2 ecosystem config
        run: |
          rsync -avz \
            -e "ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa" \
            infra/ecosystem.production.cjs \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/var/app/game/infra/ecosystem.production.cjs

      - name: Install backend production deps on VPS
        run: |
          ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} \
            -o StrictHostKeyChecking=no \
            -i ~/.ssh/id_rsa \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
            "cd /var/app/game/apps/backend && npm ci --omit=dev --prefer-offline --no-audit --loglevel=error"

      - name: Reload API (zero-downtime)
        run: |
          ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} \
            -o StrictHostKeyChecking=no \
            -i ~/.ssh/id_rsa \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
            "cd /var/app/game && pm2 reload infra/ecosystem.production.cjs --only tc-api --update-env"

      - name: Reload admin SPA (zero-downtime)
        run: |
          ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} \
            -o StrictHostKeyChecking=no \
            -i ~/.ssh/id_rsa \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
            "cd /var/app/game && pm2 reload infra/ecosystem.production.cjs --only tc-admin --update-env"

      - name: Health check with retry
        run: |
          ssh -p ${{ secrets.VPS_SSH_PORT || '22' }} \
            -o StrictHostKeyChecking=no \
            -i ~/.ssh/id_rsa \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
            "
            for i in 1 2 3 4 5; do
              if curl -sf http://127.0.0.1:8701/health > /dev/null; then
                echo '✅ Health check passed'
                exit 0
              fi
              echo \"⏳ Attempt \$i/5 failed, waiting 5s...\"
              sleep 5
            done
            echo '❌ Health check failed after 5 attempts'
            pm2 logs tc-api --lines 30 --nostream
            exit 1
            "

      - name: Cleanup SSH key
        if: always()
        run: rm -f ~/.ssh/id_rsa
```

---

### Commit sau Phase 3

```bash
git -C /var/app/game add .github/
git -C /var/app/game commit -m "ci: thêm GitHub Actions PR check và CD deploy pipeline"
```

---

## PHASE 4 — Smoke Test Script hoàn chỉnh

### File: `infra/test.sh` — Rewrite hoàn toàn

Script hiện tại chỉ có khung. Viết lại đầy đủ với 12 checks:

```bash
#!/bin/bash
# =============================================================================
# TC-GAMING SMOKE TEST — Kiểm tra toàn hệ thống sau deploy
# Cách dùng: bash /var/app/game/infra/test.sh [--local | --prod]
# Exit code: 0 = tất cả pass; 1 = có lỗi
# =============================================================================
set -euo pipefail

# ── Màu sắc ──────────────────────────────────────────────────────────────────
GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[1;33m"; BLUE="\033[0;34m"; NC="\033[0m"

# ── Biến ─────────────────────────────────────────────────────────────────────
PASS=0; FAIL=0; WARN=0
MODE="${1:---local}"
API_LOCAL="http://127.0.0.1:8701"
DOMAIN="tc-gaming.live"
ADMIN_DOMAIN="admin.tc-gaming.live"

ok()   { echo -e "${GREEN}✅ PASS${NC}  $*"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ FAIL${NC}  $*"; FAIL=$((FAIL+1)); }
warn() { echo -e "${YELLOW}⚠️  WARN${NC}  $*"; WARN=$((WARN+1)); }
info() { echo -e "${BLUE}ℹ️  INFO${NC}  $*"; }
hr()   { echo "────────────────────────────────────────────────────────────"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        TC-GAMING SMOKE TEST — $(date '+%Y-%m-%d %H:%M')         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── CHECK 1: PM2 processes running ───────────────────────────────────────────
hr; info "CHECK 1: PM2 Processes"
if pm2 list 2>/dev/null | grep -q "tc-api.*online"; then
  ok "tc-api đang chạy (online)"
else
  fail "tc-api KHÔNG chạy — chạy: pm2 start /var/app/game/infra/ecosystem.production.cjs"
fi

if pm2 list 2>/dev/null | grep -q "tc-admin.*online"; then
  ok "tc-admin đang chạy (online)"
else
  warn "tc-admin không chạy (có thể serve static qua Nginx thay thế)"
fi

# ── CHECK 2: API Health endpoint ─────────────────────────────────────────────
hr; info "CHECK 2: API Health (/health)"
HEALTH_RESP=$(curl -sf --max-time 5 "$API_LOCAL/health" 2>/dev/null || echo "FAIL")
if echo "$HEALTH_RESP" | grep -q '"status"'; then
  DB_STATUS=$(echo "$HEALTH_RESP" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
  REDIS_STATUS=$(echo "$HEALTH_RESP" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
  ok "Health endpoint phản hồi — DB: $DB_STATUS, Redis: $REDIS_STATUS"
  if [ "$DB_STATUS" != "connected" ]; then
    fail "MongoDB KHÔNG kết nối được — kiểm tra: sudo systemctl status mongod"
  fi
else
  fail "Health endpoint không phản hồi tại $API_LOCAL/health"
fi

# ── CHECK 3: API /api/health ─────────────────────────────────────────────────
hr; info "CHECK 3: API /api/health"
if curl -sf --max-time 5 "$API_LOCAL/api/health" > /dev/null 2>&1; then
  ok "/api/health OK"
else
  fail "/api/health không phản hồi"
fi

# ── CHECK 4: Auth endpoint (login endpoint tồn tại) ──────────────────────────
hr; info "CHECK 4: Auth endpoint POST /api/auth/login"
AUTH_RESP=$(curl -sf --max-time 5 -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test_nonexistent","password":"test"}' \
  "$API_LOCAL/api/auth/login" 2>/dev/null || echo "FAIL")
if echo "$AUTH_RESP" | grep -qE '"message"|"success"'; then
  ok "Auth endpoint phản hồi (kể cả lỗi login là bình thường)"
else
  fail "Auth endpoint không phản hồi hoặc bị crash"
fi

# ── CHECK 5: Frontend static files tồn tại ───────────────────────────────────
hr; info "CHECK 5: Frontend dist files"
FRONTEND_DIST="/var/app/game/apps/frontend-web/dist"
if [ -f "$FRONTEND_DIST/index.html" ]; then
  ok "Frontend index.html tồn tại"
  JS_COUNT=$(find "$FRONTEND_DIST/assets" -name "*.js" 2>/dev/null | wc -l)
  ok "Frontend JS chunks: $JS_COUNT files"
else
  fail "Frontend dist/index.html KHÔNG tồn tại — chạy: npm run build -w apps/frontend-web"
fi

# ── CHECK 6: Admin static files tồn tại ──────────────────────────────────────
hr; info "CHECK 6: Admin dist files"
ADMIN_DIST="/var/app/game/apps/admin-dashboard/dist"
if [ -f "$ADMIN_DIST/index.html" ]; then
  ok "Admin index.html tồn tại"
else
  fail "Admin dist/index.html KHÔNG tồn tại — chạy: npm run build -w apps/admin-dashboard"
fi

# ── CHECK 7: Nginx running ────────────────────────────────────────────────────
hr; info "CHECK 7: Nginx"
if systemctl is-active --quiet nginx 2>/dev/null; then
  ok "Nginx đang chạy"
else
  fail "Nginx KHÔNG chạy — chạy: sudo systemctl start nginx"
fi

if nginx -t 2>/dev/null; then
  ok "Nginx config hợp lệ"
else
  fail "Nginx config LỖI — chạy: sudo nginx -t để xem chi tiết"
fi

# ── CHECK 8: MongoDB running ──────────────────────────────────────────────────
hr; info "CHECK 8: MongoDB"
if systemctl is-active --quiet mongod 2>/dev/null; then
  ok "MongoDB đang chạy"
else
  fail "MongoDB KHÔNG chạy — chạy: sudo systemctl start mongod"
fi

# ── CHECK 9: Redis running ────────────────────────────────────────────────────
hr; info "CHECK 9: Redis"
if systemctl is-active --quiet redis-server 2>/dev/null || \
   systemctl is-active --quiet redis 2>/dev/null; then
  REDIS_PING=$(redis-cli ping 2>/dev/null || echo "FAIL")
  if [ "$REDIS_PING" = "PONG" ]; then
    ok "Redis đang chạy và phản hồi PONG"
  else
    warn "Redis service chạy nhưng không ping được"
  fi
else
  warn "Redis không chạy (hệ thống sẽ dùng fallback in-memory)"
fi

# ── CHECK 10: Disk space ──────────────────────────────────────────────────────
hr; info "CHECK 10: Disk Space"
DISK_USE=$(df -h /var/app 2>/dev/null | awk 'NR==2{print $5}' | sed 's/%//')
if [ "${DISK_USE:-0}" -lt 80 ]; then
  ok "Disk space OK (${DISK_USE}% dùng)"
elif [ "${DISK_USE:-0}" -lt 90 ]; then
  warn "Disk space cao (${DISK_USE}%) — cân nhắc dọn dẹp"
else
  fail "Disk space NGUY HIỂM (${DISK_USE}%) — cần dọn dẹp ngay!"
fi

# ── CHECK 11: RAM ─────────────────────────────────────────────────────────────
hr; info "CHECK 11: Memory"
MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_USED=$(free -m  | awk '/^Mem:/{print $3}')
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))
if [ "$MEM_PCT" -lt 75 ]; then
  ok "RAM OK (${MEM_USED}/${MEM_TOTAL} MB = ${MEM_PCT}%)"
elif [ "$MEM_PCT" -lt 85 ]; then
  warn "RAM cao (${MEM_PCT}%) — theo dõi memory leak"
else
  fail "RAM NGUY HIỂM (${MEM_PCT}%) — kiểm tra pm2 list và top"
fi

# ── CHECK 12: Backend env file ────────────────────────────────────────────────
hr; info "CHECK 12: Backend .env"
BACKEND_ENV="/var/app/game/apps/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
  if grep -q "CHANGE_ME" "$BACKEND_ENV"; then
    warn ".env có CHANGE_ME placeholder — đổi JWT_SECRET và password ngay!"
  else
    ok ".env tồn tại và không có CHANGE_ME"
  fi
else
  fail ".env KHÔNG tồn tại tại $BACKEND_ENV — copy từ .env.production và điền secrets"
fi

# ── KẾT QUẢ ─────────────────────────────────────────────────────────────────
hr
echo ""
echo -e "${BLUE}╔══════════════════════════════════╗${NC}"
echo -e "${BLUE}║         KẾT QUẢ SMOKE TEST       ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC}  ✅ PASS : ${GREEN}$PASS${NC}"
echo -e "${BLUE}║${NC}  ❌ FAIL : ${RED}$FAIL${NC}"
echo -e "${BLUE}║${NC}  ⚠️  WARN : ${YELLOW}$WARN${NC}"
echo -e "${BLUE}╚══════════════════════════════════╝${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ SMOKE TEST THẤT BẠI — $FAIL lỗi cần sửa trước khi serve traffic.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ SMOKE TEST THÀNH CÔNG — Hệ thống sẵn sàng.${NC}"
  exit 0
fi
```

---

### Commit sau Phase 4

```bash
git -C /var/app/game add infra/test.sh
git -C /var/app/game commit -m "test: viết lại smoke test script với 12 checks đầy đủ"
```

---

## PHASE 5 — Git workflow chuẩn hóa & push

### 5.1 Kiểm tra git remote

```bash
# Kiểm tra remote đã cấu hình chưa
git -C /var/app/game remote -v

# Nếu chưa có remote → thêm (thay YOUR_GITHUB_USER và YOUR_REPO_NAME):
# git -C /var/app/game remote add origin git@github.com:YOUR_GITHUB_USER/YOUR_REPO_NAME.git
```

### 5.2 Tạo `.gitconfig` nếu chưa có

```bash
# Kiểm tra
git -C /var/app/game config user.email

# Nếu chưa có
git config --global user.email "deploy@tc-gaming.live"
git config --global user.name "TC Gaming Deploy"
```

### 5.3 Push lên main

```bash
# Đảm bảo đang ở main
git -C /var/app/game checkout main 2>/dev/null || git -C /var/app/game checkout -b main

# Push tất cả commits (tất cả 4 phases)
git -C /var/app/game push origin main
```

### 5.4 Verify kết quả

```bash
# Xem 5 commit gần nhất
git -C /var/app/game log --oneline -5

# Chạy smoke test
bash /var/app/game/infra/test.sh
```

---

## Tóm tắt thứ tự thực hiện

```
Phase 1: Fix lỗi cấu hình → commit
    ├── Fix .gitignore (thêm apps/*/dist/)
    ├── Fix admin vite.config domain cuocbong99 → tc-gaming.live
    ├── Fix authService.ts token normalization
    ├── Tạo public-chat.service.ts stub
    └── Kiểm tra/thêm CSS import vào main.tsx

Phase 2: Chuẩn hóa → commit
    ├── Thêm build:seq + typecheck:seq vào root package.json
    ├── Thêm NODE_OPTIONS vào ecosystem.production.cjs env
    └── Thêm git pull vào deploy.sh

Phase 3: CI/CD Pipeline → commit
    ├── .github/workflows/pr-check.yml
    └── .github/workflows/deploy.yml

Phase 4: Smoke test → commit
    └── infra/test.sh (rewrite hoàn toàn, 12 checks)

Phase 5: Push lên git remote
    └── git push origin main
```

---

## Ràng buộc tuyệt đối (KHÔNG vi phạm)

1. **KHÔNG sửa** `authSlice.ts`, `rootSaga.ts`, `rootReducer.ts`, `adminAuth.ts`, `AuthProvider.tsx`
2. **KHÔNG thêm dependency mới** vào bất kỳ `package.json` nào
3. **KHÔNG thay đổi API contract** (endpoint paths, request/response shapes)
4. **KHÔNG chạy `npm install` hay `npm run build`** — chỉ viết/sửa file
5. **Mỗi phase phải commit** trước khi chuyển sang phase tiếp theo
6. **TypeScript only** — tất cả file mới phải là `.ts` hoặc `.tsx`
7. **`pm2 reload`** không phải `pm2 restart`
8. **`ag-callback` và `gs-callback`** đã mount trong `app.ts` — KHÔNG mount lại
