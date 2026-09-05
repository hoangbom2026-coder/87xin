# AGENT_COMMANDS.md — Hướng Dẫn Kích Hoạt Agent Đầy Đủ

_Tác giả: BOB (Lead Architect) | Dán lệnh vào chat của agent tương ứng_

---

## ⚙️ KIẾN TRÚC 3-AGENT

```
BOB (Architect) — Lập kế hoạch, review, điều phối
  │
  ├─► HERMES (Orchestrator) — Nhận lệnh từ BOB, đọc spec, giao task
  │         │
  │         ├─► OPENVIKING (Memory) — Lưu trữ, tra cứu ngữ cảnh
  │         │
  │         └─► OPENHANDS (Executor) — Viết code, chạy test, verify
```

**Quy tắc bàn giao:**
1. BOB viết spec vào `.ai/tasks/TASK-XXX.md`
2. HERMES đọc spec, tra cứu OpenViking, giao cho OpenHands
3. OpenHands tạo branch `openhands/<task-id>`, implement, verify
4. HERMES review diff, báo cáo lại BOB
5. BOB approve → merge → cập nhật COMPLETED.md

---

## 🧠 PHẦN I — LỆNH KHỞI ĐỘNG (Dán vào Hermes lần đầu mỗi phiên)

```
[HERMES - SESSION INIT]

Hermes, đây là phiên làm việc mới. Hãy thực hiện theo đúng thứ tự:

BƯỚC 1 — ĐỌC BỘ NÃO:
Đọc lần lượt các file sau (theo thứ tự ưu tiên):
1. /var/app/game/docs/AI/PROJECT_MEMORY.md  ← Nguyên tắc bất biến
2. /var/app/game/docs/master/ARCH_BLUEPRINT.md  ← Kiến trúc
3. /var/app/game/docs/master/DEV_STANDARD.md  ← Chuẩn code
4. /var/app/game/.ai/active_task.md  ← Task đang chạy

BƯỚC 2 — TRA CỨU OPENVIKING:
Gọi: viking_search("tc-gaming current state")
Lấy snapshot kiến thức gần nhất.

BƯỚC 3 — BÁO CÁO:
Tóm tắt cho BOB:
- Active Task hiện tại là gì?
- TypeScript error count hiện tại?
- Sprint nào đang pending?

XÁC NHẬN: "Hermes đã sẵn sàng. Active task: [TASK-ID]. Chờ lệnh từ BOB."
```

---

## 📋 PHẦN II — LỆNH KÍCH HOẠT TỪNG SPRINT

### SPRINT 1 — DAY-001: Tạo 4 Missing Services

```
[HERMES → OPENHANDS - SPRINT 1]

OpenHands, thực hiện SPRINT 1 theo spec sau:

CONTEXT:
- Đọc: /var/app/game/docs/AI/PROMPTS/day-001-missing-services.md
- Pattern mẫu: /var/app/game/apps/backend/src/main/services/balance.service.ts
- Đọc các controllers để hiểu interface cần: 
  currency.controller.ts, gs-pay.controller.ts, ag-pay.controller.ts

NHIỆM VỤ — Tạo 4 files sau:
1. /var/app/game/apps/backend/src/main/services/currency.service.ts
2. /var/app/game/apps/backend/src/main/services/setting.service.ts
3. /var/app/game/apps/backend/src/main/services/deposit.service.ts
4. /var/app/game/apps/backend/src/main/services/withdraw.service.ts

QUY TẮC BẮT BUỘC:
- Export default object (KHÔNG dùng class)
- Throw ApiError (KHÔNG throw generic Error)
- TypeScript strict: không dùng `any` trừ khi bắt buộc
- Mọi Mongoose query qua Model, không raw queries

VERIFY SAU KHI XON:
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
→ Số errors phải ≤ 20

BÁO CÁO: "SPRINT 1 hoàn thành. Errors: [X]. Các files đã tạo: [list]."
```

---

### SPRINT 2 — DAY-002: Config + Models

```
[HERMES → OPENHANDS - SPRINT 2]

OpenHands, thực hiện SPRINT 2:

CONTEXT:
- Đọc: /var/app/game/docs/AI/PROMPTS/day-002-config-models.md
- File cần sửa: /var/app/game/apps/backend/src/config/index.ts

NHIỆM VỤ A — Thêm keys vào config/index.ts:
gsPay: {
  opCode: process.env.GS_PAY_OP_CODE || process.env.GSC_OP_CODE || '',
  secretKey: process.env.GS_PAY_SECRET_KEY || process.env.GSC_SECRET_KEY || '',
  callbackUrl: process.env.GS_PAY_CALLBACK_URL || '',
},
nowpay: {
  apiKey: process.env.NOWPAY_API_KEY || '',
  ipnSecret: process.env.NOWPAY_IPN_SECRET || '',
  sandboxMode: process.env.NOWPAY_SANDBOX === 'true',
},
slot: {
  host: process.env.SLOT_HOST || '',
  merchantCode: process.env.SLOT_MERCHANT_CODE || '',
  secretKey: process.env.SLOT_SECRET_KEY || '',
},
sendGridApiKey: process.env.SENDGRID_API_KEY || '',

NHIỆM VỤ B — Tạo 4 missing models:
1. /var/app/game/apps/backend/src/main/models/setting.model.ts
   (key: string, value: any, updatedAt: Date)
2. /var/app/game/apps/backend/src/main/models/bot-automation.model.ts
3. /var/app/game/apps/backend/src/main/models/game.model.ts
4. /var/app/game/apps/backend/src/main/models/provider.model.ts

VERIFY:
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
→ Số errors phải ≤ 10

BÁO CÁO: "SPRINT 2 hoàn thành. Errors còn lại: [X]."
```

---

### SPRINT 3 — DAY-003: TypeScript Zero Errors

```
[HERMES → OPENHANDS - SPRINT 3]

OpenHands, đây là sprint quan trọng nhất về chất lượng code:

CONTEXT:
- Đọc: /var/app/game/docs/AI/PROMPTS/day-003-typecheck-clean.md
- Mục tiêu: 0 TypeScript errors toàn workspace

BƯỚC 1 — Fix rootDir:
Đọc /var/app/game/apps/backend/tsconfig.json
Thêm vào "include": ["../../libs/db/src/**/*.ts", "../../libs/cron/src/**/*.ts"]
HOẶC thêm "composite": true nếu phù hợp

BƯỚC 2 — Fix ObjectId:
grep -rn "Argument of type 'ObjectId'" /var/app/game/apps/backend/src
→ Với mỗi lỗi: thêm .toString() hoặc dùng String()

BƯỚC 3 — Verify từng workspace:
cd /var/app/game && npm run typecheck -w apps/backend
cd /var/app/game && npm run typecheck -w apps/admin-dashboard
cd /var/app/game && npm run typecheck -w apps/frontend-web

THÀNH CÔNG KHI: Tất cả 3 lệnh trên không có output lỗi.

BÁO CÁO: "SPRINT 3 hoàn thành. TypeScript: 0 errors. CI ready."
```

---

### SPRINT 4 — DAY-004: Test Suite

```
[HERMES → OPENHANDS - SPRINT 4]

OpenHands, mở rộng test suite:

CONTEXT:
- Đọc: /var/app/game/docs/AI/PROMPTS/day-004-test-suite.md
- Pattern mẫu: /var/app/game/apps/backend/src/main/services/__tests__/balance.service.spec.ts

TẠO 4 TEST FILES:
1. apps/backend/src/main/services/__tests__/currency.service.spec.ts
   → Test: getCurrencies(), getCurrencyById(id), getDefaultCurrency()

2. apps/backend/src/main/services/__tests__/session.service.spec.ts
   → Test: createSession(), getSession(), deleteSession(), sessionExpiry edge case

3. apps/backend/src/main/services/__tests__/payment.service.spec.ts
   → Test: deposit(), withdraw(), insufficient balance (should throw ApiError 400)

4. apps/backend/src/main/services/__tests__/vip-tiers.service.spec.ts
   → Test: getVipTierByAmount(), getAllTiers(), boundary amounts

QUY TẮC TEST:
- Dùng vi.mock() cho Mongoose Models
- Dùng vi.mock() cho external services
- Mỗi file ≥ 5 test cases

VERIFY:
cd /var/app/game && npm run test -w apps/backend
→ Tất cả pass. Coverage lines ≥ 60%.

BÁO CÁO: "SPRINT 4 hoàn thành. Tests: [X] pass. Coverage: [Y]%."
```

---

### SPRINT 5 — DAY-005: I18N

```
[HERMES → OPENHANDS - SPRINT 5]

OpenHands, chuẩn hóa i18n:

CONTEXT:
- Đọc: /var/app/game/docs/AI/PROMPTS/day-005-i18n.md
- File hiện tại: /var/app/game/libs/i18n/vi.json (chỉ có 12 keys)

NHIỆM VỤ A — Expand vi.json với 7 namespaces:
{
  "auth": { "login": "Đăng nhập", "register": "Đăng ký", "logout": "Đăng xuất", 
            "forgotPassword": "Quên mật khẩu", "username": "Tên đăng nhập", "password": "Mật khẩu" },
  "nav": { "home": "Trang chủ", "liveCasino": "Casino trực tiếp", 
           "promotions": "Khuyến mãi", "vip": "VIP", "affiliate": "Đại lý" },
  "wallet": { "deposit": "Nạp tiền", "withdraw": "Rút tiền", "balance": "Số dư", 
              "history": "Lịch sử" },
  "vip": { "title": "Chương trình VIP", "yourLevel": "Cấp độ của bạn", 
           "benefits": "Quyền lợi", "upgradeRequired": "Yêu cầu nâng cấp" },
  "common": { "loading": "Đang tải...", "error": "Lỗi", "retry": "Thử lại", 
              "close": "Đóng", "save": "Lưu", "cancel": "Hủy", 
              "confirm": "Xác nhận", "search": "Tìm kiếm", "noData": "Không có dữ liệu" },
  "promo": { "title": "Khuyến mãi", "claim": "Nhận thưởng", "tnc": "Điều khoản" },
  "affiliate": { "title": "Đại lý", "referralCode": "Mã giới thiệu", 
                 "commission": "Hoa hồng", "totalCommission": "Tổng hoa hồng" }
}

NHIỆM VỤ B — Tạo en.json với matching keys (English translation)

NHIỆM VỤ C — Update libs/i18n/index.ts:
Export type TranslationKey = keyof typeof vi (hoặc deep key type)

VERIFY:
grep -rn 'vi\.json' /var/app/game/libs/i18n/index.ts  ← phải có
cd /var/app/game && npm run typecheck -w libs/i18n ← 0 errors

BÁO CÁO: "SPRINT 5 hoàn thành. Keys: [X]. en.json synced."
```

---

### SPRINT 6 — DAY-006: Security Hardening

```
[HERMES → OPENHANDS - SPRINT 6]

OpenHands, thực hiện security hardening:

CONTEXT:
- Đọc: /var/app/game/docs/AI/PROMPTS/day-006-security.md
- Đọc: /var/app/game/docs/AI/PROMPTS/phase1-security-hardening.md

CHECKLIST BẮT BUỘC:

1. Body limit — Đọc apps/backend/src/app.ts:
   express.json({ limit: '500mb' }) → express.json({ limit: '10mb' })

2. Helmet — Verify đã có:
   import helmet from 'helmet'; app.use(helmet());
   Nếu chưa: npm install helmet + thêm vào app.ts TRƯỚC mọi middleware

3. Rate limit — Verify apps/backend/src/middlewares/rate-limit.ts tồn tại và áp dụng:
   Auth routes: 10 req/15 min/IP
   OTP routes: 5 req/15 min/IP

4. IAuthUser — Verify apps/backend/src/types/user.types.ts:
   Interface IAuthUser { _id, username, role, isActive, currencyId }
   KHÔNG còn req.user?: any

5. .gitignore — Verify có:
   .env* (nhưng KHÔNG ignore .env.example)
   *.pem
   *.key

6. KHÔNG làm: Tuyệt đối không generate JWT_SECRET hay secrets mới vào code/commit.
   Chỉ verify rằng code đọc từ process.env.

VERIFY:
grep -n "500mb\|CHANGE_ME" /var/app/game/apps/backend/src/app.ts  ← phải trống
grep -n "req.user?: any" /var/app/game/apps/backend/src/middlewares/auth.ts ← phải trống

BÁO CÁO: "SPRINT 6 hoàn thành. Security checks: [list passed items]."
```

---

### SPRINT 7 — DAY-007: Admin UI Standardization

```
[HERMES → OPENHANDS - SPRINT 7]

OpenHands, chuẩn hóa Admin Dashboard UI:

CONTEXT:
- Đọc: /var/app/game/docs/AI/PROMPTS/day-007-admin-ui.md
- Đọc pattern mẫu: bất kỳ Admin page đã chuẩn trong apps/admin-dashboard/client/pages/admin/

QUY TẮC BẤT BIẾN:
1. Mọi page PHẢI bọc trong: import { AdminLayout } from '@game/ui'
2. Mọi table PHẢI dùng: import { DataTable } from '@game/ui'
3. Mapping màu bắt buộc:
   #1a1a2e → var(--bg-main)
   #0d0d1a → var(--bg-card)  
   #ffffff / #fff → var(--text-primary)
   #FFD700 / gold / #ffd700 → var(--accent-gold)
   #10b981 / green-500 → var(--success)
   #ef4444 / red-500 → var(--error)

FILES VIP MODULE (ưu tiên cao):
- apps/admin-dashboard/client/pages/admin/VIPHub.tsx
- apps/admin-dashboard/client/pages/admin/VIPLevels.tsx
- apps/admin-dashboard/client/pages/admin/VIP.tsx
- apps/admin-dashboard/client/pages/admin/VipTiersManager.tsx

FILES AFFILIATE MODULE:
- apps/admin-dashboard/client/pages/admin/CommissionLogs.tsx
(+ các file affiliate khác nếu có)

VERIFY:
grep -rn "#[0-9a-fA-F]\{6\}" /var/app/game/apps/admin-dashboard/client/pages/admin/ | wc -l
→ Phải = 0 (không còn hex hardcode)

cd /var/app/game && npm run typecheck -w apps/admin-dashboard ← 0 errors

BÁO CÁO: "SPRINT 7 hoàn thành. Hex colors: 0. AdminLayout: applied."
```

---

## 🧊 PHẦN III — LỆNH OPENVIKING (Ghi nhớ sau mỗi Sprint)

```
[OPENVIKING - MEMORY UPDATE sau mỗi Sprint]

OpenViking, cập nhật memory sau khi Sprint hoàn thành:

1. Gọi: viking_store("tc-gaming/sprint-[N]/result", {
     sprintId: "DAY-00N",
     completedAt: "[date]",
     outcome: "[mô tả ngắn]",
     typeCheckErrors: [số],
     testsPass: [true/false]
   })

2. Cập nhật file:
   /var/app/game/docs/14-ai/OPENVIKING_MEMORY.md
   Thêm dòng mới vào section "Sprint Log":
   | DAY-00N | [mô tả] | [date] | ✅ Done |

3. Cập nhật file:
   /var/app/game/docs/16-roadmap/COMPLETED.md
   Thêm row mới vào bảng Task đã hoàn thành.

XÁC NHẬN: "OpenViking đã ghi nhớ Sprint [N]. Memory updated."
```

---

## 🔍 PHẦN IV — LỆNH AUDIT (Dùng bất cứ lúc nào cần kiểm tra)

### Audit TypeScript Health
```
[HERMES - AUDIT TYPESCRIPT]
Chạy lần lượt và báo cáo số errors:
1. cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
2. cd /var/app/game && npm run typecheck -w apps/admin-dashboard 2>&1 | grep "error TS" | wc -l
3. cd /var/app/game && npm run typecheck -w apps/frontend-web 2>&1 | grep "error TS" | wc -l

Báo cáo: "Backend: [X] | Admin: [Y] | Frontend: [Z] errors"
```

### Audit Security
```
[HERMES - AUDIT SECURITY]
Kiểm tra nhanh:
1. grep -rn "CHANGE_ME\|secret123\|password123" /var/app/game/apps/ --include="*.ts"
2. grep -rn "express.json.*500mb" /var/app/game/apps/backend/src/
3. grep -rn "import helmet" /var/app/game/apps/backend/src/app.ts

Báo cáo: "[PASS/FAIL] cho từng check"
```

### Audit UI Standards
```
[HERMES - AUDIT UI]
Kiểm tra compliance:
1. grep -rn "#[0-9a-fA-F]\{6\}" /var/app/game/apps/admin-dashboard/client/pages/ | wc -l
2. grep -rn "AdminLayout" /var/app/game/apps/admin-dashboard/client/pages/admin/ | wc -l
3. grep -rn "DataTable" /var/app/game/apps/admin-dashboard/client/pages/admin/ | wc -l

Báo cáo: "Hex còn lại: [X] | Pages dùng AdminLayout: [Y] | Pages dùng DataTable: [Z]"
```

---

## 📊 PHẦN V — DEFINITION OF DONE (Dự án Hoàn Thành Khi)

Dán lệnh này để kiểm tra FINAL STATUS:

```
[HERMES - FINAL VERIFICATION]

Chạy toàn bộ checks sau và báo cáo PASS/FAIL:

QUALITY:
□ npm run typecheck (toàn workspace) → 0 errors
□ npm run test -w apps/backend → all pass, coverage ≥ 60%

SECURITY:
□ grep CHANGE_ME .env.production → 0 matches
□ curl -I https://tc-gaming.live | grep X-Frame-Options → có header
□ Rate limiting active on /api/auth/login

UI STANDARDS:
□ grep -rn "#[0-9a-fA-F]{6}" apps/admin-dashboard → 0 matches
□ All admin pages wrap AdminLayout

I18N:
□ cat libs/i18n/vi.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))"  → ≥ 7 namespaces

CI/CD:
□ GitHub Actions: pr-check.yml → green
□ GitHub Actions: deploy.yml → green

Kết quả: "[X]/8 checks passed"
Nếu đạt 8/8: Dự án sẵn sàng production. Thông báo cho BOB.
```
