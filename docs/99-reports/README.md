# Reports & Audits — docs/99-reports

## Mục đích

Thư mục này chứa các báo cáo, audit results, và snapshots được tạo ra trong quá trình phát triển. Không phải tài liệu "sống" — mỗi file là snapshot tại một thời điểm cụ thể.

---

## Cấu trúc

```
docs/99-reports/
├── README.md                        ← file này
└── audits/
    └── REPOSITORY_DISCOVERY.md      ← Audit khám phá repo ban đầu
```

---

## Audit Log

### REPOSITORY_DISCOVERY.md
- **Ngày**: 2026-04-09
- **Agent**: Hermes (Nous Research AI)
- **Nội dung**: Audit toàn bộ codebase khi bắt đầu dự án — phát hiện 45 files TypeScript errors, missing services/models, config issues
- **Kết quả**: Tạo ra `docs/AI/DAILY_PLAN.md` và `docs/AI/ROADMAP.md`

---

## Template báo cáo mới

Khi tạo báo cáo mới, đặt file vào thư mục phù hợp và theo format:

```
docs/99-reports/
├── audits/        ← security audits, code quality scans
├── performance/   ← load test results, profiling (tạo khi cần)
└── incidents/     ← post-mortem reports (tạo khi cần)
```

### Naming convention
```
YYYY-MM-DD_<type>_<subject>.md

Ví dụ:
2024-01-15_audit_typescript-errors.md
2024-02-01_performance_api-load-test.md
2024-03-10_incident_payment-callback-delay.md
```

### Report format
```markdown
# [Type]: [Subject]

**Date**: YYYY-MM-DD
**Author**: [Agent/Developer name]
**Status**: [Draft | Final | Archived]

## Summary
Tóm tắt ngắn gọn (2-3 câu).

## Findings
Danh sách vấn đề phát hiện, chia theo mức độ nghiêm trọng.

### Critical
- ...

### High
- ...

### Medium/Low
- ...

## Actions Taken
Những gì đã được làm ngay.

## Recommendations
Những gì cần làm tiếp theo → link tới ROADMAP.md tasks.
```

---

## Trạng thái hiện tại (từ REPOSITORY_DISCOVERY)

### TypeScript Errors (tình trạng ban đầu — 2026-04-09)
| Category | Files | Status |
|---|---|---|
| Missing services (currency, setting, deposit, withdraw, bot-runner, notification) | 17+ controllers | Partially fixed |
| Missing models (setting, bot-automation, game, provider) | 4+ services | Partially fixed |
| Config missing keys (gsPay, nowpay, slot, sendGridApiKey) | 3 controllers | Fixed |
| rootDir/Redis types | 2 files | Fixed |

### Pre-existing TypeScript Errors (còn tồn tại)
Xem chi tiết tại [`docs/HERMES_CONTEXT.md`](../HERMES_CONTEXT.md) — Section 7.

Tóm tắt: ~15 admin pages import functions chưa có trong `api.ts`:
- `AdminIPManagement.tsx`: 5 missing exports
- `Admins.tsx`: 6 missing exports
- `AffiliateDashboard.tsx`: 3 missing exports
- `AffiliateHub.tsx`: 6 missing exports
- Và nhiều pages khác

**Fix**: Thêm từng function vào `apps/admin-dashboard/client/lib/api.ts`.
**Track**: Phase 3.x trong `docs/AI/ROADMAP.md`.

---

## Performance Baseline (chưa đo chính thức)

Dự kiến đo trong Phase 4 (sau khi deploy production ổn định):

| Metric | Target | Tool |
|---|---|---|
| API latency P50 | < 100ms | Nginx access log |
| API latency P99 | < 500ms | Nginx access log |
| GSC callback response | < 1000ms | ag-log collection |
| Page load (LCP) | < 2.5s | Lighthouse |
| Uptime | > 99.5% | monitor.sh |

---

## Security Audit Summary (2026-04-09)

### Fixed
- Body limit: 500mb → 10mb (ADR-008)
- Helmet.js security headers added (ADR-009)
- Rate limiting on auth/OTP endpoints (ADR-010)
- IUser interface typed (ADR-011)

### Remaining
| Issue | Priority | Phase |
|---|---|---|
| Rate limit in-memory store (không persist qua restart) | Medium | 6.1 |
| CHANGE_ME còn trong .env example | High | 6.1 |
| Redis rate limit store chưa implement | Medium | 6.1 |
| Content-Security-Policy cần tune | Low | 6.3 |
