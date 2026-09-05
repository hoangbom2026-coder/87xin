# TS-FIX-001 — Fix 41 TypeScript Errors + Architecture Violations

### Task ID: TS-FIX-001
### Title: Fix toàn bộ TypeScript errors thực tế (41 errors, 8 nhóm)
### Priority: 🔴 CRITICAL
### Author: BOB | Audit: 2026-09-05
### Pattern mẫu: `apps/backend/src/main/controllers/role.controller.ts`

---

## 📊 BASELINE THỰC TẾ (đã đo)

| Metric | Hiện tại | Mục tiêu |
|---|---|---|
| TS errors (backend) | **41** | 0 |
| try/catch controllers | **35** | 0 |
| `throw new Error()` services | **15** | 0 |
| Model import in controllers | **15** | 0 |
| Hex color admin | **6** | 0 |
| Raw `fetch()` admin | **14** | 0 |

---

## ═══════════════════════════
## NHÓM 1 — game-menu.service.ts: Import sai (named vs default)
## ═══════════════════════════

**File:** `apps/backend/src/main/services/game-menu.service.ts`

**Lỗi:**
```
error TS2614: Module '"@main/constants/game-menu-defaults"' has no exported member 'DEFAULT_GAME_MENU'
error TS2614: Module '"@main/constants/game-menu-defaults"' has no exported member 'normalizeGameMenu'
```

**Thực tế trong `game-menu-defaults.ts`:** Cả hai đều là named export `export const`.

**Fix:** Đổi import từ `{ DEFAULT_GAME_MENU, normalizeGameMenu }` thành:
```typescript
// TRƯỚC (SAI)
import {
    DEFAULT_GAME_MENU,
    IGameMenuItem,
    normalizeGameMenu
} from '@main/constants/game-menu-defaults';

// SAU (ĐÚNG) — giữ nguyên, đây ĐÃ LÀ named export → lỗi nằm ở nơi khác
// Kiểm tra lại: có thể tsconfig resolveJsonModule hoặc moduleResolution gây ra
// Thêm 'type' keyword vào interface import:
import { DEFAULT_GAME_MENU, type IGameMenuItem, normalizeGameMenu } from '@main/constants/game-menu-defaults';
```

**Verify:** `npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep game-menu` → 0

---

## ═══════════════════════════
## NHÓM 2 — IUser model: ObjectId không gán được string
## ═══════════════════════════

**Root cause:** `IUser._id` có type `Schema.Types.ObjectId`, nhưng nhiều service/controller expect `string`.

**Fix dứt điểm trong `apps/backend/src/main/models/user.model.ts`:**
```typescript
// TRƯỚC
export interface IUser extends Document {
    _id: Schema.Types.ObjectId;
    currencyId: Schema.Types.ObjectId;
    ...

// SAU — Override _id type để compatible với Document
export interface IUser extends Document {
    _id: Types.ObjectId;        // dùng Types.ObjectId (không phải Schema.Types)
    currencyId: Types.ObjectId;
    ...
```

**Thêm import:**
```typescript
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
```

**Sau đó fix các controllers dùng ObjectId làm string:**

```
FILE: apps/backend/src/main/controllers/vip-bonus.controller.ts
  Lines 16,21,22,23,25:
  user._id  →  String(user._id)          (khi truyền vào service expect string)
  user.currencyId  →  String(user.currencyId)

FILE: apps/backend/src/main/controllers/vip-spin.controller.ts
  Lines 99,100,110,131,132,133,135:
  user._id  →  String(user._id)
  user.currencyId  →  String(user.currencyId)

FILE: apps/backend/src/main/controllers/ag-pay.controller.ts
  Line 65: String(req.user!._id)  →  đã đúng, kiểm tra lại type expect của service

FILE: apps/backend/src/main/controllers/nowpay.controller.ts
  Line 195: String(req.user!._id)

FILE: apps/backend/src/main/controllers/player.controller.ts
  Line 160: String(req.user!._id)
```

**Verify:** `npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep "ObjectId" | wc -l` → 0

---

## ═══════════════════════════
## NHÓM 3 — config/index.ts: Thiếu keys `fromEmail`, `adminCode`
## ═══════════════════════════

**Files bị lỗi:**
- `verify.controller.ts` line 39,75,124: `config.fromEmail` không tồn tại
- `user.controller.ts` line 122: `config.adminCode` không tồn tại

**Fix — thêm vào `apps/backend/src/config/index.ts`** (trong object export):
```typescript
// Thêm SAU sendGridApiKey:
fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@tc-gaming.live',
adminCode: process.env.ADMIN_CODE || '',
```

**Verify:** `grep -n "fromEmail\|adminCode" apps/backend/src/config/index.ts` → có 2 dòng

---

## ═══════════════════════════
## NHÓM 4 — nowpay.controller.ts: config.nowpay thiếu email/password
## ═══════════════════════════

**Lỗi:** Line 49,56,57: `config.nowpay.email`, `config.nowpay.password` không tồn tại trong type.

**Thực tế:** `apps/backend/src/config/index.ts` ĐÃ CÓ `email` và `password` trong `nowpay` block (đã xác nhận).

**Nguyên nhân thực sự:** TypeScript cache cũ hoặc `strict: false` + partial inference.

**Fix:** Thêm explicit type cho nowpay config:
```typescript
// Trong config/index.ts, thêm interface:
nowpay: {
    host: string;
    apiKey: string;
    ipnSecret: string;
    email: string;    // đảm bảo field này có trong type
    password: string;
}
```

Hoặc đơn giản: run `npm run typecheck` lại sau khi fix NHÓM 3, thường tự resolve.

---

## ═══════════════════════════
## NHÓM 5 — player.controller.ts: depositService.getPlayerDeposit không tồn tại
## ═══════════════════════════

**Lỗi:** `Property 'getPlayerDeposit' does not exist on type deposit service`

**Thực tế:** `deposit.service.ts` có `getDepositById`, `listDeposits` nhưng KHÔNG có `getPlayerDeposit`.

**Fix — thêm method vào `apps/backend/src/main/services/deposit.service.ts`:**
```typescript
const getPlayerDeposit = async (q: { userId?: string; status?: string; page?: number; limit?: number }) => {
    return listDeposits(q);
};

// Thêm vào export default:
export default { createDeposit, getPendingDeposit, getDepositById, listDeposits, getPlayerDeposit, patchUpdate };
```

**Verify:** `grep "getPlayerDeposit" apps/backend/src/main/services/deposit.service.ts` → có

---

## ═══════════════════════════
## NHÓM 6 — reagent-program + referral-code: IUser không gán được Record<string,unknown>
## ═══════════════════════════

**Lỗi:**
- `reagent-program.controller.ts(21,78)`: `IUser` không gán được `Record<string, unknown>`
- `referral-code.controller.ts(36,39)`: tương tự

**Fix:**
```typescript
// reagent-program.controller.ts line 21:
// TRƯỚC:
const payload = await reagentEnrollmentService.getPublicEnrollmentStatus(req.user ?? null);
// SAU:
const payload = await reagentEnrollmentService.getPublicEnrollmentStatus(req.user as Record<string, unknown> ?? null);

// referral-code.controller.ts line 36:
// TRƯỚC:
await assertMayCreateReferralCode(req.user as Record<string, unknown>);
// SAU (nếu đang lỗi Conversion):
await assertMayCreateReferralCode(req.user as unknown as Record<string, unknown>);
```

**Hoặc fix đúng hơn** — cập nhật type của các functions đó nhận `IUser | null` thay vì `Record<string,unknown>`.

---

## ═══════════════════════════
## NHÓM 7 — admin-churn.controller.ts: notification field 'content' không tồn tại
## ═══════════════════════════

**Lỗi:** `Object literal may only specify known properties, 'content' does not exist`

**Fix — thêm `content` vào NotificationModel schema hoặc interface:**

Kiểm tra `apps/backend/src/main/models/notification.model.ts`:
```typescript
// Nếu schema chưa có 'content' field, thêm vào:
content: { type: String, default: '' },
```
Và thêm vào interface `INotification`:
```typescript
content?: string;
```

**Verify:** `grep -n "content" apps/backend/src/main/models/notification.model.ts` → có

---

## ═══════════════════════════
## NHÓM 8 — IUser extends Document: TS2430
## ═══════════════════════════

**Lỗi:** `Interface 'IUser' incorrectly extends interface 'Document<ObjectId, any, any, Record<string, any>, {}>'`

**Fix** trong `apps/backend/src/main/models/user.model.ts`:
```typescript
// TRƯỚC
import mongoose, { Document, Model, Schema } from 'mongoose';
export interface IUser extends Document {
    _id: Schema.Types.ObjectId;

// SAU
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
export interface IUser extends Document<Types.ObjectId> {
    // Không cần khai báo _id nữa (Document<Types.ObjectId> đã có)
    // Xóa dòng: _id: Schema.Types.ObjectId;
```

---

## ═══════════════════════════
## ARCHITECTURE VIOLATIONS — Sửa song song
## ═══════════════════════════

### [AV-001] 35 try/catch → catchAsync

Thứ tự ưu tiên (files nhiều nhất):
```
nowpay.controller.ts      — 10 blocks
plan.controller.ts        — 7 blocks
package.controller.ts     — 6 blocks
ag-pay.controller.ts      — 4 blocks
media.controller.ts       — 3 blocks
auth.controller.ts        — 2 blocks
admin-games.controller.ts — 2 blocks
(các file còn lại: 1 block mỗi file)
```

Pattern:
```typescript
// ❌ SAI
export const fn = async (req, res, next) => {
  try { ... } catch(e) { next(e); }
};

// ✅ ĐÚNG
export const fn = catchAsync(async (req: AuthRequest, res: Response) => {
  ...
});
```

### [AV-002] 15 `throw new Error()` → `throw new ApiError()`

```bash
# Tìm tất cả:
grep -rn "throw new Error(" apps/backend/src/main/services/ --include="*.ts"
```

Rule chọn status:
- Không tìm thấy → `httpStatus.NOT_FOUND`
- Dữ liệu sai → `httpStatus.BAD_REQUEST`
- Không có quyền → `httpStatus.FORBIDDEN`
- Đã tồn tại → `httpStatus.CONFLICT`

### [AV-003] 15 Model imports trong controllers → qua service

```bash
# Tìm tất cả:
grep -rn "import.*Model" apps/backend/src/main/controllers/ --include="*.ts"
```

Với mỗi kết quả:
1. Tạo/thêm method vào service tương ứng
2. Xóa Model import khỏi controller
3. Gọi qua service

---

## VERIFICATION COMMANDS

```bash
cd /var/app/game

# TS errors → 0
npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l

# try/catch → 0
grep -r "try {" apps/backend/src/main/controllers/ --include="*.ts" | wc -l

# generic Error → 0
grep -r "throw new Error(" apps/backend/src/main/services/ --include="*.ts" | wc -l

# Model import in controllers → 0
grep -r "import.*Model" apps/backend/src/main/controllers/ --include="*.ts" | wc -l
```

---

## THỨ TỰ THỰC HIỆN

```
1. NHÓM 7  → notification.model.ts thêm content field       (1 file, unblocks admin-churn)
2. NHÓM 8  → user.model.ts fix IUser extends Document        (1 file, unblocks ~10 errors)
3. NHÓM 3  → config/index.ts thêm fromEmail + adminCode      (1 file, unblocks verify+user)
4. NHÓM 1  → game-menu.service.ts fix import                 (1 file)
5. NHÓM 5  → deposit.service.ts thêm getPlayerDeposit        (1 file)
6. NHÓM 2  → vip-bonus + vip-spin String(ObjectId) cast      (2 files)
7. NHÓM 4  → nowpay config type (thường tự resolve sau step 3)
8. NHÓM 6  → reagent + referral cast fix                     (2 files)
9. AV-001  → 35 try/catch → catchAsync                       (~10 files)
10. AV-002 → 15 generic Error → ApiError                     (~7 services)
11. AV-003 → 15 Model imports → qua service                  (~11 controllers)
```

Sau mỗi bước chạy: `npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l`

_BOB — 2026-09-05 | Evidence: npm run typecheck thực tế_
