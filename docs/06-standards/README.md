# Coding Standards — docs/06-standards

## Mục đích
Đây là bộ quy tắc bắt buộc áp dụng cho toàn bộ codebase TC-Gaming.
**Mọi AI agent và developer phải tuân thủ trước khi commit.**

---

## 1. TypeScript

### General
```typescript
// strict: true trong mọi tsconfig.json
// KHÔNG dùng `any` trong function parameters — dùng `unknown` + type guard
// KHÔNG dùng `@ts-ignore` (dùng `@ts-expect-error` nếu thực sự cần, có comment giải thích)

// ĐÚNG
function process(input: unknown): string {
  if (typeof input !== 'string') throw new Error('Expected string');
  return input.trim();
}

// SAI
function process(input: any): string {
  return input.trim();
}
```

### Imports
```typescript
// Type-only imports: dùng `import type` hoặc `import { type X }`
import type { IUser } from '@game/types';
import { type LucideIcon } from 'lucide-react';

// Path aliases: luôn dùng alias, không dùng relative path qua nhiều cấp
import { AdminLayout } from '@game/ui';       // ĐÚNG
import { AdminLayout } from '../../../libs/ui'; // SAI
```

### Lucide Icons
```typescript
// ĐÚNG: dùng LucideIcon type
import { Crown, type LucideIcon } from 'lucide-react';
type Props = { icon?: LucideIcon };

// SAI: ComponentType không khớp ForwardRefExoticComponent
type Props = { icon?: React.ComponentType<{ className?: string; size?: number }> };
```

---

## 2. Backend (Express)

### Controller Pattern
```typescript
// Controller: CHỈ parse + validate + gọi service
export const getList = catchAsync(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const items = await myService.getList({ page });
  return res.send({ success: true, data: items });
});

// KHÔNG làm trong controller:
// - Gọi trực tiếp Model (phải qua service)
// - Logic nghiệp vụ phức tạp
// - Tính toán / transform data lớn
```

### Service Pattern
```typescript
// Service: chứa toàn bộ business logic
// KHÔNG import từ express, KHÔNG biết về Request/Response
export async function getList(params: { page: number }) {
  const items = await MyModel.find()
    .skip((params.page - 1) * 20)
    .limit(20)
    .lean();
  return items;
}
```

### Error Handling
```typescript
import ApiError from '@utils/ApiError';
import httpStatus from 'http-status';

// Ném ApiError — được bắt bởi error.ts middleware
throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid input: level must be 1-10');

// Wrap async controller bằng catchAsync
export const myHandler = catchAsync(async (req, res) => {
  // mọi throw trong đây được forward tới error middleware
});
```

### API Response Format
```typescript
// SUCCESS — luôn theo format này
res.send({ success: true, data: result });
res.send({ success: true, message: 'Cập nhật thành công!' });
res.send({ success: true, data: items, total, page, limit }); // paginated

// ERROR — qua error.ts middleware (từ ApiError)
// { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }

// KHÔNG trả về bare object hoặc array:
res.send(items);            // SAI
res.send({ items });        // SAI
res.send({ data: items });  // SAI (thiếu success)
```

### Mongoose Best Practices
```typescript
// Dùng .lean() cho read-only queries (hiệu suất tốt hơn)
const user = await UserModel.findById(id).lean();

// Atomic update — dùng $inc, không phải read-then-write
await BalanceModel.updateOne({ userId }, { $inc: { balance: amount } });

// Multi-document transaction khi cần ACID
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await BalanceModel.updateOne({...}, { $inc: {...} }, { session });
  await TransactionModel.create([{...}], { session });
});
```

---

## 3. Admin Dashboard (React)

### Trang Admin Template
```tsx
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function MyPage() {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Tiêu đề trang"
        description="Mô tả ngắn gọn"
        actions={
          <>
            <Button variant="outline" size="sm">Tải lại</Button>
            <Button size="sm">Thêm mới</Button>
          </>
        }
      />
      {/* nội dung trang */}
    </AdminLayout>
  );
}
```

### Data Fetching (TanStack Query)
```tsx
// READ
const { data, isLoading, refetch } = useQuery({
  queryKey: ['vip-stats'],
  queryFn: () => getVipStatsApi(),
});

// WRITE
const mutation = useMutation({
  mutationFn: (data: VipTier[]) => updateVipTiersConfig(data),
  onSuccess: () => {
    toast({ title: 'Lưu thành công!' });
    queryClient.invalidateQueries({ queryKey: ['vip-stats'] });
  },
  onError: (err) => {
    toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
  }
});
```

### Styling — Tailwind CSS Variables
```tsx
// ĐÚNG: dùng semantic tokens
<div className="bg-card border border-border/60 text-foreground">
<p className="text-muted-foreground text-xs">
<span className="bg-primary/10 text-primary">
<div className="hover:bg-muted/20">

// SAI: hex colors hoặc arbitrary values
<div className="bg-[#f7f8fa] text-[#333]">
<div className="bg-slate-50 border-slate-200">

// OK: inline style cho màu DYNAMIC từ data
<span style={{ background: tier.colorCode }}>
```

### Component tái sử dụng
```
// KHÔNG tạo component mới trong apps/admin-dashboard/client/components/ui/
// Dùng: shadcn/ui từ client/components/ui/ (đã install)
// Nếu cần component mới dùng chung → tạo trong libs/ui/src/

// ĐÚNG: dùng component đã có
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@game/ui";

// SAI: tạo component riêng khi đã có sẵn
function MyButton({ children }) { return <button>{children}</button>; }
```

---

## 4. Frontend Web (React)

### State Management
```typescript
// Server state (API data) → Redux-Saga
// UI state (modal, form) → useState
// Global client state → Redux slice

// KHÔNG dùng useEffect + fetch trực tiếp — phải qua saga
// ĐÚNG: dispatch action → saga handles fetch
dispatch(fetchWalletBalance());

// SAI: fetch trong component
useEffect(() => {
  fetch('/api/wallet/balance').then(r => r.json()).then(setBalance);
}, []);
```

### i18n
```tsx
// MỌI string hiển thị cho user → dùng t()
import { useLanguage } from '@/i18n/LanguageContext';
const { t } = useLanguage();

return <span>{t('wallet.balance')}</span>;   // ĐÚNG
return <span>Số dư</span>;                   // SAI (hard-code)
```

---

## 5. Git Workflow

### Branch naming
```
hermes/<task-id>           ← AI agent tasks
feature/<feature-name>     ← new features
fix/<bug-description>      ← bug fixes
chore/<task>               ← maintenance
```

### Commit message
```
feat(vip): thêm dynamic config 10 cấp VIP
fix(api): sửa argument order updateVipTiersConfig
fix(types): thêm fridayBonusRate, fridayBonusMax vào VipTier
chore(docs): cập nhật HERMES_CONTEXT.md
refactor(admin): extract DataTable thành shared component
test(balance): thêm unit test createBalance service
```

### Quy trình
```
1. Tạo branch từ main
2. Implement + typecheck (npx tsc --noEmit)
3. Test nếu có (npm run test)
4. Commit với message chuẩn
5. Push → tạo PR
6. PR check pass → merge vào main
7. Cập nhật docs/AI/CHANGELOG.md
```

---

## 6. Security

### TUYỆT ĐỐI KHÔNG
```bash
# Không commit secrets
.env, .env.production, .env.local   ← trong .gitignore

# Không log sensitive data
console.log(req.body.password);     # SAI
console.log(user.sessionToken);     # SAI
logger.info({ apiKey: config.key }); # SAI
```

### Validation
```typescript
// Mọi input từ client phải validate trước khi dùng
// Backend: Zod schema (đang mở rộng) hoặc manual validation
// KHÔNG tin tưởng req.body trực tiếp

const level = Math.floor(Number(req.body.level));
if (!Number.isFinite(level) || level < 0 || level > 10) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid level');
}
```

### Admin routes
```typescript
// Mọi admin route phải có admin-only middleware
router.use(adminOnly);

// Controller phải check role lần nữa cho destructive operations
if (!['admin', 'owner'].includes(req.user.role)) {
  throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
}
```

---

## 7. Logging

### Backend (Winston)
```typescript
import logger from '@utils/logger';

// Levels: error, warn, info, debug
logger.info({ event: 'deposit.created', userId, amount });
logger.warn({ event: 'rate_limit.hit', ip: req.ip });
logger.error({ event: 'db.query.failed', error: err.message, stack: err.stack });

// KHÔNG dùng console.log trong production code
// KHÔNG log passwords, tokens, API keys
```

### Format
```json
{
  "level": "info",
  "message": "deposit.created",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "requestId": "req_abc123",
  "userId": "user_xyz",
  "amount": 1500000
}
```

---

## 8. Testing

### Framework: Vitest
```typescript
// File: *.spec.ts trong __tests__/ cạnh service
// apps/backend/src/main/services/__tests__/balance.service.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creditBalance } from '../balance.service';

describe('creditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should credit user balance correctly', async () => {
    const result = await creditBalance({ userId: 'user1', amount: 100_000 });
    expect(result.balance).toBe(100_000);
  });

  it('should throw if amount is negative', async () => {
    await expect(creditBalance({ userId: 'user1', amount: -1 }))
      .rejects.toThrow('Amount must be positive');
  });
});
```

### Chạy tests
```bash
cd apps/backend
npm run test              # vitest run
npm run test:coverage     # vitest --coverage
```

### Coverage targets (Phase 5.5)
- Services: `balance`, `session`, `payment`, `vip-tiers-config` — bắt buộc
- Controllers: không cần unit test (integration test qua API)

---

## 9. Checklist trước khi commit

```
[ ] npx tsc --noEmit — không có lỗi mới
[ ] npm run lint — không có warning mới
[ ] Không có console.log còn lại
[ ] Không có TODO chưa giải quyết ảnh hưởng runtime
[ ] API functions mới đã thêm vào api.ts (admin)
[ ] Types mới đã export đúng
[ ] docs/AI/CHANGELOG.md đã cập nhật (nếu là thay đổi đáng kể)
[ ] Không commit .env hoặc secrets
```
