# DAY-004 — Test suite mở rộng

> **Điều kiện tiên quyết: DAY-001, DAY-002, DAY-003 phải hoàn thành (0 TypeScript errors)**
> Mục tiêu: thêm test coverage cho các services quan trọng nhất của platform

---

## Bước 1 — Kiểm tra coverage hiện tại

```bash
cd /var/app/game && npm run test:coverage -w apps/backend 2>&1 | tail -30
```

Ghi chú: coverage hiện tại là bao nhiêu % (chỉ có `balance.service.spec.ts`).

---

## Bước 2 — Đọc pattern test hiện có

Đọc FULL `apps/backend/src/main/services/__tests__/balance.service.spec.ts`.

Ghi nhớ:
- Dùng `vi.mock()` cho models
- Dùng `describe` / `it` / `expect`
- Mock pattern: `{ default: { aggregate: vi.fn(), ... } }`
- Import: `from 'vitest'`
- `vi.clearAllMocks()` trong `beforeEach`

---

## Bước 3 — Viết test cho `currency.service.ts`

**File:** `apps/backend/src/main/services/__tests__/currency.service.spec.ts`

**Test cases:**
- `getCurrencies()` → trả về array
- `getCurrencyById(id)` → trả về currency hoặc null
- `getDefaultCurrency()` → trả về currency với `isDefault: true`

**Pattern:** Mock `currency.model` với `{ find: vi.fn(), findOne: vi.fn(), findById: vi.fn() }`

---

## Bước 4 — Viết test cho `session.service.ts`

**Đọc trước:** `apps/backend/src/main/services/session.service.ts` FULL content.

**File:** `apps/backend/src/main/services/__tests__/session.service.spec.ts`

**Test cases (dựa trên usage trong auth middleware):**
- `createSession()` → tạo session mới
- `getSession(token)` → tìm session theo token
- `deleteSession(id)` → xóa session
- `updateSession(id, data)` → update expiredTime

---

## Bước 5 — Viết test cho `payment.service.ts`

**Đọc trước:** `apps/backend/src/main/services/payment.service.ts` FULL content.

**File:** `apps/backend/src/main/services/__tests__/payment.service.spec.ts`

**Test cases:**
- `deposit()` → tạo deposit record + cập nhật balance
- `withdraw()` → tạo withdraw record + kiểm tra số dư đủ
- Edge cases: insufficient balance, invalid currency

---

## Bước 6 — Viết test cho `vip-tiers.service.ts`

**Đọc trước:** `apps/backend/src/main/services/vip-tiers.service.ts` FULL content.

**File:** `apps/backend/src/main/services/__tests__/vip-tiers.service.spec.ts`

**Test cases:**
- `getVipTierByAmount(amount)` → trả về đúng tier
- `getAllTiers()` → trả về tất cả tiers
- Boundary test: amount ở ranh giới giữa 2 tiers

---

## Bước 7 — Chạy tất cả tests

```bash
cd /var/app/game && npm run test -w apps/backend 2>&1
```

Tất cả tests phải pass. Fix nếu có failures.

---

## Bước 8 — Check coverage

```bash
cd /var/app/game && npm run test:coverage -w apps/backend 2>&1 | tail -30
```

Ghi lại % coverage đạt được.

---

## Bước 9 — Cấu hình vitest coverage threshold (optional)

Đọc `apps/backend/vitest.config.ts`. Nếu chưa có threshold:

```typescript
coverage: {
  thresholds: {
    lines:     60,
    functions: 60,
    branches:  50,
  }
}
```

---

## Bước 10 — Git commit

```bash
cd /var/app/game
git add apps/backend/src/main/services/__tests__/
git add apps/backend/vitest.config.ts
git commit -m "test(backend): add unit tests for currency, session, payment, vip-tiers services"
```

---

## Bước 11 — Cập nhật docs

Append vào `docs/AI/CHANGELOG.md`:
```markdown
## [DAY-004] <date> — Test suite expanded
- Added tests: currency.service, session.service, payment.service, vip-tiers.service
- Coverage: lines=X%, functions=X%, branches=X%
- All N tests pass
```

Cập nhật `docs/AI/BASELINE.md`:
- Test count: N → M
- Coverage: X%
