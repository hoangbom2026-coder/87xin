# AGENTS.md — GAME PROJECT AI ENGINEERING RULES

## 1. ROLE

You are the primary AI engineering agent for this repository.

Project name: **87app** (game platform)
Repository path: `/var/app/game`

Your responsibility is to:

- inspect before modifying
- understand before rewriting
- preserve working functionality
- standardize architecture
- complete missing implementation
- detect technical debt
- fix bugs
- write tests
- run verification
- document decisions
- keep the repository buildable and runnable

Never blindly rewrite the project.

Never assume that an existing implementation is wrong without inspecting it.

Never introduce a new architecture when an existing architecture already satisfies the requirement.

---

## 2. SOURCE OF TRUTH

Priority order:

1. Actual source code
2. Database models (MongoDB Mongoose schemas)
3. Existing tests
4. Existing API contracts
5. Existing documentation
6. Architecture decisions
7. AI memory / OpenViking memory
8. AI assumptions

Memory is CONTEXT, not source of truth.

If memory conflicts with the actual repository:

**ACTUAL REPOSITORY WINS.**

---

## 3. REQUIRED WORKFLOW

Every task MUST follow:

```
DISCOVER
→ PLAN
→ IMPLEMENT
→ TEST
→ REVIEW
→ FIX
→ VERIFY
→ DOCUMENT
→ COMMIT
```

Do not skip DISCOVER.

Do not implement based only on the user's description.

---

## 4. DISCOVER

Before changing code, inspect:

- repository tree (`backend/`, `admin/`, `frontend1/`, `deploy/`)
- `package.json` in each sub-project
- `tsconfig.json` in each sub-project
- `backend/src/app.ts` — Express bootstrap, CORS, routes
- `backend/src/main/routes/` — all route files
- `backend/src/main/controllers/` — all controllers
- `backend/src/main/services/` — all services
- `backend/src/main/models/` — all Mongoose models
- `backend/src/main/validators/` — Joi validation schemas
- `backend/src/middlewares/` — auth, admin-only, error handling
- `backend/src/config/` — env config, logger
- `frontend1/src/` — React user-facing app
- `admin/client/` — React admin panel
- `deploy/` — deploy scripts, nginx config, PM2 ecosystem

Identify:

- duplicated code
- dead code
- missing validation
- controllers calling MongoDB directly (bypass service)
- inconsistent error formats
- missing authorization checks
- missing tests
- security issues
- incomplete features

Create or update:

`docs/AI/BASELINE.md`

---

## 5. ARCHITECTURE

This is a **non-monorepo** multi-app project with three independent sub-projects:

```
game/
├── backend/      Node.js + Express + MongoDB + Socket.io   (port 8701)
├── admin/        Vite + React admin panel                  (port 8781)
├── frontend1/    Vite + React player-facing site           (port 3000 dev / Nginx static prod)
├── deploy/       deploy.sh, PM2 ecosystem files, Nginx config
└── docs/         AI documentation (maintained by this agent)
```

Each sub-project has its own `package.json` and is installed/built independently.

There is NO Turborepo. There is NO pnpm workspace. Each sub-project runs independently.

---

## 6. BACKEND ARCHITECTURE

Stack: **Node.js 20 + Express + TypeScript + MongoDB (Mongoose) + Redis + Socket.io**

Backend layering:

```
Route
→ Authentication middleware (auth.ts / admin-only.ts)
→ Joi Validation middleware
→ Controller
→ Service
→ Mongoose Model
→ MongoDB
```

**Do NOT allow:**
- Controller → Mongoose model directly (must go through Service)
- Returning Mongoose documents directly as API response (must use lean() or map to DTO)
- Hardcoded secrets or connection strings

Path alias: `@main` → `src/main/`

---

## 7. FRONTEND ARCHITECTURE

Stack: **React 18 + TypeScript + Vite + Redux Toolkit + Redux-Saga + TailwindCSS**

```
frontend1/src/
├── api/          Axios instances (axios.ts, adminAxios.ts)
├── components/   Reusable UI components
│   ├── common/   Generic primitives (Badge, Input, etc.)
│   ├── financial/ Payment/deposit/withdraw UI
│   ├── layout/   App shells, navigation, footer
│   ├── promo/    Promotion modals and cards
│   ├── sections/ Page-level sections (GameList, HomeBanner)
│   ├── shared/   Cross-cutting components (PublicChat)
│   └── ui/       Base UI primitives (Modal, Loading, etc.)
├── constants/    App-wide constants
├── contexts/     React contexts (Auth, Site, Socket, Chat, UI)
├── features/     Domain-scoped Redux slices + sagas
│   ├── admin/
│   ├── affiliate/
│   ├── agency/
│   └── auth/
├── hooks/        Custom hooks
├── i18n/         Vietnamese/English translations
├── lib/          Utility (cn, etc.)
├── pages/        Page-level components
├── routes/       React Router config
├── services/     API service functions
├── store/        Redux store + root reducer + root saga
├── types/        TypeScript type definitions
└── utils/        Pure utility functions
```

---

## 8. ADMIN PANEL ARCHITECTURE

Stack: **React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui components**

```
admin/client/
├── components/
│   ├── admin/    Admin-specific components
│   ├── auth/     Auth guards (RequireSuperAdmin, RequireUser)
│   ├── layout/   AdminLayout, AdminNavTree, AppLayout
│   ├── shared/   ThemeToggle
│   ├── ui/       shadcn/ui component library (50+ components)
│   └── widget/   ChatWidget
├── constants/    Admin constants
├── hooks/        Admin hooks
├── lib/          API clients, page defaults, utils
└── pages/
    ├── admin/    All admin pages (Dashboard, Users, Games, etc.)
    └── affiliate/
```

---

## 9. DATABASE

Database: **MongoDB 6** (Mongoose ODM)
Cache: **Redis 7** (sessions, rate limiting, pub/sub)

All models are in `backend/src/main/models/`.

Important models:

| Model | File |
|---|---|
| User/Player | `user.model.ts` (inferred) |
| Session | `session.model.ts` |
| Balance | `balance.model.ts` |
| Transaction | `transaction.model.ts` |
| Deposit | `deposit.model.ts` |
| Withdraw | `withdraw.model.ts` |
| Affiliate | `affiliate.model.ts` |
| VIP Level | `vip-level.model.ts` |
| Slot Game | `slot-game.model.ts` |
| Casino Log | `casino-log.model.ts` |
| Bonus | `bonus.model.ts` |
| Role | `role.model.ts` |

No cross-collection foreign key constraints (MongoDB is schemaless).

Cross-domain references use ObjectId references only.

---

## 10. AUTHENTICATION

Authentication is session-based (custom session table in MongoDB/Redis), not stateless JWT.

Flow:
1. Login → create Session document in MongoDB
2. Token = session `_id` (or derived token stored in Redis)
3. `auth.ts` middleware looks up session by token on every request
4. Session is auto-extended on activity
5. Session expiry triggers logout

Admin auth uses separate middleware: `admin-only.ts`

Affiliate auth uses separate middleware: `affiliate-auth.ts`

**Never expose session tokens in logs.**

---

## 11. PAYMENT INTEGRATIONS

Current integrations (inferred from controllers/services):

| Integration | Files |
|---|---|
| GS Pay (internal) | `gs-pay.controller.ts`, `gs-pay-log.service.ts` |
| GS Callback | `gs-callback.router.ts` |
| AG Pay | `ag-pay.controller.ts`, `ag-pay.service.ts` |
| AG Casino (game provider) | `ag-casino.controller.ts`, `ag-casino.service.ts` |
| NowPay (crypto) | `nowpay.controller.ts`, `nowpay.service.ts`, `nowpay-withdraw.service.ts` |

Wallet/transaction rules:
- All balance mutations must go through `balance.service.ts`
- Use idempotency keys for payment callbacks
- Never trust mutable balance without ledger consistency
- All deposits/withdrawals must create an audit record

---

## 12. GAME PROVIDER INTEGRATION

GSC (Game Server Connector) Seamless Wallet API v2.0.6:

- Callback routes: `/v1/api/*` (handled by `gs-callback.router.ts`)
- AG Casino routes: `/ag-callback/*` (handled by `ag-callback.router.ts`)
- Game catalog sync: `gsc-catalog-sync.service.ts`
- Game provider games client: `gsc-provider-games.client.ts`
- Seamless wallet = provider calls our backend to debit/credit player balance

---

## 13. ERROR FORMAT

Standardize all API errors:

```json
{
  "success": false,
  "error": {
    "code": "DOMAIN_RESOURCE_REASON",
    "message": "Human readable message",
    "details": {}
  }
}
```

Use `ApiError` utility class from `backend/src/utils/ApiError.ts`.

Never return raw Mongoose errors to the client.

Never expose stack traces in production.

---

## 14. AUTHORIZATION

Roles are stored in MongoDB (role.model.ts).

Middleware:
- `auth.ts` — require authenticated player
- `admin-only.ts` — require admin role
- `affiliate-auth.ts` — require affiliate role

Permissions catalog: `backend/src/main/constants/permissions-catalog.ts`

**Always check authorization BEFORE performing data operations.**

Check for IDOR: ensure the authenticated user owns the resource before returning it.

---

## 15. SECURITY CHECKS

Always verify:

- IDOR/BOLA — user accessing another user's data
- Privilege escalation — player accessing admin endpoints
- Missing authorization — public routes that should be protected
- Mass assignment — blindly saving `req.body` to MongoDB
- SQL/NoSQL injection — unsanitized query parameters in Mongoose
- SSRF — server-side HTTP requests with user-controlled URLs
- Unsafe file uploads — missing MIME/size validation
- CORS misconfiguration — check `app.ts` CORS settings
- CSRF — session-based auth is CSRF-vulnerable on state-changing requests
- Weak session invalidation — sessions not invalidated on password change
- Replayable payment callbacks — missing idempotency keys
- Race conditions — balance deduction without atomic operations
- Secret leakage — never log JWT_SECRET, DB passwords, API keys
- PII leakage — never log phone numbers, full names, bank accounts
- Rate limiting gaps — auth endpoints must be rate limited

Never commit secrets. Use `.env` + config validation.

---

## 16. OBSERVABILITY

Backend logger: `backend/src/config/logger.ts`

Structured log fields:
```
timestamp, level, service, requestId, userId, action, resource, statusCode, durationMs, errorCode
```

Never log:
- passwords
- tokens / session IDs
- API keys
- private keys
- bank account numbers
- card numbers
- OTP codes

---

## 17. TESTING

After every implementation, run:

```bash
# Backend
cd backend
npm run typecheck
npm run lint
npm run build

# Frontend
cd frontend1
npm run typecheck
npm run lint
npm run build

# Admin
cd admin
npm run typecheck
npm run lint
npm run build
```

Do not claim completion if any check fails.

Unit tests: place in `*.spec.ts` or `*.test.ts` next to source files.

---

## 18. FEATURE COMPLETION RULE

A backend feature is NOT complete until it has:

- [ ] Mongoose model / schema update (if needed)
- [ ] Migration or seed script (if needed)
- [ ] Joi validation schema
- [ ] Service function
- [ ] Controller function
- [ ] Route registration
- [ ] Authorization middleware
- [ ] Audit/event log
- [ ] Tests
- [ ] Error handling
- [ ] Documentation update

A frontend feature is NOT complete until it has:

- [ ] API service function
- [ ] Redux slice / saga (or React Query) if stateful
- [ ] UI component
- [ ] Loading and error states
- [ ] Type definitions
- [ ] Route registration (if new page)

---

## 19. DOCUMENTATION

Maintain under `game/docs/AI/`:

```
docs/AI/
├── BASELINE.md     ← current state snapshot (auto-updated after DISCOVER)
├── ARCHITECTURE.md ← architectural decisions and patterns
├── ROADMAP.md      ← planned improvements in priority order
├── DECISIONS.md    ← ADR (Architecture Decision Records)
└── CHANGELOG.md    ← what was changed and when
```

Every architectural decision must be recorded in `DECISIONS.md`.

---

## 20. CHANGE CONTROL

Before large refactoring:

1. Inspect current implementation thoroughly
2. Identify all affected files and dependencies
3. Identify migration risk
4. Create a plan
5. Implement incrementally
6. Test after each meaningful step

Never perform massive blind rewrites.

---

## 21. COMPLETION REPORT

At the end of every task, report:

### Changed
- files modified
- features added/fixed

### Tests
- typecheck: pass/fail
- lint: pass/fail
- build: pass/fail

### Problems Found
- bugs discovered
- technical debt
- security issues

### Remaining
- incomplete work

### Next Step
- exact next task

---

## 22. GOLDEN RULE

**DO NOT GUESS.**

**INSPECT FIRST.**

**CHANGE THE SMALLEST SAFE SURFACE.**

**VERIFY EVERYTHING.**

**DOCUMENT WHAT YOU LEARN.**

**KEEP THE SYSTEM RUNNABLE.**
