# HERMES-ANALYZE-001 — Full Codebase Audit Report & Standardization Plan

_Tác giả: BOB (Lead Architect) | Ngày: 2026-09-04_
_Nguồn: Audit thực tế 3 apps + toàn bộ backend src_

---

## ✅ CẬP NHẬT TRẠNG THÁI TASK-001

**TASK-001 (Role Controller Refactor): ĐÃ HOÀN THÀNH**
- `role.controller.ts`: Sạch 100% — không còn try/catch thủ công
- `role.service.ts`: Đã throw `ApiError` với đúng HTTP codes (BAD_REQUEST, FORBIDDEN, NOT_FOUND)
- Pattern chuẩn đã được xác lập — đây là **mẫu tham chiếu** cho tất cả tasks tiếp theo

---

## PHẦN I — PHÂN TÍCH THỰC TẾ 3 APPS

---

### APP 1: `apps/backend/src` — Kết quả Audit

#### ✅ ĐÃ TỐT
| Hạng mục | Chi tiết |
|---|---|
| Helmet.js | `app.use(helmet())` — active tại app.ts:19 |
| Body limit | `express.json({ limit: '10mb' })` — đúng chuẩn |
| Rate limiting | `authLimiter` 10req/15min, `otpLimiter` 5req/15min |
| Error middleware | `errorConverter` + `errorHandler` — chuẩn format |
| Routes mounting | 56 routers mount tập trung tại routes.ts |
| Cors, session | Cấu hình đúng từ env |

#### 🔴 VI PHẠM NGHIÊM TRỌNG (CRITICAL)

**VI PHẠM 1: 3 Missing Services — Runtime crash**
```
❌ deposit.service.ts    → 4 controllers import nhưng file không tồn tại
❌ withdraw.service.ts   → 3 controllers import nhưng file không tồn tại
❌ notification.service.ts → 1 controller import nhưng file không tồn tại
```

**VI PHẠM 2: 14 Controllers import thẳng Model (bypass Service layer)**
```
❌ admin-agents.controller.ts    → UserModel, TransactionModel
❌ admin-staff.controller.ts     → UserModel (TASK-002 đang xử lý)
❌ admin-store.controller.ts     → PackageModel, TransactionModel
❌ admin-vip.controller.ts       → UserModel, VipTiersModel
❌ article.controller.ts         → ArticleCategoryModel, ArticlePostModel
❌ media.controller.ts           → MediaAssetModel
❌ newsletter.controller.ts      → NewsletterSubscriberModel
❌ package.controller.ts         → PackageCategoryModel
❌ reagent-tree.controller.ts    → UserModel
❌ ticket.controller.ts          → TicketModel
❌ user-affiliate.controller.ts  → UserModel
+ 3 others
```

**VI PHẠM 3: JWT_SECRET có fallback hardcode**
```typescript
// config/index.ts — SECURITY RISK
JWT_SECRET: process.env.JWT_SECRET || 'tc-gaming-jwt-secret-key-production'
//                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                     Exposed fallback — PHẢI XÓA
```

#### 🟠 VI PHẠM CAO (HIGH)

**VI PHẠM 4: 48 try/catch thủ công trong controllers**
- `ag-casino.controller.ts`: 8 blocks
- `nowpay.controller.ts`: 10 blocks
- `plan.controller.ts`: 7 blocks
- `gs-pay.controller.ts`: 5 blocks
- Nhiều controllers khác

**VI PHẠM 5: 14 Services throw generic `Error` thay vì `ApiError`**
```
❌ support-chat.service.ts   → throw new Error('CONVERSATION_NOT_FOUND')
❌ media.service.ts          → throw new Error('Folder not found') x5
❌ gsc-catalog-sync.service.ts → throw new Error('GSC_ENV_NOT_FOUND')
❌ game-config.service.ts    → throw new Error('name required') x2
❌ email.service.ts          → throw new Error('Email service disabled')
❌ affiliate-stats.service.ts → throw new Error('No commission to claim')
```

**VI PHẠM 6: 20+ Hardcoded URLs trong source code**
```typescript
// config/index.ts
backendUrl: 'http://127.0.0.1:8701'           // Should use process.env
frontendUrl: 'https://tc-gaming.live'          // Should use process.env

// user-affiliate.controller.ts:18
const baseUrl = 'https://tc-gaming.live';      // HARDCODED — vi phạm

// nowpay.service.ts
'https://api.coingecko.com/api/v3/...'         // External API URL hardcode

// Various constants files
'https://tc-gaming.live' references x5+
```

#### 🟡 VI PHẠM TRUNG BÌNH (MEDIUM)
- `tsconfig.json`: `noImplicitAny: false`, `strictNullChecks: false` — TypeScript lỏng lẻo
- `req.user as Record<string, unknown>` trong `referral-code.controller.ts` — unsafe cast

---

### APP 2: `apps/admin-dashboard/client` — Kết quả Audit

#### ✅ ĐÃ TỐT
| Hạng mục | Chi tiết |
|---|---|
| AdminLayout | 72/72 pages (100% compliant) |
| Raw HTML table | 0 violations — tất cả dùng @game/ui/table hoặc DataTable |
| API centralization | lib/api.ts: 100+ functions, req() wrapper |
| Auth & Session | adminAuth.ts + useSessionTimeout (30min) |
| Cross-app imports | 0 violations |
| DataTable | Được dùng đúng cách ở nhiều pages |

#### 🔴 VI PHẠM NGHIÊM TRỌNG

**VI PHẠM 1: 60+ Hardcoded Vietnamese strings (không qua i18n)**
```typescript
// Roles.tsx
toast({ title: 'Tải dữ liệu thất bại' })
toast({ title: 'Lưu thất bại' })

// VIP.tsx
toast({ title: 'Không thể tải danh sách bậc VIP' })

// CommissionLogs.tsx
<h1>Nhật ký hoa hồng</h1>
<p>Commission & referral</p>

// ChurnRisk.tsx
'Churn & giữ chân (MVP)'

// Dashboard.tsx (priority labels)
'Ưu tiên', 'Cảnh báo', 'Lưu ý', 'Ổn định'
```
> **Ảnh hưởng:** 20+ pages. Không thể chuyển sang English cho admin quốc tế.

#### 🟠 VI PHẠM CAO

**VI PHẠM 2: 3 files dùng `fetch()` trực tiếp (bypass api.ts)**
```typescript
// AdminDepositMethods.tsx:36,49
fetch("/api/setting/business")          // → Phải dùng getBusinessSettings()

// SiteContentFaqs.tsx:55,97
fetch('/api/setting/site')
fetch('/api/setting/business')          // → Phải dùng api.ts functions

// Promotions.tsx:69,108,119,148
fetch(`${BASE}/bonus/...`)             // → Phải dùng api.ts functions
```

**VI PHẠM 3: TanStack Query chỉ dùng ở 2-3/72 pages**
- Dashboard.tsx ✅, ChurnRisk.tsx ✅ — đây là pattern chuẩn
- 69+ pages còn lại dùng manual `useState + try/catch` 
- Hậu quả: Không có caching, deduplication, auto-refetch

#### 🟡 VI PHẠM TRUNG BÌNH

**VI PHẠM 4: 2-3 file còn hex colors**
```typescript
// VipTiersManager.tsx:30-31
const COLORS = ["#d97706", "#10b981", "#3b82f6", ...] // Should be CSS vars

// GamesHub.tsx:235
style={{ backgroundColor: c.color || "#888" }}

// PluginsPage.tsx:241
className="bg-[#1c1b20]"
```

---

### APP 3: `apps/frontend-web/src` — Kết quả Audit

#### ✅ ĐÃ TỐT — Frontend là app SẠCH NHẤT
| Hạng mục | Chi tiết |
|---|---|
| Cross-app imports | 0 violations |
| Hardcoded URLs | 0 — tất cả từ `import.meta.env` |
| API centralization | 2 Axios instances với interceptors |
| i18n coverage | 300+ t() calls, vi/en dual support |
| Auth flow | Redux-Saga + ProtectedRoute |
| Socket.IO | Realtime balance sync |
| Dynamic theme | SiteContext → CSS variables tại runtime |

#### 🟡 VI PHẠM NHỎ
- 21 hardcoded placeholder strings (mostly input placeholders, example values)
- `localStorage` token storage (XSS risk — nên dùng HttpOnly cookie)
- No frontend tests at all

---

## PHẦN II — BẢNG VI PHẠM TỔNG HỢP

```
PRIORITY  APP           VI PHẠM                              FILES   ACTION
──────────────────────────────────────────────────────────────────────────────────
🔴 P1     Backend       Missing services (runtime crash)         3    CREATE NOW
🔴 P1     Backend       JWT_SECRET hardcoded fallback            1    REMOVE FALLBACK
🔴 P1     Admin         60+ hardcoded strings (no i18n)        20+   ADD I18N SYSTEM
🟠 P2     Backend       Controllers import Models directly      14    SERVICE REFACTOR
🟠 P2     Backend       Services throw generic Error            14    USE ApiError
🟠 P2     Backend       48 try/catch thủ công in controllers    48    USE catchAsync
🟠 P2     Backend       20+ hardcoded URLs in source            20+   USE process.env
🟠 P2     Admin         Direct fetch() bypassing api.ts          3    MIGRATE TO api.ts
🟠 P2     Admin         TanStack Query chỉ dùng 3/72 pages     69    MIGRATE TO useQuery
🟡 P3     Backend       tsconfig noImplicitAny: false            1    ENABLE STRICT
🟡 P3     Admin         2-3 hex color violations                 3    CSS VARIABLES
🟡 P3     Frontend      21 hardcoded placeholders              21    I18N STRINGS
🟡 P3     Frontend      localStorage token (XSS risk)           1    HTTPONLY COOKIE
🟡 P3     All           No frontend tests                        0    ADD VITEST
```

---

## PHẦN III — KẾ HOẠCH CHUẨN HÓA THEO THỨ TỰ ƯU TIÊN

### 🔴 NHÓM P1 — PHẢI LÀM NGAY (Blocking production)

#### P1-A: Fix Missing Services (DAY-001)
> Tham chiếu: `docs/AI/PROMPTS/day-001-missing-services.md`

- Tạo `deposit.service.ts` — CRUD deposit records, verify deposit
- Tạo `withdraw.service.ts` — CRUD withdraw requests, process withdrawal  
- Tạo `notification.service.ts` — send/list/mark-read notifications
- **Pattern mẫu:** `role.service.ts` (đã refactor) — throw ApiError, typed DTOs

#### P1-B: Fix JWT_SECRET Security Leak
```typescript
// TRƯỚC (NGUY HIỂM):
JWT_SECRET: process.env.JWT_SECRET || 'tc-gaming-jwt-secret-key-production'

// SAU (AN TOÀN):
JWT_SECRET: process.env.JWT_SECRET || (() => { 
  throw new Error('JWT_SECRET environment variable is required'); 
})()
```

#### P1-C: Admin i18n Foundation
> Tham chiếu: `docs/AI/PROMPTS/day-005-i18n.md`

Admin dashboard cần i18n riêng (react-i18next hoặc custom hook tương tự frontend-web).
Tạo `apps/admin-dashboard/client/i18n/` với vi.json và en.json.

---

### 🟠 NHÓM P2 — LÀM THEO SPRINT (Chất lượng code)

#### P2-A: Tiếp tục Controller → Service refactoring
> Task queue sau TASK-002:

```
TASK-003: article.controller.ts → article.service.ts
TASK-004: media.controller.ts → media.service.ts  
TASK-005: admin-vip.controller.ts → admin-vip.service.ts
TASK-006: ticket.controller.ts → ticket.service.ts
TASK-007: admin-agents.controller.ts → agents.service.ts
```

**Pattern chuẩn (từ role.controller.ts đã hoàn thành):**
```typescript
// Controller chỉ làm 3 việc:
export const createXxx = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await xxxService.createXxx(req.body || {});  // 1. Gọi Service
  return res.status(httpStatus.CREATED).send(result);          // 2. Trả response
  // 3. Error tự động được xử lý bởi catchAsync → errorHandler
});
```

#### P2-B: Fix Services throw generic Error → ApiError
> 14 services cần sửa — ưu tiên: media, support-chat, affiliate-stats

#### P2-C: Migrate Admin fetch() → api.ts
> 3 files: AdminDepositMethods.tsx, SiteContentFaqs.tsx, Promotions.tsx

#### P2-D: Migrate Admin useState → TanStack Query
> 69 pages — làm theo batch theo module (VIP, Affiliate, Settings...)

---

### 🟡 NHÓM P3 — POLISH (Sau khi P1+P2 hoàn thành)

- Bật `noImplicitAny: true` trong tsconfig (sau khi fix hết TypeScript errors)
- Fix 3 hex color violations trong admin
- Migrate `localStorage` token sang `HttpOnly` cookie (security enhancement)
- Thêm vitest cho frontend-web components

---

## PHẦN IV — LỆNH HERMES CHI TIẾT

### Khởi động phiên làm việc

```
[HERMES — SESSION INIT]

Đọc theo thứ tự:
1. /var/app/game/docs/AI/PROJECT_MEMORY.md
2. /var/app/game/.ai/MASTER_PLAN.md
3. /var/app/game/.ai/active_task.md

Sau đó báo cáo:
- Active task hiện tại?
- Số TypeScript errors hiện tại?
- Sprint nào đang pending?
```

### Sprint 1 — Tạo 3 Missing Services (P1-A)

```
[HERMES → OPENHANDS — MISSING SERVICES]

CONTEXT: Đọc /var/app/game/docs/AI/PROMPTS/day-001-missing-services.md
PATTERN MẪU: /var/app/game/apps/backend/src/main/services/role.service.ts

TẠO 3 FILE:

1. /var/app/game/apps/backend/src/main/services/deposit.service.ts
   - createDeposit(payload): Tạo bản ghi deposit mới
   - getDepositById(id): Lấy thông tin deposit
   - listDeposits(filter): Danh sách deposits có pagination
   - updateDepositStatus(id, status): Cập nhật trạng thái
   - Pattern: throw ApiError(httpStatus.XXX, message) — KHÔNG throw Error

2. /var/app/game/apps/backend/src/main/services/withdraw.service.ts
   - createWithdraw(payload): Tạo yêu cầu rút tiền
   - getWithdrawById(id): Lấy thông tin withdrawal
   - listWithdraws(filter): Danh sách withdrawals có pagination
   - updateWithdrawStatus(id, status): Cập nhật trạng thái
   - Pattern: throw ApiError — KHÔNG throw Error

3. /var/app/game/apps/backend/src/main/services/notification.service.ts
   - sendNotification(userId, payload): Gửi notification
   - listNotifications(userId): Danh sách notifications
   - markAsRead(id): Đánh dấu đã đọc
   - Pattern: throw ApiError — KHÔNG throw Error

VERIFY:
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
→ Số errors phải giảm ít nhất 20 so với trước
```

### Fix JWT_SECRET Security (P1-B)

```
[HERMES → OPENHANDS — SECURITY FIX JWT]

FILE: /var/app/game/apps/backend/src/config/index.ts

TÌM VÀ SỬA dòng JWT_SECRET:
TỪ:
  jwtSecret: process.env.JWT_SECRET || 'tc-gaming-jwt-secret-key-production',
THÀNH:
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET env var is required in production'); })()
    : 'dev-only-insecure-secret'),

VERIFY:
grep -n "tc-gaming-jwt-secret" /var/app/game/apps/backend/src/config/index.ts
→ Phải trả về trống (không còn hardcoded secret)
```

### Sprint 2 — Tiếp tục Service Refactoring (TASK-003)

```
[HERMES — TẠO TASK-003]

OpenHands, tiếp tục sau TASK-002. Tạo TASK-003:

FILE SPEC: /var/app/game/.ai/tasks/TASK-003.md

SCOPE:
- Controller: /var/app/game/apps/backend/src/main/controllers/article.controller.ts
- Service: /var/app/game/apps/backend/src/main/services/article.service.ts (tạo mới nếu chưa đủ)
- Models: ArticleCategoryModel, ArticlePostModel (hiện đang được import trực tiếp trong controller)

NHIỆM VỤ:
1. Tất cả ArticleCategoryModel, ArticlePostModel queries → chuyển vào article.service.ts
2. Controller chỉ giữ lại: req parsing + service call + res.send
3. Service throw ApiError — không throw generic Error
4. Thêm unit tests: article.service.spec.ts

PATTERN: Xem role.controller.ts và role.service.ts đã hoàn thành (TASK-001)

VERIFY:
- grep -n "import.*Model" apps/backend/src/main/controllers/article.controller.ts → 0 matches
- npm run typecheck -w apps/backend → 0 errors
```

### Sprint Admin — Fix fetch() violations (P2-C)

```
[HERMES → OPENHANDS — FIX ADMIN FETCH]

FIX 3 FILES trong apps/admin-dashboard/client:

FILE 1: client/pages/admin/AdminDepositMethods.tsx
- Dòng 36: fetch("/api/setting/business") → getBusinessSettings(token())
- Dòng 49: fetch("/api/setting/business") với PATCH → patchBusinessSettings(token(), data)
- Import từ '../lib/api' (hoặc '../../lib/api')

FILE 2: client/pages/admin/SiteContentFaqs.tsx
- Dòng 55: fetch('/api/setting/site') → getSiteSettings(token()) (tạo function nếu chưa có)
- Dòng 97: fetch('/api/setting/business') → getBusinessSettings(token())

FILE 3: client/pages/admin/Promotions.tsx
- Dòng 69, 108, 119, 148: fetch(`${BASE}/bonus/...`) → dùng functions từ api.ts
- Check lib/api.ts xem đã có getAdminBonuses(), createBonusApi(), updateBonusApi() chưa

VERIFY:
grep -rn "fetch(" apps/admin-dashboard/client/pages/admin/ | grep -v "//.*fetch"
→ Phải = 0 matches
```

### Final Verification

```
[HERMES — FINAL SYSTEM CHECK]

Chạy TẤT CẢ checks sau và báo cáo PASS/FAIL:

1. TypeScript:
   npm run typecheck -w apps/backend → 0 errors
   npm run typecheck -w apps/admin-dashboard → 0 errors
   npm run typecheck -w apps/frontend-web → 0 errors

2. Tests:
   npm run test -w apps/backend → all pass

3. Security:
   grep -n "jwt-secret-key-production" apps/backend/src/config/index.ts → 0 matches
   grep -n "fetch(" apps/admin-dashboard/client/pages/admin/*.tsx → 0 matches

4. Architecture:
   grep -rn "import.*Model" apps/backend/src/main/controllers/ → 0 matches (target)
   grep -rn "throw new Error(" apps/backend/src/main/services/ → 0 matches (target)

Báo cáo: "FINAL CHECK: [X]/8 pass. Còn lại: [list issues]"
```

---

## PHẦN V — CHECKLIST HOÀN THÀNH DỰ ÁN

### Backend
- [ ] P1: deposit.service.ts, withdraw.service.ts, notification.service.ts tạo đủ
- [ ] P1: JWT_SECRET fallback hardcode được xóa
- [ ] P2: 14 controllers không còn import Model trực tiếp
- [ ] P2: 14 services không còn throw generic Error
- [ ] P2: 48 try/catch thủ công được thay bằng catchAsync
- [ ] P3: tsconfig strict mode bật
- [ ] TypeScript: 0 errors toàn workspace

### Admin Dashboard
- [ ] P1: i18n system (react-i18next hoặc custom) — 60+ strings
- [ ] P2: 3 files migrated từ fetch() sang api.ts
- [ ] P2: 10+ high-traffic pages migrated sang TanStack Query
- [ ] P3: 3 hex color violations fixed

### Frontend Web
- [ ] P3: 21 placeholder strings i18n'd
- [ ] P3: Test coverage added

### CI/CD
- [ ] `npm run typecheck` toàn workspace xanh
- [ ] `npm run test` all pass, coverage ≥ 60%
- [ ] GitHub Actions pr-check.yml: green
