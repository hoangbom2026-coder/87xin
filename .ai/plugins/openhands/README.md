# OpenHands Plugin — Code Execution Engine

- **Vai trò:** Thực thi code, chạy test, refactor, và sửa lỗi dựa trên task spec.
- **Giao diện nhận việc:** `.ai/tasks/TASK-ID.md` (theo mẫu `docs/master/TASK_TEMPLATE.md`).
- **Quy trình:**
  1. Đọc spec tại `.ai/tasks/TASK-ID.md`.
  2. Tạo branch `openhands/<task-id>`.
  3. Viết code & unit test tương ứng.
  4. Chạy `npm run typecheck` và `npm run test` để verify.
  5. Bàn giao Git diff cho Hermes review.
