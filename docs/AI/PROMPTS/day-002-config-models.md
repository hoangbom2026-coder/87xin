# DAY-002 — Fix config/index.ts + missing models + constants

> **Đọc toàn bộ file này trước. Session này fix nhóm lỗi thứ 2:**
> Config thiếu keys → controllers dùng `config.gsPay`, `config.nowpay`, `config.slot`, `config.sendGridApiKey`
> Models thiếu: `setting.model`, `bot-automation.model`, `game.model`, `provider.model`
> Constants thiếu: `game-menu-defaults`, `gsc-environments-defaults`

---

## Bước 1 — Đọc context

**Bắt buộc đọc trước:**

1. `apps/backend/src/config/index.ts` — FULL content (xem keys đang có)
2. `apps/backend/src/main/controllers/gs-pay.controller.ts` — xem dùng `config.gsPay` như thế nào
3. `apps/backend/src/main/controllers/nowpay.controller.ts` — xem dùng `config.nowpay`
4. `apps/backend/src/main/services/slot-casino.service.ts` — xem dùng `config.slot`
5. `apps/backend/src/utils/sendgrid.ts` — xem dùng `config.sendGridApiKey`
6. `apps/backend/src/main/services/bot-automation.service.ts` — xem import `bot-automation.model`
7. `apps/backend/src/main/services/game-menu.service.ts` — xem import `game-menu-defaults`
8. `apps/backend/src/main/services/gsc-catalog-sync.service.ts` — xem import `provider.model`, `gsc-environments-defaults`
9. `.env.production` — xem các env vars liên quan đến GSC/GS-Pay/NowPay/Slot

---

## Bước 2 — Mở rộng `config/index.ts`

**File:** `apps/backend/src/config/index.ts`

**Thêm các section còn thiếu** (dựa trên usage trong controllers):

```typescript
// Thêm vào config object:
gsPay: {
  opCode:    process.env.GS_PAY_OP_CODE    || process.env.GSC_OP_CODE    || '',
  secretKey: process.env.GS_PAY_SECRET_KEY || process.env.GSC_SECRET_KEY || '',
  callbackUrl: process.env.GS_PAY_CALLBACK_URL || '',
},
nowpay: {
  apiKey:     process.env.NOWPAY_API_KEY     || '',
  ipnSecret:  process.env.NOWPAY_IPN_SECRET  || '',
  sandboxMode: process.env.NOWPAY_SANDBOX === 'true',
},
slot: {
  host:        process.env.SLOT_HOST        || '',
  merchantCode: process.env.SLOT_MERCHANT_CODE || '',
  secretKey:   process.env.SLOT_SECRET_KEY  || '',
},
sendGridApiKey: process.env.SENDGRID_API_KEY || '',
exchangeRateKey: process.env.EXCHANGE_RATE_API_KEY || '',
```

**Quan trọng:**
- Đọc thực tế `gs-pay.controller.ts` để biết chính xác field nào được dùng (`config.gsPay.opCode` hay `config.gsPay.op_code`?)
- Không đoán — đọc file trước, viết code sau

---

## Bước 3 — Tạo model `setting.model.ts` (nếu chưa có)

**Kiểm tra trước:** `ls apps/backend/src/main/models/ | grep setting`

Nếu không tồn tại, tạo `apps/backend/src/main/models/setting.model.ts`:

```typescript
// Platform settings — key/value store cho admin configuration
import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: any;
  description?: string;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>({
  key:   { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
}, { timestamps: true });

export default mongoose.models['Setting'] as mongoose.Model<ISetting> ??
  mongoose.model<ISetting>('Setting', SettingSchema);
```

---

## Bước 4 — Tạo model `bot-automation.model.ts`

**Kiểm tra trước:** Đọc `bot-automation.service.ts` để biết schema cần gì.

Tạo `apps/backend/src/main/models/bot-automation.model.ts` với các fields được dùng trong service.

---

## Bước 5 — Tạo model `game.model.ts` và `provider.model.ts`

**Kiểm tra trước:**
- Đọc `slot-casino.service.ts` để biết `game.model` cần schema gì
- Đọc `gsc-catalog-sync.service.ts` để biết `provider.model` cần schema gì

Tạo minimal models với các fields thực sự được dùng.

---

## Bước 6 — Tạo constants `game-menu-defaults.ts`

**Đọc trước:** `game-menu.service.ts` để biết constant này export gì.

Tạo `apps/backend/src/main/constants/game-menu-defaults.ts` với các default values được import.

---

## Bước 7 — Tạo constants `gsc-environments-defaults.ts`

**Đọc trước:** `gsc-catalog-sync.service.ts` và `gsc-provider-games.client.ts` để biết cần gì.

Tạo `apps/backend/src/main/constants/gsc-environments-defaults.ts`.

---

## Bước 8 — Tạo `bot-runner.service.ts` và `notification.service.ts`

**Đọc trước:**
- `admin-churn.controller.ts` — xem dùng `notificationService` như thế nào
- `bot-automation.controller.ts` — xem dùng `botRunnerService` như thế nào

Tạo minimal service stubs với các methods thực sự được gọi.

---

## Bước 9 — Verify

```bash
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
```

Kỳ vọng: ≤ 10 lỗi (chỉ còn `rootDir` và `ObjectId` type mismatches).

---

## Bước 10 — Git commit

```bash
cd /var/app/game
git add apps/backend/src/config/index.ts
git add apps/backend/src/main/models/
git add apps/backend/src/main/constants/
git add apps/backend/src/main/services/bot-runner.service.ts
git add apps/backend/src/main/services/notification.service.ts
git commit -m "feat(backend): expand config keys, add missing models and constants"
```

---

## Bước 11 — Cập nhật docs

Append vào `docs/AI/CHANGELOG.md`:
```markdown
## [DAY-002] <date> — Config + models + constants
- Expanded config/index.ts: gsPay, nowpay, slot, sendGridApiKey, exchangeRateKey
- Created models: setting.model, bot-automation.model, game.model, provider.model
- Created constants: game-menu-defaults, gsc-environments-defaults
- Created services: bot-runner.service, notification.service
- TypeScript errors: N → M
```

Thêm vào `.env.production` (nếu chưa có):
```env
# === GSC/GS-Pay ===
GS_PAY_OP_CODE=
GS_PAY_SECRET_KEY=
GS_PAY_CALLBACK_URL=

# === NowPay ===
NOWPAY_API_KEY=
NOWPAY_IPN_SECRET=
NOWPAY_SANDBOX=false

# === Slot Provider ===
SLOT_HOST=
SLOT_MERCHANT_CODE=
SLOT_SECRET_KEY=

# === Exchange Rate ===
EXCHANGE_RATE_API_KEY=
```

---

## Ràng buộc

- Đọc file thực tế trước khi tạo bất kỳ schema nào
- Không đoán field names — chỉ tạo fields được dùng trong code
- Không thay đổi API response format
- Không break bất kỳ test nào đang pass
