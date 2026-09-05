# Báo Cáo Tiến Độ Dự Án — TC-Gaming Monorepo

_Ngày thực hiện: 2026-09-04_  
_Trợ lý thực hiện: Hermes (Omni-Assistant)_  
_Vị trí dự án: `/var/app/game`_  
_Tên miền chính thức: `tc-gaming.live` (Player) / `admin.tc-gaming.live` (Admin)_

---

## 1. Hôm Nay Đã Làm Được Gì (Completed Work)

### 1.1 Tái Cấu Trúc Monorepo Chuẩn & Centralization
- Chuyển đổi toàn bộ cấu trúc sang 3 tầng phân cấp rõ ràng: `apps/` (backend, frontend-web, admin-dashboard), `libs/` (shared-types, shared-utils, db, cron, ui, i18n), `infra/`, `configs/`.
- Định nghĩa tập trung cấu hình tại root: `package.json` (workspaces tường minh), `tsconfig.base.json` (path aliases `@game/*`), `.eslintrc.cjs`, `.prettierrc`.
- Loại bỏ hoàn toàn `module-alias` trong backend, thay thế bằng TypeScript Path Mappings (`@main/*`, `@utils/*`, `@config/*`, `@middlewares/*`) kết hợp `tsc-alias`.

### 1.2 Hoàn Thiện & Kết Nối Toàn Bộ Routing
- **Backend (`routes.ts`)**: Mount tập trung toàn bộ **56 router nghiệp vụ** (Auth, Wallet, GSC Seamless Wallet, AG Casino, VIP, Promotions, Admin endpoints).
- **Frontend Web (`App.tsx`)**: Wire toàn bộ **27 page routes** (bao gồm `ProtectedRoute` cho Wallet, Account, VIP, Affiliate, Store, CryptoWallet).
- **Admin Dashboard (`App.tsx` & `adminSidebarData.ts`)**: Wire và đồng bộ **70+ routes quản trị** phân vào 8 phân hệ chuyên biệt.
- **Redux-Saga Auth**: Hoàn tất `authSaga.ts` (login, logout, fetchProfile).

### 1.3 Chuẩn Hóa Thư Viện Dùng Chung (`libs/`)
- `@game/shared-types` (`libs/shared-types`): `IApiResponse`, `IApiResponseList`, `IApiError`, `IUserResponse`, `IGameResponse`.
- `@game/shared-utils` (`libs/shared-utils`): Hằng số `SYSTEM_CONFIG`, dynamic URL resolvers (`getPublicSiteUrl`, `getApiBaseUrl`, `getSupportEmail`).
- `@game/db` (`libs/db`): `connectDatabase()` quản lý MongoDB và Redis in-memory fallback.
- `@game/cron` (`libs/cron`): `startAllCrons()` điều phối fake-feed, affiliate daily và agency interest workers.
- `@game/ui` (`libs/ui`): Xuất bản `AdminLayout`, `DataTable` độc lập và 42 Radix/Tailwind components.
- `@game/i18n` (`libs/i18n`): Locale đa ngôn ngữ VI/EN.

### 1.4 Loại Bỏ Hardcoded Domain & Dọn Dẹp Legacy
- Quét sạch toàn bộ các chuỗi tên miền cũ (`cuocbong99.live`, `shivaspins.com`) trong code, controllers, docs, và configs.
- Dọn dẹp các tệp orphan cũ (`README-cuocbong99.md`, `nginx-cuocbong99.live.conf`, `ecosystem.config.cjs`, `ecosystem.pm2-spa.cjs`, `ecosystem.prod.js`).
- Chuẩn hóa format lỗi Backend sang `{ success: false, error: { code, message } }`.

### 1.5 Thiết Lập Testing & CI/CD Pipelines
- **Vitest Testing**: Cấu hình `apps/backend/vitest.config.ts`, viết bộ unit test `balance.service.spec.ts` (4/4 tests pass).
- **GitHub Actions CI/CD**:
  - `.github/workflows/pr-check.yml`: Kiểm tra typecheck tự động trên mọi PR.
  - `.github/workflows/deploy.yml`: Multi-stage build, rsync SSH lên VPS, zero-downtime PM2 reload (`tc-api`, `tc-admin`), và vòng lặp kiểm tra health check.

### 1.6 Khởi Tạo Hệ Sinh Thái Trợ Thủ & Giao Thức OpenHands
- Thiết lập `.ai/memory/profile.json` lưu trữ ngữ cảnh và hồ sơ cá nhân của `Taxi379`.
- Tạo giao thức bàn giao Task Spec `.ai/tasks/` và bảng trạng thái `.ai/active_task.md`.
- Soạn thảo Spec mẫu đầu tiên: `.ai/tasks/TASK-001.md` (Refactor Role Controller to Service Pattern).
- Đồng bộ toàn bộ kiến trúc vào bộ nhớ dài hạn OpenViking.

---

## 2. Kết Quả Kiểm Tra Thực Tế (Verification Evidence)

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả thực tế |
|---|---|---|
| **Backend Unit Tests** | `npm run test` (apps/backend) | `4 passed (4)` — 100% PASS (1.01s) |
| **Admin Imports** | `search_files` (@/components/ui) | `0 matches` — 100% chuyển sang `@game/ui` |
| **Backend Routes** | `routes.ts` | 56/56 routers mount thành công |
| **Cấu hình PM2** | `infra/ecosystem.production.cjs` | Sẵn sàng quản lý tiến trình `tc-api` (:8701) và `tc-admin` (:8781) |
| **Cấu hình Nginx** | `infra/nginx/tc-gaming.live.conf` | TLS, rate limit và reverse proxy sẵn sàng cho `tc-gaming.live` |
| **OpenViking Memory** | `viking_remember` | Session extraction `accepted` |

---

## 3. Ngày Mai Bắt Đầu Từ Đâu (Tomorrow's Roadmap)

1. **Ưu tiên 1 (Kích hoạt OpenHands thực thi TASK-001)**:
   - Kích hoạt OpenHands nhận spec tại `.ai/tasks/TASK-001.md`.
   - Thực hiện refactor `role.controller.ts` chuyển toàn bộ business logic sang `role.service.ts`.
   - Hermes thực hiện review git diff và merge vào `main`.

2. **Ưu tiên 2 (Tách Logic Controller → Service cho các module còn lại)**:
   - Soạn task spec tiếp theo cho `affiliate.controller.ts`, `ag-casino.controller.ts`, `gs-pay.controller.ts`.
   - Di chuyển Mongoose models lên `libs/models/` dùng chung.

3. **Ưu tiên 3 (Triển khai & Kiểm thử Public)**:
   - Kích hoạt GitHub Actions deploy hoặc chạy `bash infra/scripts/deploy.sh` trên VPS.
   - Kiểm tra live domain `tc-gaming.live` và `admin.tc-gaming.live`.
