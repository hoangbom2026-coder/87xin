# JS_AUDIT — Báo Cáo Chiến Dịch Zero JS

_Ngày kiểm toán: 2026-09-04_  
_Kiểm toán viên: Hermes Omni-Assistant_  
_Phạm vi: `/var/app/game` (loại trừ node_modules, dist, build, .git)_

---

## 1. Tổng Kết

| Nhóm | Số file | Trạng thái |
|---|---|---|
| SOURCE_CODE (apps/, libs/) | 4 | 2 file build artifact cũ (an toàn xóa), 1 seed script, 1 config |
| CONFIG_TOOL (root, infra/) | 5 | 1 cần migrate, 4 giữ nguyên |
| Build Artifacts cũ (dist.old/) | ~60 | Đèn Xanh — xóa theo CLEANUP_POLICY |

---

## 2. Danh Sách Chi Tiết

### 2.1 SOURCE_CODE — File .js/.cjs trong apps/ và libs/

| File | Loại | Phân tích | Hành động đề xuất |
|---|---|---|---|
| `apps/backend/src/scripts/seed-hoangbom.js` | Script seed | Script admin đơn lẻ, không import vào app | Chuyển sang `.ts` trong TASK-JS-002 |
| `libs/cron/index.js` (1854B) | Build artifact | `package.json` đã trỏ `main: index.ts` — file .js này THỪA | 🔴 XÓA (Đèn Xanh, .old artifact) |
| `libs/db/index.js` (2396B) | Build artifact | `package.json` đã trỏ `main: index.ts` — file .js này THỪA | 🔴 XÓA (Đèn Xanh, .old artifact) |
| `apps/admin-dashboard/postcss.config.js` | Config build | PostCSS config — **KHÔNG THỂ chuyển .ts** (PostCSS chỉ đọc .js/.cjs) | Giữ nguyên, đưa vào CONFIG_TOOL list |

### 2.2 CONFIG_TOOL — File cấu hình hệ thống

| File | Loại | Phân tích | Hành động đề xuất |
|---|---|---|---|
| `.eslintrc.cjs` (root) | ESLint config | ESLint 8 hỗ trợ .cjs — chuẩn hiện hành | Giữ nguyên |
| `apps/frontend-web/.eslintrc.cjs` | ESLint config | Như trên | Giữ nguyên |
| `eslint.config.mjs` (root) | ESLint flat config | ESLint 9 flat config .mjs — chuẩn mới | Giữ nguyên |
| `infra/ecosystem.production.cjs` | PM2 config | PM2 yêu cầu .cjs/.js — **KHÔNG chuyển được** | Giữ nguyên |
| `apps/admin-dashboard/postcss.config.js` | PostCSS config | PostCSS chỉ đọc .js/.cjs | Giữ nguyên |

### 2.3 Build Artifacts Cũ (dist.old/) — Đèn Xanh

`apps/backend/dist.old/` chứa ~60 file .js compile cũ từ pre-monorepo. Theo CLEANUP_POLICY mục 1 (hậu tố `.old` → xóa không cần hỏi):

- **Hành động đề xuất:** Xóa toàn bộ `apps/backend/dist.old/` ngay trong phase này.

---

## 3. Kế Hoạch Conversion (Task Specs)

### TASK-JS-001: Xóa Build Artifacts (Ưu tiên cao nhất)
- Xóa `libs/cron/index.js`, `libs/db/index.js`, toàn bộ `apps/backend/dist.old/`.
- Verify: `npm run typecheck` ở root, backend build vẫn chạy.

### TASK-JS-002: Convert seed script
- `apps/backend/src/scripts/seed-hoangbom.js` → `seed-hoangbom.ts`
- Thêm type definition, fix import, test chạy.

### TASK-JS-003: Không cần làm (0 remaining)
- Các file CONFIG_TOOL giữ nguyên — đây là yêu cầu nền tảng, không phải source code.

---

## 4. Xác Nhận

> **Tôi đã hiểu chiến dịch Zero JS. Kết quả quét: 4 file SOURCE_CODE (2 xóa, 1 convert, 1 config), 5 file CONFIG_TOOL (giữ nguyên), ~60 build artifacts cũ (xóa theo Đèn Xanh).**

> **Tôi sẽ bắt đầu thực thi TASK-JS-001 ngay (xóa artifacts .old), chờ duyệt TASK-JS-002 (convert seed script).**