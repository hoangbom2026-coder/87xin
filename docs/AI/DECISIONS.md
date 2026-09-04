# DECISIONS.md — Architecture Decision Records (ADR)

_All significant architectural decisions are recorded here._
_Format: ADR-NNN | Date | Status | Decision | Reason_

---

## ADR-001 — Non-monorepo structure

**Date:** 2026-04-09 (discovery)
**Status:** EXISTING / ACCEPTED

**Decision:**
The project is structured as three independent sub-projects (`backend/`, `admin/`, `frontend1/`) with no shared package layer, no Turborepo, and no pnpm workspace.

**Reason:**
This was the initial project structure. It simplifies deployment (each project deploys independently) and avoids monorepo tooling complexity at the cost of code duplication.

**Consequence:**
- TypeScript types are duplicated between backend and frontends
- No shared constants or utilities
- API contract is implicit (no shared contract package)
- Changes to API must be manually synchronized across all three projects

**Future consideration:**
If the project grows significantly, introduce a minimal shared `packages/types` and `packages/contracts` layer.

---

## ADR-002 — MongoDB as primary database

**Date:** 2026-04-09 (discovery)
**Status:** EXISTING / ACCEPTED

**Decision:**
MongoDB 6 with Mongoose ODM is the primary data store.

**Reason:**
Flexible schema allows rapid iteration. Game platform features (game configs, VIP tiers, affiliate structures) benefit from document model flexibility.

**Consequence:**
- No ACID transactions across collections by default (use `session.withTransaction()` for multi-document operations)
- No foreign key constraints — referential integrity must be enforced at application level
- Balance updates require careful atomic operation design (`$inc`, sessions)

---

## ADR-003 — Session-based authentication (not stateless JWT)

**Date:** 2026-04-09 (discovery)
**Status:** EXISTING / ACCEPTED

**Decision:**
Authentication uses session documents stored in MongoDB with session state cached in Redis. Token = session identifier.

**Reason:**
Sessions allow instant invalidation (delete session document = user logged out immediately). Stateless JWT cannot be revoked without a denylist.

**Consequence:**
- Every authenticated request requires a database/Redis lookup (network cost)
- Horizontal scaling requires Redis to be shared across all backend instances
- Session expiry is sliding (extended on activity)

---

## ADR-004 — Separate auth for admin and players

**Date:** 2026-04-09 (discovery)
**Status:** EXISTING / ACCEPTED

**Decision:**
Admin panel uses `admin-only.ts` middleware (separate admin role check). Player site uses `auth.ts` middleware. Affiliate panel uses `affiliate-auth.ts`.

**Reason:**
Separation of concerns. Admin and player auth have different security requirements.

**Consequence:**
- Admin users cannot accidentally use player routes
- Player users cannot accidentally use admin routes
- Session model is shared — admin and player sessions live in same collection

---

## ADR-005 — shadcn/ui for admin panel

**Date:** 2026-04-09 (discovery)
**Status:** EXISTING / ACCEPTED

**Decision:**
Admin panel uses shadcn/ui (Radix UI primitives + TailwindCSS) as the component library.

**Reason:**
shadcn/ui provides unstyled accessible components that can be fully customized. No bundle size penalty from unused components.

**Consequence:**
- 50+ component files in `admin/client/components/ui/`
- Components are owned by the project (not a dependency) — updates require manual re-generation
- TailwindCSS is required

---

## ADR-006 — Redux-Saga for frontend1 async effects

**Date:** 2026-04-09 (discovery)
**Status:** EXISTING / ACCEPTED

**Decision:**
`frontend1/` uses Redux Toolkit + Redux-Saga for async data fetching.

**Reason:**
Redux-Saga allows complex async flows (polling, retries, cancellation) that are hard to express with Thunks.

**Consequence:**
- More boilerplate than TanStack Query or Thunks
- Sagas are harder to test than simple service functions
- New features require slice + saga + service function (3 files minimum)

**Future consideration:**
Evaluate migrating to TanStack Query for server state management. Redux can remain for pure client state (auth, UI).

---

## ADR-007 — Seamless wallet integration (GSC protocol)

**Date:** 2026-04-09 (discovery)
**Status:** EXISTING / ACCEPTED

**Decision:**
Game provider integration uses the GSC Seamless Wallet API v2.0.6. The game server calls our backend to debit/credit player balances in real time.

**Reason:**
Seamless wallet means players use their platform balance directly in games — no separate game wallet top-up required.

**Consequence:**
- GSC callbacks at `/v1/api/*` are the most latency-sensitive path in the system
- Must handle idempotency (game server may retry callbacks)
- Must respond within GSC timeout (typically < 3 seconds) or game round fails
- Balance mutations from GSC callbacks must be atomic

---

## ADR-008 — 500mb JSON body limit (PENDING REMOVAL)

**Date:** 2026-04-09 (discovery)
**Status:** TECHNICAL DEBT / TO BE FIXED

**Decision:**
Current code has `express.json({ limit: '500mb' })`.

**Why this is wrong:**
500mb body limit is a DoS attack vector. Any unauthenticated client can send 500mb requests and exhaust server memory.

**Required action:**
Reduce to `10mb` maximum. Media uploads go through `upload-media.ts` middleware which uses Multer (not JSON body parser).

**Blocking:** ~~Phase 1.1 of ROADMAP.md~~ — FIXED 2026-04-09

**Status updated:** FIXED — body limit reduced to `10mb` in `app.ts`.

---

## ADR-009 — Helmet.js for HTTP security headers

**Date:** 2026-04-09
**Status:** ACCEPTED

**Decision:**
Add `helmet` middleware to `backend/src/app.ts` as the first middleware (before CORS and compression).

**Reason:**
Helmet sets secure HTTP headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, `Content-Security-Policy` (default), etc. These headers protect against common web vulnerabilities at zero implementation cost.

**Consequence:**
- Content-Security-Policy default may block inline scripts on any server-rendered HTML pages — monitor in production.
- Applied as first middleware to ensure all responses get security headers.

**Files:** `backend/src/app.ts`, `package.json` (+helmet ^8.0.0)

---

## ADR-010 — Rate limiting on auth and OTP endpoints

**Date:** 2026-04-09
**Status:** ACCEPTED

**Decision:**
Add `express-rate-limit` to all auth routes (10 req/15min/IP) and OTP/verify routes (5 req/15min/IP). Implemented in `backend/src/middlewares/rate-limit.ts`.

**Reason:**
Without rate limiting, login and OTP endpoints are trivially brute-forceable. This is especially critical for a gaming/financial platform.

**Consequence:**
- Legitimate users behind NAT/shared IP will share the limit — acceptable for most use cases.
- Redis-backed store not used (in-memory store by default) — limits reset on process restart. For multi-instance production: add `rate-limit-redis` store.

**Files:** `backend/src/middlewares/rate-limit.ts`, `backend/src/main/routes/auth.router.ts`, `backend/src/main/routes/verify.router.ts`, `package.json` (+express-rate-limit ^7.0.0)

---

## ADR-011 — IUser interface and user.model.ts

**Date:** 2026-04-09
**Status:** ACCEPTED

**Decision:**
`user.model.ts` was missing from `src/main/models/` (likely gitignored or lost). Created `backend/src/main/models/user.model.ts` with `IUser` interface. Updated `auth.ts` to use `IUser` instead of `any` for `req.user`.

**Reason:**
`req.user: any` means no TypeScript safety when accessing user fields in controllers. Any typo in field name (e.g., `req.user.rol` instead of `req.user.role`) would silently be `undefined` at runtime.

**Consequence:**
- `IUser` now serves as the single source of truth for user shape across the backend.
- If the original `user.model.ts` had different fields, this file must be updated to match.
- Pre-existing TypeScript errors in controllers (ObjectId vs string) are NOT fixed by this — those are separate technical debt items.

**Files:** `backend/src/main/models/user.model.ts` (created), `backend/src/middlewares/auth.ts` (updated)

---

_Template for new ADRs:_

```
## ADR-NNN — Title

**Date:** YYYY-MM-DD
**Status:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED by ADR-NNN

**Decision:**
What was decided.

**Reason:**
Why this decision was made.

**Consequence:**
What this means going forward.
```
