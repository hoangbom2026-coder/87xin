# HERMES-OPTIMAL-SETUP.md — Cấu Hình Hermes Chạy Ổn Định Nhất

_BOB — Lead Architect | 2026-09-04_

---

## VẤN ĐỀ HIỆN TẠI VÀ NGUYÊN NHÂN

Hermes bị stuck `msg=interrupt · 0%` vì:
1. **Prompt quá dài** — Hermes bị overflow context window khi nhận prompt > 50 dòng
2. **Không có system prompt ngắn gọn** — Hermes phải "đọc lại" toàn bộ context mỗi lần
3. **3 tasks TASK-003/004/005 chưa có spec** — active_task.md chỉ khai báo nhưng file không tồn tại
4. **OpenViking chưa được warm-up** — Hermes không có context để trả lời

---

## GIẢI PHÁP: 3 FILE CẦU HÌNH CỐT LÕI

### FILE 1: System Prompt Ngắn (Paste vào Hermes khi bắt đầu phiên)
### FILE 2: Micro-Task Template (Thay vì prompt dài)
### FILE 3: OpenViking Bootstrap (Nạp context lần đầu)

---

## SETUP BƯỚC 1: Kiểm tra và restart gateway

Chạy trong terminal của máy VPS:

```bash
# Restart Hermes gateway
hermes gateway restart

# Nếu lỗi module:
hermes update

# Verify status
hermes status
```

---

## SETUP BƯỚC 2: System Prompt Tối Ưu

Đây là prompt NGẮN nhất để khởi động Hermes đúng cách.
Copy TOÀN BỘ đoạn dưới và paste vào Hermes khi bắt đầu phiên mới:

```
[HERMES INIT — tc-gaming.live]
Project: /var/app/game
Stack: Node/Express + React Monorepo
Pattern: Controller → Service → Model
Memory: openviking_query("tc-gaming") để lấy context
Tasks: đọc /var/app/game/.ai/active_task.md

Rules:
- Max 1 tool call per step
- Verify typecheck sau mỗi file sửa
- Báo cáo ngắn: "Done [task]. Result: [X errors]"

Ready. Chờ lệnh.
```

**Tại sao ngắn?** Hermes chỉ cần biết 5 thứ: project path, pattern, memory location, task file, rules. Không hơn.

---

## SETUP BƯỚC 3: Cách Giao Task Đúng Chuẩn

### KHÔNG làm (gây interrupt):
```
[HERMES → OPENHANDS — SPRINT-002 INIT]
Đọc file: /var/app/game/.ai/HERMES-SPRINT-002.md
Sau đó thực hiện SONG SONG 9 tasks ĐỢT 2A:
  TASK-A1: Fix .env.example...
  TASK-A2: Thêm AdminLayout...
  TASK-A3: Fix fetch()...
  (... 50 dòng nữa ...)
```

### NÊN làm (1 task = 1 prompt):
```
[HERMES] Task: Fix .env.example
File: /var/app/game/apps/frontend-web/.env.example
Đổi tất cả "cuocbong99" → "tc-gaming"
Verify: grep "cuocbong99" file → 0
Done → báo cáo.
```

**Quy tắc vàng:** 1 prompt = 1 task = tối đa 10 dòng.

---

## SETUP BƯỚC 4: OpenViking Bootstrap

Paste vào Hermes để nạp context vào OpenViking (chỉ cần làm 1 lần):

```
[HERMES — OPENVIKING BOOTSTRAP]

openviking_write({
  uri: "viking://tc-gaming/state/2026-09-04",
  content: "Project tc-gaming.live. Stack: Express+MongoDB backend (port 8701), React admin (port 8781), React frontend. Monorepo: apps/backend, apps/admin-dashboard, apps/frontend-web, libs/*. Pattern: Controller→Service→Model. Active tasks: TASK-003/004/005 pending spec. TypeScript errors: ~82 (pre-existing ObjectId/string mismatch). Key files: .ai/HERMES-SPRINT-002.md, .ai/HERMES-MASTER-TASKS.md.",
  metadata: { project: "tc-gaming", type: "state", date: "2026-09-04" }
})
```

Sau đó verify:
```
[HERMES — OPENVIKING CHECK]
openviking_query({ query: "tc-gaming state", mode: "list", top_k: 3 })
```

---

## SETUP BƯỚC 5: OmniRoute — Cách Dùng Đúng

OmniRoute quản lý LLM gateway tại `127.0.0.1:20128`. Dùng để:
- Route task phức tạp sang model mạnh hơn
- Kiểm tra trạng thái providers

```
[HERMES — OMNIROUTE CHECK]
omniroute_status()
```

Nếu trả về danh sách providers → gateway đang hoạt động.
Nếu lỗi → chạy `hermes gateway restart` trên VPS.

---

## QUY TRÌNH LÀM VIỆC CHUẨN (Standard Operating Procedure)

```
PHIÊN LÀM VIỆC CHUẨN:

1. [Bạn] Mở terminal Hermes
2. [Bạn] Paste INIT PROMPT (Bước 2) → Hermes ready trong 5 giây
3. [Bạn] Paste 1 MICRO-TASK (< 10 dòng)
4. [Hermes] Thực hiện → báo cáo ngắn
5. [Bạn] Xác nhận → paste task tiếp theo
6. [Mỗi 30 phút] Paste OPENVIKING SAVE để lưu progress

KHÔNG làm:
- Paste 1 prompt dài 50+ dòng
- Yêu cầu nhiều tasks cùng lúc
- Để Hermes idle > 10 phút không có task
```

---

## 10 MICRO-TASK PROMPT SẴN SÀNG SỬ DỤNG

Copy từng prompt dưới, paste vào Hermes theo thứ tự:

### MT-01: Fix .env.example
```
[HERMES] Task: MT-01
File: /var/app/game/apps/frontend-web/.env.example
Đổi: "cuocbong99" → "tc-gaming" (mọi chỗ)
Verify: grep "cuocbong99" .env.example → 0
Report.
```

### MT-02: Fix AdminLayout — VIP.tsx
```
[HERMES] Task: MT-02
File: /var/app/game/apps/admin-dashboard/client/pages/admin/VIP.tsx
Thêm: import AdminLayout from "@/components/layout/AdminLayout";
Bọc return JSX trong <AdminLayout>...</AdminLayout>
Verify: grep "AdminLayout" file → found
Report.
```

### MT-03: Fix AdminLayout — Roles.tsx
```
[HERMES] Task: MT-03
File: /var/app/game/apps/admin-dashboard/client/pages/admin/Roles.tsx
Thêm AdminLayout wrapper (xem MT-02 làm mẫu).
Report.
```

### MT-04: Fix AdminLayout — CommissionLogs.tsx
```
[HERMES] Task: MT-04
File: /var/app/game/apps/admin-dashboard/client/pages/admin/CommissionLogs.tsx
Thêm AdminLayout wrapper.
Report.
```

### MT-05: Fix AdminLayout — VIPHub.tsx
```
[HERMES] Task: MT-05
File: /var/app/game/apps/admin-dashboard/client/pages/admin/VIPHub.tsx
Thêm AdminLayout wrapper.
Report.
```

### MT-06: Fix fetch → api.ts (AdminDepositMethods)
```
[HERMES] Task: MT-06
File: /var/app/game/apps/admin-dashboard/client/pages/admin/AdminDepositMethods.tsx
Đọc file, tìm fetch("/api/setting/business")
Thêm import { getBusinessSettings, patchBusinessSettings } from "@/lib/api";
Thay fetch calls bằng api functions.
Verify: grep "fetch(" file | grep -v "//" → 0
Report.
```

### MT-07: Fix services throw Error — media.service.ts
```
[HERMES] Task: MT-07
File: /var/app/game/apps/backend/src/main/services/media.service.ts
Thêm: import ApiError from '@utils/ApiError'; import httpStatus from 'http-status';
Đổi tất cả throw new Error('...') → throw new ApiError(httpStatus.XXX, '...')
  NOT_FOUND: 'Folder not found', 'Asset not found', 'Target folder not found'
  BAD_REQUEST: 'Folder name không hợp lệ'
  CONFLICT: 'Folder đã tồn tại', 'Folder còn X tệp...'
Verify: grep "throw new Error(" file → 0
Report.
```

### MT-08: Fix services throw Error — 3 services
```
[HERMES] Task: MT-08
Fix throw new Error → throw new ApiError trong:
1. affiliate-stats.service.ts: BAD_REQUEST 'No commission to claim', NOT_FOUND 'User not found'
2. game-config.service.ts: BAD_REQUEST 'name required', NOT_FOUND 'Game not found'
3. gsc-environment.service.ts: NOT_FOUND 'GSC environment not found'
Verify: grep "throw new Error(" các file → 0
Report.
```

### MT-09: Fix req.user! — plan.controller.ts
```
[HERMES] Task: MT-09
File: /var/app/game/apps/backend/src/main/controllers/plan.controller.ts
Tìm: req.user._id, req.user.username (không có ? hoặc !)
Đổi: req.user!._id, req.user!.username
(routes đã có auth middleware → req.user luôn có)
Verify: npm run typecheck -w apps/backend 2>&1 | grep "plan.controller" → 0
Report.
```

### MT-10: TypeScript count
```
[HERMES] Task: MT-10
Chạy: cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
Báo cáo: "TypeScript errors hiện tại: [số]"
```

---

## SAVE PROGRESS VÀO OPENVIKING (Sau mỗi 5 tasks)

```
[HERMES — OPENVIKING SAVE]

openviking_write({
  uri: "viking://tc-gaming/progress/[DATE]",
  content: "Completed: [list tasks done]. TS errors: [số]. Next: [next task].",
  metadata: { project: "tc-gaming", type: "progress" }
})
```

---

## BẢNG THAM CHIẾU NHANH

| Tình huống | Lệnh |
|---|---|
| Hermes không phản hồi | `hermes gateway restart` trên VPS |
| Khởi động phiên mới | Paste INIT PROMPT (Bước 2) |
| Giao 1 task | Paste 1 Micro-Task (< 10 dòng) |
| Tra cứu context | `openviking_query("tc-gaming [topic]")` |
| Kiểm tra providers | `omniroute_status()` |
| Hermes bị interrupt | Ctrl+C → restart gateway → init lại |
| Lưu progress | Paste OPENVIKING SAVE |
