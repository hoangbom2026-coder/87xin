# DAY-001 — Tạo 4 missing services cốt lõi

> **Hermes Agent — đọc file này toàn bộ trước khi làm bất kỳ việc gì.**
> Session này fix nhóm lỗi lớn nhất: 4 service files bị thiếu khiến 17+ file có lỗi TypeScript.
> Sau khi hoàn thành, backend phải giảm từ ~45 file lỗi xuống còn ≤ 20 file.

---

## Bối cảnh thực tế (đã verify)

**4 services bị import nhưng KHÔNG TỒN TẠI:**

| Service | File cần tạo | Được import bởi |
|---------|-------------|-----------------|
| `currency.service` | `apps/backend/src/main/services/currency.service.ts` | 9 controllers |
| `setting.service` | `apps/backend/src/main/services/setting.service.ts` | 10 controllers/services |
| `deposit.service` | `apps/backend/src/main/services/deposit.service.ts` | 4 controllers |
| `withdraw.service` | `apps/backend/src/main/services/withdraw.service.ts` | 4 controllers |

---

## Bước 1 — Đọc context trước khi viết code

**Bắt buộc đọc các file sau:**

1. `apps/backend/src/main/controllers/currency.controller.ts` — xem dùng `currencyService` như thế nào
2. `apps/backend/src/main/controllers/gs-pay.controller.ts` — xem dùng `depositService`, `currencyService`
3. `apps/backend/src/main/controllers/ag-pay.controller.ts` — xem dùng `depositService`, `withdrawService`
4. `apps/backend/src/main/controllers/nowpay.controller.ts` — xem dùng `settingService`, `currencyService`
5. `apps/backend/src/main/controllers/player.controller.ts` — xem dùng tất cả 4 services
6. `apps/backend/src/main/models/currency.model.ts` — schema của Currency
7. `apps/backend/src/main/models/deposit.model.ts` — schema của Deposit
8. `apps/backend/src/main/models/withdraw.model.ts` — schema của Withdraw
9. `apps/backend/src/main/models/preference.model.ts` — đây có thể là "setting" model

**Mục đích đọc:** hiểu signature của từng method được gọi, kiểu dữ liệu trả về.

---

## Bước 2 — Tạo `currency.service.ts`

**File:** `apps/backend/src/main/services/currency.service.ts`

**Yêu cầu:**
- Đọc `currency.model.ts` để hiểu schema
- Implement các method được gọi trong controllers (ví dụ: `getCurrencies()`, `getCurrencyById()`, `getDefaultCurrency()`)
- Dùng `mongoose` Model trực tiếp — không dùng raw queries
- Export default object (pattern giống `balance.service.ts`)
- TypeScript strict — không dùng `any` trừ khi bắt buộc

**Pattern tham khảo:** Đọc `apps/backend/src/main/services/balance.service.ts` để hiểu convention.

---

## Bước 3 — Tạo `setting.service.ts`

**File:** `apps/backend/src/main/services/setting.service.ts`

**Yêu cầu:**
- Kiểm tra `apps/backend/src/main/models/preference.model.ts` — có thể "setting" là "preference"
- Nếu preference model tồn tại → `settingService` wrap `preferenceModel`
- Implement các method được gọi: `getSetting(key)`, `updateSetting(key, value)`, v.v.
- Kiểm tra thực tế các method được gọi bằng cách đọc controllers trước

---

## Bước 4 — Tạo `deposit.service.ts`

**File:** `apps/backend/src/main/services/deposit.service.ts`

**Yêu cầu:**
- Đọc `apps/backend/src/main/models/deposit.model.ts` để hiểu schema
- Đọc `apps/backend/src/main/services/payment.service.ts` — deposit logic có thể đã có ở đây
- Nếu `payment.service` đã có `deposit()` method → `deposit.service` có thể là thin wrapper
- Implement: `createDeposit()`, `getDepositById()`, `updateDepositStatus()` (dựa trên usage trong controllers)
- Dùng `IUser` từ `@main/models/user.model`

---

## Bước 5 — Tạo `withdraw.service.ts`

**File:** `apps/backend/src/main/services/withdraw.service.ts`

**Yêu cầu:**
- Đọc `apps/backend/src/main/models/withdraw.model.ts` để hiểu schema
- Pattern giống `deposit.service.ts`
- Implement: `createWithdraw()`, `getWithdrawById()`, `updateWithdrawStatus()`, `getPendingWithdrawals()`

---

## Bước 6 — Verify

Chạy lệnh sau và báo cáo kết quả:

```bash
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | grep -E "currency|setting|deposit|withdraw" | wc -l
```

Kết quả phải là `0`. Nếu còn lỗi → đọc lỗi và fix ngay trong session này.

Sau đó chạy:
```bash
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
```

Báo cáo tổng số lỗi còn lại (kỳ vọng ≤ 20).

---

## Bước 7 — Git commit

```bash
cd /var/app/game
git add apps/backend/src/main/services/currency.service.ts
git add apps/backend/src/main/services/setting.service.ts
git add apps/backend/src/main/services/deposit.service.ts
git add apps/backend/src/main/services/withdraw.service.ts
git commit -m "feat(backend): add missing currency, setting, deposit, withdraw services"
```

---

## Bước 8 — Cập nhật docs

Append vào `docs/AI/CHANGELOG.md`:
```markdown
## [DAY-001] <date> — Missing services created
- Created: currency.service.ts, setting.service.ts, deposit.service.ts, withdraw.service.ts
- TypeScript errors: 45 → N (reduced by ~50%)
- Affected controllers fixed: currency, gs-pay, ag-pay, nowpay, player, kyc, vip-bonus, vip-spin, referral-code, reward, affiliate, admin-agents, admin-affiliate, reagent-program, public-affiliate
```

Cập nhật `docs/AI/ROADMAP.md` task 2.1 nếu hoàn thành.

---

## Ràng buộc

- **KHÔNG** thay đổi interface của bất kỳ controller nào
- **KHÔNG** thêm dependency npm mới
- **KHÔNG** sửa model schemas hiện có
- **KHÔNG** thay đổi response format của bất kỳ route nào
- Tất cả file mới phải là `.ts` (không phải `.js`)
- Export default object pattern (không phải class)
