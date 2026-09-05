# Kiến trúc hệ thống — TC-Gaming

## 1. Nguyên tắc thiết kế

### Dependency Rule (BẮT BUỘC)
```
Apps  →  Libs  →  (không phụ thuộc vào Apps)
Apps  ↛  Apps   ← TUYỆT ĐỐI CẤM
```

Luồng phụ thuộc chỉ đi một chiều: từ ngoài vào trong.

### Separation of Concerns
- **Controller**: nhận request, validate input, gọi service, trả response. Không chứa business logic.
- **Service**: chứa toàn bộ business logic. Không biết về HTTP.
- **Model**: chỉ định nghĩa schema và Mongoose operations.

---

## 2. Dependency Graph

```
┌─────────────────────────────────────────────┐
│                   APPS                      │
│                                             │
│  apps/backend   apps/admin   apps/frontend  │
│      │               │            │         │
│      └───────────────┴────────────┘         │
│                      │                      │
└──────────────────────┼──────────────────────┘
                       ▼ (import)
┌─────────────────────────────────────────────┐
│                   LIBS                      │
│                                             │
│  @game/ui   @game/types   @game/shared-utils│
│  @game/db   @game/cron    @game/i18n        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 3. Path Aliases (`tsconfig.base.json`)

Tất cả path aliases định nghĩa tại `tsconfig.base.json` gốc. Các app chỉ extend, không redefine.

```jsonc
{
  "paths": {
    // Shared Libraries
    "@game/ui":           ["libs/ui/src"],
    "@game/types":        ["libs/shared-types/src"],
    "@game/shared-utils": ["libs/shared-utils/src"],
    "@game/db":           ["libs/db/index.ts"],
    "@game/cron":         ["libs/cron/index.ts"],
    "@game/i18n":         ["libs/i18n/index.ts"],

    // Backend internal shortcuts
    "@main/*":            ["apps/backend/src/main/*"],
    "@utils/*":           ["apps/backend/src/utils/*"],
    "@config/*":          ["apps/backend/src/config/*"],
    "@middlewares/*":     ["apps/backend/src/middlewares/*"]
  }
}
```

---

## 4. Backend Architecture

### Layer Stack
```
HTTP Request
     │
     ▼
middlewares/
  ├── helmet()           — security headers (first)
  ├── cors()             — whitelist origins
  ├── compression()      — gzip
  ├── express.json()     — body parser (limit: 10mb)
  ├── auth.ts            — inject req.user (player routes)
  └── admin-only.ts      — check role ∈ ['admin','owner']
     │
     ▼
routes.ts  (central router aggregator)
     │
     ▼
*.router.ts  (route definitions + middleware chain)
     │
     ▼
*.controller.ts
  - parse & validate input
  - call service
  - send response
     │
     ▼
*.service.ts
  - business logic
  - DB queries via models
  - external API calls
     │
     ▼
*.model.ts (Mongoose)
     │
     ▼
MongoDB / Redis
```

### Controller-Service Pattern (example)
```typescript
// controller — chỉ parse + delegate
export const getStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const stats = await adminVipService.getStats();
  return res.send({ success: true, data: stats });
});

// service — chứa logic
export async function getStats() {
  const [tiersCount, distribution] = await Promise.all([
    VipTiersModel.countDocuments(),
    UserModel.aggregate([...])
  ]);
  return { tiersCount, distribution };
}
```

### API Response Contract
```typescript
// SUCCESS
{ success: true, data?: T, message?: string }

// ERROR (thrown as ApiError, caught by error.ts middleware)
{ success: false, error: { code: string, message: string } }
```

### Auth System
| Middleware | Dùng cho | Logic |
|---|---|---|
| `auth.ts` | Player routes | Validate session token → gán `req.user: IUser` |
| `admin-only.ts` | Admin routes | `auth.ts` + check `req.user.role ∈ ['admin','owner']` |
| `affiliate-auth.ts` | Affiliate routes | Validate affiliate session |

Token = session ID (stored in MongoDB + Redis cache). Không dùng stateless JWT (session có thể revoke ngay).

### Rate Limiting
```
Auth endpoints:   10 req / 15 min / IP   (middlewares/rate-limit.ts)
OTP/verify:        5 req / 15 min / IP
```
⚠ Hiện dùng in-memory store. Production multi-instance: cần migrate sang Redis store (`rate-limit-redis`).

---

## 5. Frontend Architecture (Admin Dashboard)

### Component Hierarchy
```
<App>
  <QueryClientProvider>        ← TanStack Query (server state)
    <AuthProvider>             ← auth context (localStorage token)
      <BrowserRouter>
        <ProtectedRoute>       ← redirect /login if no token
          <AdminLayout>        ← sidebar + topbar shell
            <Suspense>
              <LazyPage />     ← lazy-loaded page component
            </Suspense>
          </AdminLayout>
        </ProtectedRoute>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
</App>
```

### Data Flow (Admin)
```
Page component
  │  useQuery / useMutation (TanStack Query)
  ▼
lib/api.ts  req()
  │  fetch + Bearer token (localStorage.adminAccessToken)
  │  timeout: 10s AbortController
  │  401 → redirect /login
  ▼
Backend API /api/admin/*
```

---

## 6. Frontend Architecture (Player Web)

### State Management
```
Redux Store
  ├── auth slice          ← user session
  ├── ui slice            ← loading, modal states
  └── domain slices       ← game, wallet, affiliate...

Redux-Saga
  └── watchers            ← async effects, API calls, polling
```

### i18n
- Provider: `LanguageContext` (React Context)
- Keys: `vi.json` (Vietnamese, default) + `en.json` (English)
- Usage: `const { t } = useLanguage(); t('key.path')`
- ⚠ Hiện chỉ có ~12 keys — mở rộng đang pending (Phase 5.6 Roadmap)

---

## 7. Database Architecture

### MongoDB Collections (60+)
```
Auth & Users:
  users, sessions, otps, auth-logs, password-resets, password-logs

Finance:
  balances, transactions, deposits, withdrawals
  gs-pay-deposit-logs, gs-pay-withdraw-logs
  nowpay-deposit-logs, nowpay-withdraw-logs
  ag-payin-logs, ag-payout-logs

VIP & Loyalty:
  vip-tiers, vip-levels, vip-cashbacks, vip-level-up-bonuses
  vip-spins, vip-spin-prizes, vip-spin-rewards

Affiliate:
  affiliates, affiliate-logs, affiliate-stats, affiliate-feed-items

Games:
  slot-games, ag-games, ag-categories, ag-logs, casino-logs
  sports, daily-challenges, game-configs

CMS:
  banners, article-posts, article-categories, content-blocks
  media-assets, media-folders, helps, tickets
  support-conversations, support-messages, newsletter-subscribers

Admin:
  admin-audit-logs, roles

Others:
  bonuses, player-bonuses, rewards, packages, package-categories
  plans, stores, currencies, preferences, referral-codes
  kycs, invest-logs, site-plugins
```

### Atomic Operations
- Balance mutations: dùng `$inc` + Mongoose session (`session.withTransaction()`)
- GSC callback: phải idempotent (game server có thể retry)
- Session: sliding expiry (extend on activity)

---

## 8. Real-time Architecture (Socket.io)

```
Client
  │ WebSocket (fallback: polling)
  ▼
Nginx  (proxy_pass + upgrade headers)
  │
  ▼
Backend :8701/socket.io
  │
  ├── public-chat.service.ts   ← public chat room
  └── support-chat.service.ts  ← player-support 1-1
```

PM2 chạy backend ở **fork mode** (không dùng cluster) để Socket.io không cần sticky sessions.

---

## 9. CI/CD Pipeline

```
git push → GitHub
    │
    ▼
.github/workflows/pr-check.yml    ← PR: typecheck 3 workspaces
.github/workflows/deploy.yml      ← main branch: build → SSH → deploy
    │
    ▼
VPS (SSH)
    ├── rsync source files
    ├── docker-compose up -d --force-recreate
    └── PM2 reload tc-api + health check retry
```

Secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_PORT` — GitHub Secrets (không commit).

---

## 10. Security Architecture

| Layer | Biện pháp |
|---|---|
| HTTP Headers | `helmet()` — đặt trước tất cả middleware |
| CORS | Whitelist origins từ config |
| Body size | `10mb` limit (đã fix từ 500mb) |
| Auth | Session + Redis, revocable |
| Rate limit | express-rate-limit trên auth + OTP |
| Admin access | Role check `['admin','owner']` mọi admin route |
| Secrets | Không bao giờ commit `.env`, dùng GitHub Secrets |
| Audit | `admin-audit-log.model.ts` ghi mọi action admin |
