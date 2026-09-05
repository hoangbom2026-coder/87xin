# HERMES-MASTER-TASKS.md — Yêu Cầu Chi Tiết Toàn Bộ Codebase

_BOB — Lead Architect | Audit thực tế toàn bộ 3 apps | 2026-09-04_

---

## ĐỌC TRƯỚC KHI LÀM

```
1. Đọc file này từ đầu đến cuối
2. Đọc docs/master/ARCH_BLUEPRINT.md
3. Đọc docs/master/DEV_STANDARD.md
4. Thực hiện từng TASK theo thứ tự Priority (P1 → P2 → P3)
5. Sau mỗi Task: chạy verify, cập nhật COMPLETED.md
```

**Pattern mẫu đã chuẩn (THAM KHẢO KHI LÀM):**
- Controller: `apps/backend/src/main/controllers/role.controller.ts`
- Service: `apps/backend/src/main/services/role.service.ts`

---

## ═══════════════════════════════════
## BACKEND TASKS
## ═══════════════════════════════════

---

### [BE-P1-001] Fix req.user non-null assertion — 8 controllers

**Tại sao:** `req.user?: IUser` là optional. Các routes đã có `auth` middleware xác thực nên `req.user` luôn tồn tại, nhưng TypeScript không biết điều này → sinh ~15 TS errors.

**Quy tắc:**
- Routes có `auth` middleware bảo vệ → dùng `req.user!.xxx` (non-null assertion)
- Đã có `req.user?.xxx` → giữ nguyên

**Từng file cần sửa:**

```
FILE: apps/backend/src/main/controllers/plan.controller.ts
  Lines 100, 101, 141, 142, 162, 163, 185, 186, 206, 207:
  String(req.user._id)       → String(req.user!._id)
  String(req.user.username)  → String(req.user!.username ?? '')

FILE: apps/backend/src/main/controllers/ticket.controller.ts
  Lines 11, 12, 30, 35, 57, 58, 60, 67:
  req.user.role     → req.user!.role
  req.user._id      → req.user!._id
  req.user.username → req.user!.username

FILE: apps/backend/src/main/controllers/gs-pay.controller.ts
  Lines 19, 20, 21:
  req.user._id       → req.user!._id
  req.user.currency  → req.user!.currency
  req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/reward.controller.ts
  Lines 18, 19, 46, 52, 53, 61, 62, 103, 104:
  req.user._id     → req.user!._id
  req.user.currency → req.user!.currency

FILE: apps/backend/src/main/controllers/nowpay.controller.ts
  Lines 172, 173:
  req.user._id      → req.user!._id
  req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/preference.controller.ts
  Lines 13, 18:
  req.user._id      → req.user!._id
  req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/ag-pay.controller.ts
  Lines 62, 63:
  req.user._id      → req.user!._id
  req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/user-affiliate.controller.ts
  Lines 10, 39:
  req.user._id → req.user!._id
```

**Verify:** `npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l` → giảm ~15

---

### [BE-P1-002] Fix services throw generic Error → ApiError — 7 services

**Tại sao:** Khi service throw `new Error('message')`, global `errorHandler` không biết HTTP status code nên luôn trả về 500. Phải throw `ApiError` với đúng status code.

**Từng file:**

```
FILE: apps/backend/src/main/services/media.service.ts
  Thêm import đầu file:
    import ApiError from '@utils/ApiError';
    import httpStatus from 'http-status';
  
  Đổi:
    throw new Error('Folder name không hợp lệ')
    → throw new ApiError(httpStatus.BAD_REQUEST, 'Folder name không hợp lệ')
    
    throw new Error('Folder đã tồn tại')
    → throw new ApiError(httpStatus.CONFLICT, 'Folder đã tồn tại')
    
    throw new Error('Folder not found')
    → throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found')
    
    throw new Error(`Folder còn ${inUse} tệp, không thể xóa`)
    → throw new ApiError(httpStatus.CONFLICT, `Folder còn ${inUse} tệp, không thể xóa`)
    
    throw new Error('Asset not found')
    → throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found')
    
    throw new Error('Target folder not found')
    → throw new ApiError(httpStatus.NOT_FOUND, 'Target folder not found')

FILE: apps/backend/src/main/services/affiliate-stats.service.ts
  Thêm import: import ApiError from '@utils/ApiError'; import httpStatus from 'http-status';
  
    throw new Error('No commission to claim')
    → throw new ApiError(httpStatus.BAD_REQUEST, 'No commission to claim')
    
    throw new Error('User not found')
    → throw new ApiError(httpStatus.NOT_FOUND, 'User not found')

FILE: apps/backend/src/main/services/game-config.service.ts
  Thêm import nếu chưa có.
  
    throw new Error('name required')
    → throw new ApiError(httpStatus.BAD_REQUEST, 'Name is required')
    
    throw new Error('Game not found')
    → throw new ApiError(httpStatus.NOT_FOUND, 'Game not found')

FILE: apps/backend/src/main/services/gsc-environment.service.ts
    throw new Error('GSC environment not found: ...')
    → throw new ApiError(httpStatus.NOT_FOUND, `GSC environment not found: ${envId}`)

FILE: apps/backend/src/main/services/support-chat.service.ts
    throw new Error('CONVERSATION_NOT_FOUND')
    → throw new ApiError(httpStatus.NOT_FOUND, 'Conversation not found')

FILE: apps/backend/src/main/services/gsc-catalog-sync.service.ts
    throw new Error('GSC_ENV_NOT_FOUND')
    → throw new ApiError(httpStatus.NOT_FOUND, 'GSC environment not found')

FILE: apps/backend/src/main/services/email.service.ts
    throw new Error('Email service disabled')
    → throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Email service disabled')
    
    throw new Error('Cannot create SMTP transporter ...')
    → throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Cannot create SMTP transporter')
```

**Verify:** `grep -rn "throw new Error(" apps/backend/src/main/services/ | grep -v spec | wc -l` → 0

---

### [BE-P1-003] Fix nowpay typo full-width character

**Tại sao:** Chữ `Ｃ` (U+FF23, full-width) trong method name gây TypeScript error.

```
FILE: apps/backend/src/main/controllers/nowpay.controller.ts
  Line 144: nowpayService.updateＣurrency(...)
  
  Tìm: updateＣurrency
  Đổi: updateCurrency
  
  Lưu ý: Chữ Ｃ là ký tự FULL-WIDTH (Unicode U+FF23), không phải C bình thường.
  Dùng sed hoặc tìm bằng copy-paste từ file.
```

**Verify:** `grep -n "updateCurrency\|updateＣurrency" apps/backend/src/main/controllers/nowpay.controller.ts`

---

### [BE-P1-004] Fix ObjectId model interfaces — 26 models

**Tại sao:** Model interfaces khai báo `userId: Schema.Types.ObjectId` nhưng business logic truyền `string`. TypeScript báo lỗi TS2345 cho ~35 chỗ.

**Lưu ý quan trọng:** Các models đã được audit thực tế (deposit.model.ts, withdraw.model.ts, transaction.model.ts, ticket.model.ts) đã có `Schema.Types.ObjectId | string` rồi. Chỉ fix những model CÒN THIẾU `| string`.

**Cách kiểm tra trước khi sửa:**
```bash
grep -rn "userId: Schema.Types.ObjectId;" apps/backend/src/main/models/ | grep -v "string"
```
→ Những dòng xuất hiện là cần thêm `| string`.

**Pattern sửa (áp dụng cho tất cả):**
```typescript
// TỪ:
userId: Schema.Types.ObjectId;
adminId: Schema.Types.ObjectId;
actorId: Schema.Types.ObjectId;
depositId: Schema.Types.ObjectId;
bonusId: Schema.Types.ObjectId;

// THÀNH:
userId: Schema.Types.ObjectId | string;
adminId: Schema.Types.ObjectId | string;
actorId: Schema.Types.ObjectId | string;
depositId: Schema.Types.ObjectId | string;
bonusId: Schema.Types.ObjectId | string;
```

**Files cần check (chạy grep trước, sửa những file grep tìm thấy):**
```
apps/backend/src/main/models/balance.model.ts
apps/backend/src/main/models/session.model.ts
apps/backend/src/main/models/kyc.model.ts
apps/backend/src/main/models/otp.model.ts
apps/backend/src/main/models/referral-code.model.ts
apps/backend/src/main/models/player-bonus.model.ts
apps/backend/src/main/models/preference.model.ts
apps/backend/src/main/models/vip-cashback.model.ts
apps/backend/src/main/models/vip-level-up-bonus.model.ts
apps/backend/src/main/models/nowpay-deposit-log.model.ts
apps/backend/src/main/models/gs-pay-deposit-log.model.ts
apps/backend/src/main/models/gs-pay-withdraw-log.model.ts
apps/backend/src/main/models/auth-log.model.ts
apps/backend/src/main/models/password-log.model.ts
apps/backend/src/main/models/ag-payin-log.model.ts
apps/backend/src/main/models/ag-payout-log.model.ts
apps/backend/src/main/models/affiliate-stats.model.ts
apps/backend/src/main/models/invest-log.model.ts
apps/backend/src/main/models/newsletter-subscriber.model.ts
apps/backend/src/main/models/nowpay-withdraw-log.model.ts
apps/backend/src/main/models/password-reset.model.ts
apps/backend/src/main/models/vip-spin-reward.model.ts
apps/backend/src/main/models/support-conversation.model.ts
apps/backend/src/main/models/vip-spin-prize.model.ts
apps/backend/src/main/models/vip-level-up-bonus.model.ts
apps/backend/src/main/models/vip-level.model.ts
```

**Verify:** `npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l` → ≤ 20

---

### [BE-P2-001] Tạo article.service.ts — Refactor article.controller.ts

**Tại sao:** `article.controller.ts` đang import `ArticleCategoryModel` và `ArticlePostModel` trực tiếp — vi phạm Controller-Service boundary. Không có service layer nào.

**Tạo mới:** `apps/backend/src/main/services/article.service.ts`

```typescript
// Cần implement các functions sau (đọc article.controller.ts để lấy đúng logic):
export async function listCategories(query)        // Find với filter
export async function createCategory(data)         // Create + slug
export async function patchCategory(id, data)      // FindByIdAndUpdate
export async function deleteCategory(id)           // FindByIdAndDelete + check posts
export async function listPosts(query)             // Find với filter + pagination
export async function getPostById(id)              // FindById, throw NOT_FOUND
export async function createPost(data, authorName) // Create
export async function patchPost(id, data)          // FindByIdAndUpdate, throw NOT_FOUND
export async function deletePost(id)               // FindByIdAndDelete
export async function listPostsPublic(query)       // Find status=published
export async function listCategoriesPublic()       // Find active categories
```

**Sửa article.controller.ts:**
- Xóa: `import ArticleCategoryModel from ...`
- Xóa: `import ArticlePostModel from ...`
- Thêm: `import * as articleService from '@main/services/article.service'`
- Thay toàn bộ Model queries bằng service calls

**Verify:**
```bash
grep -n "import.*Model" apps/backend/src/main/controllers/article.controller.ts
→ 0 kết quả
```

---

### [BE-P2-002] Tạo ticket.service.ts — Refactor ticket.controller.ts

**Tại sao:** `ticket.controller.ts` import `TicketModel` trực tiếp.

**Tạo mới:** `apps/backend/src/main/services/ticket.service.ts`

```typescript
export async function listTickets(query: { userId?: string; role?: string })
export async function createTicket(data: { userId: string; subject: string; message: string; username: string })
export async function getTicketById(id: string)
export async function replyTicket(id: string, reply: { adminId?: string; userId?: string; message: string; role: string })
export async function closeTicket(id: string)
```

**Sửa ticket.controller.ts:** Xóa TicketModel import, dùng ticketService.

---

### [BE-P2-003] Tạo package-category.service.ts — Refactor package.controller.ts

**Tại sao:** `package.controller.ts` import `PackageCategoryModel` trực tiếp.

**Thêm vào `apps/backend/src/main/services/package.service.ts`** (hoặc tạo riêng):
```typescript
export async function listCategories()
export async function createCategory(data)
```

**Sửa package.controller.ts:** Xóa `import PackageCategoryModel`, dùng service.

---

### [BE-P2-004] Refactor admin-store.controller.ts

**Tại sao:** Import `PackageModel` và `TransactionModel` trực tiếp — không có service layer.

**Đánh giá đặc biệt:** Controller này tương đối đơn giản (CRUD + aggregate), hãy:
1. Tạo `apps/backend/src/main/services/store-admin.service.ts`
2. Move aggregate queries và CRUD logic vào service
3. Controller chỉ call service + res.send

---

### [BE-P2-005] Refactor admin-agents.controller.ts

**Tại sao:** Import `UserModel` và `TransactionModel` trực tiếp — 260 lines phức tạp.

**Đánh giá:** Controller này dùng complex aggregate queries. Strategy:
1. Tạo `apps/backend/src/main/services/admin-agents.service.ts`
2. Move `listAgents`, `listCommissions`, `getAgentTree`, `postManualAdjustment` vào service
3. `UserModel.aggregate(...)` → thành `agentsService.getAgentStats(...)`

---

### [BE-P2-006] Refactor admin-vip.controller.ts

**Tại sao:** Import `UserModel`, `VipTiersModel` trực tiếp.

**Đánh giá:** Cần tạo `apps/backend/src/main/services/admin-vip.service.ts`:
```typescript
export async function getVipStats()
export async function listVipUsers(query)
export async function setUserVipLevel(targetUserId, vipLevel, actorId, actorUsername)
```

---

### [BE-P2-007] Refactor reagent-tree.controller.ts

**Tại sao:** Import `UserModel` trực tiếp. Đặc biệt có:
- `const { Types } = require("mongoose")` — dynamic require trong async function (BAD)
- `console.log(...)` — không dùng logger

**Sửa:**
1. Move aggregate query vào `reagent-tree.service.ts` (hoặc thêm vào `reagentEnrollmentService`)
2. Đổi `require("mongoose")` thành import đầu file
3. Xóa `console.log`, thay bằng logger nếu cần

---

### [BE-P2-008] Fix .env.example — xóa references cũ

**Tại sao:** `apps/frontend-web/.env.example` còn chứa `cuocbong99`:
```
VITE_APP_TITLE=Cuocbong99
VITE_SITE_NAME=cuocbong99.live
VITE_PUBLIC_SITE_URL=https://cuocbong99.live
VITE_SUPPORT_EMAIL=support@cuocbong99.live
VITE_PRIVACY_EMAIL=privacy@cuocbong99.live
VITE_TELEGRAM_SUPPORT_URL=https://t.me/cuocbong99_support
```

**Sửa:** Đổi tất cả sang `tc-gaming.live` trong `apps/frontend-web/.env.example`.

---

### [BE-P3-001] Loại bỏ 35 try/catch thủ công trong controllers

**Tại sao:** `catchAsync` đã xử lý exception → forward tới `errorHandler`. Try/catch bên trong catchAsync là REDUNDANT.

**Ưu tiên theo số lượng (nhiều nhất trước):**

```
TASK: nowpay.controller.ts — 3 nested try/catch TRONG catchAsync (lines 87, 126, 171)
  → Xóa try/catch wrapper, giữ nguyên code bên trong
  → LƯU Ý: các try/catch ở lines 290, 404, 531 (callback handlers, KHÔNG trong catchAsync)
    → PHẢI GIỮ LẠI — callback handlers không dùng catchAsync

TASK: plan.controller.ts — 7 try/catch (lines 77, 91, 115, 128, 155, 175, 199)
  → Đọc từng function: nếu trong catchAsync → xóa try/catch thủ công
  → Service đã throw ApiError đúng → errorHandler sẽ xử lý

TASK: package.controller.ts — 6 try/catch
  → Xóa toàn bộ (sau khi BE-P2-003 hoàn thành và service throw ApiError)

TASK: ag-pay.controller.ts — 4 try/catch
  → Lines 61, 125 (trong catchAsync) → xóa
  → Lines 227, 273 (callback handlers) → xem context, giữ nếu cần

TASK: media.controller.ts — 2 try/catch
  → Sau khi BE-P1-002 fix media.service → xóa try/catch trong controller

TASK: auth.controller.ts — 2 try/catch (lines 46, 80)
  → Đọc context: nếu trong catchAsync → xóa
```

---

## ═══════════════════════════════════
## ADMIN DASHBOARD TASKS
## ═══════════════════════════════════

---

### [AD-P1-001] Fix AdminLayout — 2 pages thiếu

**Tại sao:** `AdminDepositMethods.tsx` và `SiteContentFaqs.tsx` không dùng `AdminLayout` — vi phạm UI Standard.

```
FILE: apps/admin-dashboard/client/pages/admin/AdminDepositMethods.tsx
  Thêm: import AdminLayout from '@/components/layout/AdminLayout';
  Bọc toàn bộ return JSX trong: <AdminLayout>...</AdminLayout>
  (thay thế wrapper div hiện tại nếu có)

FILE: apps/admin-dashboard/client/pages/admin/SiteContentFaqs.tsx
  Tương tự — wrap với AdminLayout
```

**Verify:** `grep -L "AdminLayout" apps/admin-dashboard/client/pages/admin/*.tsx` → 0 results

---

### [AD-P1-002] Fix direct fetch() — 3 files

**Tại sao:** 8 `fetch()` calls bypass `lib/api.ts` layer — inconsistent, không có token injection.

```
FILE: apps/admin-dashboard/client/pages/admin/AdminDepositMethods.tsx

  THAY Line 36:
    fetch("/api/setting/business")
  BẰNG:
    getBusinessSettings(token())
    (import từ '../lib/api' hoặc đường dẫn đúng)
  
  THAY Line 49:
    fetch("/api/setting/business", { method: "PATCH", ... })
  BẰNG:
    patchBusinessSettings(token(), data)

FILE: apps/admin-dashboard/client/pages/admin/SiteContentFaqs.tsx

  THAY Line 55:
    fetch('/api/setting/site')
  BẰNG:
    Gọi getSiteSettings() — kiểm tra lib/api.ts xem có function này chưa
    Nếu chưa: thêm function vào lib/api.ts:
      export async function getSiteSettings(token: string) {
        return req('/setting/site', { method: 'GET', token });
      }
  
  THAY Line 97:
    fetch('/api/setting/business', { method: 'PATCH', ... })
  BẰNG:
    patchBusinessSettings(token(), data)

FILE: apps/admin-dashboard/client/pages/admin/Promotions.tsx

  THAY Lines 69, 108, 119, 148:
    fetch(`${BASE}/bonus/list`, {...})
    fetch(`${BASE}/bonus/${row._id}`, {method: "PATCH", ...})
    fetch(`${BASE}/bonus/${id}`, {method: "DELETE", ...})
    fetch(`${BASE}/bonus`, {method: "POST", ...})
  BẰNG:
    getAdminBonuses(token())
    updateBonusApi(token(), id, data)
    deleteBonusApi(token(), id)
    createBonusApi(token(), data)
    (kiểm tra lib/api.ts — các functions này đã tồn tại)
```

**Verify:** `grep -rn "fetch(" apps/admin-dashboard/client/pages/admin/ --include="*.tsx" | grep -v "//\|import\|prefetch\|refetch\|useFetch"` → 0 results

---

### [AD-P1-003] Fix hex colors — VipTiersManager.tsx

**Tại sao:** 11 hardcoded hex values vi phạm UI Standard.

```
FILE: apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx

  Lines 30-31: const COLOR_PRESETS = ["#d97706", "#10b981", "#3b82f6", ...]
  → Đổi thành CSS variables hoặc Tailwind color names:
    "#d97706" → "amber-600"    (hoặc var(--vip-bronze))
    "#10b981" → "emerald-500"
    "#3b82f6" → "blue-500"
    "#f43f5e" → "rose-500"
    "#7c3aed" → "violet-600"
    "#ec4899" → "pink-500"
    "#a855f7" → "purple-500"
    "#dc2626" → "red-600"
    "#f59e0b" → "amber-400"
    "#ef4444" → "red-500"
  
  Line 369: colorCode || "#888888"
  → colorCode || "gray-400"  (Tailwind) hoặc colorCode || "var(--text-muted)"
```

---

### [AD-P2-001] Migrate VIP.tsx sang TanStack Query pattern

**Tại sao:** 3 manual state management functions (`loadTiers`, `loadLevels`, `loadSpinPrizes`) với useState + try/catch — không có caching, deduplication.

**Pattern chuẩn (xem Dashboard.tsx):**
```typescript
// TRƯỚC (manual):
const [tiers, setTiers] = useState([]);
const [loading, setLoading] = useState(false);
async function loadTiers() {
  setLoading(true);
  try {
    const res = await getVipTiersList(token());
    setTiers(res || []);
  } catch { toast({...}) }
  finally { setLoading(false); }
}

// SAU (TanStack Query):
const { data: tiers = [], isLoading, isError } = useQuery({
  queryKey: ['vip-tiers', token()],
  queryFn: () => getVipTiersList(token()!),
  enabled: Boolean(token()),
  staleTime: 30_000,
});
```

**Cho mutations (create/update/delete):**
```typescript
const mutation = useMutation({
  mutationFn: (data) => createVipTiersApi(token()!, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['vip-tiers'] });
    toast({ title: 'Thành công' });
  },
  onError: (e: Error) => toast({ variant: 'destructive', title: 'Lỗi', description: e.message }),
});
```

---

### [AD-P2-002] Migrate Roles.tsx sang TanStack Query

**Tại sao:** 4 manual functions (`load`, `handleSave`, `handleCreate`, `handleDelete`).

Áp dụng pattern tương tự AD-P2-001.

---

### [AD-P2-003] Migrate CommissionLogs.tsx sang TanStack Query

**Tại sao:** Manual `reload` function với loading state thủ công.

---

### [AD-P2-004] Migrate VipTiersManager.tsx sang TanStack Query

**Tại sao:** Manual `load` và `onSave` functions.

---

### [AD-P2-005] Migrate AdminDepositMethods.tsx sang TanStack Query

**Sau khi hoàn thành AD-P1-002** (fix fetch), migrate sang useQuery/useMutation.

---

### [AD-P3-001] Chuẩn hóa i18n Admin Dashboard

**Tại sao:** 60+ hardcoded strings (tiếng Việt và tiếng Anh) trong 20+ pages không qua i18n system.

**Phạm vi:** Tất cả strings trong `toast({ title: '...' })`, label, placeholder, heading.

**Cách làm:**
1. Tạo `apps/admin-dashboard/client/i18n/vi.json` với 20+ keys:
```json
{
  "common": {
    "loading": "Đang tải...",
    "error": "Lỗi",
    "success": "Thành công",
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "create": "Tạo mới",
    "search": "Tìm kiếm",
    "noData": "Không có dữ liệu"
  },
  "errors": {
    "loadFailed": "Tải dữ liệu thất bại",
    "saveFailed": "Lưu thất bại",
    "createFailed": "Tạo thất bại",
    "deleteFailed": "Xóa thất bại"
  }
}
```
2. Tạo hook `useAdminTranslation()` đơn giản hoặc dùng `react-i18next`
3. Replace hardcoded strings trong 5 pages ưu tiên: VIP, Roles, CommissionLogs, Dashboard, VipTiersManager

---

## ═══════════════════════════════════
## FRONTEND-WEB TASKS
## ═══════════════════════════════════

---

### [FE-P1-001] Fix en.json — Toàn bộ nội dung đang là tiếng Việt

**Tại sao:** `apps/frontend-web/src/i18n/locales/en.json` có 573 dòng nhưng tất cả values là tiếng Việt. Tính năng đổi sang English HOÀN TOÀN KHÔNG HOẠT ĐỘNG.

**Cách làm:**
1. Đọc `vi.json` để lấy cấu trúc key
2. Tạo lại `en.json` với cùng key structure, values là tiếng Anh
3. Namespace lớn nhất cần dịch: `about`, `account`, `affiliate`, `agency`, `auth`, `common`, `deposit`, `nav`, `vip`, `wallet`

**Quy tắc dịch:**
- Giữ nguyên tất cả keys (không đổi tên key)
- Giữ nguyên placeholders: `{{name}}`, `{count}`, `{{amount}}`
- Placeholder stubs (Buildcasinotext, Createcode, v.v.) → để là empty string hoặc English equivalent
- Xóa key `"vi-VN": "Vi-vn"` — không có nghĩa

**Verify:** `grep -c "[àáâãèéêìíòóôõùúýăđ]" apps/frontend-web/src/i18n/locales/en.json` → 0

---

### [FE-P1-002] Fix App.tsx — Xóa hardcoded tiếng Việt

**Tại sao:** `App.tsx` có hardcoded Vietnamese strings trong JSX (không qua `t()`):
```typescript
// Line ~87: "Trải nghiệm đa dạng trò chơi..."
// Line ~96: "Khuyến Mãi", "VIP Club", "Đại Lý", v.v.
// Line ~97-100: inline navigation link text tiếng Việt
```

**Sửa:** Dùng `const { t } = useLanguage()` và replace bằng `t('nav.xxx', 'fallback')`.

---

### [FE-P3-001] Token storage — cân nhắc HttpOnly cookie

**Tại sao:** `localStorage.setItem('token', ...)` dễ bị XSS attack đọc token.

**Đánh giá:** Đây là architectural decision. Hiện tại:
- Frontend token: `localStorage.getItem('token')` (XSS risk)
- Admin token: `localStorage.getItem('adminAccessToken')` (XSS risk)

**Khuyến nghị:** Evaluate migration sang `HttpOnly` cookie với `SameSite=Strict`.
**Không làm vội** — cần coordinate với backend auth flow (set-cookie endpoint).

---

## ═══════════════════════════════════
## VERIFICATION COMMANDS
## ═══════════════════════════════════

Sau khi hoàn thành tất cả P1 tasks, chạy:

```bash
# 1. TypeScript clean
npm run typecheck -w apps/backend
npm run typecheck -w apps/admin-dashboard
npm run typecheck -w apps/frontend-web

# 2. Tests pass
npm run test -w apps/backend

# 3. Architecture violations = 0
grep -rn "import.*Model" apps/backend/src/main/controllers/ --include="*.ts" | wc -l
→ 0

grep -rn "throw new Error(" apps/backend/src/main/services/ --include="*.ts" | grep -v spec | wc -l
→ 0

grep -rn "fetch(" apps/admin-dashboard/client/pages/admin/ --include="*.tsx" | grep -v "//\|import\|prefetch\|refetch" | wc -l
→ 0

grep -rn "#[0-9a-fA-F]\{6\}" apps/admin-dashboard/client/pages/admin/ --include="*.tsx" | wc -l
→ 0

# 4. i18n English check
grep -c "[àáâãèéêìíòóôõùúýăđ]" apps/frontend-web/src/i18n/locales/en.json
→ 0
```

---

## THỨ TỰ THỰC HIỆN ĐỀ XUẤT

```
ĐỢT 1 — Chạy SONG SONG (không phụ thuộc nhau):
  BE-P1-001 (req.user fix) 
  BE-P1-002 (services ApiError)
  BE-P1-003 (nowpay typo)
  BE-P1-004 (ObjectId models)
  AD-P1-001 (AdminLayout)
  AD-P1-002 (fetch → api.ts)
  AD-P1-003 (hex colors)
  FE-P1-001 (en.json fix)
  BE-P2-008 (.env.example)

ĐỢT 2 — Sau khi ĐỢT 1 xong, TypeScript phải về 0:
  BE-P2-001 (article.service)
  BE-P2-002 (ticket.service)
  BE-P2-003 (package-category)
  BE-P2-004 (admin-store)
  BE-P2-005 (admin-agents)
  BE-P2-006 (admin-vip)
  BE-P2-007 (reagent-tree)

ĐỢT 3 — Sau khi ĐỢT 2 xong:
  BE-P3-001 (remove try/catch)
  AD-P2-001 đến AD-P2-005 (TanStack Query migration)
  AD-P3-001 (admin i18n)
  FE-P1-002 (App.tsx)
```
