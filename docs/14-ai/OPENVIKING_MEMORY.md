# OPENVIKING_MEMORY.md — Bản Đồ Ngữ Cảnh Tri Thức Dự Án

_Last updated: 2026-09-04 (Session BOB Architect Init)_

---

## 1. Bản Đồ Kiến Trúc Đã Lưu Trong OpenViking
- **Project URI:** `viking://project/tc-gaming/map`
  - Domain: `tc-gaming.live`
  - Apps: `apps/backend` (8701), `apps/frontend-web` (SPA), `apps/admin-dashboard` (8781)
  - Libs: `@game/shared-types`, `@game/shared-utils`, `@game/db`, `@game/cron`, `@game/ui`, `@game/i18n`
- **Deployment URI:** `viking://project/tc-gaming/deployment`
  - CI/CD Flow: GitHub Actions → Build → Rsync VPS → Zero-downtime PM2 reload (`tc-api`, `tc-admin`).

## 2. Nguyên Tắc Tối Ưu Truy Vấn (Fast Retrieval)
- Khi cần tra cứu cấu trúc hoặc quy tắc: Gọi `viking_search` thay vì quét đĩa cứng.
- Khi nhận Task mới: Sử dụng các thư mục mẫu đã chuẩn hóa (`apps/backend/src/main/services/`, `libs/ui/src/`) để soạn Spec chính xác.

---

## 3. Trạng Thái Dự Án (Snapshot 2026-09-04)

| Chỉ số | Giá trị | Ghi chú |
|---|---|---|
| TypeScript errors | ~45 files | Blocked vì 4 missing services |
| Test coverage | ~1 service | Chỉ balance.service |
| Controllers vi phạm pattern | 11 files | Import thẳng Model |
| I18N keys | 12 | Target: 80+ |
| Security hardening | Partial | helmet ✅, rate-limit cần verify |
| CI/CD | ✅ Active | pr-check + deploy |

## 4. Sprint Log

| Sprint | Mô tả | Ngày | Trạng thái |
|---|---|---|---|
| BOOT-001→007 | Monorepo foundation, routes, CI/CD | 2026-09-04 | ✅ Done |
| TASK-001 | Role Controller refactor spec | 2026-09-04 | QUEUED |
| TASK-002 | Admin Staff refactor spec | 2026-09-04 | READY |

## 5. Files Quan Trọng Cần Biết

| File | Vai trò |
|---|---|
| `.ai/MASTER_PLAN.md` | Kế hoạch tổng thể 7 sprint (BOB) |
| `.ai/AGENT_COMMANDS.md` | Lệnh copy-paste cho Hermes/OpenHands |
| `docs/AI/PROMPTS/day-001-missing-services.md` | Sprint 1 prompt |
| `docs/AI/PROJECT_MEMORY.md` | Core knowledge (Hermes đọc đầu tiên) |
| `docs/master/ARCH_BLUEPRINT.md` | Dependency rule bất biến |
| `.ai/tasks/TASK-001.md` | Role refactor spec |
| `.ai/tasks/TASK-002.md` | Staff refactor spec |
