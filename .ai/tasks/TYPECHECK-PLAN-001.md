# TYPECHECK-PLAN-001 — Kế Hoạch Xử Lý 82 TypeScript Errors

_BOB — Lead Architect | Audit thực tế: 2026-09-04_

---

## TÓM TẮT

**82 TypeScript errors** đang tồn tại. Chúng KHÔNG do các fix hôm nay gây ra — là code gốc (pre-existing).
Phân loại theo nguyên nhân gốc rễ:

| Nhóm | Ước tính | Root Cause | Cách fix |
|---|---|---|---|
| **A** ObjectId vs string mismatch | ~35 | Model interface dùng `Schema.Types.ObjectId`, service nhận `string` | `.toString()` hoặc `new Types.ObjectId()` |
| **B** `req.user` optional chaining | ~15 | `req.user?: IUser` — optional, nhưng code access không guard | Add `!` hoặc guard |
| **C** Missing model fields | ~12 | Model interfaces thiếu fields mà code đang dùng | Thêm vào interface |
| **D** Service method signature mismatch | ~10 | Service return type không khớp với code dùng | Align types |
| **E** nowpay typo `updateＣurrency` | ~2 | Chữ `Ｃ` full-width trong method name | Fix typo |
| **F** Misc remaining | ~8 | Scattered | Case by case |

---

## PHÂN TÍCH CHI TIẾT

### NHÓM A — ObjectId vs string mismatch (~35 errors)

**Nguyên nhân:** Mongoose models định nghĩa `userId: Schema.Types.ObjectId` nhưng:
- Services nhận `(userId: string)` param
- Controllers truyền `String(req.user._id)` — convert thành string trước khi truyền

**Files bị ảnh hưởng (models có `userId: Schema.Types.ObjectId`):**
```
deposit.model.ts, withdraw.model.ts, transaction.model.ts, 
balance.model.ts, session.model.ts, ticket.model.ts,
kyc.model.ts, otp.model.ts, referral-code.model.ts,
player-bonus.model.ts, preference.model.ts, 
vip-cashback.model.ts, vip-level-up-bonus.model.ts,
nowpay-deposit-log.model.ts, gs-pay-deposit-log.model.ts,
auth-log.model.ts, password-log.model.ts ...
```

**Giải pháp — 2 options:**

Option 1 (NHANH): Thêm `| string` vào interface declaration
```typescript
// TRƯỚC
userId: Schema.Types.ObjectId;
// SAU — backward compatible
userId: Schema.Types.ObjectId | string;
```

Option 2 (CHUẨN): Dùng `Types.ObjectId` nhất quán
```typescript
// Trong services: convert khi cần
const filter = { userId: new Types.ObjectId(userId) }
// Trong controllers: truyền ObjectId
String(req.user._id)  // đã đúng — là string
```

**Khuyến nghị:** Option 1 nhanh hơn cho 82 errors (batch fix toàn bộ models).

---

### NHÓM B — `req.user` optional access (~15 errors)

**Nguyên nhân:** `AuthRequest.user?: IUser` — optional `?`.
Khi code access `req.user.currency`, `req.user._id` mà không guard → TypeScript TS2532.

**Patterns gặp:**
```typescript
// TS2532: Object is possibly 'undefined'
const userId = req.user._id;           // ❌
const currency = req.user.currency;   // ❌

// Fix option A — Non-null assertion (dùng khi biết chắc đã auth)
const userId = req.user!._id;

// Fix option B — Optional chaining với fallback
const userId = req.user?._id ?? '';
```

**Context:** Tất cả những controllers này đều đã có `auth` middleware phía trước
(xem `role.router.ts`: `router.get('/', auth, adminOnly, controller)`).
Vì vậy `req.user!` là an toàn — middleware đã reject nếu không có user.

**Khuyến nghị:** Thêm `!` (non-null assertion) tại những chỗ có auth middleware.

---

### NHÓM C — Missing model fields (~12 errors)

**Nguyên nhân:** Code dùng fields chưa được khai báo trong interface.

**Ví dụ đã xác định:**
```typescript
// nowpay.controller.ts:49,56
config.nowpay.email    // ❌ — config.nowpay chỉ có apiKey, ipnSecret, sandboxMode
config.nowpay.password // ❌

// Cần thêm vào config/index.ts:
nowpay: {
    apiKey: ...,
    ipnSecret: ...,
    sandboxMode: ...,
    email: process.env.NOWPAY_EMAIL || '',     // ← thêm
    password: process.env.NOWPAY_PASSWORD || '', // ← thêm
}
```

---

### NHÓM D — nowpay typo (~2 errors)

**Nguyên nhân:** Chữ `Ｃ` full-width (Unicode) trong method name:
```typescript
// nowpay.controller.ts:144
const updated = await nowpayService.updateＣurrency(...)
//                                          ^^^^^^^^^^^
//                                          Ｃ (U+FF23) ≠ C (U+0043)
```

---

## KẾ HOẠCH FIX THEO BATCH

### BATCH 1 — Fix nhanh nhất: Model interfaces (xử lý ~35 errors)

```
[HERMES → OPENHANDS — BATCH 1: Fix ObjectId model interfaces]

NHIỆM VỤ: Thêm `| string` vào TẤT CẢ fields userId trong model interfaces

DANH SÁCH FILES cần sửa (thêm `| string` sau `Schema.Types.ObjectId`):
- apps/backend/src/main/models/deposit.model.ts
- apps/backend/src/main/models/withdraw.model.ts  
- apps/backend/src/main/models/transaction.model.ts
- apps/backend/src/main/models/balance.model.ts
- apps/backend/src/main/models/session.model.ts
- apps/backend/src/main/models/ticket.model.ts
- apps/backend/src/main/models/kyc.model.ts
- apps/backend/src/main/models/otp.model.ts
- apps/backend/src/main/models/referral-code.model.ts
- apps/backend/src/main/models/player-bonus.model.ts
- apps/backend/src/main/models/preference.model.ts
- apps/backend/src/main/models/vip-cashback.model.ts
- apps/backend/src/main/models/vip-level-up-bonus.model.ts
- apps/backend/src/main/models/nowpay-deposit-log.model.ts
- apps/backend/src/main/models/gs-pay-deposit-log.model.ts
- apps/backend/src/main/models/gs-pay-withdraw-log.model.ts
- apps/backend/src/main/models/auth-log.model.ts
- apps/backend/src/main/models/password-log.model.ts
- apps/backend/src/main/models/ag-payin-log.model.ts
- apps/backend/src/main/models/ag-payout-log.model.ts
- apps/backend/src/main/models/affiliate-stats.model.ts
- apps/backend/src/main/models/invest-log.model.ts
- apps/backend/src/main/models/newsletter-subscriber.model.ts
- apps/backend/src/main/models/nowpay-withdraw-log.model.ts
- apps/backend/src/main/models/password-reset.model.ts
- apps/backend/src/main/models/vip-spin-reward.model.ts

CÁCH SỬA: Với MỖI file, tìm pattern:
  userId: Schema.Types.ObjectId;
Đổi thành:
  userId: Schema.Types.ObjectId | string;

Tương tự với các ObjectId fields khác nếu gây lỗi:
  adminId, actorId, depositId, withdrawId, bonusId, planId, v.v.

VERIFY:
  cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
  → Phải giảm từ 82 xuống ≤ 50
```

---

### BATCH 2 — Fix req.user access (xử lý ~15 errors)

```
[HERMES → OPENHANDS — BATCH 2: Fix req.user optional access]

NHIỆM VỤ: Thêm non-null assertion `!` khi access req.user trong các controllers
đã có auth middleware bảo vệ.

QUY TẮC:
- Nếu route có `auth` middleware → req.user đã được verify → dùng `req.user!`
- Nếu không chắc → dùng `req.user?.` với fallback

PATTERN SỬA (áp dụng cho tất cả controllers):
  TỪ: req.user._id          → SAU: req.user!._id
  TỪ: req.user.currency     → SAU: req.user!.currency
  TỪ: req.user.currencyId   → SAU: req.user!.currencyId
  TỪ: req.user.username     → SAU: req.user!.username
  TỪ: req.user.role         → SAU: req.user!.role
  
  GIỮ NGUYÊN (đã có ?):
  req.user?.username  (đã safe)
  req.user?.role      (đã safe)

FILES cần kiểm tra và sửa:
  gs-pay.controller.ts, reward.controller.ts, nowpay.controller.ts,
  ag-pay.controller.ts, plan.controller.ts, preference.controller.ts,
  player.controller.ts, vip-spin.controller.ts, reagent-tree.controller.ts,
  ticket.controller.ts, user.controller.ts, store.controller.ts,
  invest-log.controller.ts, referral-code.controller.ts

VERIFY:
  cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
  → Phải giảm thêm ~15 (còn ≤ 35)
```

---

### BATCH 3 — Fix nowpay config + typo (xử lý ~4 errors)

```
[HERMES → OPENHANDS — BATCH 3: Fix nowpay]

FIX 1 — Typo chữ full-width trong nowpay.controller.ts:
  Tìm:    nowpayService.updateＣurrency
  Đổi:    nowpayService.updateCurrency
  (Chữ Ｃ U+FF23 → C U+0043)

FIX 2 — Thêm fields vào config/index.ts nếu cần:
  Đọc config/index.ts phần nowpay
  Nếu thiếu email/password: thêm
    email: process.env.NOWPAY_EMAIL || '',
    password: process.env.NOWPAY_PASSWORD || '',

VERIFY:
  grep -n "updateＣurrency\|updateCurrency" apps/backend/src/main/controllers/nowpay.controller.ts
  → Chỉ thấy updateCurrency (chữ C bình thường)
```

---

### BATCH 4 — Remaining errors (xử lý ~28 errors còn lại)

```
[HERMES → OPENHANDS — BATCH 4: Fix remaining TS errors]

Sau khi chạy BATCH 1-3, lấy danh sách errors còn lại:
  cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" > /tmp/ts-errors.txt
  cat /tmp/ts-errors.txt

Với từng error còn lại, phân tích và fix theo pattern phù hợp:
- TS2339 (Property does not exist): Thêm field vào interface
- TS2345 (Argument type mismatch): Thêm .toString() hoặc cast
- TS2304 (Cannot find name): Kiểm tra import thiếu
- TS2307 (Cannot find module): Kiểm tra path alias

TARGET CUỐI: 0 TypeScript errors
```

---

## THỐNG KÊ DỰ KIẾN

| Sau Batch | Errors còn | Giảm |
|---|---|---|
| Hiện tại | 82 | — |
| Sau Batch 1 | ~47 | 35 |
| Sau Batch 2 | ~32 | 15 |
| Sau Batch 3 | ~28 | 4 |
| Sau Batch 4 | 0 | 28 |

---

## LƯU Ý QUAN TRỌNG

1. **Không bật `strict: true` vội** — sẽ gây thêm errors. Chờ 82 errors về 0 trước.
2. **Không dùng `as any` để bypass** — đây là debt, không phải fix.
3. **Ưu tiên `| string` cho ObjectId** — vì codebase đang mix string và ObjectId.
4. **Test sau mỗi Batch** — chạy `npm run test -w apps/backend` để đảm bảo logic không bị break.
