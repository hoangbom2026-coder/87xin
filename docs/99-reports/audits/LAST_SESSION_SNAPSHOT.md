# LAST SESSION SNAPSHOT
_Thời gian: 2026-09-05 ~02:40 UTC_
_Agent: Hermes | Operator: BOB_

---

## TRẠNG THÁI TỔNG QUAN

| Chỉ số | Baseline (đầu phiên) | Hiện tại | Mục tiêu |
|---|---|---|---|
| **TS errors backend** | 41 | **0** | 0 |
| `throw new Error` services | 15 | **0** (hoàn thành) | 0 |
| Nowpay full-width typo | 1 | **0** (hoàn thành) | 0 |
| `req.user` thiếu `!` (BE-P1-001) | ~25 | **0** (hoàn thành 22 controllers) | 0 |
| Model imports controllers | 15 | **2** (chỉ còn `article.controller.ts`) | 0 |
| `fetch()` trực tiếp admin | 8 | **8** (chưa fix) | 0 |
| AdminLayout thiếu | 2 | **2** (chưa fix) | 0 |
| Hex colors admin | 11 | **11** (chưa fix) | 0 |
| en.json tiếng Việt | 573 dòng | **0** (đã xóa toàn bộ tiếng Việt) | 0 |

---

## BRANCH HIỆN TẠI

- **main** (working tree — chưa commit, 480+ files changed / untracked)
- Không có branch phụ active.

---

## TASKS ĐỢT 1 — TRẠNG THÁI CHI TIẾT

### HOÀN THÀNH

| Task | Mô tả | Trạng thái | Files / Ghi chú |
|---|---|---|---|
| **BE-P1-001** | Standardize `req.user` → `req.user!` | **HOÀN THÀNH** | Sửa tự động 22 controllers (`player`, `user-affiliate`, `ag-pay`, `verify`, `media`, `reward`, `agency`, `admin-affiliate`, `admin-vip`, `admin-game-menu`, `gs-pay`, `reagent-program`, `ticket`, `preference`, `user`, `nowpay`, `invest-log`, `admin-churn`, `referral-code`, `store`, `reagent-tree`, `plan`) |
| **BE-P1-002** | `throw new Error` → `ApiError` trong 7 services | **HOÀN THÀNH** | `affiliate-stats`, `email`, `game-config`, `gsc-catalog-sync`, `gsc-environment`, `support-chat`, `media` .service.ts |
| **BE-P1-003** | Nowpay full-width `Ｃ` → `C` | **HOÀN THÀNH** | `nowpay.controller.ts` |
| **BE-P1-004** | ObjectId `\| string` cho ~26 model interfaces | **HOÀN THÀNH** | 26 model files |
| **FE-P1-001** | en.json — xóa tiếng Việt | **HOÀN THÀNH** | `libs/i18n/locales/en.json` |

### CHƯA HOÀN THÀNH / PENDING (Chuyển sang phiên tới)

| Task | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|
| **AD-P1-001** | Wrap AdminDepositMethods + SiteContentFaqs với AdminLayout | Chưa làm | 2 files trong admin-dashboard |
| **AD-P1-002** | `fetch()` → `lib/api.ts` (3 files, 8 calls) | Chưa làm | Promotions (4), SiteContentFaqs (2), AdminDepositMethods (2) |
| **AD-P1-003** | Hex colors VipTiersManager → Tailwind names | Chưa làm | VipTiersManager.tsx (11 hex colors) |
| **BE-P2-008** | .env.example cuocbong99 → tc-gaming.live | N/A | File .env.example không tồn tại |
| **Refactor Controller→Service** | Chuyển Model queries từ controller sang service | Một phần | Đã refactor 13/15 controllers. Còn **`article.controller.ts`** (2 imports: ArticleCategoryModel, ArticlePostModel) |

---

## TOÀN BỘ FILES VỪA SỬA / TẠO MỚI (LATEST DIFF SNAPSHOT)

### Backend Controllers (22 files updated with `req.user!`):
- `apps/backend/src/main/controllers/user-affiliate.controller.ts`
- `apps/backend/src/main/controllers/player.controller.ts`
- `apps/backend/src/main/controllers/ag-pay.controller.ts`
- `apps/backend/src/main/controllers/verify.controller.ts`
- `apps/backend/src/main/controllers/media.controller.ts`
- `apps/backend/src/main/controllers/reward.controller.ts`
- `apps/backend/src/main/controllers/agency.controller.ts`
- `apps/backend/src/main/controllers/admin-affiliate.controller.ts`
- `apps/backend/src/main/controllers/admin-vip.controller.ts`
- `apps/backend/src/main/controllers/admin-game-menu.controller.ts`
- `apps/backend/src/main/controllers/gs-pay.controller.ts`
- `apps/backend/src/main/controllers/reagent-program.controller.ts`
- `apps/backend/src/main/controllers/ticket.controller.ts`
- `apps/backend/src/main/controllers/preference.controller.ts`
- `apps/backend/src/main/controllers/user.controller.ts`
- `apps/backend/src/main/controllers/nowpay.controller.ts`
- `apps/backend/src/main/controllers/invest-log.controller.ts`
- `apps/backend/src/main/controllers/admin-churn.controller.ts`
- `apps/backend/src/main/controllers/referral-code.controller.ts`
- `apps/backend/src/main/controllers/store.controller.ts`
- `apps/backend/src/main/controllers/reagent-tree.controller.ts`
- `apps/backend/src/main/controllers/plan.controller.ts`

### Backend Services (mới / cập nhật):
- `apps/backend/src/main/services/admin-agents.service.ts` (new)
- `apps/backend/src/main/services/admin-vip.service.ts` (new)
- `apps/backend/src/main/services/newsletter.service.ts` (new)
- `apps/backend/src/main/services/reagent-tree.service.ts` (new)
- `apps/backend/src/main/services/store-admin.service.ts` (new)
- `apps/backend/src/main/services/ticket.service.ts` (new)
- `apps/backend/src/main/services/admin-staff.service.ts`
- `apps/backend/src/main/services/affiliate-stats.service.ts`
- `apps/backend/src/main/services/ag-casino.service.ts`
- `apps/backend/src/main/services/bot-runner.service.ts`
- `apps/backend/src/main/services/casino.service.ts`
- `apps/backend/src/main/services/currency.service.ts`
- `apps/backend/src/main/services/deposit.service.ts`
- `apps/backend/src/main/services/email.service.ts`
- `apps/backend/src/main/services/game-config.service.ts`
- `apps/backend/src/main/services/game-menu.service.ts`
- `apps/backend/src/main/services/gs-pay.service.ts`
- `apps/backend/src/main/services/gsc-catalog-sync.service.ts`
- `apps/backend/src/main/services/gsc-environment.service.ts`
- `apps/backend/src/main/services/media.service.ts`
- `apps/backend/src/main/services/notification.service.ts`
- `apps/backend/src/main/services/nowpay.service.ts`
- `apps/backend/src/main/services/package.service.ts`
- `apps/backend/src/main/services/role.service.ts`
- `apps/backend/src/main/services/setting.service.ts`
- `apps/backend/src/main/services/support-chat.service.ts`
- `apps/backend/src/main/services/user.service.ts`
- `apps/backend/src/main/services/withdraw.service.ts`

### Backend Models (ObjectId typing updates):
- 26 model files trong `apps/backend/src/main/models/`

### Admin Dashboard Pages & Components:
- `apps/admin-dashboard/client/lib/api.ts`
- `apps/admin-dashboard/client/pages/admin/ArticleCategories.tsx`
- `apps/admin-dashboard/client/pages/admin/CommissionLogs.tsx`
- `apps/admin-dashboard/client/pages/admin/GameMenuManager.tsx`
- `apps/admin-dashboard/client/pages/admin/MarketingPromotions.tsx`
- `apps/admin-dashboard/client/pages/admin/Notifications.tsx`
- `apps/admin-dashboard/client/pages/admin/Roles.tsx`
- `apps/admin-dashboard/client/pages/admin/SystemUpdates.tsx`
- `apps/admin-dashboard/client/pages/admin/TelegramTemplates.tsx`
- `apps/admin-dashboard/client/pages/admin/VIP.tsx`
- `apps/admin-dashboard/client/pages/admin/VIPHub.tsx`
- `apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx`

### Locales & Shared Config:
- `libs/i18n/locales/en.json`
- `libs/i18n/locales/vi.json`
- `apps/frontend-web/src/i18n/locales/en.json`
- `apps/frontend-web/src/i18n/locales/vi.json`

---

## KẾ HOẠCH CHO PHIÊN TỚI (DO NOW)

1. Thực hiện 3 task Admin Dashboard còn lại: `AD-P1-001`, `AD-P1-002`, `AD-P1-003`.
2. Chuyển Model queries trong `article.controller.ts` sang `article.service.ts` (dọn dẹp Model import cuối cùng trong controllers).
3. Tiến hành typecheck toàn bộ monorepo (`npm run typecheck`).
