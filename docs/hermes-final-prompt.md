# Hermes Agent — Final Prompt: Fix Bugs + Commit Git + Deploy Ready

> **Đây là prompt thực thi cuối cùng.**
> Chỉ làm đúng những gì được liệt kê. Mỗi phase commit ngay sau khi xong.
> Không refactor, không thêm tính năng, không sửa gì ngoài danh sách này.

---

## Trạng thái Git thực tế (đã verify)

```
git log --oneline:
  025f98b refactor: restructure monorepo
  bc0759e first commit

Có hàng trăm file M/AM/?? chưa được commit.
.github/workflows/ đã tạo nhưng là untracked (??).
```

**Mục tiêu sau khi hoàn thành:** tất cả file được commit sạch lên `main`, hệ thống build được.

---

## PHASE 1 — Sửa 5 lỗi cụ thể (thực hiện trước khi commit)

### Fix 1: `authService.ts` — Token normalization sai logic

**Vấn đề:** Dòng 6 chỉ check `accessToken`, nhưng backend trả `{ token, tokens.access.token }`.
Nếu backend trả `token` mà không có `accessToken` → normalize bị bỏ qua → `result.data.token` là undefined → authSaga dispatch `setToken(undefined)`.

**File:** `apps/frontend-web/src/services/authService.ts`

**Sửa chính xác** (thay thế toàn bộ 2 function `login` và `register`):

```typescript
export const login = async (username: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> => {
  const response = await api.post<any, ApiResponse<any>>('/auth/login', { username, password })
  if (response.success && response.data) {
    const raw = response.data
    // Backend trả token ở nhiều field — normalize về .token
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

### Fix 2: `vite.config.ts` admin — Domain hardcode sai

**Vấn đề:** Dòng 27 hardcode `admin.cuocbong99.live` → vite preview từ chối kết nối từ `admin.tc-gaming.live`.

**File:** `apps/admin-dashboard/vite.config.ts`

**Sửa dòng 27:**
```typescript
// TRƯỚC:
'admin.cuocbong99.live,www.admin.cuocbong99.live,localhost,127.0.0.1'

// SAU:
'admin.tc-gaming.live,www.admin.tc-gaming.live,localhost,127.0.0.1'
```

---

### Fix 3: `public-chat.service.ts` — Service bị thiếu, build fail

**Vấn đề:** `apps/backend/src/socket.ts` import và dùng các method sau từ `public-chat.service`:
- `publicChatService.PUBLIC_CHAT_ROOM` (constant string)
- `publicChatService.broadcastOnlineCount()` (async function, không throw)
- `publicChatService.createUserMessage(userId, { content, level })` (async, trả message object)

Service này **KHÔNG TỒN TẠI** → TypeScript build fail hoàn toàn.

**Tạo file mới:** `apps/backend/src/main/services/public-chat.service.ts`

```typescript
/**
 * Public chat service.
 * Quản lý tin nhắn chat công khai và phát số lượng user online.
 * Socket.ts phụ thuộc service này — phải implement đúng interface.
 */
import mongoose, { Document, Schema } from 'mongoose';

// ─── Model (inline để tránh circular dep) ────────────────────────────────────
interface IPublicMessage extends Document {
    userId: mongoose.Types.ObjectId | string;
    content: string;
    level: number;
    createdAt: Date;
}

const PublicMessageSchema = new Schema<IPublicMessage>(
    {
        userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, maxlength: 500 },
        level:   { type: Number, default: 1, min: 1, max: 99 },
    },
    { timestamps: true }
);

const PublicMessageModel =
    mongoose.models['PublicMessage'] ??
    mongoose.model<IPublicMessage>('PublicMessage', PublicMessageSchema);

// ─── Service ─────────────────────────────────────────────────────────────────
const PUBLIC_CHAT_ROOM = 'public-chat';

async function createUserMessage(
    userId: string,
    payload: { content: string; level?: number }
): Promise<IPublicMessage> {
    const msg = await PublicMessageModel.create({
        userId,
        content: String(payload.content ?? '').trim().slice(0, 500),
        level:   Number(payload.level) || 1,
    });
    return msg;
}

async function getRecentMessages(limit = 50): Promise<IPublicMessage[]> {
    return PublicMessageModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean() as unknown as IPublicMessage[];
}

/**
 * Phát số lượng user đang online qua global.io.
 * Không throw — gọi từ socket event handler, lỗi im lặng.
 */
function broadcastOnlineCount(): Promise<void> {
    return Promise.resolve().then(() => {
        try {
            if (!global.io) return;
            const room = global.io.sockets.adapter.rooms.get(PUBLIC_CHAT_ROOM);
            const count = room ? room.size : 0;
            global.io.to(PUBLIC_CHAT_ROOM).emit('public-chat:online', { count });
        } catch {
            // fail silently
        }
    });
}

const publicChatService = {
    PUBLIC_CHAT_ROOM,
    createUserMessage,
    getRecentMessages,
    broadcastOnlineCount,
};

export default publicChatService;
```

---

### Fix 4: `.gitignore` — Thiếu build output của monorepo

**Vấn đề:** `.gitignore` hiện ignore `frontend1/dist/`, `admin/dist/` (path cũ) nhưng KHÔNG ignore `apps/*/dist/` → build output sẽ bị commit → repo nặng hàng trăm MB.

**File:** `.gitignore`

**Thêm vào cuối file** (không xóa nội dung cũ):
```gitignore
# Build outputs — monorepo apps (thêm vào, path cũ đã có ở trên)
apps/*/dist/
apps/backend/dist/
apps/frontend-web/dist/
apps/admin-dashboard/dist/

# Coverage & test output
coverage/
.nyc_output/
apps/backend/src/main/services/__tests__/coverage/

# pnpm (nếu dùng)
.pnpm-store/
```

---

### Fix 5: `main.tsx` frontend-web — Thiếu CSS import

**Vấn đề:** `apps/frontend-web/src/main.tsx` không import CSS nào → Tailwind classes không được áp dụng → giao diện trắng hoàn toàn khi deploy.

**Kiểm tra:** Chạy `ls apps/frontend-web/src/*.css` — nếu không có file nào → tạo mới.

**Tạo file:** `apps/frontend-web/src/index.css`
```css
/* TC Gaming — Global Styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0d131c; }
::-webkit-scrollbar-thumb { background: #2a3a52; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #3a5070; }

/* Selection color */
::selection { background: rgba(251, 191, 36, 0.3); }
```

**Sửa file:** `apps/frontend-web/src/main.tsx` — thêm import ở dòng 1:
```typescript
import './index.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
```

---

## PHASE 2 — Kiểm tra CI/CD workflows đã đúng chưa

Workflows đã tồn tại tại `.github/workflows/deploy.yml` và `pr-check.yml` (untracked).

**Kiểm tra 2 điểm quan trọng trong `deploy.yml`:**

1. **Backend không chạy `npm install --production` trên VPS trước `pm2 reload`** — cần thêm bước này. Đọc file `deploy.yml` hiện tại. Nếu thiếu bước SSH install production deps → thêm step sau bước rsync, trước pm2 reload:

```yaml
- name: Install backend production dependencies on VPS
  run: |
    ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST \
      "cd $DEPLOY_PATH/apps/backend && npm ci --omit=dev --prefer-offline --no-audit --loglevel=error 2>&1 | tail -5"
```

2. **`webfactory/ssh-agent@v0.9.0`** — đảm bảo version này tồn tại. Nếu không chắc, đổi sang cách thủ công:
```yaml
- name: Setup SSH key
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
```
Rồi thay toàn bộ rsync/ssh commands thêm `-i ~/.ssh/id_rsa`.

---

## PHASE 3 — Git: Stage + Commit tất cả theo nhóm

> **Quan trọng:** Không commit tất cả cùng lúc. Tách thành 4 commit rõ ràng.

### Bước 3.1 — Cấu hình git author (nếu chưa có)
```bash
cd /var/app/game
git config user.email "deploy@tc-gaming.live" 2>/dev/null || true
git config user.name "TC Gaming" 2>/dev/null || true
```

### Bước 3.2 — Commit 1: Infrastructure & Config
```bash
cd /var/app/game
git add \
  .gitignore \
  .prettierrc \
  .eslintrc.cjs \
  eslint.config.mjs \
  tsconfig.base.json \
  package.json \
  package-lock.json \
  infra/ \
  libs/

git commit -m "chore: infra scripts, nginx, PM2 config, libs (db/cron/i18n/ui/shared-types)"
```

### Bước 3.3 — Commit 2: Backend fixes
```bash
cd /var/app/game
git add \
  apps/backend/src/ \
  apps/backend/package.json \
  apps/backend/tsconfig.json \
  apps/backend/vitest.config.ts 2>/dev/null || true

git commit -m "feat(backend): routes.ts đầy đủ 57 router, public-chat service, config, middlewares"
```

### Bước 3.4 — Commit 3: Frontend fixes
```bash
cd /var/app/game
git add \
  apps/frontend-web/

git commit -m "feat(frontend): App.tsx routing, authSaga, authService token fix, index.css"
```

### Bước 3.5 — Commit 4: Admin Dashboard
```bash
cd /var/app/game
git add \
  apps/admin-dashboard/

git commit -m "feat(admin): sidebar 70+ items, vite.config domain fix, pages + components"
```

### Bước 3.6 — Commit 5: CI/CD Pipeline
```bash
cd /var/app/game
git add .github/
git add docs/

git commit -m "ci: GitHub Actions deploy.yml + pr-check.yml + docs"
```

### Bước 3.7 — Verify và push
```bash
cd /var/app/game

# Kiểm tra không còn file untracked quan trọng
git status --short | grep "^??" | grep -v "node_modules" | grep -v "dist/" | grep -v ".env"

# Xem log
git log --oneline -8

# Push lên remote (thay bằng remote đúng nếu cần)
git push origin main
```

---

## PHASE 4 — Chạy build test để xác nhận không có lỗi compile

> Thực hiện trên VPS `/var/app/game`. Mục đích: xác nhận code build được trước khi CI/CD chạy.

```bash
cd /var/app/game

# Cài deps (cần cho build)
npm ci --prefer-offline --no-audit 2>&1 | tail -5

# Test build backend (quan trọng nhất — có public-chat.service mới)
npm run build -w apps/backend 2>&1 | tail -30

# Nếu backend build pass → test frontend
npm run build -w apps/frontend-web 2>&1 | tail -20

# Nếu frontend pass → test admin
npm run build -w apps/admin-dashboard 2>&1 | tail -20
```

**Nếu backend build lỗi:**
- `Cannot find module '@main/services/public-chat.service'` → Fix 3 chưa được áp dụng đúng
- `Property 'PUBLIC_CHAT_ROOM' does not exist` → Service thiếu export constant
- `Cannot find module '@game/cron'` → Kiểm tra `libs/cron/index.ts` tồn tại

**Nếu frontend build lỗi:**
- `Cannot find module './index.css'` → Fix 5 chưa tạo file
- `Module not found: socket.io-client` → Kiểm tra package.json

---

## PHASE 5 — Smoke test sau deploy

```bash
# Khởi động hệ thống (nếu chưa chạy)
cd /var/app/game

# Copy env (chỉ lần đầu)
[ -f apps/backend/.env ] || cp .env.production apps/backend/.env

# Start MongoDB nếu chưa chạy
sudo systemctl start mongod

# Start PM2
pm2 startOrReload infra/ecosystem.production.cjs --update-env

# Chạy smoke test
bash infra/test.sh
```

**Kết quả kỳ vọng:**
```
✅ PASS  tc-api đang chạy (online)
✅ PASS  Health endpoint phản hồi — DB: connected, Redis: connected
✅ PASS  /api/health OK
✅ PASS  Auth endpoint phản hồi
✅ PASS  Frontend index.html tồn tại
✅ PASS  Admin index.html tồn tại
✅ PASS  Nginx đang chạy
✅ PASS  Nginx config hợp lệ
✅ PASS  MongoDB đang chạy
✅ PASS  Redis đang chạy và phản hồi PONG
✅ PASS  Disk space OK
✅ PASS  RAM OK
```

---

## Tóm tắt thứ tự thực hiện

```
1. Fix authService.ts       → token normalization đúng
2. Fix vite.config.ts admin → domain tc-gaming.live
3. Tạo public-chat.service.ts → build backend được
4. Fix .gitignore           → thêm apps/*/dist/
5. Tạo index.css + fix main.tsx → CSS Tailwind load được
6. Kiểm tra/sửa deploy.yml nếu thiếu npm install step
7. Git commit 5 lần theo nhóm → git push origin main
8. Build test tại chỗ: npm run build -w apps/backend
9. Chạy pm2 startOrReload + smoke test
```

---

## Ràng buộc tuyệt đối

- **KHÔNG** sửa `authSlice.ts`, `rootSaga.ts`, `rootReducer.ts`, `adminAuth.ts`, `AuthProvider.tsx`
- **KHÔNG** thêm package mới vào `package.json` (dùng mongoose đã có trong backend deps)
- **KHÔNG** thay đổi API contract (endpoint paths, response shape)
- **KHÔNG** chạy `npm run build` toàn bộ monorepo song song (dùng `-w` từng app)
- **`pm2 reload`** không phải `pm2 restart`
- **`ag-callback` + `gs-callback`** đã mount trong `app.ts` — không mount lại
- Commit phải có message mô tả rõ ràng theo convention: `type(scope): mô tả`
