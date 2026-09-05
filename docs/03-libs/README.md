# Shared Libraries — libs/

## Tổng quan

6 thư viện dùng chung được import qua path aliases `@game/*`.
Tất cả được khai báo là workspace packages trong `package.json` gốc.

**Quy tắc**: Libs KHÔNG được import từ `apps/`. Libs có thể import lẫn nhau nếu không tạo vòng tròn.

---

## Danh sách Libraries

| Package | Alias | Mô tả |
|---|---|---|
| `libs/ui` | `@game/ui` | shadcn/ui components + AdminLayout + DataTable |
| `libs/shared-types` | `@game/types` | TypeScript types dùng chung |
| `libs/shared-utils` | `@game/shared-utils` | Utility functions dùng chung |
| `libs/db` | `@game/db` | MongoDB + Redis connection manager |
| `libs/cron` | `@game/cron` | Cron job orchestration |
| `libs/i18n` | `@game/i18n` | Internationalization (vi/en) |

---

## @game/ui — libs/ui

### Mục đích
Thư viện UI component duy nhất cho toàn monorepo. **Không tạo component mới trong `apps/`** — mọi component dùng chung phải nằm ở đây.

### Exports (`libs/ui/src/index.ts`)
```typescript
// Layout
export { AdminLayout } from './AdminLayout';
export { DataTable } from './DataTable';

// shadcn/ui primitives
export { Button }      from './components/button';
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter }
                       from './components/card';
export { Input }       from './components/input';
export { Label }       from './components/label';
export { Badge }       from './components/badge';
export { Separator }   from './components/separator';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
                       from './components/table';
export { Tabs, TabsContent, TabsList, TabsTrigger }
                       from './components/tabs';
export { Switch }      from './components/switch';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
                       from './components/select';
export { ScrollArea }  from './components/scroll-area';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
                       from './components/dialog';
export { Alert, AlertDescription } from './components/alert';
export { Toaster }     from './components/toaster';
export { useToast, toast } from './use-toast';
// ... 30+ more components
```

### DataTable
```tsx
import { DataTable } from "@game/ui";

// Cột định nghĩa theo TanStack Table ColumnDef
const columns: ColumnDef<MyType>[] = [
  { accessorKey: 'username', header: 'Tên' },
  { accessorKey: 'email', header: 'Email' },
  {
    id: 'actions',
    cell: ({ row }) => <Button onClick={() => edit(row.original)}>Sửa</Button>
  }
];

<DataTable
  columns={columns}
  data={data}
  searchKey="username"        // optional: search box
  pagination                  // optional: hiện pagination
/>
```

### shadcn/ui Component List (50+)
`accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `calendar`, `card`, `carousel`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `pagination`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `toggle-group`, `tooltip`

⚠ **shadcn/ui components là owned code** — không phải npm dependency. Update = chạy lại `shadcn-ui add <component>` + merge thủ công.

### Cấu trúc thư mục
```
libs/ui/
├── package.json             ← { "name": "@game/ui" }
└── src/
    ├── index.ts             ← barrel exports
    ├── AdminLayout.tsx      ← Layout shell admin
    ├── DataTable.tsx        ← Generic data table
    └── components/
        ├── button.tsx
        ├── card.tsx
        └── ... (50+ files)
```

---

## @game/types — libs/shared-types

### Mục đích
Định nghĩa TypeScript types/interfaces dùng chung giữa backend, admin, frontend.

### Status
⚠ **Đang migrate** — hiện tại nhiều types vẫn còn duplicate trong từng app. Phase 2.3 Roadmap sẽ centralize toàn bộ.

### Exports hiện tại
```typescript
// API contract types
export type ApiResponse<T> = { success: boolean; data?: T; message?: string; error?: {...} }

// User
export type IUser = { _id: string; username: string; email: string; role: UserRole; ... }
export type UserRole = 'player' | 'admin' | 'owner' | 'affiliate'

// VIP
export type IVipTier = { level: number; name: string; minValidBet: number; ... }

// Pagination
export type PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number; }
```

### Cấu trúc
```
libs/shared-types/
├── package.json             ← { "name": "@game/types" }
└── src/
    └── index.ts             ← barrel exports
```

---

## @game/shared-utils — libs/shared-utils

### Mục đích
Utility functions không phụ thuộc framework, dùng trong cả backend lẫn frontend.

### Exports
```typescript
// Format
export function formatVnd(amount: number): string     // 1500000 → "1,500,000"
export function formatShort(amount: number): string   // 1500000 → "1.5 triệu"
export function formatDate(date: Date | string): string

// Validation
export function isValidHex(color: string): boolean
export function isValidEmail(email: string): boolean

// Misc
export function clamp(value: number, min: number, max: number): number
export function slugify(text: string): string
```

### Cấu trúc
```
libs/shared-utils/
├── package.json             ← { "name": "@game/shared-utils" }
└── src/
    ├── index.ts             ← re-export từ ./config
    └── config.ts            ← utility implementations
```

---

## @game/db — libs/db

### Mục đích
Centralized database connection. Tất cả apps/services khởi tạo DB qua đây.

### API (`libs/db/index.ts`)
```typescript
// Kết nối MongoDB + Redis
export async function connectDatabase(url?: string): Promise<void>

// Redis client (global, có thể undefined nếu Redis không có)
export const redis: RedisClient | null

// Re-export mongoose
export { default as mongoose } from 'mongoose'

// Interface
export interface DbConfig {
  mongoUrl: string;
  redisUrl?: string;
}
```

### Sử dụng (trong backend index.ts)
```typescript
import { connectDatabase } from '@game/db';

await connectDatabase(config.mongoose.url);
```

### Redis Fallback
Nếu Redis không kết nối được → `redis = null`, app vẫn chạy bình thường. Chỉ mất cache (session lookup đi thẳng MongoDB).

### Cấu trúc
```
libs/db/
├── package.json             ← { "name": "@game/db" }
└── index.ts
```

---

## @game/cron — libs/cron

### Mục đích
Orchestrate tất cả cron jobs. Entry point duy nhất để khởi động scheduled tasks.

### API (`libs/cron/index.ts`)
```typescript
// Khởi động tất cả crons (gọi từ backend index.ts)
export function startAllCrons(): void

// Individual crons (re-export từ backend cron modules)
export { startAffiliateDailyCron }       // mỗi ngày 00:05
export { startAffiliateFakeFeedCron }    // mỗi 5 phút
export { startAgencyInvestmentInterestCron }  // mỗi ngày 01:00
```

### Sử dụng (trong backend index.ts)
```typescript
import { startAllCrons } from '@game/cron';

// Sau khi DB connected
startAllCrons();
```

### Cron Details
| Cron | Schedule | Mô tả |
|---|---|---|
| `affiliate-daily` | `0 5 0 * * *` (00:05 daily) | Tổng hợp affiliate stats ngày hôm trước vào `affiliate-stats` collection |
| `affiliate-fake-feed` | `0 */5 * * * *` (mỗi 5 phút) | Sinh fake feed items cho giao diện realtime giả |
| `agency-investment-interest` | `0 0 1 * * *` (01:00 daily) | Tính và credit lãi đầu tư cho các đại lý |

### Cấu trúc
```
libs/cron/
├── package.json             ← { "name": "@game/cron" }
└── index.ts                 ← re-export + startAllCrons()
```

---

## @game/i18n — libs/i18n

### Mục đích
Locale files và i18n utilities cho frontend-web.

### Sử dụng
```typescript
import { useLanguage } from '@game/i18n';

const { t, language, setLanguage } = useLanguage();
// language: 'vi' | 'en'
// t('key.path') → string
```

### Locale files
```
libs/i18n/
├── package.json
├── index.ts                 ← export LanguageProvider, useLanguage
├── vi.json                  ← Tiếng Việt (~12 keys hiện tại)
└── en.json                  ← English (~12 keys)
```

### Keys hiện có (vi.json)
Chủ yếu là FAQ cho agency. Ví dụ:
```json
{
  "agency": {
    "faq": {
      "title": "Câu hỏi thường gặp",
      "q1": "...",
      "a1": "..."
    }
  }
}
```

⚠ **Phase 5.6**: Mở rộng từ 12 → 80+ keys, cover toàn bộ strings trong frontend-web.

---

## Thêm Library Mới

1. Tạo thư mục `libs/my-lib/`
2. Tạo `libs/my-lib/package.json`:
```json
{
  "name": "@game/my-lib",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts"
}
```
3. Thêm path alias vào `tsconfig.base.json`:
```json
"@game/my-lib": ["libs/my-lib/index.ts"]
```
4. Thêm vào workspaces trong root `package.json`:
```json
"workspaces": ["...", "libs/my-lib"]
```
5. Chạy `npm install` ở root.
