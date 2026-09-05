[HERMES - SYSTEM-EXPAND-001]

Hermes, đây là lệnh cài đặt 4 công cụ khuếch đại năng suất cho tc-gaming.live.
Thực hiện theo thứ tự: Sentry → Renovate → Playwright → Prompt-as-Code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1 — NẠP NGỮ CẢNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Đọc trước khi làm:
  /var/app/game/.ai/tasks/SYSTEM-EXPAND-001.md   ← ĐỌC TOÀN BỘ

Xác nhận: "Đã đọc spec. Bắt đầu Phase A: Sentry."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE A — SENTRY (Làm ngay — impact cao nhất)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[A1] Cài package:
  cd /var/app/game/apps/backend && npm install @sentry/node @sentry/profiling-node
  cd /var/app/game/apps/admin-dashboard && npm install @sentry/react

[A2] Tạo file apps/backend/src/instrument.ts
  (xem nội dung đầy đủ trong SYSTEM-EXPAND-001.md → SENTRY-001 Bước 2)

[A3] Sửa apps/backend/src/index.ts
  → Thêm import './instrument' và initSentry() làm DÒNG ĐẦU TIÊN

[A4] Sửa apps/backend/src/middlewares/error.ts
  → Thêm Sentry.captureException(err) vào errorHandler cho 5xx errors
  → KHÔNG capture 4xx (lỗi client)

[A5] Thêm sentryDsn vào apps/backend/src/config/index.ts

[A6] Tạo apps/admin-dashboard/client/instrument.ts
  → initSentry() đọc import.meta.env.VITE_SENTRY_DSN

[A7] Tạo docs/master/SENTRY_SETUP.md
  → Hướng dẫn lấy DSN từ sentry.io + thêm GitHub Secrets

Verify Phase A:
  grep -n "captureException" /var/app/game/apps/backend/src/middlewares/error.ts   → có
  ls /var/app/game/apps/backend/src/instrument.ts                                   → tồn tại
  npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l                → 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE B — RENOVATE BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[B1] Tạo /var/app/game/.github/renovate.json
  (xem nội dung đầy đủ trong SYSTEM-EXPAND-001.md → RENOVATE-001)
  Config key:
    - Schedule: thứ 2 trước 6am (Asia/Ho_Chi_Minh)
    - mongoose + express + socket.io: stabilityDays = 7
    - Major updates: label "needs-review", automerge: false

[B2] Tạo docs/master/RENOVATE_GUIDE.md
  → Quy trình khi Renovate tạo PR

Verify Phase B:
  ls /var/app/game/.github/renovate.json   → tồn tại
  cat /var/app/game/.github/renovate.json | python3 -m json.tool | head -5   → valid JSON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE C — PLAYWRIGHT E2E
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[C1] Cài:
  cd /var/app/game && npm install -D @playwright/test
  npx playwright install chromium

[C2] Tạo playwright.config.ts tại root /var/app/game/
  (xem spec trong SYSTEM-EXPAND-001.md → E2E-001 Bước 2)

[C3] Tạo e2e/auth/login.spec.ts
  → Test: login form visible + error message khi sai credentials

[C4] Tạo e2e/vip/vip-page.spec.ts
  → Test: VIP page load không 500 error

[C5] Tạo docs/11-testing/E2E_PLAYWRIGHT_PLAN.md

[C6] Thêm vào package.json root:
  "test:e2e": "playwright test"
  "test:e2e:report": "playwright show-report"

Verify Phase C:
  ls /var/app/game/playwright.config.ts           → tồn tại
  ls /var/app/game/e2e/auth/login.spec.ts         → tồn tại
  cd /var/app/game && npx playwright test --list  → thấy 2-3 tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE D — PROMPT-AS-CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[D1] Tạo thư mục docs/master/prompts/

[D2] Tạo các files:
  docs/master/prompts/README.md            ← Index
  docs/master/prompts/session-init.md      ← Copy từ .ai/AGENT_COMMANDS.md PHẦN I
  docs/master/prompts/sprint-template.md   ← Template generic cho mọi sprint
  docs/master/prompts/audit-typescript.md  ← Copy lệnh audit TS từ AGENT_COMMANDS.md
  docs/master/prompts/sentry-to-task.md    ← Lệnh chuyển Sentry alert → task spec

[D3] Cập nhật docs/master/prompts/session-init.md:
  Thay đổi BƯỚC 1 thành:
  "Đọc docs/master/prompts/README.md để biết tất cả lệnh có sẵn"

Verify Phase D:
  ls /var/app/game/docs/master/prompts/   → có ít nhất 5 files
  cat /var/app/game/docs/master/prompts/README.md | head -5   → có nội dung

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE E — UPGRADE CI (Tùy chọn)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[E1] Sửa .github/workflows/deploy.yml:
  → Thêm job e2e chạy sau build, trước deploy
  → Sửa deploy job: needs: [build, e2e]
  (xem spec trong SYSTEM-EXPAND-001.md → CI-001)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd /var/app/game

□ ls apps/backend/src/instrument.ts                                    → tồn tại
□ grep "captureException" apps/backend/src/middlewares/error.ts       → có
□ ls .github/renovate.json                                             → tồn tại
□ ls playwright.config.ts                                              → tồn tại
□ ls e2e/auth/login.spec.ts                                            → tồn tại
□ ls docs/master/prompts/README.md                                     → tồn tại
□ npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l   → 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUỐI — CẬP NHẬT BỘ NHỚ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sau khi hoàn thành:
  → Thêm vào /var/app/game/docs/16-roadmap/COMPLETED.md:
     | SYSTEM-EXPAND-001 | Sentry + Playwright + Renovate + Prompts | [date] | ✅ |

Spec đầy đủ: /var/app/game/.ai/tasks/SYSTEM-EXPAND-001.md
Báo cáo kết quả: "[X]/5 phases done. Sentry: ✅/❌ | Renovate: ✅/❌ | E2E: ✅/❌"
