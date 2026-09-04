# DAY-007 — Admin Dashboard UI chuẩn hóa (Phase 3 ROADMAP)

> **Mục tiêu:** Chuẩn hóa Admin UI — VIP module + Affiliate module
> Áp dụng `AdminLayout`, `DataTable`, CSS variables (không hardcode hex)
> Điều kiện: DAY-001 → DAY-003 hoàn thành

---

## Bước 1 — Kiểm tra trạng thái hiện tại

```bash
# Kiểm tra AdminLayout và DataTable đang ở đâu
ls /var/app/game/libs/ui/src/
cat /var/app/game/libs/ui/src/AdminLayout.tsx 2>/dev/null | head -30 || echo "NOT_IN_LIBS"
ls /var/app/game/apps/admin-dashboard/client/components/layout/ | grep -i admin

# Kiểm tra hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" \
  /var/app/game/apps/admin-dashboard/client/pages/admin/ \
  --include="*.tsx" -l | wc -l
```

---

## Bước 2 — Đọc AdminLayout pattern

Đọc FULL:
1. File `AdminLayout.tsx` thực tế (tìm ở `libs/ui/src/` hoặc `apps/admin-dashboard/client/components/layout/`)
2. `apps/admin-dashboard/client/pages/admin/Dashboard.tsx` — ví dụ page đã chuẩn
3. `apps/admin-dashboard/client/components/layout/adminSidebarData.ts`

Mục đích: hiểu pattern wrapper chuẩn trước khi refactor.

---

## Bước 3 — Chuẩn hóa VIP Module

**Files cần refactor:**
- `apps/admin-dashboard/client/pages/admin/VIPHub.tsx`
- `apps/admin-dashboard/client/pages/admin/VIPLevels.tsx`
- `apps/admin-dashboard/client/pages/admin/VIP.tsx`
- `apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx`
- `apps/admin-dashboard/client/pages/admin/VIPProgramConfig.tsx`

**Cho mỗi file, đọc nội dung hiện tại rồi:**

1. Đảm bảo wrap bằng `AdminLayout` (nếu chưa có)
2. Thay hardcoded hex colors → CSS variables:
   ```
   #1a1a2e → var(--bg-main)
   #ffffff → var(--text-primary)
   #gold / #FFD700 → var(--accent-gold)
   ```
3. Tables → dùng `DataTable` component nếu đang dùng table HTML thuần
4. Giữ nguyên tất cả logic, API calls, state management

**Ràng buộc:**
- Không thay đổi API calls
- Không thay đổi props của component
- Không thay đổi routing

---

## Bước 4 — Chuẩn hóa Affiliate Module

**Files cần refactor:**
- `apps/admin-dashboard/client/pages/admin/AffiliateManager.tsx`
- `apps/admin-dashboard/client/pages/admin/AffiliateDashboard.tsx`
- `apps/admin-dashboard/client/pages/admin/AffiliateHub.tsx`
- `apps/admin-dashboard/client/pages/admin/CommissionLogs.tsx`

Pattern giống VIP module (bước 3).

---

## Bước 5 — Tìm và fix hardcoded hex colors toàn bộ admin

```bash
# Tìm tất cả file còn hardcode hex
grep -rn "#[0-9a-fA-F]\{3,6\}" \
  /var/app/game/apps/admin-dashboard/client/pages/ \
  --include="*.tsx" | grep -v "// " | head -20
```

Với mỗi file còn lại, thay hex → CSS variable tương ứng.

**CSS variable mapping (đọc từ global.css hoặc tailwind.config):**

```bash
cat /var/app/game/apps/admin-dashboard/client/global.css 2>/dev/null | head -50
```

---

## Bước 6 — Verify TypeScript không có lỗi mới

```bash
cd /var/app/game && npm run typecheck -w apps/admin-dashboard 2>&1 | grep "error TS" | wc -l
```

Phải là 0 lỗi MỚI (lỗi pre-existing được chấp nhận nếu không thay đổi).

---

## Bước 7 — Build verify

```bash
cd /var/app/game && npm run build -w apps/admin-dashboard 2>&1 | tail -15
ls /var/app/game/apps/admin-dashboard/dist/index.html && echo "BUILD OK"
```

---

## Bước 8 — Git commit

```bash
cd /var/app/game
git add apps/admin-dashboard/client/pages/admin/VIP*.tsx
git add apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx
git add apps/admin-dashboard/client/pages/admin/VIPProgramConfig.tsx
git add apps/admin-dashboard/client/pages/admin/Affiliate*.tsx
git add apps/admin-dashboard/client/pages/admin/CommissionLogs.tsx
git commit -m "refactor(admin): VIP + Affiliate modules use AdminLayout, DataTable, CSS variables"
```

---

## Bước 9 — Cập nhật docs

Append `docs/AI/CHANGELOG.md`:
```markdown
## [DAY-007] <date> — Admin Dashboard Phase 3
- Refactored: VIP module (5 pages) — AdminLayout, DataTable, CSS vars
- Refactored: Affiliate module (4 pages) — AdminLayout, DataTable, CSS vars
- Removed hardcoded hex: N files cleaned
- Build: admin-dashboard dist generated successfully
```

Cập nhật `docs/AI/ROADMAP.md`:
- Phase 3.1 → ✅ Done
- Phase 3.2 → ✅ Done
- Phase 3.4 → ✅ Done hoặc 🔄 In Progress
