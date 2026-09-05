[HERMES - TS-FIX-001]

Hermes, đây là task fix TypeScript errors thực tế của tc-gaming.live.
Baseline đã đo: 41 TS errors, 35 try/catch, 15 generic Error(), 15 Model imports sai.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1 — NẠP NGỮ CẢNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Đọc 2 file sau trước khi làm bất cứ điều gì:
1. /var/app/game/docs/master/ARCH_BLUEPRINT.md
2. /var/app/game/.ai/tasks/TS-FIX-001.md   ← ĐỌC TOÀN BỘ

Pattern mẫu chuẩn:
- Controller: /var/app/game/apps/backend/src/main/controllers/role.controller.ts
- Service:    /var/app/game/apps/backend/src/main/services/role.service.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 2 — THỰC HIỆN THEO THỨ TỰ (8 nhóm)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Làm đúng thứ tự dưới đây. Sau mỗi nhóm chạy verify.

[1] apps/backend/src/main/models/notification.model.ts
    → Thêm field: content?: string vào schema + INotification interface

[2] apps/backend/src/main/models/user.model.ts
    → Sửa: import { ..., Types } from 'mongoose'
    → Sửa: interface IUser extends Document<Types.ObjectId>
    → Xóa dòng _id: Schema.Types.ObjectId (Document đã có)

[3] apps/backend/src/config/index.ts
    → Thêm sau sendGridApiKey:
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@tc-gaming.live',
      adminCode: process.env.ADMIN_CODE || '',

[4] apps/backend/src/main/services/game-menu.service.ts
    → Sửa import: thêm 'type' keyword cho interface:
      import { DEFAULT_GAME_MENU, type IGameMenuItem, normalizeGameMenu } from '@main/constants/game-menu-defaults';

[5] apps/backend/src/main/services/deposit.service.ts
    → Thêm method getPlayerDeposit() alias của listDeposits()
    → Thêm vào export default

[6] apps/backend/src/main/controllers/vip-bonus.controller.ts
    apps/backend/src/main/controllers/vip-spin.controller.ts
    → Wrap ObjectId thành String(): user._id → String(user._id)
      tại tất cả chỗ truyền vào service expect string

[7] apps/backend/src/main/controllers/nowpay.controller.ts
    → Thường tự resolve sau bước 3. Nếu vẫn lỗi:
      email: (config.nowpay as any).email  tạm thời

[8] apps/backend/src/main/controllers/reagent-program.controller.ts
    apps/backend/src/main/controllers/referral-code.controller.ts
    → Cast: req.user as unknown as Record<string, unknown>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFY sau 8 nhóm trên:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
→ Phải = 0 (hoặc giảm đáng kể về 0)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 3 — ARCHITECTURE VIOLATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[AV-001] 35 try/catch → catchAsync (thứ tự: nowpay→plan→package→ag-pay→media→auth→admin-games→còn lại)
[AV-002] 15 throw new Error() → throw new ApiError(httpStatus.CODE, msg)
[AV-003] 15 Model imports trong controllers → tạo method trong service, xóa import

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL VERIFY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd /var/app/game
npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l          → 0
grep -r "try {" apps/backend/src/main/controllers/ --include="*.ts" | wc -l → 0
grep -r "throw new Error(" apps/backend/src/main/services/ --include="*.ts" | wc -l → 0
grep -r "import.*Model" apps/backend/src/main/controllers/ --include="*.ts" | wc -l → 0

Spec đầy đủ: /var/app/game/.ai/tasks/TS-FIX-001.md
