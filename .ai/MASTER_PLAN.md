# MASTER_PLAN.md — TC-Gaming.live Complete Execution Roadmap

_Tác giả: BOB (Lead Architect) | Cập nhật: 2026-09-04_  
_Nguồn thẩm quyền: docs/master/ARCH_BLUEPRINT.md + docs/AI/PROJECT_MEMORY.md_

---

## TÓM TẮT TỔNG QUAN

**Mục tiêu cuối cùng:** Hoàn thiện hệ thống `tc-gaming.live` đạt trạng thái production-ready:
- TypeScript 0 errors
- Security hardened (helmet, rate-limit, no secrets in code)
- Controller-Service pattern toàn bộ backend
- Admin UI chuẩn (AdminLayout + DataTable + CSS variables)
- Test coverage ≥ 60%
- I18N 80+ keys
- CI/CD pipeline xanh hoàn toàn

**Quy tắc bất biến (KHÔNG được vi phạm):**
1. Dependency Rule: `Apps → Libs`. KHÔNG import App → App.
2. Controller: Chỉ parse request + call Service. Không có DB query.
3. UI: Chỉ dùng `@game/ui` (AdminLayout, DataTable). Không hex color.
4. Security: Mọi credentials phải ở GitHub Secrets. Không commit secrets.

---

## TRẠNG THÁI HIỆN TẠI (Evidence-Based Snapshot)

### ✅ ĐÃ HOÀN THÀNH
- BOOT-001→007: Monorepo foundation, CI/CD, routes, testing setup
- TASK-001: Spec Role Controller refactor (chờ OpenHands)
- TASK-002: Spec Admin Staff refactor (chờ OpenHands)

### 🔴 CRITICAL BLOCKERS (45 TypeScript errors)
- 17 controllers bị block vì thiếu services: `currency`, `setting`, `deposit`, `withdraw`
- 4 services cần missing models: `setting`, `bot-automation`, `game`, `provider`
- 3 controllers block vì `config/index.ts` thiếu keys: `gsPay`, `nowpay`, `slot`
- rootDir error: `libs/db` và `libs/cron` nằm ngoài rootDir

### 🟠 IN-PROGRESS
- Phase 2.1: Controller→Service separation (TASK-001, TASK-002)
- Phase 3.1: VIP Admin UI standardization

### ⏳ PENDING
- Phase 5.1-5.6: TypeScript clean, test suite, i18n
- Phase 6.1-6.3: Security audit, Admin UI polish

---

## EXECUTION PLAN — 7 SPRINTS

---

### SPRINT 1 — DAY-001: Tạo 4 Missing Services

**Intent:** Unblock 17 controllers bằng cách tạo đủ 4 service files còn thiếu.

**Prompt File:** `docs/AI/PROMPTS/day-001-missing-services.md`

**Todo:**
- [ ] Tạo `apps/backend/src/main/services/currency.service.ts`
- [ ] Tạo `apps/backend/src/main/services/setting.service.ts`
- [ ] Tạo `apps/backend/src/main/services/deposit.service.ts`
- [ ] Tạo `apps/backend/src/main/services/withdraw.service.ts`
- [ ] Verify: TypeScript errors ≤ 20 files sau khi tạo

**Pattern chuẩn (theo `balance.service.ts`):**
```typescript
// Export default object (NOT class)
// Use mongoose Model trực tiếp
// Throw ApiError với đúng HTTP code
// TypeScript strict, no any
```

**Expected Outcomes:**
- 45 errors → ≤ 20 errors
- Các controller: currency, gs-pay, ag-pay, nowpay, player không còn lỗi import

**Relevant Context:**
- `apps/backend/src/main/services/balance.service.ts` (pattern mẫu)
- Controllers cần service: `currency.controller.ts`, `gs-pay.controller.ts`, `ag-pay.controller.ts`, `nowpay.controller.ts`, `player.controller.ts`

**Status:** [ ] pending

---

### SPRINT 2 — DAY-002: Fix Config + Missing Models

**Intent:** Tạo missing models và bổ sung config keys để unblock phần còn lại.

**Prompt File:** `docs/AI/PROMPTS/day-002-config-models.md`

**Todo:**
- [ ] Thêm keys vào `apps/backend/src/config/index.ts`: `gsPay`, `nowpay`, `slot`, `sendGridApiKey`, `exchangeRateKey`
- [ ] Tạo `apps/backend/src/main/models/setting.model.ts`
- [ ] Tạo `apps/backend/src/main/models/bot-automation.model.ts`
- [ ] Tạo `apps/backend/src/main/models/game.model.ts`
- [ ] Tạo `apps/backend/src/main/models/provider.model.ts`
- [ ] Tạo `apps/backend/src/main/services/bot-runner.service.ts`
- [ ] Tạo `apps/backend/src/main/services/notification.service.ts`
- [ ] Tạo constants: `game-menu-defaults.ts`, `gsc-environments-defaults.ts`

**Expected Outcomes:**
- TypeScript errors ≤ 10 files
- Chỉ còn rootDir và ObjectId mismatches

**Status:** [ ] pending

---

### SPRINT 3 — DAY-003: TypeScript Clean (0 errors)

**Intent:** Đạt 0 TypeScript errors để CI/CD pass hoàn toàn.

**Prompt File:** `docs/AI/PROMPTS/day-003-typecheck-clean.md`

**Todo:**
- [ ] Fix `apps/backend/tsconfig.json`: Thêm `../../libs/**/*.ts` vào include hoặc fix rootDir
- [ ] Fix ObjectId vs string mismatches (`String(objectId)` hoặc `.toString()`)
- [ ] Verify Redis v4 built-in types đúng
- [ ] Tạo stubs cho các remaining missing modules
- [ ] Chạy `npm run typecheck -w apps/backend` → 0 errors
- [ ] Chạy `npm run typecheck -w apps/admin-dashboard` → 0 errors
- [ ] Chạy `npm run typecheck -w apps/frontend-web` → 0 errors

**Expected Outcomes:**
- `npm run typecheck` pass 0 errors toàn bộ workspace
- CI/CD pr-check.yml xanh hoàn toàn

**Status:** [ ] pending

---

### SPRINT 4 — DAY-004: Mở Rộng Test Suite

**Intent:** Tăng coverage từ 1 service (balance) lên ≥ 60% line coverage.

**Prompt File:** `docs/AI/PROMPTS/day-004-test-suite.md`

**Todo:**
- [ ] Tạo `currency.service.spec.ts`: getCurrencies, getCurrencyById, getDefaultCurrency
- [ ] Tạo `session.service.spec.ts`: createSession, getSession, deleteSession
- [ ] Tạo `payment.service.spec.ts`: deposit, withdraw, insufficient balance
- [ ] Tạo `vip-tiers.service.spec.ts`: getVipTierByAmount, getAllTiers, boundary tests
- [ ] Cấu hình coverage threshold trong `vitest.config.ts`: lines ≥ 60%, functions ≥ 60%

**Expected Outcomes:**
- `npm run test -w apps/backend` → tất cả pass
- Coverage report: lines ≥ 60%

**Status:** [ ] pending

---

### SPRINT 5 — DAY-005: I18N Chuẩn Hóa

**Intent:** Từ 12 keys → 80+ keys, loại bỏ hard-coded strings khỏi frontend.

**Prompt File:** `docs/AI/PROMPTS/day-005-i18n.md`

**Todo:**
- [ ] Expand `libs/i18n/vi.json` với 7 namespaces: auth, nav, wallet, vip, common, promo, affiliate
- [ ] Tạo `libs/i18n/en.json` với matching keys (English translation)
- [ ] Update `libs/i18n/index.ts`: Export type `TranslationKey`
- [ ] Verify TypeScript: `t('key')` type-safe với TranslationKey
- [ ] Cleanup `libs.old-root/` và `.backup-roots/` (legacy snapshots)

**Expected Outcomes:**
- 80+ i18n keys available
- No hard-coded strings trong frontend components
- Type-safe i18n calls

**Status:** [ ] pending

---

### SPRINT 6 — DAY-006: Security Audit & Hardening

**Intent:** Đảm bảo hệ thống production-safe: không secrets trong code, rate limiting, proper headers.

**Prompt File:** `docs/AI/PROMPTS/day-006-security.md`  
**Ref:** `docs/AI/PROMPTS/phase1-security-hardening.md`

**Todo:**
- [ ] Scan `.env.production`: Replace tất cả `CHANGE_ME` với proper values hoặc remove
- [ ] Verify `apps/backend/src/app.ts`: Body limit ≤ 10mb (fix từ 500mb)
- [ ] Verify `helmet()` middleware installed và applied trước tất cả middleware khác
- [ ] Verify `rate-limit.ts`: Auth 10 req/15min, OTP 5 req/15min
- [ ] Verify CORS config đọc từ env, không hardcode
- [ ] Update `.gitignore`: Cover `.env*`, `*.pem`, `*.key`
- [ ] Verify `IAuthUser` interface thay thế `req.user: any`
- [ ] Generate JWT_SECRET mới nếu còn placeholder

**Expected Outcomes:**
- Security headers đúng chuẩn (helmet)
- Rate limiting active trên auth/OTP routes
- Không còn sensitive data trong code

**Status:** [ ] pending

---

### SPRINT 7 — DAY-007: Admin UI Standardization

**Intent:** Chuẩn hóa toàn bộ Admin Dashboard theo AdminLayout + DataTable + CSS variables.

**Prompt File:** `docs/AI/PROMPTS/day-007-admin-ui.md`

**VIP Module:**
- [ ] `VIPHub.tsx` → Wrap AdminLayout, replace hex → CSS variables
- [ ] `VIPLevels.tsx` → Wrap AdminLayout, replace tables → DataTable
- [ ] `VIP.tsx` → Wrap AdminLayout, CSS variables
- [ ] `VipTiersManager.tsx` → Wrap AdminLayout, DataTable

**Affiliate Module:**
- [ ] `AffiliateManager.tsx` → Wrap AdminLayout, DataTable
- [ ] `AffiliateDashboard.tsx` → CSS variables
- [ ] `CommissionLogs.tsx` → DataTable

**CSS Variable Mapping:**
- `#1a1a2e` → `var(--bg-main)`
- `#ffffff` → `var(--text-primary)`
- `#FFD700` / `#gold` → `var(--accent-gold)`

**Expected Outcomes:**
- Toàn bộ Admin pages dùng AdminLayout
- Không còn hardcoded hex colors
- DataTable replace raw HTML tables

**Status:** [ ] pending

---

## SONG SONG (Parallel Tasks — Không Blocked)

### TASK-001: Role Controller Refactor
- **Spec:** `.ai/tasks/TASK-001.md`
- **Assigned to:** OpenHands
- **Branch:** `openhands/task-001-role-refactor`
- **Status:** QUEUED_FOR_EXECUTION

### TASK-002: Admin Staff Controller Refactor
- **Spec:** `.ai/tasks/TASK-002.md`
- **Assigned to:** OpenHands
- **Branch:** `openhands/task-002-admin-staff`
- **Status:** READY_FOR_EXECUTION

---

## DOCS STRUCTURE — SAU KHI TỔ CHỨC LẠI

```
docs/
├── master/                          ← Hiến pháp dự án (BOB đọc trước)
│   ├── ARCH_BLUEPRINT.md            ← Dependency graph, data flow
│   ├── DEV_STANDARD.md              ← Backend, UI, i18n standards
│   ├── OPS_GUIDE.md                 ← Deploy, monitoring
│   ├── ROADMAP.md                   ← Phase 1→6, status tracking
│   ├── TASK_TEMPLATE.md             ← Mẫu tạo task spec
│   └── USER_PREFERENCES.md          ← Working style, feedback log
│
├── AI/                              ← Bộ não AI Agents
│   ├── PROJECT_MEMORY.md            ← Core knowledge base (Hermes đọc đầu tiên)
│   ├── ARCHITECTURE.md              ← System diagram chi tiết
│   ├── BASELINE.md                  ← Repository state snapshot
│   ├── CHANGELOG.md                 ← AI change log
│   ├── COMPLETION_CHECKLIST.md      ← Trạng thái checklist
│   ├── DAILY_PLAN.md                ← 7-day sprint plan
│   ├── DECISIONS.md                 ← ADR-001 → ADR-011
│   └── PROMPTS/                     ← Lệnh kích hoạt từng sprint
│       ├── day-001-missing-services.md
│       ├── day-002-config-models.md
│       ├── day-003-typecheck-clean.md
│       ├── day-004-test-suite.md
│       ├── day-005-i18n.md
│       ├── day-006-security.md
│       ├── day-007-admin-ui.md
│       ├── HERMES_EFFICIENCY.md     ← Meta-learning rules cho Hermes
│       └── phase1-security-hardening.md
│
├── 14-ai/                           ← Coordination logs
│   ├── AGENT_CONTEXT_LOG.md         ← Handoff protocol + task execution log
│   └── OPENVIKING_MEMORY.md         ← Memory map cho OpenViking
│
├── 16-roadmap/
│   └── COMPLETED.md                 ← Merge history
│
└── 99-reports/
    └── audits/
        ├── REPOSITORY_DISCOVERY.md
        └── E2E_SYNC_REPORT.md
```

---

## VERIFICATION CRITERIA (Definition of Done)

Dự án hoàn thành khi đạt **TẤT CẢ** các tiêu chí sau:

| # | Tiêu chí | Lệnh kiểm tra | Target |
|---|---|---|---|
| 1 | TypeScript clean | `npm run typecheck` | 0 errors |
| 2 | Test coverage | `npm run test --coverage` | Lines ≥ 60% |
| 3 | Security headers | `curl -I https://tc-gaming.live` | X-Frame-Options, Helmet headers |
| 4 | Rate limiting | `ab -n 20 /api/auth/login` | 429 after 10 req |
| 5 | No hex colors | `grep -rn "#[0-9a-f]{6}" apps/admin-dashboard` | 0 matches |
| 6 | No hardcoded strings | `grep -rn '"[A-Z].*"' apps/frontend-web/src/components` | 0 matches |
| 7 | i18n coverage | Count keys in vi.json | ≥ 80 keys |
| 8 | CI/CD green | GitHub Actions | All checks pass |
