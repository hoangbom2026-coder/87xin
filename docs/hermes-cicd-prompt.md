# Hermes Agent — Task: GitHub Actions CI/CD Pipeline

## Trạng thái hiện tại (đã verify thực tế)

Các task P1–P3 đã HOÀN THÀNH bên ngoài:
- ✅ `apps/frontend-web/src/App.tsx` — 27 routes lazy-loaded, ProtectedRoute đầy đủ
- ✅ `apps/frontend-web/src/features/auth/authSaga.ts` — login/logout/fetchProfile saga
- ✅ `apps/admin-dashboard/client/components/layout/adminSidebarData.ts` — 8 sections, 70+ items
- ✅ `apps/frontend-web/src/services/siteService.ts` — getSiteData + getStorePackages

**Chỉ còn 1 task duy nhất: Tạo GitHub Actions CI/CD Pipeline**

---

## Task: Tạo GitHub Actions CI/CD Pipeline

### Files cần tạo
```
.github/workflows/pr-check.yml     ← CI: chạy trên mọi PR
.github/workflows/deploy.yml       ← CD: chạy khi merge vào main
```

---

## Thông tin VPS (đã xác minh trực tiếp)

| Thông số | Giá trị |
|----------|---------|
| OS | Ubuntu 24.04 LTS |
| Node.js | v22.23.2 |
| Package manager | npm workspaces (root `package.json`) |
| Deploy path | `/var/app/game` |
| PM2 process API | `tc-api` |
| PM2 process Admin | `tc-admin` |
| Backend port | `8701` |
| Admin preview port | `8781` |
| Frontend static dir | `/var/app/game/apps/frontend-web/dist` |
| Admin static dir | `/var/app/game/apps/admin-dashboard/dist` |
| Nginx serves | `tc-gaming.live` → frontend, `admin.tc-gaming.live` → `tc-admin` (vite preview) |
| Health check | `curl http://127.0.0.1:8701/health` |

---

## Cấu trúc monorepo (npm workspaces)

```
game/                              ← root (package.json có workspaces)
├── apps/
│   ├── backend/                   ← Express API, build: tsc → dist/
│   │   ├── tsconfig.json
│   │   ├── package.json           ← script: "build": "tsc", "typecheck": "tsc --noEmit"
│   │   └── src/
│   ├── frontend-web/              ← React SPA, build: vite → dist/
│   │   ├── vite.config.ts
│   │   └── package.json           ← script: "build": "vite build", "typecheck": "tsc --noEmit"
│   └── admin-dashboard/           ← React Admin SPA, build: vite → dist/
│       ├── vite.config.ts
│       └── package.json           ← script: "build": "vite build", "typecheck": "tsc --noEmit"
├── libs/
│   ├── shared-types/
│   ├── ui/
│   ├── db/
│   ├── cron/
│   └── i18n/
├── infra/
│   ├── ecosystem.production.cjs   ← PM2 config (tc-api + tc-admin)
│   ├── scripts/
│   │   ├── deploy.sh              ← deploy script (có thể gọi từ CD nếu cần)
│   │   └── rollback.sh
│   └── nginx/
│       └── tc-gaming.live.conf
└── .env.production                ← KHÔNG commit (trong .gitignore) — chỉ có trên VPS
```

---

## GitHub Secrets cần thiết (agent PHẢI document trong workflow)

```
VPS_HOST          ← IP hoặc domain của VPS (ví dụ: 157.230.xxx.xxx)
VPS_USER          ← SSH user (thường là root hoặc deploy)
VPS_SSH_KEY       ← Nội dung private key SSH (multiline)
VPS_SSH_PORT      ← SSH port (mặc định 22, optional)
```

---

## Yêu cầu chi tiết

### File 1: `.github/workflows/pr-check.yml`

**Trigger:** `pull_request` target `main` và `develop`

**Jobs:**
1. `typecheck` — chạy typecheck cho cả 3 apps
   - Node.js v22
   - Cache: `~/.npm` với key theo `package-lock.json` hash
   - Install: `npm ci` tại root (cài đủ workspaces)
   - Run **tuần tự** (không song song để tránh OOM trên CI runner):
     1. `npm run typecheck --workspace=apps/backend`
     2. `npm run typecheck --workspace=apps/frontend-web`
     3. `npm run typecheck --workspace=apps/admin-dashboard`

**Không cần:** lint, test (chưa có test suite), build (tốn thời gian trên PR)

---

### File 2: `.github/workflows/deploy.yml`

**Trigger:** `push` to `main` (sau khi PR merge)

**Điều kiện:** Chỉ chạy nếu có thay đổi trong các path sau (dùng `paths` filter):
```
apps/**
libs/**
infra/ecosystem.production.cjs
package.json
package-lock.json
```

**Jobs — phải chạy TUẦN TỰ (sequential), KHÔNG song song:**

#### Job 1: `build` (chạy trên GitHub CI runner)

```
Step 1: Checkout code
Step 2: Setup Node.js v22
Step 3: npm ci (cài đủ monorepo workspaces)
Step 4: Build backend    → apps/backend/dist/
Step 5: Build frontend   → apps/frontend-web/dist/
Step 6: Build admin      → apps/admin-dashboard/dist/
Step 7: Upload artifact  "build-output" gồm:
          - apps/backend/dist/
          - apps/frontend-web/dist/
          - apps/admin-dashboard/dist/
          - package.json (root)
          - apps/backend/package.json
          - infra/ecosystem.production.cjs
```

Lưu ý build tuần tự:
```yaml
- name: Build backend
  run: npm run build --workspace=apps/backend
- name: Build frontend-web
  run: npm run build --workspace=apps/frontend-web
- name: Build admin-dashboard
  run: npm run build --workspace=apps/admin-dashboard
```

#### Job 2: `deploy` (phụ thuộc `build`, chạy sau)

```
Step 1: Download artifact "build-output"
Step 2: Setup SSH key từ VPS_SSH_KEY secret
Step 3: rsync dist + configs lên VPS (chi tiết bên dưới)
Step 4: SSH — npm install --production (backend only)
Step 5: SSH — pm2 reload tc-api (không restart — zero downtime)
Step 6: SSH — copy frontend dist → /var/app/game/apps/frontend-web/dist
Step 7: SSH — pm2 reload tc-admin (vite preview)
Step 8: SSH — health check với retry (3 lần, delay 5s)
Step 9: SSH — dọn dẹp tmp files
```

**rsync command:**
```bash
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  ./apps/backend/dist/ $VPS_USER@$VPS_HOST:/var/app/game/apps/backend/dist/

rsync -avz --delete \
  ./apps/frontend-web/dist/ $VPS_USER@$VPS_HOST:/var/app/game/apps/frontend-web/dist/

rsync -avz --delete \
  ./apps/admin-dashboard/dist/ $VPS_USER@$VPS_HOST:/var/app/game/apps/admin-dashboard/dist/

# Copy ecosystem config nếu có thay đổi
rsync -avz \
  ./infra/ecosystem.production.cjs \
  $VPS_USER@$VPS_HOST:/var/app/game/infra/ecosystem.production.cjs
```

**Health check SSH script:**
```bash
for i in 1 2 3; do
  if curl -sf http://127.0.0.1:8701/health; then
    echo "✅ Health check passed"
    exit 0
  fi
  echo "⏳ Attempt $i failed, retrying in 5s..."
  sleep 5
done
echo "❌ Health check failed after 3 attempts"
exit 1
```

---

## Ràng buộc QUAN TRỌNG

1. **KHÔNG dùng `npm run build` tại root** — monorepo root build tất cả cùng lúc, sẽ OOM trên CI
2. **Build TUẦN TỰ**: backend → frontend-web → admin-dashboard
3. **KHÔNG commit `.env.production`** — file này chỉ tồn tại trên VPS tại `/var/app/game/apps/backend/.env`
4. **`pm2 reload`** chứ KHÔNG phải `pm2 restart` — zero downtime
5. **SSH strictHostKeyChecking disabled** cho CI: `-o StrictHostKeyChecking=no`
6. **VPS SSH key** phải dùng `webfactory/ssh-agent` hoặc manual `ssh-add` trong workflow
7. **Không thêm `--force` hay `--legacy-peer-deps`** vào npm install
8. **Backend `npm install --production`** chỉ cài production deps (không devDependencies)
9. **Artifact retention**: 3 days (tiết kiệm GitHub storage)

---

## Sử dụng Actions chuẩn (không custom)

```yaml
uses: actions/checkout@v4
uses: actions/setup-node@v4
uses: actions/cache@v4
uses: actions/upload-artifact@v4
uses: actions/download-artifact@v4
```

Dùng `appleboy/ssh-action` cho SSH commands hoặc manual ssh với key setup.

---

## Kết quả kỳ vọng

Sau khi agent tạo xong:
1. Mở PR → `pr-check.yml` chạy typecheck 3 apps, báo pass/fail
2. Merge PR vào `main` → `deploy.yml` chạy:
   - Build tuần tự 3 apps
   - rsync dist lên VPS
   - npm install --production
   - pm2 reload (zero downtime)
   - Health check pass
3. Workflow hiển thị ✅ trong GitHub Actions tab
4. Nếu health check fail → workflow exit code 1 → developer nhận notification

---

## Không cần làm

- ❌ Docker / containerization
- ❌ Kubernetes / ECS
- ❌ Staging environment (chưa có)
- ❌ Database migration steps (MongoDB schema-less)
- ❌ Slack/Discord notification (chưa config)
- ❌ E2E tests trong pipeline (chưa có test suite)
- ❌ Sửa bất kỳ file nào ngoài `.github/workflows/`

---

## Context bổ sung

- `authService.ts` dùng `api.post('/auth/login')` — backend trả `{ user, token, tokens: { access: { token } } }`
- Admin `adminAuth.ts` đã normalize token đúng: `raw?.accessToken ?? raw?.token ?? raw?.tokens?.access?.token`
- `ecosystem.production.cjs` có 2 apps: `tc-api` (port 8701) và `tc-admin` (port 8781)
- Nginx reverse proxy: `/api/*` → port 8701, `admin.tc-gaming.live` → port 8781
- Frontend SPA tại: `/var/app/game/apps/frontend-web/dist` (served trực tiếp bởi Nginx)
