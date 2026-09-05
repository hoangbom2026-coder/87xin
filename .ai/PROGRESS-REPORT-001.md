# PROGRESS-REPORT-001 — Báo Cáo Tiến Độ & Kế Hoạch Tiếp Theo

_BOB — Lead Architect | Cập nhật: 2026-09-04_

---

## PHẦN I — ĐÁNH GIÁ KẾT QUẢ (Score Card)

### 🏆 Tổng điểm: 61/100 (+36 so với baseline)

| Hạng mục | Baseline | Hiện tại | Delta | Mục tiêu |
|---|---|---|---|---|
| Missing services | ❌ 3 thiếu | ✅ 0 thiếu | **+15** | ✅ |
| JWT_SECRET security | ❌ Hardcoded | ✅ Fail-fast | **+10** | ✅ |
| Controller try/catch | ❌ 48 blocks | ⚠️ 35 blocks | **+7** | 0 blocks |
| Controllers import Model | ❌ 14 files | ⚠️ 11 files | **+3** | 0 files |
| Services throw generic Error | ❌ 15 instances | ⚠️ 15 instances | 0 | 0 |
| TypeScript errors | ❌ ~45 files | ⚠️ Unknown | TBD | 0 |
| Test coverage | ❌ 1 service | ⚠️ 1 service | 0 | ≥60% |
| Admin i18n | ❌ 0 | ❌ 0 | 0 | 80+ keys |
| Admin fetch() bypass | ❌ 3 files | ❌ 3 files | 0 | 0 |

---

## PHẦN II — NHỮNG GÌ ĐÃ LÀM ĐƯỢC ✅

### 1. TASK-001: Role Module — HOÀN CHỈNH ✅
- [`role.controller.ts`]: Sạch 100% — 0 try/catch, 0 Model imports
- [`role.service.ts`]: Throw `ApiError` chuẩn với đúng HTTP codes
- **Pattern mẫu đã được thiết lập** cho toàn bộ dự án

### 2. TASK-002: Admin Staff Module — HOÀN CHỈNH ✅
- Controller: 7746 bytes → 2154 bytes (−72% code)
- [`admin-staff.service.ts`] mới (170 lines): Full business logic với audit logging
- 0 Model imports trong controller, 0 try/catch thủ công
- Bcrypt, pagination, ApiError — tất cả đúng chuẩn

### 3. Security: JWT_SECRET — FIXED ✅
```typescript
// Fail-fast production, fallback dev/test only
const getJwtSecret = (): string => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'test' || ...) return 'dev-jwt-secret-...';
    throw new Error('JWT_SECRET is required in production');
};
```

### 4. Missing Services — CREATED ✅
- `deposit.service.ts` ✅
- `withdraw.service.ts` ✅ (đầy đủ: create, getById, update, paginate)
- `notification.service.ts` ✅
- `currency.service.ts` ✅
- `setting.service.ts` ✅
- `bot-runner.service.ts` ✅

### 5. `ag-casino.controller.ts` — CLEAN ✅
- **0 try/catch blocks** (đã kiểm tra thực tế)
- Sử dụng `catchAsync` hoàn toàn

---

## PHẦN III — CÁC VẤN ĐỀ CÒN TỒN TẠI ❌

### 🔴 BUG QUAN TRỌNG (Cần fix ngay)

#### BUG-001: Typo trong notification.service.ts
```typescript
// HIỆN TẠI (SAI)
const createNotifcation = async (...)   // thiếu chữ 'i'
export default { createNotifcation, ... }

// CẦN SỬA THÀNH
const createNotification = async (...)
export default { createNotification, ... }
```
**Nguy cơ:** Bất kỳ code nào gọi `notificationService.createNotification(...)` sẽ crash TypeScript.

#### BUG-002: deposit.service.ts thiếu method
```typescript
// HIỆN TẠI — chỉ có 2 methods
export default { createDeposit, getPendingDeposit }

// THIẾU — nowpay.controller.ts cần thêm
getDepositById(id: string)    // dùng tại line 306
listDeposits(filter)          // dùng tại nhiều controllers
```

---

### 🟠 VI PHẠM KIẾN TRÚC CÒN LẠI

#### 35 try/catch thủ công trong controllers
```
❌ nowpay.controller.ts    — 10 blocks (nhiều nhất)
❌ plan.controller.ts      — 7 blocks
❌ package.controller.ts   — 6 blocks
❌ ag-pay.controller.ts    — 4 blocks
❌ media.controller.ts     — 3 blocks
❌ auth.controller.ts      — 2 blocks
❌ admin-games.controller.ts — 2 blocks
❌ kyc-admin.controller.ts  — 1 block
```

#### 11 controllers còn import Model trực tiếp
```
❌ reagent-tree.controller.ts
❌ newsletter.controller.ts
❌ admin-agents.controller.ts
❌ ticket.controller.ts
❌ media.controller.ts
❌ package.controller.ts
❌ user-affiliate.controller.ts
❌ article.controller.ts
❌ admin-store.controller.ts
❌ admin-vip.controller.ts
❌ setting.controller.ts
```

#### 15 Services throw generic Error (root cause của try/catch ở controller)
```
❌ media.service.ts         — 6 instances
❌ affiliate-stats.service.ts — 2 instances
❌ email.service.ts          — 2 instances
❌ game-config.service.ts    — 2 instances
❌ gsc-environment.service.ts — 1 instance
❌ support-chat.service.ts   — 1 instance
❌ gsc-catalog-sync.service.ts — 1 instance
```

---

### 🟡 VẤN ĐỀ I18N NGHIÊM TRỌNG (Phát hiện mới)

Từ file `I18N-001.md` trong `.ai/tasks/`:

| File | Vấn đề | Mức độ |
|---|---|---|
| `apps/frontend-web/src/i18n/locales/en.json` | **Toàn bộ 573 dòng là tiếng Việt** — file sai nội dung | 🔴 |
| `apps/frontend-web/src/i18n/locales/vi.json` | Identical với en.json — byte-for-byte giống nhau | 🔴 |
| `libs/i18n/locales/en.json` | Chỉ có 7 keys namespace `agency` — thiếu 30+ namespaces | 🟠 |
| `libs/i18n/locales/vi.json` | Chỉ có 7 keys — thiếu 30+ namespaces | 🟠 |

**Hậu quả:** Tính năng đổi ngôn ngữ sang English KHÔNG HOẠT ĐỘNG — người dùng vẫn thấy tiếng Việt.

---

## PHẦN IV — KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO

### NGAY BÂY GIỜ — Fix Bugs (15 phút)

```
[HERMES → OPENHANDS — BUG FIXES]

FIX 2 bugs ngay:

BUG-001: /var/app/game/apps/backend/src/main/services/notification.service.ts
  Đổi tất cả 'createNotifcation' → 'createNotification' (3 chỗ: line 3, 24, và export)

BUG-002: /var/app/game/apps/backend/src/main/services/deposit.service.ts
  Thêm 2 methods sau const getPendingDeposit (trước export default):
  
  const getDepositById = async (id: string) => {
      return await DepositModel.findById(id);
  };
  
  const listDeposits = async (query: { userId?: string; status?: string; page?: number; limit?: number }) => {
      const { userId, status, page = 1, limit = 10 } = query;
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (status) filter.status = status;
      const [items, total] = await Promise.all([
          DepositModel.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
          DepositModel.countDocuments(filter)
      ]);
      return { items, total, page, limit };
  };
  
  Cập nhật export: { createDeposit, getPendingDeposit, getDepositById, listDeposits }

VERIFY sau:
  cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
```

---

### SPRINT TIẾP THEO — Fix Services (Priority: Media + AffiliateStats)

```
[HERMES → OPENHANDS — FIX SERVICES THROW GENERIC ERROR]

NHIỆM VỤ: Đổi throw new Error → throw new ApiError trong 4 services ưu tiên cao

FILE 1: /var/app/game/apps/backend/src/main/services/media.service.ts
  Thêm import: import ApiError from '@utils/ApiError'; import httpStatus from 'http-status';
  Đổi TẤT CẢ:
  - throw new Error('Folder name không hợp lệ')    → throw new ApiError(httpStatus.BAD_REQUEST, 'Folder name không hợp lệ')
  - throw new Error('Folder đã tồn tại')            → throw new ApiError(httpStatus.CONFLICT, 'Folder đã tồn tại')
  - throw new Error('Folder not found')             → throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found')
  - throw new Error('Folder còn ... tệp, không thể xóa') → throw new ApiError(httpStatus.CONFLICT, ...)
  - throw new Error('Asset not found')              → throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found')
  - throw new Error('Target folder not found')      → throw new ApiError(httpStatus.NOT_FOUND, 'Target folder not found')

FILE 2: /var/app/game/apps/backend/src/main/services/affiliate-stats.service.ts
  - throw new Error('No commission to claim')       → throw new ApiError(httpStatus.BAD_REQUEST, ...)
  - throw new Error('User not found')               → throw new ApiError(httpStatus.NOT_FOUND, ...)

FILE 3: /var/app/game/apps/backend/src/main/services/game-config.service.ts
  - throw new Error('name required')                → throw new ApiError(httpStatus.BAD_REQUEST, ...)
  - throw new Error('Game not found')               → throw new ApiError(httpStatus.NOT_FOUND, ...)

FILE 4: /var/app/game/apps/backend/src/main/services/gsc-environment.service.ts
  - throw new Error('GSC environment not found...')  → throw new ApiError(httpStatus.NOT_FOUND, ...)

VERIFY:
  grep -rn "throw new Error(" /var/app/game/apps/backend/src/main/services/ | grep -v spec | wc -l
  → Phải ≤ 5 (giảm từ 15 xuống)
```

---

### TASK-003 — Refactor nowpay.controller.ts (Priority cao nhất tiếp theo)

```
[HERMES → OPENHANDS — TASK-003: nowpay controller]

Tạo spec tại .ai/tasks/TASK-003.md:

SCOPE:
- File: /var/app/game/apps/backend/src/main/controllers/nowpay.controller.ts
- Vấn đề: 10 try/catch thủ công — nhiều nhất trong toàn bộ codebase

NHIỆM VỤ:
1. Xóa toàn bộ nested try/catch TRONG catchAsync (lines 87, 126, 171, 509)
   Lý do: catchAsync đã tự động chuyển exception → errorHandler
   
2. Các try/catch ở callback handlers (lines 290, 404, 531) — GIỮ LẠI
   Lý do: Đây là webhook callbacks, không dùng catchAsync — cần xử lý lỗi thủ công
   
3. Đảm bảo services throw ApiError đúng (nowpay.service.ts)

VERIFY:
  grep -c "try {" apps/backend/src/main/controllers/nowpay.controller.ts
  → Phải = 3 (chỉ còn callback handlers)
```

---

### Fix i18n en.json (Critical)

```
[HERMES → OPENHANDS — FIX I18N EN.JSON]

PROBLEM: apps/frontend-web/src/i18n/locales/en.json có nội dung tiếng Việt

NHIỆM VỤ:
1. Đọc apps/frontend-web/src/i18n/locales/vi.json
2. Tạo bản dịch tiếng Anh tương ứng — copy cấu trúc, dịch values
3. Ghi vào apps/frontend-web/src/i18n/locales/en.json

QUY TẮC DỊCH:
- Không dịch key names — chỉ dịch values
- Giữ nguyên placeholders: {{name}}, {{amount}}, {count}
- Nếu không chắc: dùng English equivalent ngắn gọn

VERIFY:
  grep -c "ạ\|ắ\|ặ\|ể\|ệ\|ồ\|ổ\|ỗ" apps/frontend-web/src/i18n/locales/en.json
  → Phải = 0 (không còn dấu tiếng Việt trong file en)
```

---

## PHẦN V — SCORECARD DỰ KIẾN SAU KHI HOÀN THÀNH

| Hạng mục | Sau bugs fix | Sau services fix | Sau TASK-003 | Sau i18n |
|---|---|---|---|---|
| Bugs quan trọng | 0 | 0 | 0 | 0 |
| Services throw Error | 15 | ≤5 | ≤5 | ≤5 |
| try/catch trong controllers | 35 | 35 | 28 | 28 |
| TypeScript errors | TBD | TBD | TBD | TBD |
| i18n (English) | ❌ | ❌ | ❌ | ✅ |
| **Tổng điểm** | **63** | **68** | **72** | **78** |

---

## PHẦN VI — THỨ TỰ THỰC HIỆN THEO ĐỘ ƯU TIÊN

```
╔══════════════════════════════════════════════════════════════╗
║  NGAY BÂY GIỜ (Fix runtime bugs — 15 phút)                  ║
║  1. BUG-001: notification.service.ts typo                    ║
║  2. BUG-002: deposit.service.ts missing methods              ║
╠══════════════════════════════════════════════════════════════╣
║  TIẾP THEO (Fix services — 30 phút)                         ║
║  3. media.service.ts — 6 throw generic Error                 ║
║  4. affiliate-stats.service.ts — 2 throw generic Error       ║
║  5. game-config.service.ts — 2 throw generic Error           ║
╠══════════════════════════════════════════════════════════════╣
║  TIẾP THEO (Reduce try/catch — 45 phút)                     ║
║  6. TASK-003: nowpay.controller.ts — loại 4 nested try/catch ║
║  7. TASK-004: plan.controller.ts — 7 try/catch               ║
╠══════════════════════════════════════════════════════════════╣
║  SAU ĐÓ (I18N + Quality)                                    ║
║  8. Fix en.json (English translation)                        ║
║  9. TypeScript strict mode bật                               ║
║  10. Expand test suite                                        ║
╚══════════════════════════════════════════════════════════════╝
```
