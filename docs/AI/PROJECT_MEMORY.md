# PROJECT_MEMORY: tc-gaming.live

## 1. Kiến trúc Monorepo (The Monorepo Law)
- **Dependency Rule:** Mã nguồn đi từ ngoài vào trong: `Apps` (Web/Admin/API) -> `Libs`. KHÔNG BAO GIỜ có `App -> App`.
- **Path Aliases:**
  - `@game/i18n`: `libs/i18n/index.ts`
  - `@game/types`: `libs/shared-types/src/index.ts`
  - `@game/db`: `libs/db/index.ts`
  - `@game/cron`: `libs/cron/index.ts`
  - `@game/models`: `libs/models/index.ts`
  - `@game/ui`: `libs/ui/index.ts`
- **Tất cả cấu hình (tsconfig, eslint, prettier):** Đặt tại root, app chỉ kế thừa.

## 2. Tiêu chuẩn Backend (Controller-Service Pattern)
- **Controllers:** Chỉ xử lý Request (validate) và gọi Service.
- **Services:** Chứa logic nghiệp vụ. Không được chứa logic HTTP.
- **Models:** Dùng Mongoose, được tập trung tại `libs/models/`.

## 3. Tiêu chuẩn UI/UX (Admin Dashboard)
- **Layout:** Mọi trang Admin bắt buộc dùng `AdminLayout` từ `@game/ui`.
- **Styling:** Không dùng mã màu Hex cứng. Sử dụng CSS variables từ Tailwind config.
- **Components:** Không tạo component UI mới tại `apps/`. Mọi component dùng chung phải nằm ở `libs/ui/`.

## 4. Bảo mật & CI/CD
- **Bảo mật:** Không bao giờ log, print, commit API keys. Sử dụng GitHub Secrets.
- **CI/CD:** Quy trình chuẩn: Build GitHub Actions -> Push GHCR -> Deploy VPS.
