# AUDIT_DETAIL_2026-09-04 — Báo Cáo Kiểm Toán Chi Tiết Chuẩn Hóa Hệ Thống

_Ngày kiểm toán: 2026-09-04_  
_Kiểm toán viên: Hermes Omni-Assistant_  
_Phạm vi: `/var/app/game`_  
_Cơ sở: `docs/master/DEV_STANDARD.md` & `docs/master/ARCH_BLUEPRINT.md`_

---

## 1. Tóm Tắt Kết Quả (Executive Summary)

| # | Hạng mục Audit | Tình trạng | Số lượng file/line | Mức độ ưu tiên |
|---|---|---|---|---|
| 1 | Backend import Model trực tiếp (bỏ qua Service) | **CÓ LỖI** | 50 matches | 🔴 CRITICAL |
| 2 | Frontend import `@/components/` thay vì `@game/ui/` | **CÓ LỖI** | 46 matches (multi-file) | 🔴 CRITICAL |
| 3 | Admin Dashboard hardcoded hex colors | **CÓ LỖI** | 40+ hex values | 🟠 HIGH |
| 4 | Utils duplicate (backend vs shared-utils) | **CÓ LỖI** | 13 vs 2 files | 🟡 MEDIUM |

---

## 2. Chi Tiết Phát Hiện

### 2.1 Backend — Import Mongoose Model Trực Tiếp (Vi phạm Controller-Service Pattern)

**Quy tắc vi phạm:** "Controller chỉ validate/parse request. Mọi DB query phải nằm trong Service." (`DEV_STANDARD.md`)

| File | Model import trực tiếp | Phân loại | Khuyến nghị |
|---|---|---|---|
| `apps/backend/src/init-helps.ts` | `HelpModel` | Script/Init | Di chuyển logic sang Service hoặc giữ riêng |
| `apps/backend/src/main/controllers/reagent-tree.controller.ts` | `UserModel` | **Controller** | Move sang `reagent-tree.service.ts` |
| `apps/backend/src/main/controllers/newsletter.controller.ts` | `NewsletterSubscriberModel` | **Controller** | Move sang `newsletter.service.ts` |
| `apps/backend/src/main/controllers/admin-vip.controller.ts` | `UserModel`, `VipTiersModel` | **Controller** | Move sang `admin-vip.service.ts` |
| `apps/backend/src/main/controllers/user-affiliate.controller.ts` | `UserModel` | **Controller** | Move sang `user-affiliate.service.ts` |
| `apps/backend/src/main/controllers/package.controller.ts` | `PackageCategoryModel` | **Controller** | Move sang `package.service.ts` |
| `apps/backend/src/main/controllers/media.controller.ts` | `MediaAssetModel` | **Controller** | Move sang `media.service.ts` |
| `apps/backend/src/main/controllers/article.controller.ts` | `ArticleCategoryModel`, `ArticlePostModel` | **Controller** | Move sang `article.service.ts` |
| `apps/backend/src/main/controllers/admin-store.controller.ts` | `TransactionModel` | **Controller** | Move sang `admin-store.service.ts` |
| `apps/backend/src/main/controllers/ticket.controller.ts` | `TicketModel` | **Controller** | Move sang `ticket.service.ts` |
| `apps/backend/src/main/controllers/admin-agents.controller.ts` | `UserModel`, `TransactionModel` | **Controller** | Move sang `admin-agents.service.ts` |
| `apps/backend/src/main/services/ag-casino.service.ts` | `AgCategoryModel`, `AgGameModel` | Service | ✅ OK (nằm trong service) |
| `apps/backend/src/main/services/admin-churn.service.ts` | `TransactionModel` | Service | ✅ OK |
| `apps/backend/src/main/services/referral-code.service.ts` | `ReferralCodeModel` | Service | ✅ OK |
| `apps/backend/src/main/services/package.service.ts` | `PackageModel` | Service | ✅ OK |
| `apps/backend/src/main/services/ag-log.service.ts` | `AgLogModel` | Service | ✅ OK |
| `apps/backend/src/main/services/gs-pay-log.service.ts` | `GsPayDepositLogModel`, `GsPayWithdrawLogModel` | Service | ✅ OK |
| `apps/backend/src/main/services/site-plugin.service.ts` | `SitePluginModel` | Service | ✅ OK |
| `apps/backend/src/main/services/game-config.service.ts` | (truncated) | Service | ✅ OK |
| *... 25+ service files khác* | (truncated) | Service | ✅ OK |

**Kết luận:** 11 Controllers đang vi phạm pattern (tăng từ 4). Cần tạo Service tương ứng và refactor.

---

### 2.2 Frontend Web — Import UI Sai (`@/components/` thay vì `@game/ui/`)

**Quy tắc vi phạm:** "Mọi component dùng chung phải nằm ở `libs/ui/`. Không tạo component UI mới tại `apps/`." (`DEV_STANDARD.md`)

| File | Import sai | Component đang dùng | Khuyến nghị |
|---|---|---|---|
| `apps/frontend-web/src/pages/Privacy/index.tsx` | `../../components/ui/PageLayout`, `ContentSection`, `PolicyList` | 3 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/Terms/index.tsx` | `../../components/ui/PageLayout`, `ContentSection`, `PolicyList` | 3 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/NotFound/index.tsx` | `../../components/ui/PageLayout` | 1 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/ResponsibleGaming/index.tsx` | `../../components/ui/PageLayout`, `ContentSection`, `Button` | 3 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/HelpCenter/index.tsx` | `../../components/ui/PageLayout`, `ContentSection` | 2 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/Wallet/index.tsx` | `../../components/ui/PageLayout` | 1 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/Promo/index.tsx` | `../../components/ui/PageLayout` | 1 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/Affiliate/index.tsx` | `../../components/ui/PageLayout`, `ContentSection`, `StableImg`, `Button` | 4 | Import từ `@game/ui` |
| `apps/frontend-web/src/pages/AboutUs/index.tsx` | `../../components/ui/PageLayout`, `ContentSection` | 2 | Import từ `@game/ui` |
| *... 30+ file khác* | (truncated) | (truncated) | Import từ `@game/ui` |

**Tổng ước tính:** ~40 file frontend web cần fix import path.

---

### 2.3 Admin Dashboard — Hardcoded Hex Colors (Vi phạm CSS Variables)

**Quy tắc vi phạm:** "Không dùng mã màu Hex cứng. Sử dụng CSS variables từ Tailwind config." (`DEV_STANDARD.md`)

| File | Hex colors phát hiện | Phân loại | Khuyến nghị |
|---|---|---|---|
| `apps/admin-dashboard/client/pages/admin/PluginsPage.tsx` | `bg-[#1c1b20]` | UI Component | Thay bằng `bg-card` hoặc `bg-surface` |
| `apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx` | `#d97706`, `#10b981`, `#3b82f6`, `#f43f5e`, `#7c3aed`, `#ec4899`, `#a855f7`, `#dc2626`, `#f59e0b`, `#ef4444`, `#888888` | Color palette | Di chuyển vào `ui-theme-defaults.ts` hoặc dùng CSS variables |
| `apps/admin-dashboard/client/pages/admin/GamesHub.tsx` | `backgroundColor: c.color || "#888"` | Inline style | Dùng Tailwind class |
| `apps/admin-dashboard/client/pages/admin/ThemeEditor.tsx` | `#1B1A1A`, `#1a191e` | Theme config | OK nếu là theme defaults (nhưng nên thống nhất) |
| `apps/admin-dashboard/client/lib/ui-theme-defaults.ts` | 30+ hex values (`#0b0e11`, `#161a1e`, `#2283f6`, etc.) | **Theme defaults** | Đây là file config theme — CHỈ CHO PHÉP ở đây. Còn lại phải chuyển sang class Tailwind. |

**Kết luận:** `ui-theme-defaults.ts` là file nguồn sự thật cho theme — được phép chứa hex. Các file component/page khác KHÔNG được chứa hex cứng.

---

### 2.4 Utils Duplicate — Backend vs Shared-Utils

**Quy tắc vi phạm:** "Mọi logic dùng chung (utility, format, crypto) đều nằm ở `@game/shared-utils`." (`ARCH_BLUEPRINT.md`)

| Thư mục | Files | Trạng thái |
|---|---|---|
| `apps/backend/src/utils/` | 13 files | **Phân bổ lại** |
| `libs/shared-utils/src/` | 2 files (`config.ts`, `index.ts`) | **Thiếu hụt** |

| File backend utils | Khuyến nghị |
|---|---|
| `ApiError.ts` | Move → `@game/shared-utils` |
| `catchAsync.ts` | Move → `@game/shared-utils` |
| `file.ts` | Move → `@game/shared-utils` |
| `fileFormat.ts` | Move → `@game/shared-utils` |
| `getCountry.ts` | Move → `@game/shared-utils` |
| `html.ts` | Move → `@game/shared-utils` |
| `library.ts` | Move → `@game/shared-utils` |
| `model-plugins/` (3 files) | Keep backend (Mongoose-specific) |
| `pick.ts` | Move → `@game/shared-utils` |
| `sendgrid.ts` | Move → `@game/shared-utils` |
| `utils.ts` | Move → `@game/shared-utils` |

---

## 3. Kế Hoạch Thực Thi (Sau Khi Duyệt)

### Phase A — Backend Controller Refactor (Tạo Service mới)
1. Tạo `reagent-tree.service.ts` + refactor `reagent-tree.controller.ts`
2. Tạo `newsletter.service.ts` + refactor `newsletter.controller.ts`
3. Tạo `admin-vip.service.ts` + refactor `admin-vip.controller.ts`
4. Tạo `user-affiliate.service.ts` + refactor `user-affiliate.controller.ts`
5. Tạo `package.service.ts` + refactor `package.controller.ts`
6. Tạo `media.service.ts` + refactor `media.controller.ts`
7. Tạo `article.service.ts` + refactor `article.controller.ts`
8. Tạo `admin-store.service.ts` + refactor `admin-store.controller.ts`
9. Tạo `ticket.service.ts` + refactor `ticket.controller.ts`
10. Tạo `admin-agents.service.ts` + refactor `admin-agents.controller.ts`

### Phase B — Frontend UI Import Fix
1. Thêm export `PageLayout`, `ContentSection`, `PolicyList`, `StableImg`, `Button` từ `libs/ui`
2. Search & replace `../../components/ui/` → `@game/ui/` trên 40+ file

### Phase C — Admin Hardcoded Colors
1. Định nghĩa CSS variables trong `tailwind.config.js` cho các màu trong `VipTiersManager`
2. Thay `#d97706` → `brand-amber-600`, `#10b981` → `brand-emerald-500`, v.v.
3. Giữ nguyên `ui-theme-defaults.ts` (đây là source of truth)

### Phase D — Utils Consolidation
1. Move 10 files từ `apps/backend/src/utils/` → `libs/shared-utils/src/`
2. Update `libs/shared-utils/src/index.ts` export all
3. Fix imports trong backend dùng `@utils/` → `@game/shared-utils/`

---

## 4. Yêu Cầu Duyệt

> **Tôi đã hoàn tất AUDIT (chỉ đọc, không sửa code). Báo cáo đầy đủ tại `docs/99-reports/audits/AUDIT_DETAIL_2026-09-04.md`.**
> 
> **Chờ bạn gõ "Duyệt" để bắt đầu Phase A→D.**