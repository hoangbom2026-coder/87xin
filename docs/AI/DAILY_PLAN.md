# TC-GAMING — Kế hoạch hoàn thiện từng ngày (Daily Hermes Prompts)

> **Nguồn sự thật:** Đây là kế hoạch được tạo từ phân tích thực tế codebase tại `/var/app/game`.
> Mỗi ngày là một session riêng với Hermes. Hoàn thành từng ngày theo thứ tự.
> Cập nhật `ROADMAP.md` sau mỗi ngày hoàn thành.

---

## Tổng hợp đánh giá thực trạng (2025-09-04)

### Điểm mạnh ✅
- Monorepo npm workspaces hoàn chỉnh (`apps/`, `libs/`)
- CI/CD pipeline GitHub Actions đã hoạt động (pr-check + deploy)
- PM2 fork mode cho Socket.IO đúng chuẩn
- Health endpoint `/health` với DB + Redis latency
- Smoke test script `infra/test.sh` đầy đủ 13 checks
- Docs AI memory (`ARCHITECTURE`, `DECISIONS`, `ROADMAP`, `PROJECT_MEMORY`) đã có
- 61 services, 62 models — domain coverage đầy đủ
- ADR-001 → ADR-011 đã document

### Vấn đề nghiêm trọng cần fix ❌

**BACKEND — 45 files có lỗi TypeScript:**

| Nhóm lỗi | Số file | Mức độ |
|---------|--------|--------|
| Missing services: `currency.service`, `setting.service`, `deposit.service`, `withdraw.service` | 17 file | 🔴 Critical |
| Missing services: `bot-runner.service`, `notification.service` | 2 file | 🔴 Critical |
| Missing model: `setting.model`, `bot-automation.model`, `game.model`, `provider.model` | 4 file | 🔴 Critical |
| Missing constants: `game-menu-defaults`, `gsc-environments-defaults` | 2 file | 🔴 Critical |
| Config sai: `config.gsPay` (đúng là `config.agPay`), `config.nowpay`, `config.slot`, `config.sendGridApiKey`, `config.exchangeRateKey` | 3 file | 🟠 High |
| `rootDir` error: `libs/db` và `libs/cron` ngoài rootDir | 1 file | 🟠 High |
| ObjectId vs string type mismatch | 1 file | 🟡 Medium |

**I18N — Nghèo nàn:**
- `libs/i18n` chỉ có 12 key (chỉ agency FAQs)
- Toàn bộ frontend dùng hard-coded text tiếng Việt

**Cleanup cần làm:**
- `libs.old-root/` — chỉ có `i18n/` cũ, cần xóa
- `.backup-roots/` — empty, cần xóa
- `infra/ecosystem.prod.js`, `infra/reload.sh`, `infra/ecosystem.config.cjs` — đã deleted (ok)

---

## Ngày 1 (DAY-001) — Tạo 4 missing services cốt lõi

**Mục tiêu:** Fix `currency.service`, `setting.service`, `deposit.service`, `withdraw.service`
→ Xóa hơn 50% lỗi TypeScript trong một lần

**File prompt:** [`docs/AI/PROMPTS/day-001-missing-services.md`](PROMPTS/day-001-missing-services.md)

---

## Ngày 2 (DAY-002) — Fix config + missing models + constants

**Mục tiêu:** Fix `config/index.ts` (thêm `gsPay`, `nowpay`, `slot`, `sendGridApiKey`), tạo models còn thiếu

**File prompt:** [`docs/AI/PROMPTS/day-002-config-models.md`](PROMPTS/day-002-config-models.md)

---

## Ngày 3 (DAY-003) — Fix rootDir + remaining TypeScript errors

**Mục tiêu:** Fix `tsconfig.json` backend để include `libs/`, xóa toàn bộ lỗi TypeScript còn lại

**File prompt:** [`docs/AI/PROMPTS/day-003-typecheck-clean.md`](PROMPTS/day-003-typecheck-clean.md)

---

## Ngày 4 (DAY-004) — Test suite mở rộng

**Mục tiêu:** Thêm unit tests cho các services quan trọng (currency, payment, vip-tiers)

**File prompt:** [`docs/AI/PROMPTS/day-004-test-suite.md`](PROMPTS/day-004-test-suite.md)

---

## Ngày 5 (DAY-005) — I18N chuẩn hóa

**Mục tiêu:** Quét hard-coded strings, mở rộng `vi.json` / `en.json`, hook vào frontend

**File prompt:** [`docs/AI/PROMPTS/day-005-i18n.md`](PROMPTS/day-005-i18n.md)

---

## Ngày 6 (DAY-006) — Backend cleanup + security audit

**Mục tiêu:** `.env.production` secrets, rate limiting, cleanup `libs.old-root`, CORS hardening

**File prompt:** [`docs/AI/PROMPTS/day-006-security.md`](PROMPTS/day-006-security.md)

---

## Ngày 7 (DAY-007) — Admin Dashboard chuẩn hóa

**Mục tiêu:** Phase 3 ROADMAP — VIP module, Affiliate module dùng `AdminLayout` + `DataTable`

**File prompt:** [`docs/AI/PROMPTS/day-007-admin-ui.md`](PROMPTS/day-007-admin-ui.md)

---

## Status tracker

| Ngày | Task | Status | Commit |
|------|------|--------|--------|
| DAY-001 | Missing services | ⏳ Pending | - |
| DAY-002 | Config + models | ⏳ Pending | - |
| DAY-003 | TypeScript clean | ⏳ Pending | - |
| DAY-004 | Test suite | ⏳ Pending | - |
| DAY-005 | I18N | ⏳ Pending | - |
| DAY-006 | Security | ⏳ Pending | - |
| DAY-007 | Admin UI | ⏳ Pending | - |
