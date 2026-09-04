# ARCHITECTURE.md — TC-GAMING Monorepo Architecture

_Last updated: 2026-09-04 (Monorepo Transitioning)_

---

## 1. Project Type

**TC-Gaming** (`tc-gaming.live`) is an online gaming and entertainment platform unified as a **TypeScript Monorepo** managing three core applications and shared domain libraries under npm workspaces.

- **Workspace standard:** Root `package.json` with npm workspaces (`apps/*`, `libs/*`).
- **Dependency Rule:** `Apps` (Web / Admin / API) → `Libs` (`@game/*`). Strict boundary: **Apps NEVER import from other Apps**.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                       │
│                                                                                 │
│   Player Browser (SPA)           Admin Dashboard (SPA)         GSC / AG Provider│
│   apps/frontend-web (React)      apps/admin-dashboard (React)  (Game Server API)│
└──────────┬───────────────────────────────┬──────────────────────────────┬───────┘
           │                               │                              │
           │  HTTP /api/*                  │  HTTP /api/admin/*           │  HTTP /api/gsc/*
           │  WS /socket.io                │  HTTP /api/auth/*            │  HTTP /api/ag-callback/*
           ▼                               ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           apps/backend (Express API)                            │
│                                   port 8701                                     │
│                                                                                 │
│   Middlewares: auth, admin-only, affiliate-auth, rate-limit, upload             │
│   Routes (REST + Socket.IO) ──► Controllers (HTTP) ──► Services (Business Logic)│
└──────────┬───────────────────────────────┬──────────────────────────────┬───────┘
           │                               │                              │
           ▼                               ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                SHARED LIBS (@game/*)                            │
│                                                                                 │
│   @game/types     │ @game/db          │ @game/cron        │ @game/models        │
│   shared-types/   │ db/ (Mongo/Redis) │ cron/ (Schedulers)│ models/ (Mongoose)  │
│   ────────────────┴───────────────────┴───────────────────┴─────────────────    │
│   @game/ui (DataTable, AdminLayout, shadcn/ui)  │ @game/i18n (vi/en locales)    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE & DATA STORES                           │
│                                                                                 │
│   MongoDB (Core Data)    │    Redis (Cache/Session/PubSub)  │   Nginx Reverse Proxy│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Monorepo Layer Organization

### 3.1 Apps (`apps/`)
- **`apps/backend`** (Port 8701): Express 4.21 + Socket.IO 4.8 + MongoDB + Redis + JWT.
- **`apps/frontend-web`**: React 18 + Redux Toolkit + Redux-Saga + Tailwind CSS (Player SPA).
- **`apps/admin-dashboard`** (Port 8781): React 18 + shadcn/ui + TanStack Query 5 + Vite (Admin SPA).

### 3.2 Shared Libraries (`libs/`)
- **`libs/shared-types`** (`@game/types`): Centralized TypeScript interfaces, API request/response contracts, and domain models.
- **`libs/db`** (`@game/db`): Centralized database client initializers (MongoDB connection, Redis fallback in-memory client).
- **`libs/cron`** (`@game/cron`): Centralized background workers, affiliate cron schedulers, and periodic calculation jobs.
- **`libs/models`** (`@game/models`): Centralized Mongoose schemas and models shared across backend and administrative services.
- **`libs/ui`** (`@game/ui`): Centralized UI design system, `AdminLayout`, `DataTable`, and shared Radix/Tailwind components.
- **`libs/i18n`** (`@game/i18n`): Centralized localization bundles (`vi.json`, `en.json`).

### 3.3 Infrastructure (`infra/`) & Configs (`configs/`)
- **`infra/nginx`**: Nginx configuration files with TLS termination, rate limiting, and reverse proxy routing.
- **`infra/scripts`**: Deployment (`deploy.sh`), monitoring (`monitor.sh`), and rollback (`rollback.sh`) scripts.
- **`configs/`**: Domain documentation, third-party vendor specs (GSC Seamless Wallet, AG Casino).
- **Root configuration**: Unified `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc`.
