# BASELINE.md — TC-GAMING Current Monorepo State

_Last updated: 2026-09-04 by AI System Architect_  
_Status: **Monorepo Transitioning**_

---

## 1. Repository Inventory

```
/var/app/game/
├── package.json               ← Root monorepo workspace definition
├── tsconfig.base.json         ← Root TypeScript compiler options & @game/* path mappings
├── .eslintrc.cjs              ← Root ESLint ruleset
├── .prettierrc                ← Root Prettier configuration
├── .gitignore
├── apps/
│   ├── backend/               ← Express 4.21 + MongoDB + Socket.IO (port 8701)
│   ├── frontend-web/          ← React 18 + Redux-Saga player web SPA
│   └── admin-dashboard/       ← React 18 + shadcn/ui + TanStack Query 5 (port 8781)
├── libs/
│   ├── shared-types/          ← @game/types (Shared API contracts & TypeScript interfaces)
│   ├── db/                    ← @game/db (MongoDB & Redis connection manager)
│   ├── cron/                  ← @game/cron (Affiliate & system background schedulers)
│   ├── models/                ← @game/models (Centralized Mongoose models)
│   ├── ui/                    ← @game/ui (AdminLayout, DataTable, UI component library)
│   └── i18n/                  ← @game/i18n (vi/en translations)
├── configs/                   ← Vendor specifications (GSC API, AG Casino, AGENTS.md)
├── infra/                     ← Deployment scripts, Nginx configurations, PM2 ecosystem
└── docs/                      ← Architectural memory and changelogs
    └── AI/
        ├── ARCHITECTURE.md
        ├── BASELINE.md
        ├── CHANGELOG.md
        ├── DECISIONS.md
        ├── PROJECT_MEMORY.md
        └── ROADMAP.md
```

---

## 2. Technology Stack & Packages

| Layer | Technology | Package Name | Path |
|---|---|---|---|
| Monorepo Orchestration | npm workspaces | `tc-gaming-monorepo` | `/` |
| Backend API | Express 4.21 + TypeScript | `backend` | `apps/backend` |
| Player Frontend | React 18 + Redux Toolkit + Vite | `frontend-web` | `apps/frontend-web` |
| Admin Dashboard | React 18 + TanStack Query 5 + Vite | `admin` | `apps/admin-dashboard` |
| Shared UI Library | Radix UI + Tailwind CSS | `@game/ui` | `libs/ui` |
| Shared DB Layer | Mongoose 8 + Redis 4 | `@game/db` | `libs/db` |
| Shared Cron Layer | Cron 3 | `@game/cron` | `libs/cron` |
| Shared i18n | JSON Locales | `@game/i18n` | `libs/i18n` |
| Shared Types | TypeScript Definitions | `@game/types` | `libs/shared-types` |

---

## 3. Current Health & Status

1. **Path Mapping & Module Aliases:**
   - Root `tsconfig.base.json` provides unified `@game/*` mappings.
   - `module-alias` deprecated in favor of TypeScript path resolution.
2. **Missing Files Resolved:**
   - Created `apps/backend/src/middlewares/upload.ts`
   - Created `apps/backend/src/main/controllers/auth.controller.ts`
   - Created `apps/backend/src/main/routes/transaction.router.ts`
   - Created `apps/backend/src/main/routes/wallet.router.ts`
   - Created `apps/frontend-web/src/services/api.ts`
   - Created `apps/frontend-web/src/types/index.ts`
3. **Current In-Progress Modules:**
   - Admin Dashboard VIP module refactoring (`VIP.tsx`, `VIPHub.tsx`, `VIPLevels.tsx`, `VIPProgramConfig.tsx`, `VipTiersManager.tsx`).
   - Moving business logic from Backend Controllers to Services.
   - DevOps CI/CD pipeline setup (`.github/workflows/deploy.yml` and `infra/scripts/deploy.sh`).
