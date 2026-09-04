# BASELINE.md — GAME Project Current State

_Last updated: 2026-04-09 by AI Discovery_

---

## 1. Repository Overview

```
game/
├── AGENTS.md                 ← AI engineering rules (master rules)
├── README.md                 ← Setup and deployment guide
├── DEPLOY.md                 ← Quick deploy checklist
├── gamelauch.md              ← Game launch notes
├── GSC+ Seamless Wallet API v2.0.6EN.md  ← GSC integration spec
├── backend/                  ← Node.js + Express + MongoDB API (port 8701)
├── admin/                    ← React admin panel (port 8781)
├── frontend1/                ← React player site (port 3000 / Nginx prod)
├── deploy/                   ← deploy.sh, PM2 ecosystem files, Nginx config
└── docs/AI/                  ← AI documentation (this folder)
```

**NOT a monorepo.** Each sub-project has its own `package.json`, installed and built independently. No Turborepo, no pnpm workspace.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Backend | Express + TypeScript (strict) |
| ORM | Mongoose 8 |
| Database | MongoDB 6 |
| Cache / Session | Redis 7 |
| Realtime | Socket.io |
| Frontend | React 18 + TypeScript + Vite |
| State management | Redux Toolkit + Redux-Saga (frontend1) |
| Admin UI library | shadcn/ui (Radix UI + Tailwind) |
| Admin state | TanStack Query v5 |
| Styling | TailwindCSS 3 |
| Validation (backend) | Joi |
| Build tool | Vite 7 (frontend, admin), tsc (backend) |
| Package manager | pnpm (all sub-projects) |
| Process manager | PM2 |
| Web server | Nginx |

---

## 3. Backend Inventory

### Entry Points

| File | Purpose |
|---|---|
| `src/index.ts` | Server boot, DB connect, Redis connect |
| `src/app.ts` | Express app setup, CORS, routes, Socket.io |
| `src/socket.ts` | Socket.io event handlers |
| `src/page.route.ts` | Catch-all / SPA fallback |

### Routes (54 route files)

Categories:
- **Admin**: `admin-affiliate`, `admin-agents`, `admin-audit`, `admin-churn`, `admin-dashboard`, `admin-game-menu`, `admin-games`, `admin-ip`, `admin-staff`, `admin-store`, `admin-vip`
- **Auth**: `auth`
- **Affiliate**: `affiliate`, `user-affiliate`, `public-affiliate`, `reagent-program`
- **Finance**: `gs-pay`, `ag-pay`, `nowpay`, `currency`, `plan`, `package`, `store`, `reward`
- **Game**: `game-menu`, `ag-callback`, `gs-callback`, `sport`
- **User/Player**: `verify`, `kyc`, `preference`, `referral-code`, `ticket`, `newsletter`
- **Content**: `banner`, `article`, `content-block`, `help`, `media`
- **Bonus/VIP**: `bonus`, `vip-level`, `vip-tiers`, `vip-tiers-config`, `vip-spin`, `vip-spin-prize`, `vip-bonus`
- **Other**: `site-plugin`, `role`, `bot-automation`, `daily-challenge`, `agency`, `promotion`, `setting`

### Controllers (70+ controller files)

All controllers are in `src/main/controllers/`.

### Services (55+ service files)

All services are in `src/main/services/`. Services call Mongoose models directly.

### Models (40+ Mongoose models)

All models are in `src/main/models/`.

Key models identified:

| Model | Collection |
|---|---|
| Balance | `balances` |
| Transaction | `transactions` |
| Session | `sessions` |
| Deposit | `deposits` |
| Withdraw | `withdraws` |
| Affiliate | `affiliates` |
| Affiliate Log | `affiliatelogs` |
| Affiliate Stats | `affiliatestats` |
| VIP Level | `viplevels` |
| VIP Tiers | `viptiers` |
| Slot Game | `slotgames` |
| Casino Log | `casinologs` |
| Bonus | `bonuses` |
| Role | `roles` |
| Banner | `banners` |
| Currency | `currencies` |
| Transaction | `transactions` |
| AG Log | `aglogs` |
| AG Payin Log | `agpayinlogs` |
| AG Payout Log | `agpayoutlogs` |

### Validators (24 Joi validator files)

In `src/main/validators/`. Not all routes have corresponding validators (coverage gap).

### Middlewares

| File | Purpose |
|---|---|
| `auth.ts` | Session-based authentication |
| `admin-only.ts` | Admin role gate |
| `affiliate-auth.ts` | Affiliate role gate |
| `error.ts` | Global error converter + handler |
| `upload-media.ts` | Multer file upload |
| `uploadValidation.ts` | File type/size validation |
| `attachmentValidation.ts` | Attachment validation |

### Constants (14 constant files)

Contains defaults for game providers, affiliate mechanisms, UI themes, VIP config, etc.

---

## 4. Frontend1 (Player Site) Inventory

Stack: React 18 + TypeScript + Vite + Redux Toolkit + Redux-Saga + TailwindCSS

### Structure

```
src/
├── api/            Axios instances (axios.ts, adminAxios.ts)
├── components/
│   ├── common/     Badge, Input, BigWinTicker, DataTableSection, PlanSection...
│   ├── financial/  CryptoDepositPanel, PaymentMethodTabs, FinancialNotice...
│   ├── layout/     MobileAppShell, BottomNav, AccountFinancialShell...
│   ├── promo/      PromoDetailModal, PromoModalDefaultTnc
│   ├── sections/   GameList, HomePromoBanner, HotMatch, DailyChallengeCountdown
│   ├── shared/     PublicChat
│   └── ui/         AuthModal, Modal, Loading, Toaster, EmptyState...
├── constants/      apiConfig, brandDefaults, financial, uiTokens, uiIcons...
├── contexts/       AuthContext, SiteContext, SocketContext, ChatContext, UIContext
├── features/
│   ├── admin/      adminSlice, adminSaga
│   ├── affiliate/  AffiliateOverview
│   ├── agency/     AgencyPlans, AgencyTransferModal
│   └── auth/       authSlice, authSaga
├── hooks/          useAuth, useSite, useCurrency, useVipTiers, useScroll...
├── i18n/           Vietnamese locale strings
├── lib/            cn (TailwindCSS class merge)
├── pages/          AboutUs, Account (deposit/withdraw), Affiliate, Agency, Promo, VIP, Wallet...
├── routes/         ProtectedRoute, route index
├── services/       authService, affiliateService, bannerService, bonusService...
├── store/          Redux store, rootReducer, rootSaga
├── types/          SystemContract.ts, api.type.ts
└── utils/          apiList, format, validators, gscpSignature, toast...
```

### Key Architecture Notes

- Authentication: Redux slice + saga, persisted via `AuthContext` wrapper
- API: Axios instance at `src/api/axios.ts`, separate `adminAxios.ts` for admin calls
- State: Redux Toolkit (auth, admin slices) + Redux-Saga for async effects
- No TanStack Query — all data fetching via sagas or direct service calls
- i18n: Manual Vietnamese locale constants (no i18next)

---

## 5. Admin Panel Inventory

Stack: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui (Radix UI)

### Structure

```
admin/client/
├── components/
│   ├── admin/   AdminErrorBoundary, AdminPageHeader, AdminRelatedLinks, ReferralTree
│   ├── auth/    AuthProvider, RequireSuperAdmin, RequireUser
│   ├── layout/  AdminLayout, AdminNavTree, AppLayout
│   ├── shared/  ThemeToggle
│   ├── ui/      50+ shadcn/ui components (button, dialog, table, form, chart...)
│   └── widget/  ChatWidget
├── constants/   gameLobbyBanners
├── hooks/       use-mobile, use-toast, useAdminThemeVars, useSessionTimeout
├── lib/         adminAuth, affiliateApi, affiliateAuth, projectMeta, ui-theme-defaults...
└── pages/
    ├── admin/   Dashboard, Users, Games, Affiliates, VIP, Deposits, Withdrawals...
    └── affiliate/
```

### Admin Pages (50+ pages)

Dashboard, Users, Games, Affiliates, VIP, Deposits, Withdrawals, Bonuses, Settings, Banners, Articles, KYC, Audit Logs, Staff, Roles, IP Management, Bot Automation, Store, Churn Risk, Daily Challenges, Email Settings...

---

## 6. Deployment Inventory

```
deploy/
├── deploy.sh               Main deploy script
├── ecosystem.config.cjs    PM2 config (backend + optional FE preview)
├── ecosystem.pm2-spa.cjs   PM2 SPA mode (FE via vite preview)
└── nginx/87app.conf        Nginx config
```

### Ports

| Service | Port | Prod URL |
|---|---|---|
| backend | 8701 | api.cuocbong99.live |
| admin | 8781 | admin.cuocbong99.live |
| frontend1 | 80 | cuocbong99.live (Nginx static) |

---

## 7. Test Inventory

**Current status: NO TESTS.**

- `*.spec.ts` files: 0 found
- `*.test.ts` files: 0 found
- Exception: `admin/client/lib/utils.spec.ts` (1 file — admin only)

**Technical Debt:** Zero backend test coverage. Zero frontend test coverage.

---

## 8. Build Status (as of discovery)

Not verified by running builds. Assumed buildable based on README instructions.

```bash
# Backend
cd backend && pnpm install && pnpm build    # tsc → dist/

# Frontend
cd frontend1 && pnpm install && pnpm build  # vite → dist/

# Admin
cd admin && pnpm install && pnpm build      # vite → dist/
```

---

## 9. Technical Debt

### HIGH PRIORITY

1. **No tests** — zero backend test coverage, zero frontend test coverage
2. **No test infrastructure** — no Jest/Vitest config in backend or frontend1
3. **Missing validators** — not all controller routes have Joi validation schemas
4. **Error response format inconsistency** — current error handler returns `{ code, message }`, not a standardized `{ success, error: { code, message, ... } }` format
5. **Raw Mongoose documents** — some controllers may return Mongoose documents directly without `.lean()` or mapping to DTOs
6. **No request logging middleware** — no structured request ID / correlation ID attached per request
7. **Global `any` types** — `auth.ts` uses `req.user: any`, `AuthRequest` has `any` typed user

### MEDIUM PRIORITY

8. **Frontend i18n** — manual Vietnamese locale constants, no i18next framework
9. **Admin auth vs player auth** — two separate auth mechanisms, no unified session management
10. **Missing rate limiting** — auth endpoints (login, OTP, register) need rate limiting middleware
11. **500mb JSON body limit** — `express.json({ limit: '500mb' })` is extremely large and a DoS risk
12. **No API versioning** — all routes under `/api/`, no versioning strategy

### LOW PRIORITY

13. **frontend1 has `adminAxios.ts`** — player frontend has admin API calls mixed in
14. **No OpenAPI/Swagger documentation** — API is undocumented
15. **No migration scripts** — MongoDB schema changes are undocumented

---

## 10. Security Findings

| Severity | Finding |
|---|---|
| HIGH | `express.json({ limit: '500mb' })` — DoS risk via large payload |
| HIGH | No rate limiting on auth endpoints |
| MEDIUM | `req.user: any` — no TypeScript safety on authenticated user object |
| MEDIUM | Session token never appears in logs (GOOD) but error.ts logs raw errors in development |
| LOW | Admin API routes in player frontend (adminAxios.ts) |
| LOW | No Content-Security-Policy headers |
| LOW | No Helmet.js for security headers |

---

## 11. Architectural Violations

1. **`frontend1` contains admin API client** (`adminAxios.ts`, `services/adminApi.ts`) — admin calls should only be in the admin panel
2. **No DTO layer** — backend likely returns Mongoose documents directly in some routes
3. **Single role field** — `PlayerUser.role: 'user' | 'admin'` is overly simplified; actual permissions are in `permissions-catalog.ts`
4. **`src/utils/` in frontend1** contains mixed concerns: pure utils + API list + validators

---

## 12. Missing Functionality

- Unit tests (backend + frontend)
- Integration tests
- API documentation (OpenAPI/Swagger)
- Structured request logging with `requestId`
- Rate limiting middleware
- Input sanitization middleware
- Helmet.js security headers
- Health check monitoring (endpoint exists, but no alerting integration)

---

## 13. Recommended Migration Order

1. **Security hardening** — add Helmet.js, reduce JSON body limit, add rate limiting on auth
2. **Type safety** — replace `req.user: any` with typed `IUser` interface
3. **Test infrastructure** — add Vitest to backend and frontend1
4. **First tests** — write tests for `balance.service.ts` (critical financial logic)
5. **Structured request logging** — add `requestId` middleware
6. **Validator coverage** — add Joi validators for all routes missing them
7. **Error format standardization** — unify error response format
8. **DTO layer** — audit controllers returning raw Mongoose documents

---

## 14. Next Recommended Task

**Security hardening (backend):**

1. Replace `express.json({ limit: '500mb' })` with a sane limit (`10mb` or `50mb`)
2. Add `helmet` middleware
3. Add `express-rate-limit` on `/api/auth/*` routes
4. Type `req.user` properly in `auth.ts`

This is the safest, highest-impact first step — does not change business logic, only adds protection.
