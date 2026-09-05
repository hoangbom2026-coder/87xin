# HERMES-VPS-SETUP.md — Kiến Trúc Thực Tế & Cách Dùng Hermes Đúng

_BOB — Lead Architect | 2026-09-04_

---

## KIẾN TRÚC THỰC TẾ (Đã xác nhận từ code)

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS (Ubuntu)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Hermes Agent v0.21.0                   │   │
│  │         (chạy TRỰC TIẾP trên VPS này)               │   │
│  │   Tools: terminal, file, memory, code_execution     │   │
│  │   Memory: OpenViking (159.223.81.157:1933)          │   │
│  │   LLM routing: OmniRoute (127.0.0.1:20128)         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           /var/app/game  (Monorepo Source)           │  │
│  │                                                      │  │
│  │  apps/backend/     → Node/Express :8701              │  │
│  │  apps/admin-dashboard/ → Vite preview :8781          │  │
│  │  apps/frontend-web/ → Nginx static                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │   Nginx      │   │   PM2        │   │   MongoDB     │  │
│  │   :80/:443   │   │   tc-api     │   │   :27017      │  │
│  │   tc-gaming  │   │   tc-admin   │   │   Redis :6379 │  │
│  └──────────────┘   └──────────────┘   └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                    GitHub Actions
                    (build + rsync)
                           │
                    ┌──────────────┐
                    │   tc-gaming  │
                    │   .live      │
                    │  (Internet)  │
                    └──────────────┘
```

**Luồng deploy:**
1. Developer push code lên GitHub
2. GitHub Actions build apps + rsync dist/ về VPS
3. PM2 reload zero-downtime
4. Nginx serve static files + proxy API

**Điều quan trọng:**
- Hermes làm việc TRỰC TIẾP trên `/var/app/game` — chỉnh sửa source code tại chỗ
- OpenViking là memory server riêng tại `159.223.81.157:1933`
- OmniRoute là LLM gateway local tại `127.0.0.1:20128`
- Sau khi Hermes sửa code xong → chạy `infra/scripts/deploy.sh` để deploy lên tc-gaming.live

---

## VẤN ĐỀ HIỆN TẠI VÀ CÁCH FIX

### Tại sao Hermes bị stuck `msg=interrupt · 0%`?

**Nguyên nhân 1: Gateway cần restart**
Terminal hiển thị `Run hermes update or hermes gateway restart` — đây là cảnh báo rõ ràng.

**Nguyên nhân 2: Prompt quá dài**
Prompt Sprint-002 có ~80 dòng → Hermes bị overflow context → stuck.

**Fix ngay:**
```bash
# Chạy trên VPS terminal
hermes gateway restart

# Nếu vẫn lỗi:
hermes update
hermes gateway restart
```

---

## SETUP HERMES CHẠY ỔN ĐỊNH

### BƯỚC 1: Khởi động đúng cách

Mỗi khi mở terminal Hermes mới, paste ĐÚNG prompt này (không thêm gì):

```
[INIT]
Repo: /var/app/game
Đọc context: openviking_query("tc-gaming state")
Đọc task: /var/app/game/.ai/active_task.md
Sẵn sàng nhận lệnh.
```

Chờ Hermes trả lời "Sẵn sàng" rồi mới giao task.

---

### BƯỚC 2: Giao task đúng cách — NGẮN GỌN

**KHÔNG làm:**
```
Hãy thực hiện sprint-002 gồm các task sau:
TASK-A1: Fix .env.example...
TASK-A2: AdminLayout...
TASK-A3: fetch()...
... (50 dòng nữa)
```

**NÊN làm — 1 task = 1 prompt:**
```
Task: Fix .env.example
/var/app/game/apps/frontend-web/.env.example
Đổi cuocbong99 → tc-gaming (tất cả)
Verify: grep cuocbong99 → 0 kết quả
```

---

### BƯỚC 3: Sử dụng OpenViking đúng cách

OpenViking là bộ nhớ dài hạn của Hermes tại `159.223.81.157:1933`.

**Truy vấn context:**
```
openviking_query("tc-gaming current state")
openviking_query("tc-gaming sprint progress")
openviking_query("tc-gaming typescript errors")
```

**Lưu kết quả sau mỗi task:**
```
openviking_write uri="viking://tc-gaming/progress/2026-09-04"
content="Completed: [task name]. TS errors: [số]. Next: [task tiếp]."
```

---

### BƯỚC 4: Sử dụng OmniRoute đúng cách

OmniRoute chạy tại `127.0.0.1:20128` — route task sang model LLM phù hợp.

**Kiểm tra status:**
```
omniroute_status()
```

**Nếu không phản hồi:**
```bash
# Trên VPS terminal
hermes gateway restart
```

---

## 10 MICRO-TASK CHUẨN BỊ SẴN

Paste từng prompt theo thứ tự vào Hermes.
Chờ xong task trước rồi mới paste task tiếp.

---

**MT-01: Fix .env.example**
```
Task: Fix frontend env example
File: /var/app/game/apps/frontend-web/.env.example
Đổi tất cả cuocbong99 → tc-gaming
Verify: grep cuocbong99 file → 0
Báo cáo.
```

---

**MT-02: Fix AdminLayout — VIP.tsx + VIPHub.tsx**
```
Task: Add AdminLayout wrapper
Files:
  /var/app/game/apps/admin-dashboard/client/pages/admin/VIP.tsx
  /var/app/game/apps/admin-dashboard/client/pages/admin/VIPHub.tsx
Add: import AdminLayout from "@/components/layout/AdminLayout";
Wrap return JSX in <AdminLayout>...</AdminLayout>
Verify: grep AdminLayout cả 2 file → found
Báo cáo.
```

---

**MT-03: Fix AdminLayout — Roles.tsx + CommissionLogs.tsx**
```
Task: Add AdminLayout wrapper
Files:
  /var/app/game/apps/admin-dashboard/client/pages/admin/Roles.tsx
  /var/app/game/apps/admin-dashboard/client/pages/admin/CommissionLogs.tsx
Same as MT-02.
Báo cáo.
```

---

**MT-04: Fix AdminLayout — VIPLevels.tsx + GameMenuManager.tsx**
```
Task: Add AdminLayout wrapper
Files:
  /var/app/game/apps/admin-dashboard/client/pages/admin/VIPLevels.tsx
  /var/app/game/apps/admin-dashboard/client/pages/admin/GameMenuManager.tsx
Same pattern.
Báo cáo.
```

---

**MT-05: Fix AdminLayout — các file còn lại**
```
Task: Add AdminLayout wrapper to remaining pages
Files:
  ArticleCategories.tsx, TelegramTemplates.tsx, SystemUpdates.tsx
  MarketingPromotions.tsx, Notifications.tsx, AffiliateImpersonation.tsx
  AdminDepositMethods.tsx
Path: /var/app/game/apps/admin-dashboard/client/pages/admin/
Báo cáo danh sách đã sửa.
```

---

**MT-06: Fix media.service.ts**
```
Task: Fix generic Error → ApiError
File: /var/app/game/apps/backend/src/main/services/media.service.ts
Add imports: import ApiError from '@utils/ApiError'; import httpStatus from 'http-status';
Replace all throw new Error('...') with throw new ApiError(httpStatus.XXX, '...')
  NOT_FOUND: Folder not found, Asset not found, Target folder not found
  BAD_REQUEST: Folder name không hợp lệ
  CONFLICT: Folder đã tồn tại, Folder còn X tệp
Verify: grep "throw new Error(" file → 0
Báo cáo.
```

---

**MT-07: Fix 3 services throw generic Error**
```
Task: Fix generic Error → ApiError
Files:
  /var/app/game/apps/backend/src/main/services/affiliate-stats.service.ts
  /var/app/game/apps/backend/src/main/services/game-config.service.ts
  /var/app/game/apps/backend/src/main/services/gsc-environment.service.ts
Pattern: throw new Error('X') → throw new ApiError(httpStatus.APPROPRIATE_CODE, 'X')
Verify: grep "throw new Error" các file → 0
Báo cáo.
```

---

**MT-08: Fix req.user! — plan.controller.ts**
```
Task: Fix req.user non-null assertion
File: /var/app/game/apps/backend/src/main/controllers/plan.controller.ts
Find: req.user._id, req.user.username (no ! or ?)
Replace with: req.user!._id, req.user!.username
(routes protected by auth middleware → user always exists)
Verify: npm run typecheck -w apps/backend 2>&1 | grep plan.controller → 0
Báo cáo.
```

---

**MT-09: Fix fetch() bypass — AdminDepositMethods.tsx**
```
Task: Replace direct fetch with api.ts functions
File: /var/app/game/apps/admin-dashboard/client/pages/admin/AdminDepositMethods.tsx
Check lib/api.ts for: getBusinessSettings, patchBusinessSettings
Add import if needed.
Replace:
  fetch("/api/setting/business") → getBusinessSettings(token())
  fetch("/api/setting/business", {method:"PATCH",...}) → patchBusinessSettings(data, token())
Verify: grep "fetch(" file | grep -v "//" → 0
Báo cáo.
```

---

**MT-10: TypeScript count**
```
Task: Count TS errors
Run: npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
Run: npm run typecheck -w apps/admin-dashboard 2>&1 | tail -3
Run: npm run typecheck -w apps/frontend-web 2>&1 | tail -3
Report: "BE=[X] AD=[Y] FE=[Z] errors"
```

---

## QUY TRÌNH DEPLOY SAU KHI HERMES SỬA CODE

Khi Hermes đã sửa xong source code tại `/var/app/game`:

```bash
# 1. Verify trước khi deploy
npm run typecheck -w apps/backend
npm run test -w apps/backend

# 2. Deploy lên tc-gaming.live
sudo bash /var/app/game/infra/scripts/deploy.sh

# 3. Kiểm tra sau deploy
curl -sf http://127.0.0.1:8701/health
pm2 status
```

---

## BẢNG THAM CHIẾU NHANH

| Tình huống | Hành động |
|---|---|
| Hermes interrupt/stuck | `hermes gateway restart` |
| Hermes không có context | Paste INIT PROMPT + `openviking_query("tc-gaming state")` |
| Cần giao task | 1 prompt ngắn = 1 task (< 10 dòng) |
| Lưu progress | `openviking_write uri="viking://tc-gaming/..."` |
| Kiểm tra providers | `omniroute_status()` |
| Deploy lên live | `sudo bash /var/app/game/infra/scripts/deploy.sh` |
| Rollback | `sudo bash /var/app/game/infra/scripts/rollback.sh` |
| Kiểm tra hệ thống | `bash /var/app/game/infra/scripts/monitor.sh` |
