# Backend API — apps/backend

## Tổng quan

Express 4 + TypeScript strict + MongoDB 6 + Redis.
Entry point: `src/index.ts` → `src/app.ts`.
Port mặc định: `8701`.

---

## Cấu trúc thư mục

```
apps/backend/src/
├── index.ts                    ← process entry, khởi DB + cron + listen
├── app.ts                      ← Express app config, middleware chain
├── routes.ts                   ← Central route aggregator (60+ routers)
├── socket.ts                   ← Socket.io event setup
├── page.route.ts               ← SPA fallback / SSR route
├── initialize.service.ts       ← App boot logic
├── init-helps.ts               ← Seed/init helpers
│
├── config/
│   ├── index.ts                ← Env config (MongoDB, JWT, payment keys)
│   ├── logger.ts               ← Winston logger setup
│   └── static.ts               ← Enums & constants (TRANSACTION_TYPE, etc.)
│
├── middlewares/
│   ├── auth.ts                 ← Player auth → req.user: IUser
│   ├── admin-only.ts           ← Role check ['admin','owner']
│   ├── affiliate-auth.ts       ← Affiliate session auth
│   ├── rate-limit.ts           ← express-rate-limit rules
│   ├── error.ts                ← Global error handler
│   └── upload.ts               ← Multer file upload (re-export)
│
├── utils/
│   ├── catchAsync.ts           ← Async error wrapper cho controllers
│   ├── ApiError.ts             ← Custom error class (status + message)
│   └── logger.ts               ← Winston instance
│
└── main/
    ├── controllers/            ← 60+ files (xem bên dưới)
    ├── services/               ← 60+ files (xem bên dưới)
    ├── models/                 ← 60+ Mongoose schemas (xem bên dưới)
    ├── routes/                 ← 60+ Express routers (xem bên dưới)
    ├── cron/                   ← Scheduled jobs
    ├── constants/              ← Game catalogs, VIP defaults, email templates
    ├── validators/             ← Zod schemas (đang mở rộng)
    ├── utils/                  ← Domain helpers
    └── types/                  ← TypeScript interfaces nội bộ
```

---

## config/index.ts — Biến môi trường

```typescript
{
  env: 'production' | 'development' | 'test',
  port: 8701,
  mongoose: { url: 'mongodb://127.0.0.1:27017/tc-gaming' },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpirationMinutes: 1440,    // 24h
    refreshExpirationDays: 30
  },
  cors: { origin: ['https://tc-gaming.live', ...] },
  agCasino: { host, merchantCode, secretKey },
  agPay:    { host, sn, merchantName, secretKey },
  gscPay:   { operationCode, secretKey, env: 'staging'|'prod' }
}
```

---

## Middleware Chain (app.ts — theo thứ tự)

```
1. helmet()                        — HTTP security headers
2. cors(config.cors)               — whitelist origins
3. compression()                   — gzip responses
4. express.json({ limit: '10mb' }) — JSON body parser
5. express.static(...)             — /uploads/avatars, /uploads/bonuses, ...
6. routes(app)                     — all API routes
7. errorHandler (middlewares/error.ts) — catch ApiError + unhandled
```

---

## routes.ts — Route Groups

| Group | Prefix | Routers |
|---|---|---|
| Auth & User | `/api/auth`, `/api/users`, `/api/role`, `/api/kyc` | auth, verify, user, role, kyc, kyc-admin |
| Wallet | `/api/wallet`, `/api/transactions`, `/api/invest-logs` | wallet, transaction, invest-log |
| Payments | `/api/gs-pay`, `/api/ag-pay`, `/api/nowpay` | gs-pay, ag-pay, nowpay |
| Games | `/api/casino`, `/api/sport`, `/api/daily-challenge`, `/api/game-menu` | ag-casino, sport, daily-challenge, game-menu |
| VIP | `/api/vip-tiers`, `/api/vip-level`, `/api/vip-spin`, `/api/vip-tiers-config` | vip-tiers, vip-level, vip-spin, vip-tiers-config |
| Affiliate | `/api/affiliate`, `/api/agency`, `/api/reagent` | affiliate, agency, user-affiliate, public-affiliate, referral-code, reagent |
| Admin | `/api/admin/*` | admin-dashboard, admin-vip, admin-affiliate, admin-games, admin-staff, admin-ip, admin-audit, admin-store, admin-game-menu, admin-churn, admin-agents |
| CMS | `/api/banners`, `/api/articles`, `/api/media`, `/api/help`, `/api/tickets` | banner, article, content-block, media, help, ticket, newsletter, bot-automation, site-plugin, support-chat, preference |
| Bonuses | `/api/bonuses`, `/api/rewards`, `/api/packages`, `/api/plans`, `/api/store` | bonus, player-bonus, reward, package, plan, store |
| Public | `/api/vip-tiers-config`, `/api/currency` | vip-tiers-config (public read), currency |

---

## Controllers — Danh sách đầy đủ

### Admin (12 files)
| File | Routes prefix | Chức năng |
|---|---|---|
| `admin-dashboard.controller.ts` | `/api/admin/dashboard` | Tổng quan thống kê hệ thống |
| `admin-vip.controller.ts` | `/api/admin/vip` | VIP stats, user list, dynamic config 10 cấp |
| `admin-affiliate.controller.ts` | `/api/admin/affiliate` | Quản lý affiliates |
| `admin-affiliate-extras.controller.ts` | `/api/admin/affiliate/extras` | Cấu hình commission extras |
| `admin-agents.controller.ts` | `/api/admin/agents` | Quản lý đại lý (agents) |
| `admin-audit.controller.ts` | `/api/admin/audit` | Audit logs |
| `admin-churn.controller.ts` | `/api/admin/churn` | Phân tích churn risk |
| `admin-game-menu.controller.ts` | `/api/admin/game-menu` | Quản lý menu game |
| `admin-games.controller.ts` | `/api/admin/games` | Quản lý game catalog |
| `admin-ip.controller.ts` | `/api/admin/ip` | IP access control |
| `admin-staff.controller.ts` | `/api/admin/staff` | Quản lý nhân viên (staff) |
| `admin-store.controller.ts` | `/api/admin/store` | Quản lý store |

### VIP (6 files)
| File | Chức năng |
|---|---|
| `vip-tiers.controller.ts` | CRUD vip-tiers (legacy, theo parentId) |
| `vip-level.controller.ts` | CRUD vip-levels (con của tiers) |
| `vip-bonus.controller.ts` | Thưởng lên cấp |
| `vip-spin.controller.ts` | Vòng quay VIP |
| `vip-spin-prize.controller.ts` | Giải thưởng vòng quay |
| `admin-vip.controller.ts` | Dynamic config 10 cấp (xem Admin bên trên) |

### Payment (4 files)
| File | Chức năng |
|---|---|
| `gs-pay.controller.ts` | GS-Pay deposit/withdraw callbacks |
| `ag-pay.controller.ts` | AG-Pay callbacks |
| `nowpay.controller.ts` | NowPay crypto callbacks |
| `transaction.controller.ts` | Lịch sử giao dịch |

### Auth & User (7 files)
`auth.controller.ts`, `user.controller.ts`, `verify.controller.ts`, `kyc.controller.ts`, `kyc-admin.controller.ts`, `role.controller.ts`, `player.controller.ts`

### Affiliate & Agency (7 files)
`affiliate.controller.ts`, `agency.controller.ts`, `user-affiliate.controller.ts`, `public-affiliate.controller.ts`, `referral-code.controller.ts`, `reagent-program.controller.ts`, `reagent-tree.controller.ts`

### Games (4 files)
`ag-casino.controller.ts`, `sport.controller.ts`, `daily-challenge.controller.ts`, `admin-game-menu.controller.ts`

### CMS (9 files)
`banner.controller.ts`, `article.controller.ts`, `content-block.controller.ts`, `media.controller.ts`, `help.controller.ts`, `ticket.controller.ts`, `newsletter.controller.ts`, `bot-automation.controller.ts`, `site-plugin.controller.ts`

### Misc (8 files)
`bonus.controller.ts`, `player-bonus.controller.ts`, `reward.controller.ts`, `package.controller.ts`, `plan.controller.ts`, `store.controller.ts`, `currency.controller.ts`, `preference.controller.ts`

---

## Services — Nhóm quan trọng

### Finance & Payments
```
balance.service.ts          — createBalance, creditBalance, depositBonus, getBalanceByUserId
payment.service.ts          — deposit/withdraw orchestration
gs-pay-log.service.ts       — GS-Pay transaction logging
nowpay.service.ts           — NowPay deposit
nowpay-withdraw.service.ts  — NowPay withdrawal
```

### VIP
```
vip-tiers-config.service.ts — Dynamic config: getVipTiers(), updateVipTiers(), DEFAULT_VIP_TIERS
vip-level-up-bonus.service.ts
vip-cashback.service.ts
vip-spin-reward.service.ts
vip-spin-prize.service.ts
```

### Affiliate
```
affiliate.service.ts
affiliate-stats.service.ts  — daily stats aggregation
affiliate-payout.service.ts — commission calculations
affiliate-log.service.ts
affiliate-extras.service.ts — commission tier config
affiliate-mechanism.service.ts
```

### Auth & Session
```
session.service.ts          — create/validate/revoke sessions
otp.service.ts              — OTP generation/verification
auth-log.service.ts         — login audit trail
```

### Games
```
ag-casino.service.ts        — GSC Seamless Wallet callbacks
gsc-catalog-sync.service.ts — sync game catalog từ GSC API
gsc-provider-games.client.ts — GSC API client
```

### Notifications
```
email.service.ts            — SendGrid (transactional email)
telegram.service.ts         — Telegram bot alerts
```

---

## Models — Mongoose Schemas

### Finance (10)
`balance`, `transaction`, `deposit`, `withdrawal`, `gs-pay-deposit-log`, `gs-pay-withdraw-log`, `nowpay-deposit-log`, `nowpay-withdraw-log`, `ag-payin-log`, `ag-payout-log`

### Auth & User (6)
`user`, `session`, `otp`, `auth-log`, `password-reset`, `password-log`

### VIP (7)
`vip-tiers`, `vip-level`, `vip-cashback`, `vip-level-up-bonus`, `vip-spin`, `vip-spin-prize`, `vip-spin-reward`

### Affiliate (4)
`affiliate`, `affiliate-log`, `affiliate-stats`, `affiliate-feed-item`

### Games (7)
`slot-game`, `ag-game`, `ag-category`, `ag-log`, `casino-log`, `sport`, `daily-challenge`

### CMS (11)
`banner`, `article-post`, `article-category`, `content-block`, `media-asset`, `media-folder`, `help`, `ticket`, `support-conversation`, `support-message`, `newsletter-subscriber`

### Admin & Config (6)
`admin-audit-log`, `role`, `preference`, `currency`, `site-plugin`, `game-config`

### Commerce (7)
`bonus`, `player-bonus`, `reward`, `package-category`, `packages`, `plan`, `store`, `invest-log`

### Misc (3)
`referral-code`, `kyc`, `bot-automation`

---

## Cron Jobs

| File | Trigger | Chức năng |
|---|---|---|
| `affiliate-daily.cron.ts` | Mỗi ngày 00:05 | Tổng hợp stats affiliate ngày hôm trước |
| `affiliate-fake-feed.cron.ts` | Mỗi 5 phút | Sinh feed affiliate giả để giao diện sống động |
| `agency-investment-interest.cron.ts` | Mỗi ngày 01:00 | Tính lãi đầu tư đại lý |

---

## VIP Dynamic Config — Flow chi tiết

```
IVipTier interface
  (apps/backend/src/main/constants/vip-tiers-defaults.ts)
        │
        ▼ normalizeVipTiers()
vip-tiers-config.service.ts
  - getVipTiers(bustCache?)   → đọc DB, fallback DEFAULT_VIP_TIERS, cache 60s Redis
  - updateVipTiers({ adminUserId, adminUsername, input })
      → normalizeVipTiers(input)
      → lưu DB (setting key: 'vip-tiers-config')
      → ghi admin_audit_logs
      → bust Redis cache
        │
        ├── Admin route:   POST /api/admin/vip/tiers   (auth required)
        └── Public route:  GET  /api/vip-tiers-config  (no auth)
```

---

## Health Check

```
GET /health
GET /api/health

Response:
{
  status: 'ok' | 'degraded',
  latency_ms: number,
  services: {
    mongodb: 'connected' | 'disconnected',
    redis: 'connected' | 'unavailable'
  }
}
```

---

## TypeScript Build

```bash
cd apps/backend
npx tsc --noEmit --project tsconfig.json   # typecheck
npm run build                               # tsc → dist/
npm run test                               # vitest run
npm run test:coverage                       # vitest --coverage
```

Compiler: `tsc` + `tsc-alias` (resolve path aliases sau khi compile).
