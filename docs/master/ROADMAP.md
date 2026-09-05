# ROADMAP.md — TC-GAMING Improvement Roadmap

_Last updated: 2026-09-04 by AI System Architect_

---

## Priority Legend
- 🔴 CRITICAL — security, blocking builds, data integrity
- 🟠 HIGH — stability, core monorepo unification, CI/CD
- 🟡 MEDIUM — code cleanliness, test coverage
- 🟢 LOW — documentation polish

---

## Phase 1: Monorepo Foundation & Core Unification (COMPLETED / IN-PROGRESS)

| # | Priority | Task | Status | Notes |
|---|---|---|---|---|
| 1.1 | 🔴 | Monorepo structure creation (`apps/`, `libs/`, `infra/`) | ✅ Done | Workspaces active |
| 1.2 | 🔴 | Root configuration centralization (`tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc`) | ✅ Done | Root extends |
| 1.3 | 🔴 | Remove `module-alias` and map paths via `@game/*` and `@main/*` | ✅ Done | Paths active |
| 1.4 | 🔴 | Create missing critical files (`upload.ts`, `auth.controller.ts`, `wallet.router.ts`, `transaction.router.ts`, `api.ts`, `types/index.ts`) | ✅ Done | Blocking errors cleared |
| 1.5 | 🟠 | Modularize DB initialization (`libs/db`) and Cron jobs (`libs/cron`) | ✅ Done | Libraries created |

---

## Phase 2: Domain Refinement & Logic Separation (IN-PROGRESS)

| # | Priority | Task | Status | Notes |
|---|---|---|---|---|
| 2.1 | 🟠 | **Phân tách Logic Controller → Service**: Move non-HTTP query/business logic into services | 🔄 In Progress | Enforce Controller-Service boundary |
| 2.2 | 🟠 | Centralize Mongoose models into `libs/models/` | ⏳ Pending | Shared across API and Admin scripts |
| 2.3 | 🟠 | Standardize API contracts in `libs/shared-types/` | ⏳ Pending | Shared types across all apps |

---

## Phase 3: Admin Dashboard UI Standardization (IN-PROGRESS)

| # | Priority | Task | Status | Notes |
|---|---|---|---|---|
| 3.1 | 🟠 | **Refactor VIP Module** with `AdminLayout`, `DataTable`, and Tailwind CSS variables | 🔄 In Progress | `VIP.tsx`, `VIPHub.tsx`, `VIPLevels.tsx`, etc. |
| 3.2 | 🟠 | Refactor Affiliate Module with `AdminLayout` & `DataTable` | ⏳ Pending | `AffiliateManager.tsx`, etc. |
| 3.3 | 🟠 | Refactor Marketing & Article Modules | ⏳ Pending | `MarketingHubPage.tsx`, `ArticlePosts.tsx` |
| 3.4 | 🟡 | Replace all remaining hardcoded hex colors with CSS variables | ⏳ Pending | Full UI theme compliance |

---

## Phase 4: DevOps & CI/CD Automation

| # | Priority | Task | Status | Notes |
|---|---|---|---|---|
| 4.1 | 🔴 | **GitHub Actions CI/CD Pipeline**: PR typecheck + prod deploy | ✅ Done | `.github/workflows/deploy.yml` + `pr-check.yml` |
| 4.2 | 🔴 | **Zero-Downtime VPS Deployment Script** | ✅ Done | `infra/scripts/deploy.sh` (symlink + PM2 reload) |
| 4.3 | 🟡 | **Cloudflare Configuration Guide** | ⏳ Next | `docs/infra/CLOUDFLARE_SETUP.md` |

---

## Phase 5: Fix TypeScript Errors & Test Coverage (NEW — PRIORITY)

| # | Priority | Task | Status | Notes |
|---|---|---|---|---|
| 5.1 | 🔴 | **Tạo missing services**: currency, setting, deposit, withdraw | ⏳ DAY-001 | 17+ controllers blocked |
| 5.2 | 🔴 | **Fix config/index.ts**: thêm gsPay, nowpay, slot, sendGridApiKey | ⏳ DAY-002 | 3 controllers blocked |
| 5.3 | 🔴 | **Tạo missing models**: setting, bot-automation, game, provider | ⏳ DAY-002 | 4+ services blocked |
| 5.4 | 🟠 | **Fix rootDir TypeScript** + Redis types | ⏳ DAY-003 | libs/db outside rootDir |
| 5.5 | 🟠 | **Expand test suite**: currency, session, payment, vip-tiers | ⏳ DAY-004 | Only balance.service tested |
| 5.6 | 🟡 | **I18N mở rộng**: 12 keys → 80+ keys | ⏳ DAY-005 | Hard-coded strings everywhere |

---

## Phase 6: Security & Admin UI Polish

| # | Priority | Task | Status | Notes |
|---|---|---|---|---|
| 6.1 | 🟠 | **Security audit**: secrets, CORS, rate-limit, .gitignore | ⏳ DAY-006 | CHANGE_ME still in .env |
| 6.2 | 🟠 | **Admin VIP + Affiliate modules**: AdminLayout + DataTable | ⏳ DAY-007 | Phase 3.1 + 3.2 |
| 6.3 | 🟡 | **Remove hardcoded hex colors** from admin pages | ⏳ DAY-007 | Phase 3.4 |
