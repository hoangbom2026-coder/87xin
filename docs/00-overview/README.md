# TC-Gaming — Tổng quan dự án

## Giới thiệu

TC-Gaming là nền tảng game đổi thưởng trực tuyến full-stack, xây dựng theo kiến trúc **monorepo** với 3 ứng dụng độc lập và 6 thư viện dùng chung.

Domain: `tc-gaming.live`

---

## Thành phần hệ thống

| Thành phần | Tech stack | Port | Mô tả |
|---|---|---|---|
| **Backend API** | Express 4 + Node 20 + TypeScript | `8701` | REST API + Socket.io |
| **Admin Dashboard** | React 18 + Vite + shadcn/ui | `8781` | Quản trị nội bộ |
| **Frontend Web** | React 18 + Vite + Redux-Saga | `5173` | Giao diện người chơi |
| **MongoDB** | MongoDB 6 + Mongoose | `27017` | Cơ sở dữ liệu chính |
| **Redis** | Redis 7 (optional) | `6379` | Cache + session store |
| **Nginx** | Nginx 1.24 | `80/443` | Reverse proxy + TLS |

---

## Kiến trúc tổng quát

```
Internet
    │
    ▼
 Nginx (443/80)
    ├── /          → Frontend Web  (SPA static files)
    ├── /admin     → Admin Dashboard (SPA static files)
    └── /api       → Backend API (PM2 process, port 8701)
                           │
                     ┌─────┼────────┐
                     ▼     ▼        ▼
                  MongoDB Redis  External APIs
                            (GS-Pay, AG Casino, NowPay)
```

---

## Workspace layout

```
game/                          ← monorepo root
├── apps/
│   ├── backend/               ← Express API
│   ├── admin-dashboard/       ← React Admin
│   └── frontend-web/          ← React Player site
├── libs/
│   ├── ui/                    ← @game/ui     — shadcn components
│   ├── shared-types/          ← @game/types  — TypeScript types
│   ├── shared-utils/          ← @game/shared-utils
│   ├── db/                    ← @game/db     — DB connection
│   ├── cron/                  ← @game/cron   — cron jobs
│   └── i18n/                  ← @game/i18n   — localization
├── docs/                      ← tài liệu (file này)
├── infra/                     ← scripts deploy, nginx, env
├── tsconfig.base.json         ← path aliases chung
└── package.json               ← workspace root
```

---

## Domain nghiệp vụ

| Domain | Mô tả |
|---|---|
| **Authentication** | Đăng nhập, session, OTP, role-based access |
| **Wallet & Payment** | Nạp/rút tiền, lịch sử giao dịch |
| **Payment Gateways** | GS-Pay, AG-Pay, NowPay (crypto) |
| **Games & Casino** | AG Casino seamless wallet, slot, sport |
| **VIP & Loyalty** | 10 cấp VIP, cashback, thưởng thứ Sáu, spin thưởng |
| **Affiliate & Agency** | Đa cấp affiliate, commission, đại lý đầu tư |
| **Bonuses & Rewards** | Khuyến mãi, thưởng nạp, daily challenges |
| **CMS** | Banner, bài viết, help center, media |
| **Support** | Ticket, support chat real-time |
| **Admin** | Audit logs, churn risk, realtime monitor |

---

## Số liệu codebase

| Loại | Số lượng |
|---|---|
| Controllers | 60+ |
| Services | 60+ |
| Mongoose Models | 60+ |
| Express Routers | 60+ |
| Admin Pages | 60+ |
| API Endpoints (ước tính) | 200+ |
| Cron Jobs | 3 |
| Shared Libraries | 6 |

---

## Luồng request điển hình

```
Client (browser)
    │  HTTP/HTTPS
    ▼
Nginx proxy_pass /api → :8701
    │
    ▼
Express app.ts
    │  middlewares: helmet → cors → compression → json → auth
    ▼
routes.ts  (route aggregator)
    │
    ▼
*.router.ts  (route definition)
    │
    ▼
*.controller.ts  (parse request, call service)
    │
    ▼
*.service.ts  (business logic)
    │
    ▼
*.model.ts  (Mongoose → MongoDB)
    │
    ◄ response JSON { success, data, message }
```

---

## Tài liệu liên quan

- [`docs/01-architecture/README.md`](../01-architecture/README.md) — Kiến trúc chi tiết
- [`docs/02-apps/`](../02-apps/) — Từng app riêng biệt
- [`docs/03-libs/README.md`](../03-libs/README.md) — Shared libraries
- [`docs/04-infra/README.md`](../04-infra/README.md) — Infrastructure & deploy
- [`docs/05-integrations/README.md`](../05-integrations/README.md) — Third-party integrations
- [`docs/06-standards/README.md`](../06-standards/README.md) — Coding standards
- [`docs/HERMES_CONTEXT.md`](../HERMES_CONTEXT.md) — Context nhanh cho AI agent
