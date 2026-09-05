# Admin Dashboard — apps/admin-dashboard

## Tổng quan

React 18 + Vite + TypeScript + shadcn/ui + TanStack Query.
Port: `8781` (dev), build ra `dist/` phục vụ qua Nginx.
Prefix URL: `/admin/*`.

---

## Cấu trúc thư mục

```
apps/admin-dashboard/
├── index.html
├── vite.config.ts              ← proxy /api → backend :8701
├── tsconfig.json
├── tailwind.config.ts          ← Tailwind config + CSS variables
├── components.json             ← shadcn/ui CLI config
├── package.json
│
└── client/
    ├── App.tsx                 ← Root component (218 lines)
    ├── vite-env.d.ts
    ├── global.css              ← Tailwind directives + CSS variables
    │
    ├── components/
    │   ├── admin/
    │   │   ├── AdminPageHeader.tsx  ← Header chuẩn cho mọi trang admin
    │   │   └── ...
    │   ├── auth/
    │   │   ├── AuthProvider.tsx     ← Context quản lý token
    │   │   ├── RequireUser.tsx      ← Guard: phải login
    │   │   └── RequireSuperAdmin.tsx← Guard: phải role admin/owner
    │   ├── layout/
    │   │   ├── AdminLayout.tsx      ← Shell: sidebar + topbar + outlet
    │   │   ├── AdminNavTree.tsx     ← Nav menu tree
    │   │   └── AppLayout.tsx
    │   ├── shared/
    │   │   └── ThemeToggle.tsx
    │   ├── ui/                 ← shadcn/ui components (50+ files, owned by project)
    │   └── widget/
    │       └── ChatWidget.tsx
    │
    ├── pages/
    │   ├── Auth.tsx            ← /login page
    │   ├── NotFound.tsx        ← 404
    │   ├── admin/              ← 60+ page components (xem danh sách bên dưới)
    │   └── affiliate/          ← Affiliate portal (Dashboard, Login, Register)
    │
    ├── lib/
    │   ├── adminAuth.ts        ← getAdminToken(), setAdminToken(), clearAdminToken()
    │   ├── affiliateAuth.ts    ← affiliate token helpers
    │   ├── api.ts              ← API client (tất cả functions, xem chi tiết)
    │   ├── utils.ts            ← cn(), formatVnd(), ...
    │   └── defaults/           ← Default configs (5 files)
    │
    ├── hooks/
    │   ├── use-mobile.tsx
    │   ├── use-toast.ts
    │   ├── useAdminThemeVars.ts
    │   └── useSessionTimeout.ts
    │
    ├── constants/
    │   └── gameLobbyBanners.ts
    │
    └── styles/
```

---

## App.tsx — Route Structure

```
/login                    → Auth page (public)
/                         → redirect /admin/dashboard
/admin                    → redirect /admin/dashboard
/admin/dashboard          → Dashboard
/admin/admins             → Admins (staff list)
/admin/roles              → Roles
/admin/audit-logs         → AuditLogs
/admin/vip                → VIP (legacy tier list)
/admin/vip-hub            → VIPHub
/admin/vip-levels         → VIPLevels
/admin/vip-program        → VIPProgramConfig
/admin/vip-tiers-manager  → VipTiersManager (dynamic config 10 cấp)
/admin/affiliate          → AffiliateDashboard
/admin/affiliate-hub      → AffiliateHub
/admin/affiliate-manager  → AffiliateManager
/admin/affiliate-impersonation → AffiliateImpersonation
/admin/affiliate-program  → AffiliateProgramConfig
/admin/affiliate-signups  → AffiliateSignups
/admin/commission-logs    → CommissionLogs
/admin/create-root-affiliate → CreateRootAffiliate
/admin/agents             → AgentsHub
/admin/games              → GamesHub
/admin/game-menu          → GameMenuManager
/admin/daily-challenges   → DailyChallenges
/admin/deposits           → DepositsPage
/admin/withdrawals        → WithdrawalsTab
/admin/kyc                → KYC
/admin/manual-payments    → ManualPaymentsPage
/admin/bonuses            → Bonuses
/admin/rewards            → Rewards
/admin/packages           → Packages
/admin/plans              → Plans
/admin/store              → StoreHub
/admin/banners            → Banners
/admin/articles           → ArticlePosts
/admin/articles/new       → ArticleCreate
/admin/articles/:id/edit  → ArticleEdit
/admin/article-categories → ArticleCategories
/admin/content-blocks     → ContentBlocks
/admin/help-center        → HelpCenter
/admin/site-faqs          → SiteContentFaqs
/admin/promotions         → Promotions
/admin/marketing          → MarketingHubPage
/admin/marketing-affiliate-web → MarketingAffiliateWeb
/admin/telegram-templates → TelegramTemplates
/admin/email-settings     → EmailSettings
/admin/theme-editor       → ThemeEditor
/admin/currencies         → Currencies
/admin/preferences        → Preference
/admin/gateways           → GatewayListPage
/admin/gateways/:id       → GatewayDetailPage
/admin/media-library      → MediaLibrary
/admin/plugins            → PluginsPage
/admin/system-updates     → SystemUpdates
/admin/schedules          → SchedulesPage
/admin/integrations       → IntegrationExperiencePage
/admin/languages          → ManageLanguagesPage
/admin/realtime           → RealtimeMonitor
/admin/bot-automation     → BotAutomation
/admin/tickets            → Tickets
/admin/tickets/:id        → TicketDetail
/admin/support-chat       → SupportChat
/admin/customer-care      → CustomerCare
/admin/user-interest      → UserInterestLogPage
/admin/churn-risk         → ChurnRisk
/admin/invest-logs        → InvestLogs
/admin/ip-management      → AdminIPManagement
/admin/admin-deposit-methods → AdminDepositMethods
```

---

## lib/api.ts — API Client

### Cơ chế hoạt động

```typescript
// Internal fetch wrapper — tất cả functions gọi qua đây
async function req(path: string, options: RequestInit = {}): Promise<any> {
  // 1. Lấy token từ localStorage tự động
  const token = localStorage.getItem('adminAccessToken') || localStorage.getItem('token');
  // 2. Inject Authorization header
  // 3. AbortController timeout 10s
  // 4. 401 → clear token + redirect /login
  // 5. !res.ok → throw new Error(message)
}
```

### Quy tắc quan trọng
- **KHÔNG truyền token vào arguments** — `req()` tự inject từ localStorage
- Signature convention: `functionName(data?, extraParams?)` — token KHÔNG xuất hiện trong public API
- Nếu page dùng function chưa có: phải thêm vào `api.ts`, không dựa vào Proxy fallback

### Functions hiện có (nhóm theo domain)

```typescript
// Auth
loginAdmin(username, password)
getMe()
logout()

// Settings
getBusinessSettings()
patchBusinessSettings(data)
getSystemInfoApi()

// Bonuses
getAdminBonuses()
createBonusApi(data)
updateBonusApi(id, data)
deleteBonusApi(id)

// Affiliate (basic)
createRootAffiliateAdmin(data)

// VIP
getVipTiersList()                    // legacy tier list
createVipTiersApi(data)
updateVipTiersApi(id, data)
deleteVipTiersApi(id)
getVipTiersConfig()                  // → { value: VipTier[], defaults: VipTier[] }
updateVipTiersConfig(data, token?)   // data = VipTier[], token optional
getVipStatsApi()
listVipUsersApi(params?)

// ... + Proxy dynamic fallback cho các functions chưa implement
```

### VipTier type (đầy đủ)
```typescript
export type VipTier = {
  _id?: string;
  name?: string;
  level?: number;
  minValidBet?: number;      // VND
  upReward?: number;         // VND
  cashbackRate?: number;     // %
  lossReturnRate?: number;   // %
  lossReturnMax?: number;    // VND
  fridayBonusRate?: number;  // %
  fridayBonusMax?: number;   // VND
  withdrawLimit?: number;
  colorCode?: string;        // HEX
};
```

### Functions CẦN thêm (pre-existing missing — Phase roadmap)
```
AdminIPManagement.tsx cần:   listIPAccessAdminApi, createIPAccessAdminApi,
                              updateIPAccessAdminApi, deleteIPAccessAdminApi, IPAccessItem type
Admins.tsx cần:              createStaffApi, deleteStaffApi, listStaffApi,
                              resetStaffPasswordApi, updateStaffApi, StaffUser type
AffiliateDashboard.tsx cần:  getUsers, listTransactions, listBetTransactions
AffiliateHub.tsx cần:        getAffiliateExtrasApi, patchAffiliateExtrasApi,
                              getAffiliateCounterApi, getAffiliateSignupsApi,
                              getAffiliateCommissionSplitApi, listAffiliateFeedApi
```

---

## lib/adminAuth.ts

```typescript
getAdminToken(): string | null   // localStorage.getItem('adminAccessToken')
setAdminToken(token: string)     // localStorage.setItem(...)
clearAdminToken()                // localStorage.removeItem(...)
```

---

## Quy tắc viết trang Admin (BẮT BUỘC)

### Template trang chuẩn
```tsx
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { DataTable } from "@game/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";

export default function MyAdminPage() {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Tiêu đề trang"
        description="Mô tả ngắn"
        actions={<Button>Action</Button>}
      />
      {/* content */}
    </AdminLayout>
  );
}
```

### Styling
| Đúng | Sai |
|---|---|
| `bg-card`, `bg-muted/40` | `bg-[#f7f8fa]` |
| `text-foreground`, `text-muted-foreground` | `text-[#333]` |
| `border-border/60` | `border-[#e5e7eb]` |
| `bg-primary/10`, `text-primary` | `bg-blue-100` |
| `style={{ background: colorCode }}` ← data dynamic: OK | — |

### Icon type
```typescript
// ĐÚNG
import { type LucideIcon } from "lucide-react";
icon?: LucideIcon

// SAI
icon?: React.ComponentType<{ className?: string; size?: number }>
```

---

## Tailwind & Theme

CSS variables được định nghĩa trong `global.css`:
```css
:root {
  --background: ...; --foreground: ...;
  --card: ...;       --card-foreground: ...;
  --primary: ...;    --primary-foreground: ...;
  --muted: ...;      --muted-foreground: ...;
  --border: ...;     --ring: ...;
  /* ... */
}
.dark { /* dark mode overrides */ }
```

Tailwind classes `bg-card`, `text-foreground`, etc. map 1-1 với CSS variables trên.

---

## Build & Dev

```bash
# Dev (proxy /api → :8701)
cd apps/admin-dashboard
npm run dev       # vite dev server :8781

# Build
npm run build     # → dist/

# Typecheck
npx tsc --noEmit
```

Vite config proxy:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8701'
  }
}
```
