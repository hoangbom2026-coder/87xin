# REPOSITORY_DISCOVERY.md — Báo Cáo Khảo Sát và Kiểm Tra Bằng Chứng Hệ Thống

_Ngày lập: 2026-09-04_  
_Kiểm toán viên: Lead Repository Architect & Auditor_  
_Vị trí đích: `/var/app/game`_  
_Trạng thái kiểm tra: **EVIDENCE-BASED (ĐÃ XÁC MINH TRÊN ĐĨA CỨNG)**_

---

## 1. Phân Loại Thư Mục Hệ Thống (Directory Classification)

Dựa trên việc quét trực tiếp toàn bộ cây thư mục tại `/var/app/game`, các thành phần được phân loại thành 4 nhóm chính xác:

### 1.1 Nhóm Hoạt Động (ACTIVE — Runtime & Production)
| Đường dẫn | Phân loại | Mục đích thực tế | Bằng chứng kiểm chứng |
|---|---|---|---|
| `apps/backend/` | Application | Backend API Express 4.21, Mongoose 8, Socket.IO 4.8 (Port 8701) | `apps/backend/src/index.ts`, `package.json` |
| `apps/frontend-web/` | Application | Player Web SPA (React 18, Redux-Saga, Vite 5, Tailwind CSS) | `apps/frontend-web/src/App.tsx`, `package.json` |
| `apps/admin-dashboard/` | Application | Admin Management SPA (React 18, TanStack Query 5, Vite 7, Port 8781) | `apps/admin-dashboard/client/App.tsx`, `package.json` |
| `libs/shared-types/` | Library | Gói TypeScript types và API contracts (`@game/types`, `@game/shared-types`) | `libs/shared-types/src/index.ts` |
| `libs/shared-utils/` | Library | Hằng số cấu hình hệ thống và URL dynamic resolver (`@game/shared-utils`) | `libs/shared-utils/src/config.ts` |
| `libs/db/` | Library | Khởi tạo kết nối MongoDB và Redis in-memory fallback (`@game/db`) | `libs/db/index.ts` |
| `libs/cron/` | Library | Điều phối các worker cron định kỳ (`@game/cron`) | `libs/cron/index.ts` |
| `libs/ui/` | Library | Bộ component UI dùng chung, `AdminLayout`, `DataTable` (`@game/ui`) | `libs/ui/src/index.ts` |
| `libs/i18n/` | Library | Gói từ điển đa ngôn ngữ VI/EN (`@game/i18n`) | `libs/i18n/index.ts` |
| `infra/nginx/` | Infrastructure | Cấu hình Nginx reverse proxy và TLS termination cho `tc-gaming.live` | `infra/nginx/tc-gaming.live.conf` |
| `infra/scripts/` | Infrastructure | Scripts triển khai zero-downtime, giám sát và rollback | `infra/scripts/deploy.sh`, `monitor.sh` |
| `infra/ecosystem.production.cjs` | Infrastructure | Cấu hình PM2 quản lý tiến trình `tc-api` và `tc-admin` | `infra/ecosystem.production.cjs` |
| `.github/workflows/` | CI/CD | Pipeline CI kiểm tra PR và CD tự động deploy lên VPS | `deploy.yml`, `pr-check.yml` |
| `configs/` | Specifications | Đặc tả tích hợp GSC Seamless Wallet, AG Casino, tài liệu AI Agents | `configs/GSC+ Seamless Wallet...` |

### 1.2 Nhóm Lưu Trữ Cũ / Bản Sao Tạm (LEGACY / BACKUP / ARCHIVE)
| Đường dẫn | Trạng thái | Nguồn gốc & Lý do tồn tại |
|---|---|---|
| `libs.old-root/` | **LEGACY / READ-ONLY** | Thư mục backup gốc sở hữu bởi root trước khi chuyển đổi quyền sở hữu. Không nằm trong npm workspaces. |
| `libs/shared-types.root/` | **LEGACY / READ-ONLY** | Snapshot thư mục `shared-types` cũ do root sở hữu. Không sử dụng. |
| `libs/ui.root/` | **LEGACY / READ-ONLY** | Snapshot thư mục `ui` cũ do root sở hữu. Không sử dụng. |
| `infra/scripts.root/` | **LEGACY / READ-ONLY** | Snapshot thư mục scripts cũ do root sở hữu. Không sử dụng. |
| `.backup-roots/` | **ARCHIVE** | Thư mục cách ly các tệp backup lịch sử. |

### 1.3 Nhóm Siêu Dữ Liệu & Môi Trường (META / TOOLING)
| Đường dẫn | Phân loại | Mục đích |
|---|---|---|
| `.git/` | VCS Meta | Cơ sở dữ liệu Git repository |
| `.vscode/` | Editor Meta | Cấu hình settings và debugger launch profile |
| `.gemini/` | Tooling Meta | Cấu hình editor settings |
| `docs/` | Documentation | Hệ thống tài liệu kiến trúc, kiểm toán và quy chuẩn |
| `tools/hermes/` | Agent Tooling | Tiện ích hỗ trợ vận hành cho agent |

---

## 2. Danh Sách Các Điểm Mâu Thuẫn & Trạng Thái Xử Lý (Conflict Analysis)

| Vấn đề kiến trúc | Trạng thái trước | Hiện trạng thực tế (Đã giải quyết) | Trạng thái |
|---|---|---|---|
| **Cấu trúc Monorepo** | Phân mảnh, từng app có config riêng | Root `package.json` định nghĩa workspaces rõ ràng; `tsconfig.base.json` map `@game/*` | ✅ ĐÃ ĐỒNG BỘ |
| **Path Aliases Backend** | Dùng runtime `module-alias` | Đã bỏ `module-alias`, chuyển sang TS Path Mappings + `tsc-alias` | ✅ ĐÃ ĐỒNG BỘ |
| **Domain & Brand URL** | Rải rác `cuocbong99.live`, `shivaspins.com` | Tập trung tại `libs/shared-utils/src/config.ts`, dùng `tc-gaming.live` và biến môi trường | ✅ ĐÃ ĐỒNG BỘ |
| **Imports UI trong Admin** | Trộn lẫn `@/components/ui` và `@game/ui` | 100% components dùng chung xuất phát từ `@game/ui` | ✅ ĐÃ ĐỒNG BỘ |
| **Ngoại lệ npm workspace** | Khai báo `libs/*` gây xung đột với thư mục `.root` | Khai báo tường minh: `libs/shared-types`, `libs/shared-utils`, `libs/ui`, `libs/db`, `libs/cron`, `libs/i18n` | ✅ ĐÃ ĐỒNG BỘ |

---

## 3. Xác Nhận Các Thành Phần Thực Tế Đã Tìm Thấy

### 3.1 Ứng Dụng (Applications)
1. **`apps/backend`**: Express REST API + Socket.IO realtime server (Port 8701). Đã mount 56 router nghiệp vụ tại `apps/backend/src/routes.ts`.
2. **`apps/frontend-web`**: Single Page Application dành cho người chơi (React 18 + Redux-Saga + Tailwind CSS). Đã wire 27 routes tại `apps/frontend-web/src/App.tsx`.
3. **`apps/admin-dashboard`**: Dashboard quản trị hệ thống (React 18 + TanStack Query 5 + Vite). Đã wire 70+ routes và đồng bộ sidebar tại `apps/admin-dashboard/client/App.tsx`.

### 3.2 Thư Viện Dùng Chung (Shared Libraries - `@game/*`)
1. **`@game/types` & `@game/shared-types`**: `IApiResponse`, `IApiResponseList`, `IApiError`, `IUserResponse`, `IGameResponse`.
2. **`@game/shared-utils`**: `SYSTEM_CONFIG`, `getPublicSiteUrl`, `getApiBaseUrl`, `getSupportEmail`.
3. **`@game/db`**: `connectDatabase()`, quản lý kết nối MongoDB và Redis client fallback.
4. **`@game/cron`**: `startAllCrons()`, điều phối cron fake-feed, hoa hồng daily và agency interest.
5. **`@game/ui`**: `AdminLayout`, `DataTable`, 42 Radix/Tailwind components.
6. **`@game/i18n`**: Dữ liệu từ điển `vi.json` và `en.json`.

### 3.3 Tích Hợp Bên Thứ Ba (Third-Party Integrations)
1. **GSC Seamless Wallet API v2.0.6**: `apps/backend/src/main/routes/gs-callback.router.ts`, `gs-pay.router.ts`. Xác thực HMAC-MD5 theo chuẩn operator code + secret key.
2. **Asia Gaming (AG Casino & AG Pay)**: `apps/backend/src/main/routes/ag-callback.router.ts`, `ag-pay.router.ts`.
3. **NowPayments Crypto Gateway**: `apps/backend/src/main/routes/nowpay.router.ts`.

---

## 4. Đề Xuất Thứ Tự Ưu Tiên Xây Dựng Tài Liệu (Documentation Roadmap)

Để hoàn thiện hệ thống tài liệu từ `00-overview` đến `99-reports`, đề xuất thứ tự ưu tiên sau:

1. **`docs/00-overview/`**:
   - `SYSTEM_OVERVIEW.md`: Bản đồ tổng quan toàn bộ hệ sinh thái TC-Gaming.
2. **`docs/01-architecture/`**:
   - `MONOREPO_RULES.md`: Quy tắc cấu trúc Monorepo, biên giới Apps → Libs, và chuẩn TypeScript paths.
   - `DATA_FLOW.md`: Sơ đồ luồng dữ liệu (Player SPA → Nginx → Express API → Mongo/Redis / GSC Gateway).
3. **`docs/02-apps/`**:
   - `BACKEND_API.md`: Tài liệu danh mục 56 API routers, auth flows, middleware stack.
   - `FRONTEND_WEB.md`: Kiến trúc Redux-Saga, danh mục 27 pages, và hệ thống Theme/i18n.
   - `ADMIN_DASHBOARD.md`: Tài liệu AdminLayout, DataTable, 70+ quản trị modules.
4. **`docs/03-libs/`**:
   - `SHARED_LIBRARIES.md`: Hướng dẫn sử dụng chi tiết cho từng gói `@game/*`.
5. **`docs/04-infra/`**:
   - `DEPLOYMENT_GUIDE.md`: Quy trình deploy zero-downtime, cấu hình Nginx và PM2 cluster.
   - `CI_CD_PIPELINE.md`: Hướng dẫn cấu hình GitHub Actions workflows (`pr-check.yml`, `deploy.yml`).
6. **`docs/05-integrations/`**:
   - `GSC_SEAMLESS_WALLET.md`: Chi tiết tích hợp callback, IP whitelist, signature validation.
   - `AG_CASINO_GATEWAY.md`: Quy trình launch game và callback verify session.
7. **`docs/06-standards/`**:
   - `CODING_STANDARDS.md`: Bộ quy tắc Controller-Service, Zod validation, và Tailwind CSS variables.
