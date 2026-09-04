# CHANGELOG.md — TC-GAMING Project AI Change Log

_Records all changes made by AI agents. Newest first._

---

## [2026-09-04] — Backend Testing Infrastructure Setup

**Agent:** Hermes (Nous Research AI)
**Session type:** QA / TESTING

### Added
- `apps/backend/vitest.config.ts` — Vitest configuration for backend module with full path alias mappings.
- `apps/backend/src/main/services/__tests__/balance.service.spec.ts` — Comprehensive unit test suite covering `createBalance`, `creditBalance`, `depositBonus`, and `getBalanceByUserId`.
- `apps/backend/package.json` — Added `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, and `vitest` dependency.

---

## [2026-09-04] — CI/CD Pipeline Automation

**Agent:** Hermes (Nous Research AI)
**Session type:** DEVOPS / CI-CD

### Added
- `.github/workflows/pr-check.yml` — Pull Request CI workflow executing typecheck on all 3 workspaces sequentially.
- `.github/workflows/deploy.yml` — Production CD workflow with sequential multi-stage build, artifact bundling, SSH rsync, zero-downtime PM2 reloads (`tc-api`, `tc-admin`), and retry-based health checking.

---

## [2026-09-04] — Monorepo Transition & Architectural Unification

**Agent:** Hermes (Nous Research AI)
**Session type:** REFACTOR / ARCHITECT

### Added
- `libs/db/package.json` & `libs/db/index.ts` (`@game/db`) — Centralized database connection manager for MongoDB & Redis with memory fallback.
- `libs/cron/package.json` & `libs/cron/index.ts` (`@game/cron`) — Centralized cron worker orchestration (`startAllCrons`).
- `apps/backend/src/middlewares/upload.ts` — Re-export bridge for `uploadMedia` as `uploadFile`.
- `apps/backend/src/main/controllers/auth.controller.ts` — Fully typed auth controller supporting admin, user, and affiliate flows.
- `apps/backend/src/main/routes/transaction.router.ts` — Standardized routes for transaction list and bet logs.
- `apps/backend/src/main/routes/wallet.router.ts` — Standardized routes for `/balance`, `/deposit`, `/withdraw`, `/history`.
- `apps/frontend-web/src/services/api.ts` — Base Axios HTTP client with Bearer auth injection and response unboxing.
- `apps/frontend-web/src/types/index.ts` — TypeScript types for User, ApiResponse, DepositCryptoNetwork, PromoFilterKey, AccountMenuItem.

### Changed
- `tsconfig.base.json` — Defined unified `@game/*`, `@main/*`, `@utils/*`, `@config/*`, `@middlewares/*` path mappings.
- `apps/backend/package.json` & `apps/backend/src/index.ts` — Removed runtime `module-alias`, migrated to TS path resolution + `tsc-alias`.
- `apps/backend/src/config/static.ts` — Added missing enum constants and types (`TRANSACTION_TYPE`, `TRANSACTION_CATEGORY`, `WITHDRAW_STATUS_OPTION`, `DEPOSIT_STATUS_OPTION`, `AFFILIATE_ROLE`, `AFFILIATE_STATUS`, `THEME_OPTION`).
- `apps/backend/src/config/index.ts` — Validated `jwt.secret` fallback and configured `agPay` environment settings.
- `apps/admin-dashboard/client/App.tsx` — Wired TanStack Query provider, `AuthProvider`, `ProtectedRoute`, and lazy-loaded routes under `AdminLayout`.
- `apps/admin-dashboard/client/lib/api.ts` — Added 10s AbortSignal timeout, 401 redirect to `/login`, and structured HTTP error throwing.
- `apps/frontend-web/src/constants/siteUrls.ts` & `brandDefaults.ts` — Standardized brand name to "TC Gaming" and domain to `tc-gaming.live`.
- `docs/AI/ARCHITECTURE.md`, `docs/AI/BASELINE.md`, `docs/AI/ROADMAP.md` — Updated documentation to reflect 3-tier monorepo architecture and roadmap priorities.

## [ASSESSMENT] 2025-09-04 — Full project assessment & daily plan creation

### Findings
- Backend TypeScript errors: **45 files** with errors across 3 categories
  - Missing services: currency, setting, deposit, withdraw, bot-runner, notification (🔴 Critical)
  - Missing models: setting.model, bot-automation.model, game.model, provider.model (🔴 Critical)
  - Config missing keys: gsPay, nowpay, slot, sendGridApiKey, exchangeRateKey (🟠 High)
  - rootDir/redis types: 2 files (🟠 High)
- I18N: only 12 keys (agency FAQs only) — hard-coded strings throughout frontend
- CI/CD: ✅ deploy.yml + pr-check.yml operational
- PM2: ✅ fork mode correct for Socket.IO
- Health endpoint: ✅ latency_ms + services wrapper
- Smoke test: ✅ 13 checks

### Actions taken
- Created: docs/AI/DAILY_PLAN.md (7-day plan)
- Created: docs/AI/PROMPTS/day-001-missing-services.md
- Created: docs/AI/PROMPTS/day-002-config-models.md
- Created: docs/AI/PROMPTS/day-003-typecheck-clean.md
- Created: docs/AI/PROMPTS/day-004-test-suite.md
- Created: docs/AI/PROMPTS/day-005-i18n.md
- Created: docs/AI/PROMPTS/day-006-security.md
- Created: docs/AI/PROMPTS/day-007-admin-ui.md
- Updated: docs/AI/ROADMAP.md (Phase 4 ✅, Phase 5 + 6 added)
