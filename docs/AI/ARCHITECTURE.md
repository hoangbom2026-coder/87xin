# ARCHITECTURE.md — GAME Project Architecture

_Last updated: 2026-04-09_

---

## 1. Project Type

**87app** is a gaming platform (online casino / sports betting) consisting of three independently deployed applications sharing a single MongoDB + Redis backend.

This is NOT a monorepo. There is no Turborepo, no pnpm workspace, no shared packages. Each sub-project is fully self-contained.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                     │
│                                                                     │
│   Player Browser              Admin Browser          GSC Provider   │
│   frontend1 (React)           admin (React)          (Game server)  │
└──────┬──────────────────────────┬──────────────────────┬────────────┘
       │                          │                      │
       │  HTTP /api/*             │  HTTP /api/admin/*   │  HTTP /v1/api/*
       │  WS /socket.io           │                      │  HTTP /ag-callback/*
       ▼                          ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         backend (Express)                            │
│                            port 8701                                 │
│                                                                      │
│   auth.ts        → Session middleware                                │
│   admin-only.ts  → Admin gate                                        │
│   affiliate-auth.ts → Affiliate gate                                 │
│                                                                      │
│   Routes → Controllers → Services → Mongoose Models → MongoDB        │
│                                                     → Redis          │
│                                                                      │
│   Socket.io → socket.ts → real-time events                          │
└──────────────────────────────────────────────────────────────────────┘
       │                          │
       ▼                          ▼
  MongoDB 6                    Redis 7
  (all data)                   (sessions, cache, pub/sub)
```

---

## 3. Backend Architecture

### Layering

```
HTTP Request
    ↓
Express Router (src/main/routes/)
    ↓
Authentication Middleware (auth.ts / admin-only.ts / affiliate-auth.ts)
    ↓
Joi Validation Middleware (src/main/validators/)
    ↓
Controller (src/main/controllers/)
    ↓
Service (src/main/services/)
    ↓
Mongoose Model (src/main/models/)
    ↓
MongoDB / Redis
```

### Rules

- Controllers MUST NOT call Mongoose models directly — always through Service
- Services MUST NOT call other domain services if it creates circular dependency
- Balance mutations MUST go through `balance.service.ts`
- Wallet transactions MUST be auditable and idempotent
- Never return raw Mongoose documents to client — use `.lean()` or map to response object

### Path Alias

- `@main` → `src/main/`
- `@utils` → `src/utils/`
- `@config` → `src/config/`

### Authentication

Session-based (not stateless JWT):

1. POST `/api/auth/login` → creates Session document in MongoDB, returns token
2. Token stored client-side (localStorage or cookie)
3. Each request: `auth.ts` middleware looks up Session by token
4. Session expiry auto-extended on activity
5. Session deleted on logout or expiry

Redis is used to cache user info (`${userId}-info` key).

### Error Handling

`ApiError` class (`src/utils/ApiError.ts`) is the standard error container.

Global error pipeline:
1. `errorConverter` — wraps non-ApiError errors into ApiError
2. `errorHandler` — formats and sends response

Current response format:
```json
{ "code": 400, "message": "Validation error" }
```

Target standardized format (to be migrated):
```json
{
  "success": false,
  "error": {
    "code": "DOMAIN_RESOURCE_REASON",
    "message": "...",
    "details": {}
  }
}
```

---

## 4. Frontend1 Architecture (Player Site)

### State Management

```
Component
  ↓ dispatch(action)
Redux Store
  ↓ matched by rootSaga
Redux-Saga (async effects)
  ↓
Service function (src/services/)
  ↓
Axios (src/api/axios.ts)
  ↓
Backend API
```

Redux slices: `authSlice`, `adminSlice`

Sagas: `authSaga`, `adminSaga`, `rootSaga`

### Context Layer

React contexts provide derived auth state and global UI state:

- `AuthContext` — wraps Redux auth state, exposes `user`, `token`, `isLoggedIn`
- `SiteContext` — site configuration (theme, brand settings)
- `SocketContext` — Socket.io connection and events
- `ChatContext` — public chat state
- `UIContext` — global UI state (modals, drawers)

### Component Hierarchy

```
primitives (ui/):     Modal, Loading, EmptyState, Toaster, Badge...
layout:               MobileAppShell, BottomNav, AccountFinancialShell
sections:             GameList, HomePromoBanner, HotMatch
domain components:    financial/, promo/
pages:                Account, Wallet, Affiliate, VIP, Promo...
```

---

## 5. Admin Panel Architecture

### Paradigm

Admin panel is a standalone React SPA with its own auth flow (separate from player auth).

State management: **TanStack Query v5** (not Redux) — data fetching, caching, mutations.

UI library: **shadcn/ui** — unstyled Radix UI primitives + TailwindCSS. 50+ components in `client/components/ui/`.

### Auth Guards

- `RequireUser` — requires any authenticated admin user
- `RequireSuperAdmin` — requires super admin role

### API Communication

Admin panel calls `/api/admin/*` routes on the backend using `adminAxios.ts` (also duplicated in frontend1 — architectural violation to clean up).

---

## 6. Payment Architecture

### Payment Providers

| Provider | Type | Routes |
|---|---|---|
| GS Pay | Manual / VND banking | `/api/gs-pay/*`, `/v1/api/*` (callback) |
| AG Pay | Automated payment | `/api/ag-pay/*` |
| AG Casino | Game provider (seamless wallet) | `/ag-callback/*` |
| NowPay | Cryptocurrency | `/api/nowpay/*` |

### Seamless Wallet (GSC)

The Game Server (GSC) calls our backend to:
- Check player balance
- Debit balance (bet)
- Credit balance (win)
- Refund (cancel)

All GSC callbacks arrive at `/v1/api/*` (handled by `gs-callback.router.ts`).

Our backend MUST respond correctly to GSC callbacks or game rounds will be stuck.

### Balance Integrity Rules

1. All balance changes go through `balance.service.ts`
2. Every balance change creates a `Transaction` document (before/after amounts recorded)
3. Use `tnxId` for idempotency on payment callbacks
4. Deposits: pending → completed flow with audit trail
5. Withdraws: pending → approved/rejected flow with audit trail

---

## 7. Affiliate Architecture

Multi-level affiliate system:

- Affiliates have a parent-child tree structure (`path` field on transactions records ancestry)
- Commission is calculated daily via `affiliate-daily.cron.ts`
- Stats tracked in `affiliate-stats.model.ts` and `affiliate-log.model.ts`
- Separate "reagent" program (different commission structure)
- "Agency" program (investment-based, with interest payments via `agency-investment-interest.cron.ts`)

---

## 8. VIP Architecture

VIP levels: `vip-level.model.ts`
VIP tiers (groups of levels): `vip-tiers.model.ts`
VIP cashback: `vip-cashback.model.ts`
VIP level-up bonus: `vip-level-up-bonus.model.ts`
VIP spin reward (wheel): `vip-spin-reward.model.ts`, `vip-spin-prize.model.ts`

VIP advancement is calculated based on deposit totals and wager volume.

---

## 9. Deployment Architecture

```
Server (Ubuntu 22.04)
├── PM2
│   └── 87app-api (backend, port 8701)
│
└── Nginx
    ├── cuocbong99.live → serve frontend1/dist/ (static)
    │   └── /api/ → proxy_pass localhost:8701
    │   └── /socket.io → proxy_pass localhost:8701
    ├── admin.cuocbong99.live → serve admin/dist/ (static)
    └── api.cuocbong99.live → proxy_pass localhost:8701
```

SSL: Let's Encrypt (certbot).

---

## 10. Known Architectural Limitations

1. **No shared package layer** — type definitions and constants are duplicated between backend, frontend1, and admin
2. **No API contract** — frontend relies on runtime behavior, not typed contracts
3. **Single MongoDB instance** — no read replicas, no sharding strategy
4. **No queue/worker** — background tasks run as cron jobs in the main process (not isolated workers)
5. **No OpenAPI docs** — API is undocumented and relies on developer knowledge
