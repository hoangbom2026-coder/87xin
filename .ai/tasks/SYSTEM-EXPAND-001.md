# SYSTEM-EXPAND-001 — Amplifiers: Sentry + Playwright + Renovate + Prompt-as-Code

### Task ID: SYSTEM-EXPAND-001
### Title: Cài đặt 4 công cụ khuếch đại năng suất hệ thống
### Priority: 🟠 HIGH
### Author: BOB | 2026-09-05
### Đọc trước: `docs/master/ARCH_BLUEPRINT.md`

---

## 📊 TRẠNG THÁI HIỆN TẠI (Evidence-Based)

| Công cụ | Hiện tại | Cần làm |
|---|---|---|
| Sentry (error tracking) | ❌ Chưa có — `instrument.ts` không tồn tại | Cài cho backend + admin |
| Playwright (E2E test) | ❌ Chưa có — `playwright.config.ts` không tồn tại | Setup + viết 3 test critical |
| Renovate Bot | ❌ Chưa có — `.github/renovate.json` không tồn tại | Cấu hình auto-PR |
| Prompt-as-Code | ❌ Chưa có — `docs/master/prompts/` không tồn tại | Di chuyển tất cả prompts |
| CI: test trong deploy | ❌ `deploy.yml` không chạy test trước khi deploy | Thêm test gate |

**Đánh giá code thực tế đã quan sát:**
- `app.ts` đã có `helmet`, CORS strict, body limit 10mb, `/health` endpoint → nền tảng tốt
- Error handler `errorConverter` + `errorHandler` đã có → Sentry chỉ cần hook vào đây
- `nowpay.controller.ts` đã dùng `catchAsync` + `ApiError` — pattern chuẩn
- CI workflow `pr-check.yml` đã có typecheck + lint + test → chất lượng tốt
- `deploy.yml` chạy healthcheck sau deploy → infrastructure tốt
- **Thiếu:** Sentry capture exceptions ở `errorHandler`, test E2E, auto-update deps

---

## ═══════════════════════════════════
## PHASE A — SENTRY (Ưu tiên cao nhất)
## ═══════════════════════════════════

### [SENTRY-001] Cài Sentry cho Backend

**DSN:** Lấy từ `process.env.SENTRY_DSN` (thêm vào `.env.production` và GitHub Secrets)

**Bước 1 — Cài package:**
```bash
cd apps/backend && npm install @sentry/node @sentry/profiling-node
```

**Bước 2 — Tạo `apps/backend/src/instrument.ts`:**
```typescript
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        console.warn('[Sentry] SENTRY_DSN not set — skipping initialization');
        return;
    }
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'production',
        integrations: [nodeProfilingIntegration()],
        tracesSampleRate: 0.1,   // 10% traces — tiết kiệm quota
        profilesSampleRate: 0.1,
        // Bỏ qua lỗi không quan trọng
        ignoreErrors: [
            'ECONNRESET',
            'ECONNREFUSED',
        ],
    });
    console.log('[Sentry] Initialized for environment:', process.env.NODE_ENV);
}
```

**Bước 3 — Import trong `apps/backend/src/index.ts`:**
```typescript
// PHẢI là dòng đầu tiên — trước mọi import khác
import './instrument';
import { initSentry } from './instrument';
initSentry();
// ... các import khác
```

**Bước 4 — Hook Sentry vào `apps/backend/src/middlewares/error.ts`:**
```typescript
import * as Sentry from '@sentry/node';

// Trong errorHandler, TRƯỚC khi res.status(...).json(...):
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Capture 5xx errors to Sentry (không capture 4xx — đó là lỗi của client)
    if (err.statusCode >= 500 || !err.isOperational) {
        Sentry.captureException(err, {
            extra: {
                url: req.url,
                method: req.method,
                requestId: req.headers['x-request-id'],
            },
        });
    }
    // ... phần còn lại của handler giữ nguyên
};
```

**Bước 5 — Thêm vào `apps/backend/src/config/index.ts`:**
```typescript
sentryDsn: process.env.SENTRY_DSN || '',
```

**Verify:**
```bash
cd /var/app/game
grep -n "initSentry\|@sentry/node" apps/backend/src/index.ts  # → có
grep -n "captureException" apps/backend/src/middlewares/error.ts  # → có
npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l  # → 0
```

---

### [SENTRY-002] Cài Sentry cho Admin Dashboard

**Bước 1 — Cài package:**
```bash
cd apps/admin-dashboard && npm install @sentry/react
```

**Bước 2 — Tạo `apps/admin-dashboard/client/instrument.ts`:**
```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return;
    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.05,
        replaysOnErrorSampleRate: 1.0,  // replay khi có lỗi
    });
}
```

**Bước 3 — Import trong `apps/admin-dashboard/client/main.tsx` (hoặc App entry):**
```typescript
import './instrument';
import { initSentry } from './instrument';
initSentry();
```

**Bước 4 — Thêm vào `.env.production` (không commit giá trị thật):**
```
SENTRY_DSN=                          # Backend Sentry DSN
VITE_SENTRY_DSN=                     # Admin Frontend Sentry DSN
```

**Tạo `docs/master/SENTRY_SETUP.md`** — hướng dẫn lấy DSN từ sentry.io:
```markdown
# SENTRY SETUP GUIDE

## 1. Tạo project Sentry
- Vào https://sentry.io → New Project
- Platform: Node.js (cho backend), React (cho admin)
- Lấy DSN từ Project Settings → Client Keys

## 2. Thêm GitHub Secrets
- SENTRY_DSN: DSN của backend project
- VITE_SENTRY_DSN: DSN của admin project

## 3. Hermes workflow khi nhận Sentry alert
Khi Sentry báo lỗi mới:
"Hermes, đọc Sentry issue [ID] và tạo task FIX-[ID].md trong .ai/tasks/"
```

---

## ═══════════════════════════════════
## PHASE B — PLAYWRIGHT (E2E Testing)
## ═══════════════════════════════════

### [E2E-001] Setup Playwright tại root

**Bước 1 — Cài:**
```bash
cd /var/app/game && npm install -D @playwright/test
npx playwright install chromium  # chỉ cài chromium, đủ dùng
```

**Bước 2 — Tạo `playwright.config.ts` tại root:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: 1,
    workers: 1,  // 1 worker — tránh overload VPS
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
        screenshot: 'only-on-failure',  // chụp ảnh khi fail
        video: 'off',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
```

**Bước 3 — Tạo `docs/11-testing/E2E_PLAYWRIGHT_PLAN.md`:**
```markdown
# E2E Testing Plan — Playwright

## Critical User Flows (ưu tiên test)
1. Login flow — đăng nhập thành công/thất bại
2. Deposit flow — tạo lệnh nạp tiền
3. VIP page — hiển thị đúng level

## Test Files
e2e/
├── auth/
│   └── login.spec.ts
├── financial/
│   └── deposit.spec.ts
└── vip/
    └── vip-page.spec.ts

## Chạy test
npm run test:e2e                     # chạy tất cả
npm run test:e2e -- --grep "login"   # chỉ test login
```

**Bước 4 — Tạo 3 test files critical:**

`e2e/auth/login.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('should show login form', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('textbox', { name: /username|email/i })).toBeVisible();
    });

    test('should show error with wrong credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByRole('textbox', { name: /username/i }).fill('wronguser');
        await page.getByRole('textbox', { name: /password/i }).fill('wrongpass');
        await page.getByRole('button', { name: /login|đăng nhập/i }).click();
        await expect(page.getByText(/error|lỗi|invalid|sai/i)).toBeVisible({ timeout: 5000 });
    });
});
```

`e2e/vip/vip-page.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('VIP page loads without error', async ({ page }) => {
    await page.goto('/vip');
    // Không có 500 error
    await expect(page).not.toHaveTitle(/error|500/i);
    // Có content
    await expect(page.locator('body')).not.toBeEmpty();
});
```

**Bước 5 — Thêm script vào `package.json` root:**
```json
"test:e2e": "playwright test",
"test:e2e:report": "playwright show-report"
```

**Verify:**
```bash
cd /var/app/game
ls e2e/  # → có auth/, vip/
cat playwright.config.ts | grep "testDir"  # → './e2e'
```

---

## ═══════════════════════════════════
## PHASE C — RENOVATE BOT
## ═══════════════════════════════════

### [RENOVATE-001] Cấu hình Renovate cho GitHub repo

**Tạo `.github/renovate.json`:**
```json
{
    "$schema": "https://docs.renovatebot.com/renovate-schema.json",
    "extends": ["config:recommended"],
    "timezone": "Asia/Ho_Chi_Minh",
    "schedule": ["before 6am on monday"],
    "labels": ["dependencies", "automated"],
    "assignees": [],
    "reviewers": [],
    "packageRules": [
        {
            "matchUpdateTypes": ["patch", "minor"],
            "matchPackagePatterns": ["*"],
            "groupName": "non-major dependencies",
            "automerge": false
        },
        {
            "matchUpdateTypes": ["major"],
            "groupName": "major updates",
            "automerge": false,
            "labels": ["dependencies", "major", "needs-review"]
        },
        {
            "matchPackageNames": ["mongoose", "express", "socket.io"],
            "stabilityDays": 7,
            "labels": ["dependencies", "critical"]
        }
    ],
    "ignorePaths": [
        "**/node_modules/**",
        "**/dist/**"
    ]
}
```

**Kích hoạt:**
- Vào github.com → repo → Settings → GitHub Apps → Renovate → Install
- Hoặc: github.com/apps/renovate → Install on repo

**Tạo `docs/master/RENOVATE_GUIDE.md`:**
```markdown
# Renovate Bot Guide

## Quy trình khi Renovate tạo PR
1. Renovate tạo PR "Update dependency X from vA to vB"
2. CI pr-check.yml tự chạy: typecheck + lint + test
3. Nếu CI xanh → Review PR: "Hermes, review PR #[N] từ Renovate"
4. Hermes kiểm tra CHANGELOG + breaking changes → approve hoặc reject
5. Merge nếu OK

## Lịch chạy: Thứ 2, trước 6:00 AM (GMT+7)
```

---

## ═══════════════════════════════════
## PHASE D — PROMPT-AS-CODE
## ═══════════════════════════════════

### [PROMPT-001] Di chuyển tất cả prompts vào `docs/master/prompts/`

**Tạo cấu trúc:**
```
docs/master/prompts/
├── README.md              ← Index + hướng dẫn dùng
├── session-init.md        ← Lệnh khởi động Hermes mỗi phiên
├── sprint-template.md     ← Template cho mọi sprint
├── audit-typescript.md    ← Lệnh audit TS errors
├── audit-security.md      ← Lệnh audit security
├── audit-ui.md            ← Lệnh audit UI standards
├── fix-task.md            ← Template tạo task fix từ bug report
└── sentry-to-task.md      ← Lệnh chuyển Sentry issue → task spec
```

**Di chuyển:** Copy nội dung từ `.ai/AGENT_COMMANDS.md` và `.ai/prompts/` vào đây, chuẩn hóa format.

**Tạo `docs/master/prompts/README.md`:**
```markdown
# Prompt-as-Code — Thư Viện Lệnh Chuẩn

Mọi lệnh/prompt dùng để điều khiển Hermes đều lưu tại đây.
Không dán prompt tự phát — luôn dùng template từ thư mục này.

## Dùng như thế nào
"Hermes, sử dụng template docs/master/prompts/fix-task.md cho issue này"

## Index
| File | Mục đích |
|---|---|
| session-init.md | Khởi động phiên làm việc mới |
| sprint-template.md | Bắt đầu một sprint mới |
| audit-typescript.md | Kiểm tra TS health |
| sentry-to-task.md | Chuyển Sentry alert → task spec |
```

**Tạo `docs/master/prompts/sentry-to-task.md`:**
```markdown
[HERMES - SENTRY-TO-TASK]

Hermes, một lỗi production vừa được báo từ Sentry.
Issue ID: [SENTRY_ISSUE_ID]
Error: [ERROR_MESSAGE]
File: [FILE_PATH]:[LINE]

Nhiệm vụ:
1. Đọc stack trace: [PASTE_STACK_TRACE]
2. Tìm file bị lỗi trong codebase
3. Phân tích root cause
4. Tạo task spec tại .ai/tasks/FIX-[SENTRY_ISSUE_ID].md
5. Báo cáo: "Task FIX-[ID] đã tạo. Root cause: [mô tả ngắn]"
```

---

## ═══════════════════════════════════
## PHASE E — CI UPGRADE
## ═══════════════════════════════════

### [CI-001] Thêm E2E test gate vào deploy.yml

**Thêm job `e2e` vào `.github/workflows/deploy.yml`** — chạy TRƯỚC khi deploy:

```yaml
  e2e:
    name: E2E Smoke Test
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Install Playwright
        run: npx playwright install chromium --with-deps
      - name: Start dev server
        run: npm run dev --workspace=apps/frontend-web &
        env:
          VITE_API_URL: http://localhost:8701
      - name: Wait for server
        run: npx wait-on http://localhost:5173 --timeout 30000
      - name: Run E2E tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

**Cập nhật `deploy` job** — thêm `needs: [build, e2e]`:
```yaml
  deploy:
    needs: [build, e2e]   # ← thêm e2e vào đây
```

---

## ═══════════════════════════════════
## THỨ TỰ THỰC HIỆN
## ═══════════════════════════════════

```
NGAY (Impact cao nhất):
  1. [SENTRY-001] Backend Sentry instrument.ts + errorHandler hook
  2. [SENTRY-002] Admin Sentry + SENTRY_SETUP.md
  3. [RENOVATE-001] .github/renovate.json

SAU (Cần environment):
  4. [E2E-001] playwright.config.ts + 3 test files
  5. [PROMPT-001] docs/master/prompts/ directory + files
  6. [CI-001] deploy.yml E2E gate
```

---

## VERIFICATION CHECKLIST

```bash
cd /var/app/game

# Sentry
grep -n "captureException" apps/backend/src/middlewares/error.ts    # → có
grep -rn "@sentry/node" apps/backend/package.json                   # → có
ls apps/backend/src/instrument.ts                                   # → tồn tại

# Playwright
ls playwright.config.ts                                              # → tồn tại
ls e2e/auth/login.spec.ts                                           # → tồn tại
npm run test:e2e 2>&1 | grep -E "passed|failed"                    # → passed

# Renovate
ls .github/renovate.json                                             # → tồn tại

# Prompt-as-Code
ls docs/master/prompts/README.md                                    # → tồn tại
ls docs/master/prompts/sentry-to-task.md                           # → tồn tại

# TypeScript vẫn clean
npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l  # → 0
```

_BOB — 2026-09-05 | Evidence: code scan thực tế_
