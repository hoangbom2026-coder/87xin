# AGENT_CONTEXT_LOG.md — Nhật Ký Phối Hợp Hermes + OpenHands

_Last updated: 2026-09-04_

---

## 1. Giao Thức Phối Hợp (Handoff Protocol Summary)
- **Hermes:** Architect & Planner (Lập spec `.ai/tasks/TASK-ID.md`, thẩm định diff, review architecture, cập nhật roadmap).
- **OpenHands:** Executor (Tạo branch `openhands/<task-id>`, implement code, sửa test, verify build).

---

## 2. Nhật Ký Bàn Giao & Thực Thi (Task Execution Log)

| Task ID | Tiêu đề | Phân công | Branch | Trạng thái | Ghi chú / Review |
|---|---|---|---|---|---|
| `TASK-001` | Refactor Role Controller to Service Pattern | OpenHands | `openhands/task-001-role-refactor` | `✅ COMPLETED` | role.controller.ts: 0 try/catch. role.service.ts: throw ApiError chuẩn. Pattern mẫu đã xác lập. |
| `TASK-002` | Refactor Admin Staff Controller to Service Pattern | OpenHands | `openhands/task-002-admin-staff` | `READY_FOR_EXECUTION` | Spec: `.ai/tasks/TASK-002.md`. UserModel.create/findById/findByIdAndUpdate cần chuyển vào admin-staff.service.ts mới. |
| `HERMES-ANALYZE-001` | Full Codebase Audit — 3 Apps | BOB | — | `✅ COMPLETED` | Spec: `.ai/tasks/HERMES-ANALYZE-001.md`. 14 vi phạm backend, 3 vi phạm admin. JWT hardcode, 3 missing services. |

---

## 3. Sprint Backlog (Chờ Thực Thi theo thứ tự)

| Sprint | Prompt File | Status | Mô Tả |
|---|---|---|---|
| DAY-001 | `docs/AI/PROMPTS/day-001-missing-services.md` | ⏳ PENDING | Tạo 4 missing services — unblock 17 controllers |
| DAY-002 | `docs/AI/PROMPTS/day-002-config-models.md` | ⏳ PENDING | Fix config + 4 missing models |
| DAY-003 | `docs/AI/PROMPTS/day-003-typecheck-clean.md` | ⏳ PENDING | TypeScript 0 errors |
| DAY-004 | `docs/AI/PROMPTS/day-004-test-suite.md` | ⏳ PENDING | Test coverage ≥ 60% |
| DAY-005 | `docs/AI/PROMPTS/day-005-i18n.md` | ⏳ PENDING | I18N 80+ keys |
| DAY-006 | `docs/AI/PROMPTS/day-006-security.md` | ⏳ PENDING | Security hardening |
| DAY-007 | `docs/AI/PROMPTS/day-007-admin-ui.md` | ⏳ PENDING | Admin UI chuẩn hóa |

**Lệnh tổng thể:** Xem `.ai/AGENT_COMMANDS.md` để lấy lệnh copy-paste cho từng Sprint.
