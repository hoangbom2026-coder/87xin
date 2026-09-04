# CHANGELOG.md — GAME Project AI Change Log

_Records all changes made by AI agents. Newest first._

---

## [2026-04-09] — Phase 1: Security Hardening

**Agent:** Bob (IBM Bob AI)
**Session type:** IMPLEMENT

### Added

- `game/backend/package.json` — Missing file recreated from `pnpm-lock.yaml` dependencies. Includes `helmet` and `express-rate-limit` as new dependencies.
- `game/backend/src/middlewares/rate-limit.ts` — New middleware: `authLimiter` (10 req/15min/IP) and `otpLimiter` (5 req/15min/IP).
- `game/backend/src/main/models/user.model.ts` — Missing model file recreated. Defines `IUser` interface and `UserModel` with `isPasswordMatch`, `isUsernameTaken`, `isEmailTaken`, `isPhoneTaken` statics.

### Changed

- `game/backend/src/app.ts`:
  - Added `import helmet from 'helmet'`
  - Added `app.use(helmet())` as first middleware
  - Reduced `express.json({ limit: '500mb' })` → `express.json({ limit: '10mb' })`
  - Reduced `express.urlencoded({ limit: '500mb' })` → `express.urlencoded({ limit: '10mb' })`
- `game/backend/src/middlewares/auth.ts`:
  - Replaced `user?: any` with `user?: IUser` in `AuthRequest`
  - Replaced `file?: any` with `file?: Express.Multer.File`
  - Added `import { IUser } from '@main/models/user.model'`
- `game/backend/src/main/routes/auth.router.ts`:
  - Added `authLimiter` to: `POST /login`, `POST /register`, `POST /admin-login`, `POST /forgot-password`, `POST /reset-password`, `POST /affiliate/login`, `POST /affiliate/register`
- `game/backend/src/main/routes/verify.router.ts`:
  - Added `otpLimiter` to all routes: `/email-verify`, `/email-resend`, `/email-code`, `/resetpassword`

### Tests

- **typecheck:** Pre-existing errors: 143 (93 are `Cannot find module` — pre-existing before this PR). No new errors introduced by these changes.
- **lint:** PASS — zero errors on all modified files
- **build:** Not run (missing referenced modules prevent a clean build — pre-existing issue)

### Problems Found

- 93 `Cannot find module` errors in TypeScript — services and config files that are referenced but don't exist in the repo (likely gitignored or deleted). This is a pre-existing issue unrelated to Phase 1.
- `ObjectId` vs `string` type mismatch in multiple controllers — pre-existing technical debt from weak TypeScript config.
- `package.json` was entirely missing from `backend/` — only `pnpm-lock.yaml` existed. Created from lock file data.

### Remaining

- Rate limiting uses in-memory store — for multi-instance production, upgrade to `rate-limit-redis` store.
- Pre-existing 143 TypeScript errors need separate investigation.
- Phase 1.7 (payment callback signature validation) not done — requires deeper investigation of GSC/AG callback flows.

### Next Step

- **Phase 2**: Investigate and restore the 93 missing module files (setting.service, currency.service, deposit.service, etc.) — OR confirm they're in a gitignore and need to be restored.
- Then: Add Vitest test infrastructure to backend.

---

## [2026-04-09] — Initial AI Training Setup

**Agent:** Bob (IBM Bob AI)
**Session type:** DISCOVER + DOCUMENT

### Added

- `game/AGENTS.md` — Master AI engineering rules, adapted for the 87app game project (not the generic AXVN APPPWED monorepo rules). Covers project structure, backend layering, frontend architecture, security rules, workflow, and the GOLDEN RULE.
- `game/docs/AI/BASELINE.md` — Complete discovery snapshot: repository tree, technology stack, backend/frontend inventory, model list, route list, test coverage status (zero), technical debt, security findings, architectural violations, recommended migration order.
- `game/docs/AI/ARCHITECTURE.md` — Detailed architecture documentation: system overview diagram, backend layering, frontend1 state management flow, admin panel paradigm, payment provider architecture, affiliate system, VIP system, deployment topology.
- `game/docs/AI/ROADMAP.md` — Prioritized improvement roadmap across 7 phases: Security, Tests, Type Safety, Observability, API Docs, Frontend, Infrastructure.
- `game/docs/AI/DECISIONS.md` — Architecture Decision Records (ADR-001 through ADR-008): non-monorepo structure, MongoDB choice, session-based auth, admin/player auth separation, shadcn/ui, Redux-Saga, seamless wallet, 500mb body limit debt.
- `game/docs/AI/CHANGELOG.md` — This file.

### Changed

Nothing. This session was DISCOVER + DOCUMENT only. No source code was modified.

### Problems Found

See `BASELINE.md` sections 9 (Technical Debt), 10 (Security Findings), 11 (Architectural Violations).

**Summary of critical issues:**
1. Zero test coverage (backend + frontend)
2. `express.json({ limit: '500mb' })` — DoS risk
3. No rate limiting on auth/OTP endpoints
4. No Helmet.js security headers
5. `req.user: any` — no type safety on authenticated user
6. `adminAxios.ts` in `frontend1/` — admin API in player app

### Next Step

→ Phase 1.1: Reduce JSON body limit in `backend/src/app.ts`
→ Then Phase 1.2: Add Helmet.js

---

_Template for new changelog entries:_

```markdown
## [YYYY-MM-DD] — Short description

**Agent:** Name
**Session type:** DISCOVER | IMPLEMENT | FIX | REFACTOR | DOCUMENT

### Added
- Files added

### Changed
- Files changed and what changed

### Tests
- typecheck: pass/fail
- lint: pass/fail
- build: pass/fail

### Problems Found
- New bugs or debt discovered

### Next Step
- Exact next task
```
