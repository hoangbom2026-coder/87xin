[HERMES - MASTER-SCAN-001]

Hermes, đây là lệnh thực thi toàn hệ thống cho dự án tc-gaming.live.
Thực hiện đúng thứ tự, không bỏ bước nào.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1 — NẠP NGỮ CẢNH (đọc đúng thứ tự)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Đọc lần lượt 4 file sau trước khi làm bất cứ điều gì:

1. /var/app/game/docs/master/ARCH_BLUEPRINT.md        ← Luật kiến trúc
2. /var/app/game/docs/master/DEV_STANDARD.md          ← Chuẩn code
3. /var/app/game/docs/AI/PROJECT_MEMORY.md            ← Nguyên tắc bất biến
4. /var/app/game/.ai/tasks/MASTER-SCAN-001.md         ← Spec đầy đủ (ĐỌC TOÀN BỘ)

Xác nhận sau khi đọc xong: "Đã nạp ngữ cảnh. Bắt đầu Phase 1."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 2 — AUDIT BASELINE (chạy trước khi sửa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chạy 5 lệnh này và ghi nhớ số liệu:

cd /var/app/game

# a. TypeScript errors
npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l

# b. try/catch còn lại
grep -r "try {" apps/backend/src/main/controllers/ --include="*.ts" | wc -l

# c. generic Error trong services
grep -r "throw new Error(" apps/backend/src/main/services/ --include="*.ts" | wc -l

# d. Model import trực tiếp trong controllers
grep -r "import.*Model" apps/backend/src/main/controllers/ --include="*.ts" | wc -l

# e. Hex color trong admin
grep -rn "#[0-9a-fA-F]\{6\}" apps/admin-dashboard/client/pages/admin/ | wc -l

Báo cáo: "Baseline — TS: [a] | try/catch: [b] | Error(): [c] | ModelImport: [d] | Hex: [e]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 3 — THỰC THI PHASE 1: CRITICAL BUGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[BUGFIX-001] Sửa typo trong notification.service.ts:
  createNotifcation  →  createNotification  (tìm và sửa toàn file)

[BUGFIX-002] Thêm 2 methods vào deposit.service.ts:
  - getDepositById(id: string)
  - listDeposits(filter, page, limit)
  (Xem spec chi tiết trong MASTER-SCAN-001.md → PHASE 1)

Verify sau Phase 1:
  grep -n "createNotif[^i]" apps/backend/src/main/services/notification.service.ts  → 0 kết quả
  grep -n "getDepositById" apps/backend/src/main/services/deposit.service.ts         → có kết quả

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 4 — THỰC THI PHASE 2: BACKEND TS CLEAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thực hiện theo đúng thứ tự trong MASTER-SCAN-001.md:

[BE-P1-001] req.user non-null assertion — 8 controllers
[BE-P1-002] Services throw ApiError thay vì generic Error — 7 services  
[BE-P1-003] Refactor 35 try/catch → catchAsync (ưu tiên: nowpay→plan→package→ag-pay→...)
[BE-P1-004] Controllers không được import Model trực tiếp

Verify sau Phase 2:
  npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l  → giảm đáng kể
  grep -r "try {" apps/backend/src/main/controllers/ | wc -l         → 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 5 — THỰC THI PHASE 3: ADMIN DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[AD-P1-001] 3 files dùng raw fetch() → dùng api client từ @/lib/api
[AD-P2-001] Hard-coded strings → t('key') với react-i18next
[AD-P2-002] Admin pages thiếu AdminLayout → bọc vào <AdminLayout>
[AD-P3-001] Hex color → CSS variables / Tailwind semantic classes

Verify sau Phase 3:
  grep -r "fetch(" apps/admin-dashboard/client/ --include="*.tsx" | grep -v "//" | wc -l  → 0
  grep -rn "#[0-9a-fA-F]\{6\}" apps/admin-dashboard/client/pages/admin/ | wc -l          → 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 6 — THỰC THI PHASE 4+5+6 (nếu còn thời gian)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[FE-P1-002] Frontend TypeScript errors → scan và fix
[TEST-001]  Viết test cho 5 services quan trọng (≥60% coverage)
[INFRA-001] Đồng bộ ecosystem.production.cjs với thực tế
[INFRA-002] Nginx security headers verify

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 7 — FINAL VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chạy toàn bộ checks sau, báo cáo PASS/FAIL:

cd /var/app/game

□ npm run typecheck 2>&1 | grep "error" | wc -l                                        → 0
□ grep -r "try {" apps/backend/src/main/controllers/ | wc -l                           → 0
□ grep -r "throw new Error(" apps/backend/src/main/services/ | wc -l                  → 0
□ grep -r "import.*Model" apps/backend/src/main/controllers/ | wc -l                  → 0
□ grep -r "fetch(" apps/admin-dashboard/client/ --include="*.tsx" | grep -v "//" | wc -l → 0
□ grep -rn "#[0-9a-fA-F]\{6\}" apps/admin-dashboard/client/pages/admin/ | wc -l       → 0
□ npm run test -w apps/backend 2>&1 | tail -5                                          → all pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 8 — CẬP NHẬT BỘ NHỚ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sau khi hoàn thành, cập nhật 2 files:

1. /var/app/game/docs/16-roadmap/COMPLETED.md
   → Thêm row: | MASTER-SCAN-001 | Full system fix | [date] | ✅ |

2. /var/app/game/docs/14-ai/OPENVIKING_MEMORY.md
   → Thêm vào "Sprint Log":
   | MASTER-SCAN-001 | Full system fix: TS clean + Admin UI + Tests | [date] | ✅ Done |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LUẬT BẤT BIẾN (nhắc lại)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Dependency: Apps → Libs (CẤM App → App)
✅ Controller: chỉ parse request + gọi service (không query DB trực tiếp)
✅ Error: throw ApiError(httpStatus.CODE, msg) (CẤM throw new Error())
✅ UI: AdminLayout + DataTable từ @game/ui (CẤM hex color)
✅ Security: credentials chỉ từ process.env (CẤM commit secrets)

Pattern mẫu chuẩn:
  apps/backend/src/main/controllers/role.controller.ts
  apps/backend/src/main/services/role.service.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Spec đầy đủ: /var/app/game/.ai/tasks/MASTER-SCAN-001.md
Bắt đầu ngay từ BƯỚC 1. Báo cáo sau mỗi Phase.
