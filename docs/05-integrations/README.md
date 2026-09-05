# Third-party Integrations — docs/05-integrations

## Tổng quan

TC-Gaming tích hợp với 3 nhóm service bên ngoài:
1. **Game Provider** — AG Casino (GSC Seamless Wallet)
2. **Payment Gateways** — GS-Pay, AG-Pay, NowPay (crypto)
3. **Communication** — SendGrid (email), Telegram Bot

---

## 1. AG Casino — GSC Seamless Wallet

### Mô tả
AG Casino (Asia Gaming) dùng giao thức **GSC Seamless Wallet API v2.0.6**.
Game server gọi backend của chúng ta để debit/credit số dư người chơi trong thời gian thực.

### Luồng hoạt động
```
Player clicks "Play Game"
       │
       ▼
Backend tạo game session URL (GET /api/casino/launch)
       │ AG API: getGameToken(merchantCode, username, secretKey)
       ▼
Player browser → AG Casino iframe
       │
       ▼  (player đặt cược)
AG Casino server → callback đến TC-Gaming backend
       │  POST /api/casino/balance     ← kiểm tra số dư
       │  POST /api/casino/debit       ← trừ tiền khi đặt cược
       │  POST /api/casino/credit      ← cộng tiền khi thắng
       │  POST /api/casino/cancel      ← hoàn tiền khi hủy round
       ▼
Backend cập nhật balance (atomic $inc)
```

### Config
```typescript
// apps/backend/src/config/index.ts
agCasino: {
  host: process.env.AG_CASINO_HOST,           // AG API endpoint
  merchantCode: process.env.AG_CASINO_MERCHANT_CODE,
  secretKey: process.env.AG_CASINO_SECRET_KEY
}
```

### Endpoints (callbacks từ AG server → TC-Gaming)
```
POST /api/casino/balance   → Kiểm tra số dư player
POST /api/casino/debit     → Trừ tiền (đặt cược)
POST /api/casino/credit    → Cộng tiền (thắng / rollback)
POST /api/casino/cancel    → Hủy giao dịch
GET  /api/casino/launch    → Tạo game URL cho player
GET  /api/casino/games     → Danh sách game
```

### Yêu cầu quan trọng
- **Timeout**: phải trả lời trong < 3 giây, nếu không AG sẽ timeout round
- **Idempotency**: AG có thể retry callbacks → phải check duplicate bằng `transactionId`
- **Atomic**: mọi balance mutation dùng Mongoose `$inc` + session
- **Signature**: verify HMAC signature trên mỗi callback

### Files liên quan
```
apps/backend/src/main/
├── controllers/ag-casino.controller.ts
├── services/ag-casino.service.ts
├── services/gsc-catalog-sync.service.ts   ← sync game catalog
├── services/gsc-provider-games.client.ts  ← AG API HTTP client
├── models/ag-game.model.ts
├── models/ag-category.model.ts
├── models/ag-log.model.ts
├── models/casino-log.model.ts
└── constants/gsc-integration.ts           ← enums, error codes
```

---

## 2. GS-Pay

### Mô tả
GS-Pay là cổng thanh toán hỗ trợ e-wallet và FlashPay (nạp/rút VND).

### Config
```typescript
gsPay: {
  host: process.env.GS_PAY_HOST,
  sn: process.env.GS_PAY_SN,                     // Serial number
  merchantName: process.env.GS_PAY_MERCHANT_NAME,
  secretKey: process.env.GS_PAY_SECRET_KEY
}
```

### Luồng nạp tiền (Deposit)
```
Player chọn GS-Pay deposit
       │
       ▼
POST /api/gs-pay/deposit
  → Backend tạo order (GS-Pay API)
  → Trả về payment URL
       │
       ▼
Player redirect → GS-Pay payment page
       │ (sau khi thanh toán)
       ▼
GS-Pay gọi webhook: POST /api/gs-pay/callback/deposit
  → Backend verify signature
  → Credit balance
  → Lưu gs-pay-deposit-log
```

### Luồng rút tiền (Withdraw)
```
Player request withdraw
       │
       ▼
POST /api/gs-pay/withdraw
  → Backend tạo payout request
       │
       ▼
GS-Pay gọi webhook: POST /api/gs-pay/callback/withdraw
  → Backend verify + update status
  → Lưu gs-pay-withdraw-log
```

### Files liên quan
```
apps/backend/src/main/
├── controllers/gs-pay.controller.ts
├── services/payment.service.ts
├── services/gs-pay-log.service.ts
├── models/gs-pay-deposit-log.model.ts
└── models/gs-pay-withdraw-log.model.ts
```

---

## 3. AG-Pay

### Mô tả
AG-Pay là cổng thanh toán nội bộ AG (TPay, ngân hàng nội địa VN).

### Config
```typescript
agPay: {
  host: process.env.AG_PAY_HOST,
  sn: process.env.AG_PAY_SN,
  merchantName: process.env.AG_PAY_MERCHANT_NAME,
  secretKey: process.env.AG_PAY_SECRET_KEY
}
```

### Endpoints
```
POST /api/ag-pay/deposit     → tạo deposit order
POST /api/ag-pay/withdraw    → tạo withdraw request
POST /api/ag-pay/callback    → webhook từ AG-Pay
```

### Files liên quan
```
apps/backend/src/main/
├── controllers/ag-pay.controller.ts
├── models/ag-payin-log.model.ts
└── models/ag-payout-log.model.ts
```

---

## 4. NowPay (Crypto)

### Mô tả
NowPay hỗ trợ thanh toán crypto (USDT TRC20, ETH, BNB, v.v.).

### Config
```typescript
nowPay: {
  apiKey: process.env.NOWPAY_API_KEY,
  ipnSecretKey: process.env.NOWPAY_IPN_SECRET,  // Webhook verification
}
```

### Luồng nạp tiền crypto
```
Player chọn Crypto deposit
       │
       ▼
POST /api/nowpay/deposit
  → NowPay API tạo payment address
  → Trả về: { payAddress, network, currency, amount }
       │
       ▼
Player gửi crypto đến address
       │ (blockchain confirm)
       ▼
NowPay IPN webhook: POST /api/nowpay/ipn
  → verify IPN signature (HMAC SHA-512)
  → khi status = 'confirmed' → credit balance
  → Lưu nowpay-deposit-log
```

### Networks hỗ trợ
`ETH`, `BSC (BEP20)`, `TRC20`, `POLYGON`, `USDT`, `BTC` (có thể mở rộng)

### Files liên quan
```
apps/backend/src/main/
├── controllers/nowpay.controller.ts
├── services/nowpay.service.ts
├── services/nowpay-withdraw.service.ts
├── models/nowpay-deposit-log.model.ts
└── models/nowpay-withdraw-log.model.ts
```

---

## 5. SendGrid (Email)

### Mô tả
Gửi email giao dịch (OTP, xác nhận, thông báo rút tiền).

### Config
```typescript
sendGrid: {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: 'noreply@tc-gaming.live',
  fromName: 'TC Gaming'
}
```

### Email templates
```
apps/backend/src/main/constants/
├── email-templates/           ← HTML templates
│   ├── otp.html
│   ├── deposit-confirm.html
│   ├── withdraw-confirm.html
│   └── welcome.html
└── email-defaults.ts          ← Subject lines, template keys
```

### Sử dụng
```typescript
import emailService from '@main/services/email.service';

await emailService.sendOtp(user.email, otpCode);
await emailService.sendDepositConfirm(user.email, amount);
```

---

## 6. Telegram Bot

### Mô tả
Gửi alerts cho admin (monitoring) và hỗ trợ player (support link).

### Config
```typescript
telegram: {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
  supportUrl: 'https://t.me/tcgaming_support'
}
```

### Dùng cho
1. **System alerts**: `infra/scripts/monitor.sh` gửi alert khi CPU/RAM/Disk vượt ngưỡng
2. **Transaction alerts**: admin nhận thông báo khi có deposit/withdraw lớn
3. **Player support**: link `VITE_TELEGRAM_SUPPORT_URL` trên frontend

### Files liên quan
```
apps/backend/src/main/
├── services/telegram.service.ts
└── constants/telegram-templates.ts   ← message templates
```

---

## Tóm tắt Security cho Callbacks/Webhooks

| Integration | Verify method |
|---|---|
| AG Casino | HMAC signature trong header |
| GS-Pay | HMAC-MD5 signature trong body |
| AG-Pay | HMAC signature trong header |
| NowPay IPN | HMAC-SHA512, key = `NOWPAY_IPN_SECRET` |

**Quy tắc chung**: Mọi webhook phải verify signature TRƯỚC khi xử lý. Nếu signature sai → trả 400 và log cảnh báo.
