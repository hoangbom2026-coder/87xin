# DEV_STANDARD — tc-gaming.live

## 1. Backend Standards
- **Service Layer Pattern:** Controller chỉ validate và parse request, gọi Service. Mọi logic nghiệp vụ nằm tại `apps/backend/src/main/services/`.
- **Validation:** Sử dụng `Zod` (Schema-first). Mọi route API phải có Zod middleware.
- **Logging:** Sử dụng `@game/utils/logger` (Winston), format JSON, bao gồm `requestId`.

## 2. Admin UI Standards
- **Layout:** Mọi trang Admin bọc trong `<AdminLayout />` từ `@game/ui`.
- **Data Tables:** Mọi bảng dữ liệu sử dụng `<DataTable />` từ `@game/ui`.
- **Styling:** Không hex color. Sử dụng Tailwind classes: `bg-card`, `text-foreground`, `brand-600`.

## 3. Localization
- **i18n:** Mọi string hiển thị phải thông qua `t('key')` import từ `@game/i18n`. Không được hard-code string.
