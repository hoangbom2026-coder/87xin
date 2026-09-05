# SYSTEM_COMMAND_CENTER.md — Trung Tâm Điều Phối Hệ Thống (Hermes + BOB + OpenHands)

_Phiên bản: 1.0.0_  
_Kiến trúc sư trưởng: BOB Strategic Advisor_  
_Điều phối viên: Hermes Omni-Assistant_  
_Thực thi: OpenHands Executor_

---

## 1. Bản Đồ Thẩm Quyền & Phân Công (Responsibility Matrix)

| Thành phần | Vai trò | Nhiệm vụ chính |
|---|---|---|
| **BOB** | Chief Architect & Strategic Advisor | Định hướng chiến lược, thẩm định an toàn, duyệt PR & Git diff |
| **Hermes** | Orchestrator & System Planner | Nhận lệnh, lập spec (`.ai/tasks/`), cập nhật Roadmaps, tổng hợp báo cáo |
| **OpenHands** | Execution Engine (Cơ bắp) | Tạo branch (`openhands/TASK-*`), viết code, test, sửa lỗi typecheck |

---

## 2. Giao Thức Bàn Giao 5 Bước (Autonomous 5-Step Pipeline)

```
[1. DISCOVER] ──► [2. PLAN (Spec)] ──► [3. HANDOFF (OpenHands)] ──► [4. REVIEW (với BOB)] ──► [5. MERGE]
      ▲                                                                         │
      └─────────────────────────── [NẾU LỖI: FIX-TASK-ID] ◄─────────────────────┘
```

1. **DISCOVER**: Hermes quét mã nguồn và tài liệu liên quan theo phạm vi hẹp.
2. **PLAN**: Tạo file spec `.ai/tasks/TASK-ID.md` (theo chuẩn `docs/master/TASK_TEMPLATE.md`).
3. **HANDOFF**: Chuyển giao task cho OpenHands thực thi trên branch riêng `openhands/TASK-ID`.
4. **REVIEW**: Xuất báo cáo diff và kết quả test sang `docs/99-reports/audits/E2E_SYNC_REPORT.md` để BOB thẩm định.
5. **MERGE**: Khi BOB xác nhận "OK", Hermes tiến hành merge vào `main` và cập nhật `docs/16-roadmap/COMPLETED.md`.

---

## 3. Liên Kết Tài Liệu Trọng Yếu (Quick References)

- **Roadmap tổng thể:** `docs/master/ROADMAP.md`
- **Quy chuẩn kiến trúc:** `docs/master/ARCH_BLUEPRINT.md`
- **Tiêu chuẩn lập trình:** `docs/master/DEV_STANDARD.md`
- **Chính sách dọn dẹp:** `docs/master/CLEANUP_POLICY.md`
- **Báo cáo đồng bộ & thẩm định:** `docs/99-reports/audits/E2E_SYNC_REPORT.md`
