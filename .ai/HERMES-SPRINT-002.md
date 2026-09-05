# HERMES-SPRINT-002.md — Lệnh Thực Thi Đợt 2

_BOB — Lead Architect | Dựa trên audit thực tế | 2026-09-04_
_Đọc file này đầy đủ trước khi bắt đầu_

---

## TRẠNG THÁI HIỆN TẠI (Evidence từ code thực tế)

### ✅ ĐÃ HOÀN THÀNH
- TASK-001: role.controller.ts + role.service.ts — CLEAN
- TASK-002: admin-staff.controller.ts + admin-staff.service.ts — CLEAN
- deposit.service.ts: 6 methods đầy đủ (createDeposit, getPendingDeposit, getDepositById, listDeposits, getPlayerDeposit, patchUpdate)
- notification.service.ts: typo createNotification đã fix
- JWT_SECRET: fail-fast production mode
- nowpay typo (updateCurrency): ĐÃ ĐÚNG — không cần fix
- en.json (frontend-web): ĐÃ CLEAN — 0 Vietnamese characters ✅

### ❌ CÒN TỒN TẠI

**Backend:**
- 35 try/catch thủ công trong 8 controllers
- 11 controllers import Model trực tiếp
- 15 instances throw generic Error trong 7 services
- 3 services chưa có: article.service.ts, ticket.service.ts, store-admin.service.ts
- BE: TypeScript errors chưa đếm được

**Admin Dashboard:**
- 14 pages thiếu AdminLayout (phát hiện MỚI — nhiều hơn báo cáo trước)
- 8 fetch() calls trực tiếp bypass api.ts (3 files)
- 11 hex colors hardcoded (VipTiersManager.tsx)
- 60+ hardcoded strings không qua i18n
- Chỉ 2/82 pages dùng TanStack Query

**Frontend-web:**
- App.tsx: 6 hardcoded Vietnamese strings
- .env.example: 8 references còn cuocbong99

---

## ĐỢT 2A — FIX NGAY (Chạy song song, không phụ thuộc nhau)

---

### [TASK-A1] Fix .env.example cuocbong99 — Frontend-web

```
[OPENHANDS — TASK-A1]

FILE: /var/app/game/apps/frontend-web/.env.example

Tìm và thay tất cả occurrences:
  cuocbong99.live → tc-gaming.live
  cuocbong99_support → tcgaming_support
  Cuocbong99 → TC Gaming
  cuocbong99 → tc-gaming

Cụ thể từng dòng:
  VITE_APP_TITLE=Cuocbong99         → VITE_APP_TITLE=TC Gaming
  VITE_SITE_NAME=cuocbong99.live    → VITE_SITE_NAME=tc-gaming.live
  VITE_PUBLIC_SITE_URL=https://cuocbong99.live → VITE_PUBLIC_SITE_URL=https://tc-gaming.live
  VITE_SUPPORT_EMAIL=support@cuocbong99.live   → VITE_SUPPORT_EMAIL=support@tc-gaming.live
  VITE_PRIVACY_EMAIL=privacy@cuocbong99.live   → VITE_PRIVACY_EMAIL=privacy@tc-gaming.live
  VITE_TELEGRAM_SUPPORT_URL=https://t.me/cuocbong99_support → VITE_TELEGRAM_SUPPORT_URL=https://t.me/tcgaming_support
  (các comments cũng sửa)

VERIFY: grep -c "cuocbong99" /var/app/game/apps/frontend-web/.env.example → 0
```

---

### [TASK-A2] Fix 14 Admin pages thiếu AdminLayout

**LÝ DO:** Audit thực tế phát hiện 14 pages không có AdminLayout — vi phạm UI Standard.

```
[OPENHANDS — TASK-A2]

DANH SÁCH 14 FILES cần thêm AdminLayout:
1.  apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx
2.  apps/admin-dashboard/client/pages/admin/ArticleCategories.tsx
3.  apps/admin-dashboard/client/pages/admin/VIPHub.tsx
4.  apps/admin-dashboard/client/pages/admin/TelegramTemplates.tsx
5.  apps/admin-dashboard/client/pages/admin/SystemUpdates.tsx
6.  apps/admin-dashboard/client/pages/admin/GameMenuManager.tsx
7.  apps/admin-dashboard/client/pages/admin/CommissionLogs.tsx
8.  apps/admin-dashboard/client/pages/admin/Roles.tsx
9.  apps/admin-dashboard/client/pages/admin/MarketingPromotions.tsx
10. apps/admin-dashboard/client/pages/admin/Notifications.tsx
11. apps/admin-dashboard/client/pages/admin/VIP.tsx
12. apps/admin-dashboard/client/pages/admin/VIPLevels.tsx
13. apps/admin-dashboard/client/pages/admin/AffiliateImpersonation.tsx
14. apps/admin-dashboard/client/pages/admin/AdminDepositMethods.tsx

CÁCH SỬA cho mỗi file:
1. Thêm import (nếu chưa có):
   import AdminLayout from "@/components/layout/AdminLayout";

2. Tìm return statement, bọc toàn bộ JSX content trong AdminLayout:
   return (
     <AdminLayout>
       {/* nội dung hiện tại */}
     </AdminLayout>
   );

LƯU Ý:
- Không xóa các wrapper div hiện có nếu chúng có padding/margin quan trọng
- Nếu page đã có RequireSuperAdmin: giữ nguyên, AdminLayout nằm BÊN TRONG RequireSuperAdmin
  <RequireSuperAdmin>
    <AdminLayout>
      {content}
    </AdminLayout>
  </RequireSuperAdmin>
- Đọc từng file trước khi sửa để hiểu cấu trúc

VERIFY: grep -rL "AdminLayout" apps/admin-dashboard/client/pages/admin/*.tsx → 0 results
```

---

### [TASK-A3] Fix 8 direct fetch() calls — 3 files

**LÝ DO:** AdminDepositMethods.tsx, SiteContentFaqs.tsx, Promotions.tsx bypass api.ts layer.

```
[OPENHANDS — TASK-A3]

BƯỚC 1: Kiểm tra lib/api.ts có các functions sau không:
  cat /var/app/game/apps/admin-dashboard/client/lib/api.ts | grep -n "getBusinessSettings\|patchBusinessSettings\|getSiteSettings\|getAdminBonuses\|createBonusApi\|updateBonusApi\|deleteBonusApi"

--- FILE 1: AdminDepositMethods.tsx ---

Thêm import đầu file (nếu chưa có):
  import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
  import { getAdminToken } from "@/lib/adminAuth";

THAY fetchMethods function:
  TỪ:
    const res = await fetch("/api/setting/business");
    const data = await res.json();
  THÀNH:
    const data = await getBusinessSettings(getAdminToken() || "");

THAY handleSave function:
  TỪ:
    const res = await fetch("/api/setting/business", { method: "PATCH", headers: {...}, body: JSON.stringify({...}) });
    if (!res.ok) throw new Error("Failed to save");
  THÀNH:
    await patchBusinessSettings({ vietnamDepositMethods: methods }, getAdminToken() || "");

--- FILE 2: SiteContentFaqs.tsx ---

Kiểm tra getSiteSettings trong api.ts. Nếu KHÔNG có:
  Thêm vào cuối lib/api.ts (trước export cuối):
  
  export async function getSiteSettings(token?: string) {
    return req('/setting/site', { method: 'GET', token });
  }

Thêm import vào SiteContentFaqs.tsx:
  import { getSiteSettings, patchBusinessSettings } from "@/lib/api";

THAY load function:
  TỪ: fetch('/api/setting/site')
  THÀNH: getSiteSettings(getAdminToken() || "")

THAY save function:
  TỪ: fetch('/api/setting/business', { method: 'PATCH', ... })
  THÀNH: patchBusinessSettings(data, getAdminToken() || "")

--- FILE 3: Promotions.tsx ---

Kiểm tra trong lib/api.ts: getAdminBonuses, createBonusApi, updateBonusApi, deleteBonusApi
Nếu chưa có, thêm vào lib/api.ts:

  export async function getAdminBonuses(token?: string) {
    return req('/bonus/list', { method: 'GET', token });
  }
  export async function createBonusApi(token: string, data: any) {
    return req('/bonus', { method: 'POST', body: JSON.stringify(data), token });
  }
  export async function updateBonusApi(token: string, id: string, data: any) {
    return req(`/bonus/${id}`, { method: 'PATCH', body: JSON.stringify(data), token });
  }
  export async function deleteBonusApi(token: string, id: string) {
    return req(`/bonus/${id}`, { method: 'DELETE', token });
  }

Thay 4 fetch calls trong Promotions.tsx:
  fetch(`${BASE}/bonus/list`, {...})    → getAdminBonuses(token())
  fetch(`${BASE}/bonus/${row._id}`, {method:"PATCH",...}) → updateBonusApi(token(), row._id, data)
  fetch(`${BASE}/bonus/${id}`, {method:"DELETE",...})     → deleteBonusApi(token(), id)
  fetch(`${BASE}/bonus`, {method:"POST",...})             → createBonusApi(token(), data)

XÓABIẾN BASE (không cần nữa): const BASE = ...

VERIFY: grep -rn "fetch(" apps/admin-dashboard/client/pages/admin/ --include="*.tsx" | grep -v "//\|import\|prefetch\|refetch" → 0
```

---

### [TASK-A4] Fix 11 hex colors — VipTiersManager.tsx

```
[OPENHANDS — TASK-A4]

FILE: /var/app/game/apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx

Lines 30-31: COLOR_PRESETS array
TỪ:
  const COLOR_PRESETS = [
    "#d97706", "#10b981", "#3b82f6", "#f43f5e", "#7c3aed",
    "#ec4899", "#a855f7", "#dc2626", "#f59e0b", "#ef4444",
  ];

THÀNH (dùng Tailwind color tokens trong CSS custom properties):
  const COLOR_PRESETS = [
    "var(--color-amber-600)",
    "var(--color-emerald-500)",
    "var(--color-blue-500)",
    "var(--color-rose-500)",
    "var(--color-violet-600)",
    "var(--color-pink-500)",
    "var(--color-purple-500)",
    "var(--color-red-600)",
    "var(--color-amber-400)",
    "var(--color-red-500)",
  ];

HOẶC (nếu CSS vars chưa được định nghĩa, dùng Tailwind class equivalents):
  const COLOR_PRESETS = [
    "#d97706",  // amber-600 — giữ hex nhưng document rõ ràng
    ...
  ];

Line 369: value={t.colorCode || "#888888"}
THÀNH: value={t.colorCode || "var(--muted-foreground)"}

VERIFY: grep -n "#[0-9a-fA-F]\{6\}" apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx → 0 (hoặc chỉ còn trong COLOR_PRESETS được document)
```

---

## ĐỢT 2B — BACKEND SERVICES (Sau khi 2A xong)

---

### [TASK-B1] Tạo article.service.ts + Refactor article.controller.ts

```
[OPENHANDS — TASK-B1]

BƯỚC 1: Đọc file hiện tại để lấy logic
  cat /var/app/game/apps/backend/src/main/controllers/article.controller.ts

BƯỚC 2: Tạo /var/app/game/apps/backend/src/main/services/article.service.ts

Nội dung service (copy logic từ controller, thêm ApiError):

import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import ArticleCategoryModel from '@main/models/article-category.model';
import ArticlePostModel from '@main/models/article-post.model';

export async function listCategories(query: { page?: number; limit?: number }) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const [items, total] = await Promise.all([
    ArticleCategoryModel.find().sort({ order: 1 }).skip((page-1)*limit).limit(limit).lean(),
    ArticleCategoryModel.countDocuments()
  ]);
  return { items, total, page, limit };
}

export async function createCategory(data: { name: string; slug?: string; status?: string }) {
  return ArticleCategoryModel.create(data);
}

export async function patchCategory(id: string, data: any) {
  const updated = await ArticleCategoryModel.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  return updated;
}

export async function deleteCategory(id: string) {
  const postsCount = await ArticlePostModel.countDocuments({ categoryId: id });
  if (postsCount > 0) throw new ApiError(httpStatus.CONFLICT, `Category has ${postsCount} posts`);
  await ArticleCategoryModel.findByIdAndDelete(id);
  return { ok: true };
}

export async function listPosts(query: { categoryId?: string; status?: string; page?: number; limit?: number }) {
  const { categoryId, status, page = 1, limit = 20 } = query;
  const filter: any = {};
  if (categoryId) filter.categoryId = categoryId;
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    ArticlePostModel.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
    ArticlePostModel.countDocuments(filter)
  ]);
  return { items, total, page, limit };
}

export async function getPostById(id: string) {
  const post = await ArticlePostModel.findById(id).lean();
  if (!post) throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  return post;
}

export async function createPost(data: any, authorName: string) {
  return ArticlePostModel.create({ ...data, authorName });
}

export async function patchPost(id: string, data: any) {
  const updated = await ArticlePostModel.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  return updated;
}

export async function deletePost(id: string) {
  await ArticlePostModel.findByIdAndDelete(id);
  return { ok: true };
}

export async function listPostsPublic(query: { categoryId?: string; page?: number; limit?: number }) {
  return listPosts({ ...query, status: 'published' });
}

export async function listCategoriesPublic() {
  return ArticleCategoryModel.find({ status: 'active' }).sort({ order: 1 }).lean();
}

BƯỚC 3: Sửa article.controller.ts
  - Xóa: import ArticleCategoryModel from '@main/models/article-category.model'
  - Xóa: import ArticlePostModel from '@main/models/article-post.model'
  - Thêm: import * as articleService from '@main/services/article.service'
  - Thay toàn bộ Model queries bằng service calls
  - Giữ catchAsync wrapper cho mỗi function
  - Không có try/catch thủ công

VERIFY:
  grep -n "import.*Model" apps/backend/src/main/controllers/article.controller.ts → 0
  npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
```

---

### [TASK-B2] Tạo ticket.service.ts + Refactor ticket.controller.ts

```
[OPENHANDS — TASK-B2]

BƯỚC 1: Đọc ticket.controller.ts để lấy logic
  cat /var/app/game/apps/backend/src/main/controllers/ticket.controller.ts

BƯỚC 2: Tạo /var/app/game/apps/backend/src/main/services/ticket.service.ts

import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import TicketModel from '@main/models/ticket.model';
import telegramService from '@main/services/telegram.service';

export async function listTickets(query: { userId?: string; role?: string }) {
  const filter: any = {};
  if (query.role !== 'admin') filter.userId = query.userId;
  return TicketModel.find(filter).sort({ createdAt: -1 }).lean();
}

export async function createTicket(data: {
  userId: string; subject: string; message: string; username: string;
}) {
  const ticket = await TicketModel.create({
    userId: data.userId,
    subject: data.subject,
    message: data.message,
    status: 'open',
    priority: 'medium'
  });
  telegramService.notifyNewTicket(data.username, data.subject).catch(() => undefined);
  return ticket;
}

export async function getTicketById(id: string) {
  const ticket = await TicketModel.findById(id);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  return ticket;
}

export async function replyTicket(id: string, reply: {
  adminId?: string; userId?: string; message: string; role: string;
}) {
  const ticket = await TicketModel.findById(id);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  const replyData: any = { message: reply.message, createdAt: new Date() };
  if (reply.role === 'admin') {
    replyData.adminId = reply.adminId;
    ticket.status = 'answered';
  } else {
    replyData.userId = reply.userId;
    ticket.status = 'replied';
  }
  ticket.replies = ticket.replies || [];
  ticket.replies.push(replyData);
  await ticket.save();
  return ticket;
}

export async function closeTicket(id: string) {
  const ticket = await TicketModel.findByIdAndUpdate(id, { status: 'closed' }, { new: true });
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  return ticket;
}

BƯỚC 3: Sửa ticket.controller.ts
  - Xóa: import TicketModel
  - Xóa: import telegramService (moved to service)
  - Thêm: import * as ticketService from '@main/services/ticket.service'
  - Đổi req.user.xxx → req.user!.xxx (auth middleware đã protect routes)

VERIFY:
  grep -n "import.*Model\|import.*telegramService" apps/backend/src/main/controllers/ticket.controller.ts → 0
```

---

### [TASK-B3] Fix 15 services throw generic Error → ApiError

```
[OPENHANDS — TASK-B3]

Sửa TỪNG FILE sau (thêm import ApiError nếu chưa có):

FILE 1: /var/app/game/apps/backend/src/main/services/media.service.ts
  Thêm: import ApiError from '@utils/ApiError'; import httpStatus from 'http-status';
  throw new Error('Folder name không hợp lệ')  → throw new ApiError(httpStatus.BAD_REQUEST, 'Folder name không hợp lệ')
  throw new Error('Folder đã tồn tại')          → throw new ApiError(httpStatus.CONFLICT, 'Folder đã tồn tại')
  throw new Error('Folder not found')            → throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found')
  throw new Error(`Folder còn ${inUse} tệp...`) → throw new ApiError(httpStatus.CONFLICT, `Folder còn ${inUse} tệp, không thể xóa`)
  throw new Error('Asset not found')             → throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found')
  throw new Error('Target folder not found')     → throw new ApiError(httpStatus.NOT_FOUND, 'Target folder not found')

FILE 2: /var/app/game/apps/backend/src/main/services/affiliate-stats.service.ts
  throw new Error('No commission to claim') → throw new ApiError(httpStatus.BAD_REQUEST, 'No commission to claim')
  throw new Error('User not found')          → throw new ApiError(httpStatus.NOT_FOUND, 'User not found')

FILE 3: /var/app/game/apps/backend/src/main/services/game-config.service.ts
  throw new Error('name required')  → throw new ApiError(httpStatus.BAD_REQUEST, 'Name is required')
  throw new Error('Game not found') → throw new ApiError(httpStatus.NOT_FOUND, 'Game not found')

FILE 4: /var/app/game/apps/backend/src/main/services/gsc-environment.service.ts
  throw new Error('GSC environment not found: ${envId}') → throw new ApiError(httpStatus.NOT_FOUND, `GSC environment not found: ${envId}`)

FILE 5: /var/app/game/apps/backend/src/main/services/support-chat.service.ts
  throw new Error('CONVERSATION_NOT_FOUND') → throw new ApiError(httpStatus.NOT_FOUND, 'Conversation not found')

FILE 6: /var/app/game/apps/backend/src/main/services/gsc-catalog-sync.service.ts
  throw new Error('GSC_ENV_NOT_FOUND') → throw new ApiError(httpStatus.NOT_FOUND, 'GSC environment not found')

FILE 7: /var/app/game/apps/backend/src/main/services/email.service.ts
  throw new Error('Email service disabled')             → throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Email service disabled')
  throw new Error('Cannot create SMTP transporter...') → throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'SMTP transporter error')

VERIFY: grep -rn "throw new Error(" /var/app/game/apps/backend/src/main/services/ | grep -v spec | wc -l → 0
```

---

### [TASK-B4] Fix req.user! — 8 controllers

```
[OPENHANDS — TASK-B4]

PATTERN: Routes có auth middleware → req.user luôn tồn tại → dùng req.user!

Đọc từng file, tìm req.user.xxx (không có ? và không có !) → thêm !

FILE: apps/backend/src/main/controllers/plan.controller.ts
  String(req.user._id)      → String(req.user!._id)
  (req.user.username)       → (req.user!.username)

FILE: apps/backend/src/main/controllers/ticket.controller.ts
  req.user.role  → req.user!.role
  req.user._id   → req.user!._id
  req.user.username → req.user!.username

FILE: apps/backend/src/main/controllers/gs-pay.controller.ts
  req.user._id        → req.user!._id
  req.user.currency   → req.user!.currency
  req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/reward.controller.ts
  req.user._id      → req.user!._id
  req.user.currency → req.user!.currency

FILE: apps/backend/src/main/controllers/nowpay.controller.ts
  req.user._id        → req.user!._id (line 172)
  req.user.currencyId → req.user!.currencyId (line 173)

FILE: apps/backend/src/main/controllers/preference.controller.ts
  req.user._id        → req.user!._id
  req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/ag-pay.controller.ts
  req.user._id        → req.user!._id
  req.user.currencyId → req.user!.currencyId

FILE: apps/backend/src/main/controllers/user-affiliate.controller.ts
  req.user._id → req.user!._id

LƯU Ý:
- KHÔNG đổi req.user?.xxx (đã safe với optional chaining)
- KHÔNG đổi nếu đã có if (!req.user) guard phía trước

VERIFY: npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
```

---

### [TASK-B5] Fix ObjectId model interfaces

```
[OPENHANDS — TASK-B5]

BƯỚC 1: Kiểm tra thực tế files nào CÒN thiếu `| string`:
  grep -rn "userId: Schema.Types.ObjectId;" /var/app/game/apps/backend/src/main/models/ --include="*.ts" | grep -v "string"

BƯỚC 2: Với TỪNG dòng xuất hiện, thêm `| string`:
  userId: Schema.Types.ObjectId;  → userId: Schema.Types.ObjectId | string;

Làm tương tự với: adminId, actorId, depositId, withdrawId, bonusId, planId, affiliateId

BƯỚC 3: Verify tổng số TypeScript errors:
  cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
  → Mục tiêu: ≤ 20 (từ 82 xuống)

BƯỚC 4: Với errors còn lại, báo cáo danh sách và sửa từng cái.
```

---

## ĐỢT 2C — TYPECHECK FINAL (Sau B1-B5)

```
[OPENHANDS — FINAL TYPECHECK]

Chạy đầy đủ và báo cáo:

1. cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | head -30
2. cd /var/app/game && npm run typecheck -w apps/admin-dashboard 2>&1 | tail -5
3. cd /var/app/game && npm run typecheck -w apps/frontend-web 2>&1 | tail -5
4. cd /var/app/game && npm run test -w apps/backend 2>&1 | tail -10

Mục tiêu cuối:
  Backend: 0 errors
  Admin: 0 errors
  Frontend: 0 errors
  Tests: all pass

Báo cáo: "SPRINT-002 DONE. TypeScript: BE=[X] AD=[Y] FE=[Z]. Tests: [pass/fail]"
```

---

## SCORECARD MỤC TIÊU SAU SPRINT-002

| Metric | Trước | Mục tiêu |
|---|---|---|
| TS errors backend | ~82 | 0 |
| Controllers import Model | 11 | 9 (sau article + ticket) |
| Services throw generic Error | 15 | 0 |
| try/catch thủ công | 35 | 35 (chưa tackle) |
| Pages thiếu AdminLayout | 14 | 0 |
| Direct fetch() bypass | 8 | 0 |
| Hex colors admin | 11 | 0 |
| cuocbong99 references | 8 | 0 |
| en.json clean | ✅ | ✅ |
