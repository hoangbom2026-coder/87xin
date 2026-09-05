# HERMES_CONTEXT — tc-gaming.live
> Đọc file này 1 lần trước khi làm bất kỳ task nào. Đây là nguồn sự thật duy nhất.

---

## 1. CẤU TRÚC MONOREPO

```
game/
├── apps/
│   ├── admin-dashboard/     # React + Vite + shadcn/ui (port 5174)
│   ├── backend/             # Express + TypeScript + Mongoose (port 3000)
│   └── frontend-web/        # React + Vite + Redux-Saga (port 5173)
├── libs/
│   ├── ui/                  # @game/ui   — shadcn/ui components + DataTable
│   ├── models/              # @game/models — Mongoose models dùng chung (CHƯA migrate xong)
│   ├── shared-types/        # @game/types  — TypeScript types dùng chung (CHƯA migrate xong)
│   ├── shared-utils/        # @game/shared-utils — utilities dùng chung
│   ├── db/                  # @game/db    — MongoDB + Redis connection manager
│   └── cron/                # @game/cron  — cron job orchestration
├── configs/                 # DEPLOY.md, infra docs
├── docs/                    # tài liệu AI (đây là file này)
├── infra/                   # scripts deploy, nginx, env
├── tsconfig.base.json       # Định nghĩa tất cả @game/* path aliases
└── package.json             # pnpm workspace root
```

### Quy tắc phụ thuộc (BẮT BUỘC)
- `Apps` → `Libs`: OK
- `Libs` → `Libs`: OK (không vòng tròn)
- `App` → `App`: **TUYỆT ĐỐI CẤM**

### Path Aliases (tsconfig.base.json)
| Alias | Đường dẫn |
|---|---|
| `@game/ui` | `libs/ui/src/index.ts` |
| `@game/types` | `libs/shared-types/src/index.ts` |
| `@game/models` | `libs/models/index.ts` |
| `@game/db` | `libs/db/index.ts` |
| `@game/cron` | `libs/cron/index.ts` |
| `@game/shared-utils` | `libs/shared-utils/src/index.ts` |
| `@main/*` | `apps/backend/src/main/*` |
| `@utils/*` | `apps/backend/src/utils/*` |
| `@middlewares/*` | `apps/backend/src/middlewares/*` |
| `@config/*` | `apps/backend/src/config/*` |

---

## 2. BACKEND (apps/backend)

### Stack
- **Runtime:** Node 20, Express 4, TypeScript strict
- **DB:** MongoDB 6 + Mongoose, Redis (optional cache/session)
- **Auth:** Session-based (MongoDB session store), Redis cache. Token = session ID.
- **Pattern:** Controller → Service → Model (KHÔNG bỏ qua Service)

### Cấu trúc thư mục backend
```
apps/backend/src/
├── main/
│   ├── controllers/    # Chỉ parse request + gọi service
│   ├── services/       # Logic nghiệp vụ (chứa toàn bộ business logic)
│   ├── models/         # Mongoose models CỤC BỘ (một số chưa migrate lên libs/models)
│   ├── routes/         # Express Router definitions
│   └── constants/      # Enums, defaults (vd: vip-tiers-defaults.ts)
├── middlewares/        # auth.ts, admin-only.ts, rate-limit.ts, error.ts
├── utils/              # catchAsync, ApiError, logger
├── config/             # index.ts (env config), static.ts (enums)
├── routes.ts           # Route aggregator — gán tất cả router vào app
└── app.ts              # Express app setup (helmet, cors, body-parser, middleware chain)
```

### API Response Contract (BẮT BUỘC)
```typescript
// Success
{ success: true, data?: any, message?: string }

// Error (qua ApiError + error.ts middleware)
{ success: false, error: { code: string, message: string } }
```

### Middleware chain (app.ts — theo thứ tự)
1. `helmet()` — security headers
2. `cors()` — whitelist origins
3. `compression()`
4. `express.json({ limit: '10mb' })`
5. `express.static()`
6. routes (routes.ts)
7. error handler (middlewares/error.ts)

### Auth Middleware
- **Player:** `middlewares/auth.ts` → gán `req.user: IUser`
- **Admin:** `middlewares/admin-only.ts` → kiểm tra `req.user.role ∈ ['admin','owner']`
- **Affiliate:** `middlewares/affiliate-auth.ts`

### Rate Limiting
- Auth routes: 10 req / 15 min / IP
- OTP/verify routes: 5 req / 15 min / IP
- File: `middlewares/rate-limit.ts`

---

## 3. ADMIN DASHBOARD (apps/admin-dashboard)

### Stack
- React 18 + Vite + TypeScript
- TanStack Query (server state) + React Context (auth state)
- shadcn/ui (Radix + Tailwind) — components tại `client/components/ui/`
- Tailwind CSS variables (KHÔNG dùng hex màu cứng)

### Quy tắc UI (BẮT BUỘC)
```tsx
// Mọi trang admin phải bọc trong AdminLayout
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

// Mọi bảng dữ liệu dùng DataTable từ @game/ui
import { DataTable } from "@game/ui";
```

### API Client (client/lib/api.ts)
- Base URL: `VITE_API_URL` hoặc `/api`
- Token: đọc từ `localStorage.adminAccessToken` hoặc `localStorage.token`
- Timeout: 10s (AbortController)
- 401 → redirect `/login`
- Tất cả functions export riêng lẻ (named exports), **không** dùng default class
- Token được inject tự động trong hàm `req()` nội bộ — KHÔNG cần truyền token vào arguments

### Lỗi phổ biến trong api.ts
Nhiều page import functions chưa tồn tại trong `api.ts` (dùng Proxy dynamic fallback).
Khi thêm page mới: **phải thêm function vào api.ts trước**, đừng dựa vào Proxy.

### VipTier type (client/lib/api.ts)
```typescript
export type VipTier = {
  _id?: string;
  name?: string;
  level?: number;
  minValidBet?: number;
  upReward?: number;
  cashbackRate?: number;
  lossReturnRate?: number;
  lossReturnMax?: number;
  fridayBonusRate?: number;   // thêm 2026
  fridayBonusMax?: number;    // thêm 2026
  withdrawLimit?: number;
  colorCode?: string;
};
```

### Các trang admin quan trọng
| File | Chức năng |
|---|---|
| `VipTiersManager.tsx` | Quản lý 10 cấp VIP dynamic config |
| `VIPHub.tsx` | Hub tổng quan VIP |
| `VIP.tsx` | Danh sách VIP (legacy CRUD) |
| `AffiliateHub.tsx` | Hub Affiliate |
| `AffiliateManager.tsx` | Quản lý affiliates |
| `Dashboard.tsx` | Tổng quan hệ thống |

---

## 4. FRONTEND WEB (apps/frontend-web)

### Stack
- React 18 + Vite + TypeScript
- Redux Toolkit + Redux-Saga (async effects)
- Tất cả strings hiển thị: qua `t('key')` từ `@game/i18n` (i18n đang mở rộng)

---

## 5. VIP MODULE — Chi tiết đầy đủ

### Luồng dữ liệu
```
Admin UI (VipTiersManager.tsx)
  → POST /api/admin/vip/tiers  [body: IVipTier[]]
  → admin-vip.controller.ts → updateVipTiersConfig()
  → vip-tiers-config.service.ts → lưu DB + bust cache
  
Frontend Web (trang VIP)
  → GET /api/vip-tiers-config  (public, không cần auth)
  → vip-tiers-config.router.ts → vip-tiers-config.service.ts
  → trả về { value: IVipTier[] }
```

### Backend routes
```
GET  /api/vip-tiers-config          → public, frontend web đọc
GET  /api/admin/vip/stats           → admin stats
GET  /api/admin/vip/users           → danh sách user theo level
GET  /api/admin/vip/tiers           → đọc config 10 cấp VIP
POST /api/admin/vip/tiers           → cập nhật config 10 cấp VIP
POST /api/admin/vip/users/:id/set-level → set level thủ công
```

### IVipTier interface (source of truth)
File: `apps/backend/src/main/constants/vip-tiers-defaults.ts`
```typescript
interface IVipTier {
  level: number;          // 1..10
  name: string;
  minValidBet: number;    // VND, tích lũy cược hợp lệ
  upReward: number;       // VND, thưởng khi thăng cấp
  cashbackRate: number;   // %, 0..100
  lossReturnRate: number; // %, 0..100
  lossReturnMax: number;  // VND
  fridayBonusRate: number;// %, 0..100
  fridayBonusMax: number; // VND
  badgeImage: string;
  cardImage: string;
  colorCode: string;      // HEX, vd "#d97706"
}
```

### Admin UI call signature (ĐÚNG)
```typescript
// updateVipTiersConfig(data: IVipTier[], token?: string)
const res = await updateVipTiersConfig(tiers, token);  // data trước, token sau
//                                     ^^^^^ ^^^^^
```

---

## 6. AFFILIATE MODULE — Chi tiết

### Backend routes
```
GET  /api/admin/affiliate/extras           → cấu hình extras
PATCH /api/admin/affiliate/extras          → cập nhật extras
GET  /api/admin/affiliate/counter          → số đếm
GET  /api/admin/affiliate/signups          → signups gần đây
GET  /api/admin/affiliate/commission-split → chia hoa hồng
GET  /api/admin/affiliate/feed             → feed hoạt động
```

### Affiliate Extras type
File: `apps/backend/src/main/constants/affiliate-extras-defaults.ts`
(Chứa cấu hình commission tiers, bonus conditions...)

---

## 7. LỖI TYPECHECK ĐANG CÒN TỒN TẠI

Các lỗi này là PRE-EXISTING, KHÔNG phải do session này tạo ra:

### admin-dashboard (api.ts missing exports)
Nhiều trang import functions chưa có trong `api.ts` — dùng dynamic Proxy làm fallback.
Các pages bị ảnh hưởng:
- `AdminIPManagement.tsx` — thiếu: `listIPAccessAdminApi`, `createIPAccessAdminApi`, `updateIPAccessAdminApi`, `deleteIPAccessAdminApi`, `IPAccessItem`
- `Admins.tsx` — thiếu: `createStaffApi`, `deleteStaffApi`, `listStaffApi`, `resetStaffPasswordApi`, `updateStaffApi`, `StaffUser`
- `AffiliateDashboard.tsx` — thiếu: `getUsers`, `listTransactions`, `listBetTransactions`
- `AffiliateHub.tsx` — thiếu: `getAffiliateExtrasApi`, `patchAffiliateExtrasApi`, `getAffiliateCounterApi`, `getAffiliateSignupsApi`, `getAffiliateCommissionSplitApi`, `listAffiliateFeedApi`

**Cách fix:** Thêm từng function vào `apps/admin-dashboard/client/lib/api.ts`.

---

## 8. CONVENTIONS & RULES (BẮT BUỘC)

### TypeScript
- `strict: true` cho tất cả apps
- Không dùng `any` trong function parameters (dùng `unknown` + type guard)
- Icon từ `lucide-react`: type là `LucideIcon`, không phải `React.ComponentType<...>`
- Import type: `import { type X } from '...'` (isolatedModules)

### Styling (Admin)
- KHÔNG dùng hex màu cứng (`#xxx`) trong Tailwind classes
- Dùng: `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary/10`, `text-primary`
- Inline style (như `style={{ background: t.colorCode }}`) cho màu dynamic từ data: OK

### Git
- Branch: `hermes/<task-id>` hoặc `main` (direct push cho hotfix nhỏ)
- Commit message: `fix(module): mô tả ngắn` / `feat(module): mô tả ngắn`
- Sau mỗi task: cập nhật `docs/AI/CHANGELOG.md`

### Testing
- Framework: Vitest
- Cấu hình: `apps/backend/vitest.config.ts`
- Test files: `*.spec.ts` trong `__tests__/` cạnh service
- Chạy: `cd apps/backend && npm run test`

### Deploy & CI/CD
- CI: GitHub Actions (`.github/workflows/pr-check.yml` — typecheck, `deploy.yml` — prod deploy)
- Deploy: SSH → VPS → `docker-compose up -d --force-recreate` HOẶC PM2 reload
- Env secrets: GitHub Secrets (KHÔNG commit `.env`)

---

## 9. TRẠNG THÁI HIỆN TẠI (tính đến session này)

### Đã hoàn thành
- Monorepo structure + pnpm workspace
- tsconfig.base.json với đầy đủ path aliases
- GitHub Actions CI/CD (pr-check + deploy)
- Backend: auth, VIP tiers config, affiliate extras, admin routes
- Admin dashboard: VipTiersManager fully functional
- `VipTier` type trong api.ts: có đủ `fridayBonusRate` + `fridayBonusMax`
- `updateVipTiersConfig(data, token?)` — argument order đúng

### Đang làm (Phase 2 + 3 của ROADMAP)
- Migrate Mongoose models → `libs/models/` (Phase 2.2)
- Migrate shared types → `libs/shared-types/` (Phase 2.3)
- Refactor Admin pages: Affiliate, Marketing, Articles (Phase 3.2, 3.3)
- Fix pre-existing missing exports trong `api.ts` (Phase 3.x)

### Chưa làm
- i18n mở rộng (12 → 80+ keys) — Phase 5.6
- Test coverage: currency, session, payment, vip-tiers — Phase 5.5
- Cloudflare config guide — Phase 4.3
- Security: rate-limit-redis store (đang dùng in-memory) — Phase 6.1

---

## 10. QUICK REFERENCE — FILES HAY CHỈNH SỬA

| Mục tiêu | File |
|---|---|
| Thêm API function mới | `apps/admin-dashboard/client/lib/api.ts` |
| Thêm route backend mới | `apps/backend/src/routes.ts` + tạo `*.router.ts` |
| Thêm VIP tier field | `apps/backend/src/main/constants/vip-tiers-defaults.ts` + `apps/admin-dashboard/client/lib/api.ts` |
| Thêm admin page | tạo `apps/admin-dashboard/client/pages/admin/XxxPage.tsx` + wire vào `App.tsx` |
| Config backend | `apps/backend/src/config/index.ts` |
| Shared enums/constants | `apps/backend/src/config/static.ts` |
| Audit/changelog | `docs/AI/CHANGELOG.md` |
| Roadmap | `docs/AI/ROADMAP.md` |
