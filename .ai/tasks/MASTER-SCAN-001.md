# MASTER-SCAN-001 — Yêu Cầu Thực Thi Toàn Hệ Thống

### Task ID: MASTER-SCAN-001
### Title: Full System Execution Plan — TC-Gaming Monorepo
### Priority: 🔴 CRITICAL
### Author: BOB (Lead Architect) | 2026-09-05
### Đọc trước: `docs/master/ARCH_BLUEPRINT.md`, `docs/master/DEV_STANDARD.md`

---

## 📌 TRẠNG THÁI HIỆN TẠI (Evidence-Based Snapshot)

| Hạng mục | Trạng thái | Mục tiêu |
|---|---|---|
| TypeScript errors | ⚠️ ~45 files (ước tính) | 0 errors |
| Controller try/catch | ⚠️ 35 blocks còn lại | 0 blocks |
| Services throw generic Error | ⚠️ 15 instances | 0 instances |
| Controllers import Model trực tiếp | ⚠️ 11 files | 0 files |
| Admin i18n `t()` usage | ❌ 0% coverage | 80+ keys |
| Admin fetch() bypass | ❌ 3 files dùng raw fetch | 0 files |
| Test coverage | ⚠️ 1 service | ≥60% services |
| BUG-001: typo notification.service | 🔴 createNotifcation | createNotification |
| BUG-002: deposit.service thiếu method | 🔴 thiếu getDepositById, listDeposits | hoàn chỉnh |
| CI/CD pipeline | ✅ pr-check + deploy | ✅ giữ nguyên |

---

## 🏗️ KIẾN TRÚC BẤT BIẾN (KHÔNG được vi phạm)

```
Layer 1: Apps (backend, admin-dashboard, frontend-web)
  ↓ import ↓   [TUYỆT ĐỐI CẤM: App → App]
Layer 2: Libs  (@game/ui, @game/types, @game/db, @game/cron, @game/i18n, @game/shared-utils)
  ↓
Layer 3: Root  (tsconfig.base.json, .eslintrc, .prettierrc)

Backend pattern: Route → Controller (parse only) → Service (business logic) → Model
Error: Throw ApiError(httpStatus.CODE, 'message') — KHÔNG throw new Error()
UI: Chỉ dùng AdminLayout + DataTable từ @game/ui. KHÔNG hex color, dùng CSS vars.
Security: credentials chỉ ở GitHub Secrets / process.env — KHÔNG commit.
```

**Pattern mẫu đã chuẩn (tham khảo khi làm):**
- Controller: `apps/backend/src/main/controllers/role.controller.ts`
- Service: `apps/backend/src/main/services/role.service.ts`
- Admin Staff: `apps/backend/src/main/services/admin-staff.service.ts`

---

## ═══════════════════════════════════════════
## PHASE 1 — CRITICAL BUG FIXES (Làm NGAY)
## ═══════════════════════════════════════════

### [BUGFIX-001] Typo: notification.service.ts
**Priority:** 🔴 CRITICAL — crash TypeScript ngay lập tức

```
FILE: apps/backend/src/main/services/notification.service.ts

TÌMVÀ SỬA:
  const createNotifcation   → const createNotification
  export default { createNotifcation, ... }  → export default { createNotification, ... }
```

**Verify:** `grep -n "createNotif" apps/backend/src/main/services/notification.service.ts` → 0 kết quả

---

### [BUGFIX-002] deposit.service.ts — Thêm methods còn thiếu
**Priority:** 🔴 CRITICAL — nowpay.controller và nhiều controllers bị lỗi

```
FILE: apps/backend/src/main/services/deposit.service.ts

THÊM VÀO cuối file (trước export default):

const getDepositById = async (id: string) => {
  const deposit = await DepositModel.findById(id);
  if (!deposit) throw new ApiError(httpStatus.NOT_FOUND, 'Deposit không tồn tại');
  return deposit;
};

const listDeposits = async (filter: Record<string, unknown>, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    DepositModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    DepositModel.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

export default { createDeposit, getPendingDeposit, getDepositById, listDeposits };
```

**Verify:** `npm run typecheck -w apps/backend 2>&1 | grep "deposit" | wc -l` → 0

---

## ═══════════════════════════════════════════
## PHASE 2 — BACKEND TYPESCRIPT CLEAN
## ═══════════════════════════════════════════

### [BE-P1-001] Fix req.user non-null assertion — 8 controllers

**Lý do:** Routes đã có `auth` middleware → req.user luôn tồn tại. TypeScript không biết → ~15 TS errors.

**Rule:** Routes protected bởi `auth` middleware → dùng `req.user!.xxx`

```
FILE: apps/backend/src/main/controllers/plan.controller.ts
  Sửa: req.user._id → req.user!._id  (lines 100, 101, 141, 142, 162, 163, 185, 186, 206, 207)
  Sửa: req.user.username → req.user!.username ?? ''

FILE: apps/backend/src/main/controllers/ticket.controller.ts
  Sửa: req.user.role → req.user!.role  (lines 11, 12, 30, 35, 57, 58, 60, 67)
  Sửa: req.user._id → req.user!._id
  Sửa: req.user.username → req.user!.username

FILE: apps/backend/src/main/controllers/gs-pay.controller.ts
  Sửa: req.user._id → req.user!._id  (lines 19, 20, 21)
  Sửa: req.user.currency → req.user!.currency
  Sửa: req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/reward.controller.ts
  Sửa: req.user._id → req.user!._id  (lines 18, 19, 46, 52, 53, 61, 62, 103, 104)
  Sửa: req.user.currency → req.user!.currency

FILE: apps/backend/src/main/controllers/nowpay.controller.ts
  Sửa: req.user._id → req.user!._id  (lines 172, 173)
  Sửa: req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/preference.controller.ts
  Sửa: req.user._id → req.user!._id  (lines 13, 18)
  Sửa: req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/ag-pay.controller.ts
  Sửa: req.user._id → req.user!._id  (lines 62, 63)
  Sửa: req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/user-affiliate.controller.ts
  Sửa: req.user._id → req.user!._id  (lines 10, 39)
```

**Verify:** `npm run typecheck -w apps/backend 2>&1 | grep "req.user" | wc -l` → 0

---

### [BE-P1-002] Fix services throw generic Error → ApiError — 7 services

**Lý do:** `throw new Error(...)` → errorHandler không biết status → luôn trả 500. Phải dùng ApiError.

**Import cần thêm vào đầu mỗi file (nếu chưa có):**
```typescript
import ApiError from '@utils/ApiError';
import httpStatus from 'http-status';
```

```
FILE: apps/backend/src/main/services/media.service.ts
  throw new Error('Folder name không hợp lệ')
  → throw new ApiError(httpStatus.BAD_REQUEST, 'Folder name không hợp lệ')

FILE: apps/backend/src/main/services/payment.service.ts
  throw new Error('Phương thức thanh toán không hợp lệ')
  → throw new ApiError(httpStatus.BAD_REQUEST, 'Phương thức thanh toán không hợp lệ')
  throw new Error('Không tìm thấy giao dịch')
  → throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy giao dịch')

FILE: apps/backend/src/main/services/game.service.ts (nếu tồn tại)
  Mọi throw new Error(...) → throw new ApiError(httpStatus.APPROPRIATE_CODE, ...)

FILE: apps/backend/src/main/services/provider.service.ts (nếu tồn tại)
  Mọi throw new Error(...) → throw new ApiError(...)

FILE: apps/backend/src/main/services/currency.service.ts
  Kiểm tra và convert mọi throw new Error(...)

FILE: apps/backend/src/main/services/setting.service.ts
  Kiểm tra và convert mọi throw new Error(...)
```

**Rule chọn status code:**
- Không tìm thấy → `httpStatus.NOT_FOUND` (404)
- Dữ liệu sai → `httpStatus.BAD_REQUEST` (400)
- Không có quyền → `httpStatus.FORBIDDEN` (403)
- Đã tồn tại → `httpStatus.CONFLICT` (409)

**Verify:** `grep -r "throw new Error(" apps/backend/src/main/services/ | wc -l` → 0

---

### [BE-P1-003] Refactor 35 try/catch trong controllers → catchAsync

**Lý do:** Controller có try/catch thủ công là antipattern. `catchAsync` đã xử lý mọi exception.

**Danh sách ưu tiên (nhiều nhất trước):**
```
nowpay.controller.ts      — 10 blocks (ưu tiên cao nhất)
plan.controller.ts        — 7 blocks
package.controller.ts     — 6 blocks
ag-pay.controller.ts      — 4 blocks
media.controller.ts       — 3 blocks
auth.controller.ts        — 2 blocks
admin-games.controller.ts — 2 blocks
(và các file còn lại)
```

**Pattern chuẩn:**
```typescript
// ❌ SAI — có try/catch
export const getList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await someService.getList();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ✅ ĐÚNG — dùng catchAsync
export const getList = catchAsync(async (req: Request, res: Response) => {
  const data = await someService.getList();
  res.json({ success: true, data });
});
```

**Import cần có:**
```typescript
import catchAsync from '@utils/catchAsync';
```

**Verify:** `grep -r "try {" apps/backend/src/main/controllers/ | wc -l` → 0

---

### [BE-P1-004] Controllers import Model trực tiếp → phải qua Service

**Lý do:** Controller import Model trực tiếp là vi phạm kiến trúc Controller→Service→Model.

```
Tìm: grep -r "import.*Model" apps/backend/src/main/controllers/ --include="*.ts"
Với mỗi kết quả:
  - Nếu có method chưa tồn tại trong service → thêm method vào service tương ứng
  - Sau đó xóa Model import khỏi controller
  - Gọi qua service thay thế
```

**Verify:** `grep -r "import.*Model" apps/backend/src/main/controllers/ | wc -l` → 0

---

## ═══════════════════════════════════════════
## PHASE 3 — ADMIN DASHBOARD STANDARDIZE
## ═══════════════════════════════════════════

### [AD-P1-001] Fix 3 files dùng raw fetch() → dùng api client

**Lý do:** `api.ts` có interceptors (auth header, error handling). Raw fetch() bypass hết.

```
Tìm: grep -r "fetch(" apps/admin-dashboard/client/ --include="*.tsx" --include="*.ts"
Loại trừ: node_modules

Với mỗi kết quả, đổi:
  fetch('/api/xxx', { headers: { Authorization: `Bearer ${token}` } })
  → import api from '@/lib/api'; api.get('/xxx')  hoặc  api.post('/xxx', data)
```

**Verify:** `grep -r "fetch(" apps/admin-dashboard/client/ --include="*.tsx" | grep -v "//\|node_modules" | wc -l` → 0

---

### [AD-P2-001] Admin i18n — Thêm t() cho 80+ string

**Lý do:** Hiện tại admin dashboard hard-code text tiếng Việt. Phải đi qua `t('key')`.

**Setup cần có trong mỗi file admin:**
```typescript
import { useTranslation } from 'react-i18next'; // hoặc i18n lib đang dùng
const { t } = useTranslation();
```

**Các string cần i18n (ưu tiên):**

```
Tất cả text nút: "Thêm mới", "Sửa", "Xóa", "Lưu", "Hủy", "Tìm kiếm"
Tất cả title bảng: "Danh sách...", "Quản lý..."
Tất cả message lỗi/thành công hiển thị cho user
Placeholder input: "Nhập tên...", "Chọn ngày..."
```

**Keys cần thêm vào `libs/i18n/locales/vi.json` và `en.json`:**
```json
{
  "common": {
    "add": "Thêm mới",
    "edit": "Sửa",
    "delete": "Xóa",
    "save": "Lưu",
    "cancel": "Hủy",
    "search": "Tìm kiếm",
    "confirm": "Xác nhận",
    "loading": "Đang tải...",
    "noData": "Không có dữ liệu",
    "actions": "Thao tác",
    "status": "Trạng thái",
    "createdAt": "Ngày tạo",
    "updatedAt": "Ngày cập nhật"
  }
}
```

**Verify:** `grep -r "\"Thêm mới\"\|\"Xóa\"\|\"Lưu\"" apps/admin-dashboard/client/ | wc -l` → giảm đáng kể

---

### [AD-P2-002] Admin pages không có AdminLayout → bọc vào AdminLayout

**Lý do:** DEV_STANDARD yêu cầu mọi admin page phải bọc `<AdminLayout />` từ `@game/ui`.

```
Tìm: grep -rL "AdminLayout" apps/admin-dashboard/client/pages/admin/ --include="*.tsx"
→ Liệt kê các file không có AdminLayout
→ Bọc vào <AdminLayout> từ @game/ui
```

---

### [AD-P3-001] Hex color → CSS Variables

**Lý do:** DEV_STANDARD cấm hex color trong admin. Phải dùng Tailwind semantic classes.

```
Tìm: grep -r "#[0-9A-Fa-f]\{6\}" apps/admin-dashboard/client/ --include="*.tsx" --include="*.ts" --include="*.css"
Đổi sang: bg-card, text-foreground, text-muted-foreground, border-border, v.v.
```

---

## ═══════════════════════════════════════════
## PHASE 4 — FRONTEND WEB CLEAN
## ═══════════════════════════════════════════

### [FE-P1-001] i18n en.json — Đã fix (xem I18N-001.md)

**Status:** ✅ Đã được Bob fix trong session trước. Verify lại:
```bash
node -e "const e=require('./apps/frontend-web/src/i18n/locales/en.json'); console.log(e.login?.title)"
# Expected output: "Login" (NOT "Đăng nhập")
```

---

### [FE-P1-002] Frontend TypeScript errors

```
Chạy: npm run typecheck -w apps/frontend-web 2>&1 | head -50
Liệt kê tất cả errors → Fix theo thứ tự từ trên xuống
Không suppress bằng @ts-ignore (trừ trường hợp external lib không có types)
```

---

## ═══════════════════════════════════════════
## PHASE 5 — TESTING
## ═══════════════════════════════════════════

### [TEST-001] Viết test cho 5 services quan trọng nhất

**Target coverage:** ≥60% functions/branches trong mỗi service

**Danh sách ưu tiên:**
```
1. apps/backend/src/main/services/balance.service.ts     (đã có test mẫu)
2. apps/backend/src/main/services/vip.service.ts
3. apps/backend/src/main/services/affiliate.service.ts
4. apps/backend/src/main/services/deposit.service.ts
5. apps/backend/src/main/services/withdraw.service.ts
```

**Test file pattern:**
```
apps/backend/src/main/services/__tests__/[name].service.test.ts
```

**Setup chuẩn (theo vitest.config.ts):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
// Mock mongoose models
vi.mock('@main/models/...');
```

**Verify:** `npm run test -w apps/backend 2>&1 | grep "Coverage"` → ≥60%

---

## ═══════════════════════════════════════════
## PHASE 6 — CONFIG & INFRA ALIGNMENT
## ═══════════════════════════════════════════

### [INFRA-001] Đồng bộ ecosystem.production.cjs với cấu hình thực tế

**Kiểm tra:**
```bash
# Ports đang chạy thực tế:
pm2 list | grep -E "tc-|admin|backend|frontend"

# So sánh với infra/ecosystem.production.cjs:
cat infra/ecosystem.production.cjs | grep -E "port|PORT|name"
```

**Nếu lệch → cập nhật `infra/ecosystem.production.cjs` cho khớp.**

---

### [INFRA-002] Nginx config — Security headers kiểm tra

```bash
# Verify security headers có trong nginx config
grep -E "X-Frame-Options|Content-Security-Policy|X-Content-Type|Strict-Transport" \
  infra/nginx/tc-gaming.live.conf
```

Nếu thiếu → thêm vào block `add_header`.

---

## ═══════════════════════════════════════════
## QUY TRÌNH THỰC THI (Hermes phải theo)
## ═══════════════════════════════════════════

```
BƯỚC 1: Đọc file này toàn bộ
BƯỚC 2: Đọc docs/master/ARCH_BLUEPRINT.md và DEV_STANDARD.md
BƯỚC 3: Chạy audit baseline:
  npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
  grep -r "try {" apps/backend/src/main/controllers/ | wc -l
  grep -r "throw new Error(" apps/backend/src/main/services/ | wc -l

BƯỚC 4: Thực hiện theo thứ tự PHASE 1 → 2 → 3 → 4 → 5 → 6
BƯỚC 5: Sau mỗi Phase, chạy verify command trong task đó
BƯỚC 6: Sau khi hoàn tất, cập nhật docs/16-roadmap/COMPLETED.md
BƯỚC 7: Báo cáo kết quả cuối: số TS errors còn lại, test coverage, tasks done/skip
```

---

## ✅ VERIFICATION CHECKLIST CUỐI

```bash
# 1. TypeScript clean
npm run typecheck 2>&1 | grep "error" | wc -l  # → 0

# 2. No try/catch in controllers
grep -r "try {" apps/backend/src/main/controllers/ | wc -l  # → 0

# 3. No generic Error in services
grep -r "throw new Error(" apps/backend/src/main/services/ | wc -l  # → 0

# 4. No direct Model import in controllers
grep -r "import.*Model" apps/backend/src/main/controllers/ | wc -l  # → 0

# 5. No raw fetch() in admin
grep -r "fetch(" apps/admin-dashboard/client/ --include="*.tsx" | grep -v "//\|node_modules" | wc -l  # → 0

# 6. Tests pass
npm run test -w apps/backend  # → all green

# 7. Dependency rule check
grep -r "from '.*apps/" apps/admin-dashboard/client/ | wc -l  # → 0
grep -r "from '.*apps/" apps/frontend-web/src/ | wc -l  # → 0
```

---

## 📋 LƯU Ý QUAN TRỌNG

1. **Không làm refactor lớn nếu không có task spec** — chỉ làm những gì được chỉ định ở trên
2. **Sau mỗi phase**, chạy `npm run typecheck` để không có regression
3. **Không commit** `.env`, secrets, hoặc file chứa credentials
4. **Không import App → App** — nếu thấy, tạo task ARCH-FIX ngay
5. **Pattern mẫu ĐÚNG** luôn ở: `role.controller.ts` + `role.service.ts` + `admin-staff.service.ts`

---

_Được tạo bởi BOB — Lead Architect | 2026-09-05_
_Dựa trên: Full system scan + ARCH_BLUEPRINT + DEV_STANDARD + PROGRESS-REPORT-001_
