# ROADMAP.md — GAME Project Improvement Roadmap

_Last updated: 2026-04-09_

---

## Priority Legend

- 🔴 CRITICAL — security or data integrity risk
- 🟠 HIGH — stability, correctness, or maintainability
- 🟡 MEDIUM — developer experience, technical debt
- 🟢 LOW — nice-to-have, polish

---

## Phase 1: Security & Stability (Do First)

| # | Priority | Task | Affected Files |
|---|---|---|---|
| 1.1 | 🔴 | Reduce JSON body limit from `500mb` to `10mb` max | `backend/src/app.ts` |
| 1.2 | 🔴 | Add `helmet` middleware for HTTP security headers | `backend/src/app.ts` |
| 1.3 | 🔴 | Add `express-rate-limit` on all `/api/auth/*` routes | `backend/src/main/routes/auth.router.ts` |
| 1.4 | 🔴 | Add rate limiting on OTP/verify routes | `backend/src/main/routes/verify.router.ts` |
| 1.5 | 🟠 | Replace `req.user: any` with typed `IUser` interface | `backend/src/middlewares/auth.ts` |
| 1.6 | 🟠 | Add `requestId` middleware (uuid per request) for structured logging | `backend/src/app.ts` |
| 1.7 | 🟠 | Validate all payment callback signatures (HMAC/secret check) | `gs-callback.router.ts`, `ag-callback.router.ts` |

---

## Phase 2: Test Infrastructure

| # | Priority | Task | Notes |
|---|---|---|---|
| 2.1 | 🟠 | Add Vitest + test config to `backend/` | No tests currently exist |
| 2.2 | 🟠 | Write unit tests for `balance.service.ts` | Critical financial logic |
| 2.3 | 🟠 | Write unit tests for `affiliate-mechanism.service.ts` | Commission calculation |
| 2.4 | 🟡 | Add Vitest + test config to `frontend1/` | |
| 2.5 | 🟡 | Write unit tests for Redux `authSlice` | |
| 2.6 | 🟡 | Write integration tests for auth flow (login → session → logout) | |

---

## Phase 3: Type Safety & Code Quality

| # | Priority | Task | Notes |
|---|---|---|---|
| 3.1 | 🟠 | Create `IUser` TypeScript interface from `user.model.ts` | Replace `any` in auth middleware |
| 3.2 | 🟠 | Audit all controllers for raw Mongoose document returns | Should use `.lean()` or DTO mapping |
| 3.3 | 🟡 | Standardize error response format to `{ success, error: { code, message } }` | Requires frontend changes |
| 3.4 | 🟡 | Add missing Joi validators for routes that lack them | Audit `routes/` vs `validators/` |
| 3.5 | 🟡 | Remove `adminAxios.ts` and `adminApi.ts` from `frontend1/` | Should only exist in `admin/` |
| 3.6 | 🟡 | Enable `noUncheckedIndexedAccess` in backend `tsconfig.json` | Better array safety |

---

## Phase 4: Observability

| # | Priority | Task | Notes |
|---|---|---|---|
| 4.1 | 🟡 | Add structured request logging middleware | Include `requestId`, `userId`, `method`, `url`, `statusCode`, `durationMs` |
| 4.2 | 🟡 | Replace `console.log` calls with structured logger | Use `logger.ts` consistently |
| 4.3 | 🟡 | Add health check metrics (DB connection, Redis connection, uptime) | Extend `/health` endpoint |
| 4.4 | 🟢 | Add error tracking integration (Sentry or similar) | |

---

## Phase 5: API Documentation

| # | Priority | Task | Notes |
|---|---|---|---|
| 5.1 | 🟡 | Add Swagger/OpenAPI spec generator (`swagger-jsdoc` or `zod-openapi`) | Backend has no API docs |
| 5.2 | 🟡 | Document all auth routes | |
| 5.3 | 🟡 | Document all payment routes | |
| 5.4 | 🟢 | Generate TypeScript client from OpenAPI spec for frontend | |

---

## Phase 6: Frontend Improvements

| # | Priority | Task | Notes |
|---|---|---|---|
| 6.1 | 🟡 | Add i18next for proper internationalization | Replace manual locale constants |
| 6.2 | 🟡 | Extract shared types into a separate `types/` module shared between frontend1 and admin | Currently duplicated |
| 6.3 | 🟡 | Add TanStack Query to `frontend1/` | Replace manual saga data-fetching patterns |
| 6.4 | 🟢 | Add Storybook for component documentation | |

---

## Phase 7: Infrastructure & Deployment

| # | Priority | Task | Notes |
|---|---|---|---|
| 7.1 | 🟡 | Add MongoDB replica set for read scaling and oplog | Currently single node |
| 7.2 | 🟡 | Add Bull/BullMQ queue for background jobs | Replace in-process cron jobs |
| 7.3 | 🟡 | Add CI/CD pipeline (GitHub Actions or similar) | Currently manual deploy.sh |
| 7.4 | 🟢 | Add Docker Compose for local development | |

---

## Current Status Summary

| Phase | Status |
|---|---|
| Phase 1: Security & Stability | ❌ Not started |
| Phase 2: Test Infrastructure | ❌ Not started |
| Phase 3: Type Safety | ❌ Not started |
| Phase 4: Observability | ❌ Not started |
| Phase 5: API Documentation | ❌ Not started |
| Phase 6: Frontend Improvements | ❌ Not started |
| Phase 7: Infrastructure | ❌ Not started |

---

## Immediate Next Task

→ **Phase 1.1**: Reduce `express.json` body limit in `backend/src/app.ts`

This is the smallest, safest, highest-impact change. No business logic affected.
