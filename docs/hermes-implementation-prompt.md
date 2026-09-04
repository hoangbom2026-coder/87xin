# HERMES PROMPT — TC-Gaming Optimization (All 7 Sub-tasks)
# Plan file: /var/app/game/docs/optimization-plan.md
# Workspace root: /var/app/game
# Thực hiện tuần tự: Sub-task 1 → 6 → 7 → 5 → 4 → 2 → 3

---

## CONTEXT ĐẦY ĐỦ (đọc kỹ trước khi làm)

**Monorepo:** npm workspaces tại `/var/app/game`
- `apps/backend` — Express + MongoDB + Socket.IO (port 8701)
- `apps/frontend-web` — React 18 + Redux Toolkit + Redux-Saga + Vite
- `apps/admin-dashboard` — React 18 + shadcn/ui + TanStack Query + Vite
- `libs/ui` — 42 Radix UI components (@game/ui)
- `libs/shared-types` — IApiResponseList, IApiError, IUserResponse, IGameResponse
- `libs/db` — connectDatabase()
- `libs/cron` — startAllCrons()

**Path aliases (tsconfig.base.json):**
- `@game/db` → libs/db/index.ts
- `@game/cron` → libs/cron/index.ts
- `@game/ui` → libs/ui/index.ts
- `@game/shared-types` → libs/shared-types/src/index.ts
- `@main/*` → apps/backend/src/main/*
- `@utils/*` → apps/backend/src/utils/*
- `@config/*` → apps/backend/src/config/*
- `@middlewares/*` → apps/backend/src/middlewares/*

**Backend auth response (QUAN TRỌNG):**
```typescript
// auth.controller.ts adminLogin và login đều trả:
res.send({ user, token, tokens: { access: { token, expires } } })
// KHÔNG có field accessToken — chỉ có token
```

**PM2 process names:** tc-api (backend), tc-admin (admin preview)

---

## CONSTRAINTS BẮT BUỘC

1. **KHÔNG thêm dependency mới** — chỉ dùng packages đã có trong package.json
2. **KHÔNG thay đổi business logic** — chỉ wire, connect, và chuẩn hóa
3. **KHÔNG đổi API contract** (request/response shape)
4. **TypeScript** — tất cả file mới/sửa phải là `.ts` hoặc `.tsx`
5. **Sau mỗi sub-task:** chạy build/typecheck để verify không có lỗi mới
6. Giữ nguyên tất cả code đang hoạt động, chỉ thêm/sửa những gì trong plan

---

## SUB-TASK 1 — Backend: Wire tất cả routers vào routes.ts

**File cần sửa:** `/var/app/game/apps/backend/src/routes.ts`

**Vấn đề:** File hiện chỉ mount 5 routers. Trong `src/main/routes/` có 50+ router files — tất cả đang bị bỏ qua, gây ra 404 cho mọi API call.

**Cách làm:**
1. List tất cả file trong `src/main/routes/` directory
2. Với mỗi file `*.router.ts`, tạo một import và một `router.use()` call
3. Quy tắc đặt path:
   - `auth.router.ts` → `/auth` (đã có, giữ)
   - `transaction.router.ts` → `/transactions` (đã có, giữ)
   - `wallet.router.ts` → `/wallet` (đã có, giữ)
   - `gs-pay.router.ts` → `/gs-pay` (đã có, giữ)
   - `gs-callback.router.ts` → `/gsc` (đã có, giữ)
   - `ag-callback.router.ts` → `/ag-callback`
   - `ag-pay.router.ts` → `/ag-pay`
   - `admin-vip.router.ts` → `/admin/vip`
   - `admin-dashboard.router.ts` → `/admin/dashboard`
   - `admin-affiliate.router.ts` → `/admin/affiliate`
   - `admin-games.router.ts` → `/admin/games`
   - `admin-*.router.ts` → `/admin/[tên phần sau admin-]`
   - Còn lại: tên file bỏ `.router.ts`, kebab-case giữ nguyên

4. Nhóm imports theo category (comments):
   ```
   // Auth & User
   // Player & Wallet
   // Payment Gateways
   // Game & Casino
   // Affiliate & Agency
   // VIP & Rewards
   // Content & CMS
   // Admin Routes
   // Support & Misc
   ```

**Verification:** `cd apps/backend && npm run build` phải pass (có thể còn TS errors từ trước, quan trọng là không có lỗi mới từ routes.ts)

---

## SUB-TASK 6 — Chuẩn hóa shared types

**Files liên quan:**
- `/var/app/game/libs/shared-types/src/index.ts` — source of truth
- `/var/app/game/apps/frontend-web/src/types/index.ts` — cần update

**Hiện trạng libs/shared-types/src/index.ts:**
```typescript
export interface IApiResponseList<T> { items: T[]; total: number; page: number; limit: number }
export interface IApiError { status: number; message: string }
export interface IUserResponse { _id, username, email, role, status, createdAt }
export interface IGameResponse { id, name, image, provider, category, order }
```

**Cách làm:**
1. Mở `libs/shared-types/src/index.ts`, thêm các types còn thiếu mà frontend cần:
   ```typescript
   export interface IApiResponse<T = unknown> { success: boolean; data: T; message?: string }
   ```
2. Mở `frontend-web/src/types/index.ts`, thay thế/extend để dùng từ shared-types:
   - Import `IApiResponse, IApiResponseList, IUserResponse` từ `@game/shared-types`
   - `ApiResponse<T>` = re-export hoặc alias của `IApiResponse<T>`
   - `User` extend `IUserResponse` và thêm các field extra của FE: `balance?, vipLevel?, vipTier?, currency?, currencyId?, inviteCode?, invitorId?, avatar?, lockedBalance?`
   - Giữ nguyên `DepositCryptoNetwork, FinancialFaq, PromoFilterKey, PromoFilterDef` (FE-specific)
3. Verify: `cd apps/frontend-web && npm run typecheck` không có lỗi type mới

---

## SUB-TASK 7 — Frontend-web: siteService và wire SiteProvider

**Bước 1 — Check siteService:**
- `ls /var/app/game/apps/frontend-web/src/services/` — xem có `siteService.ts` chưa
- Nếu không có: tạo `/var/app/game/apps/frontend-web/src/services/siteService.ts`

**Nội dung siteService.ts cần tạo nếu thiếu:**
```typescript
import api from './api'
import type { ApiResponse } from '../types'

export interface SiteData {
  siteName?: string
  siteDescription?: string
  uiTheme?: { webMain?: Record<string, string> }
  telegram?: string
  supportEmail?: string
  currency?: string
}

export const getSiteData = async (): Promise<ApiResponse<SiteData>> => {
  const res = await api.get<any, ApiResponse<any>>('/preference')
  if (!res.success) return res as ApiResponse<SiteData>
  const raw = res.data as any
  const data: SiteData = {
    siteName: raw?.siteName ?? raw?.site?.name,
    siteDescription: raw?.siteDescription ?? raw?.site?.description,
    uiTheme: raw?.uiTheme,
    telegram: raw?.telegram ?? raw?.site?.telegram,
    supportEmail: raw?.supportEmail ?? raw?.site?.supportEmail,
    currency: raw?.currency,
  }
  return { ...res, data }
}
```

**Bước 2 — Wire SiteProvider vào App.tsx:**
```typescript
// Thêm import
import { SiteProvider } from './contexts/SiteContext'

// Wrap trong Provider stack (bên trong LanguageProvider, bên ngoài BrowserRouter):
<Provider store={store}>
  <LanguageProvider>
    <SiteProvider>          {/* THÊM */}
      <BrowserRouter>
        ...
      </BrowserRouter>
    </SiteProvider>          {/* THÊM */}
  </LanguageProvider>
</Provider>
```

---

## SUB-TASK 5 — Admin-dashboard: Fix auth token key mismatch

**Files cần sửa:**
1. `/var/app/game/apps/admin-dashboard/client/lib/adminAuth.ts`
2. `/var/app/game/apps/admin-dashboard/client/components/auth/AuthProvider.tsx`

**Vấn đề:** `AuthProvider.tsx` line `setAdminToken(res.accessToken)` — backend trả `res.token` không phải `res.accessToken`.

**Fix adminAuth.ts — hàm adminLogin:**
```typescript
export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const raw = await loginAdmin(username, password)
  // Backend response: { user, token, tokens: { access: { token } } }
  const resolvedToken = raw?.accessToken ?? raw?.token ?? raw?.tokens?.access?.token
  if (!resolvedToken) throw new Error('Login failed: no token in response')
  return {
    user: raw?.user ?? null,
    accessToken: resolvedToken,  // normalize to accessToken for AuthProvider
  }
}
```

**Fix AuthProvider.tsx:**
- Dòng `setAdminToken(res.accessToken)` giữ nguyên vì adminLogin đã normalize

**Fix App.tsx ProtectedRoute (nếu cần):**
- Chỉ check `adminAccessToken`, không fallback sang `token`:
  ```typescript
  const token = localStorage.getItem('adminAccessToken')
  ```

---

## SUB-TASK 4 — Admin-dashboard: Sync sidebar với 70+ routes

**File cần sửa:** `/var/app/game/apps/admin-dashboard/client/components/layout/adminSidebarData.ts`

**Cách làm:**
1. Đọc `App.tsx` để lấy tất cả route paths
2. Map paths thành sidebar items với icon từ lucide-react
3. Tổ chức thành sections sau:

```
Sections:
1. "Core"
   - /admin/dashboard          → LayoutDashboard "Dashboard"
   - /admin/admins             → Users "Admins"
   - /admin/roles              → Shield "Roles"
   - /admin/audit-logs         → ClipboardList "Audit Logs"
   - /admin/preferences        → Settings "Preferences"

2. "Users & Finance"
   - /admin/customer-care      → HeadphonesIcon "Customer Care"
   - /admin/kyc                → BadgeCheck "KYC"
   - /admin/deposits           → ArrowDownCircle "Deposits"
   - /admin/withdrawals        → ArrowUpCircle "Withdrawals"
   - /admin/manual-payments    → CreditCard "Manual Payments"
   - /admin/currencies         → DollarSign "Currencies"
   - /admin/invest-logs        → TrendingUp "Invest Logs"

3. "Gaming"
   - /admin/games              → Gamepad2 "Games"
   - /admin/game-menu          → Menu "Game Menu"
   - /admin/gateways           → Network "Gateways"
   - /admin/daily-challenges   → Trophy "Daily Challenges"

4. "VIP & Rewards"
   - /admin/vip-hub            → Crown "VIP Hub"
   - /admin/vip-tiers          → Star "VIP Tiers"
   - /admin/vip-levels         → BarChart2 "VIP Levels"
   - /admin/vip-program        → Settings2 "VIP Config"
   - /admin/rewards            → Gift "Rewards"
   - /admin/bonuses            → Percent "Bonuses"
   - /admin/packages           → Package "Packages"
   - /admin/plans              → FileText "Plans"
   - /admin/store              → ShoppingBag "Store"

5. "Affiliate & Agency"
   - /admin/affiliates         → Network "Affiliates"
   - /admin/affiliate-hub      → Globe "Affiliate Hub"
   - /admin/affiliate-manager  → UserCheck "Affiliate Manager"
   - /admin/affiliate-program  → Settings "Affiliate Config"
   - /admin/affiliate-signups  → UserPlus "Signups"
   - /admin/commission-logs    → Receipt "Commission Logs"
   - /admin/agents             → Users2 "Agents"
   - /admin/referrals          → Share2 "Referrals"

6. "Content & Marketing"
   - /admin/banners            → Image "Banners"
   - /admin/promotions         → Tag "Promotions"
   - /admin/content-blocks     → Layout "Content Blocks"
   - /admin/articles           → BookOpen "Articles"
   - /admin/media              → FolderOpen "Media Library"
   - /admin/marketing-hub      → Megaphone "Marketing Hub"
   - /admin/help-center        → HelpCircle "Help Center"
   - /admin/site-content       → MessageSquare "Site Content"

7. "System"
   - /admin/plugins            → Puzzle "Plugins"
   - /admin/telegram           → Send "Telegram"
   - /admin/email-settings     → Mail "Email Settings"
   - /admin/schedules          → Clock "Schedules"
   - /admin/bot-automation     → Bot "Bot Automation"
   - /admin/system-updates     → RefreshCw "System Updates"
   - /admin/languages          → Languages "Languages"
   - /admin/theme-editor       → Palette "Theme Editor"
   - /admin/realtime-monitor   → Activity "Realtime Monitor"
   - /admin/churn              → AlertTriangle "Churn Risk"

8. "Support"
   - /admin/support-chat       → MessageCircle "Support Chat"
   - /admin/tickets            → Ticket "Tickets"
   - /admin/newsletter         → Mail "Newsletter"
```

**Lưu ý:** Import tất cả icons từ `lucide-react`. Dùng `AdminNavLeaf` interface cho đơn giản (không nested), giữ `filterAdminSidebar` function nguyên.

---

## SUB-TASK 2 — Frontend-web: Wire App.tsx với tất cả pages

**File cần sửa:** `/var/app/game/apps/frontend-web/src/App.tsx`

**Hiện trạng:** App.tsx render 1 placeholder `path="*"`. Cần wire toàn bộ 18+ page directories.

**Danh sách pages và paths:**

PUBLIC routes (không cần token):
```
/                         → HomePage (lazy)
/promotions               → pages/Promo/index.tsx
/help-center              → pages/HelpCenter/index.tsx
/about                    → pages/AboutUs/index.tsx
/contact                  → pages/ContactUs/index.tsx
/privacy                  → pages/Privacy/index.tsx
/terms                    → pages/Terms/index.tsx
/responsible-gaming       → pages/ResponsibleGaming/index.tsx
/live-casino              → pages/LiveCasino/LiveCasinoMenu.tsx
*                         → pages/NotFound/index.tsx
```

PROTECTED routes (cần token từ Redux):
```
/account/history          → pages/Account/BetHistory.tsx
/account/deposit/crypto   → pages/Account/deposit/DepositCrypto.tsx
/account/deposit/ewallet  → pages/Account/deposit/DepositEwallet.tsx
/account/deposit/flashpay → pages/Account/deposit/DepositFlashpay.tsx
/account/deposit/tpay     → pages/Account/deposit/DepositTpay.tsx
/account/withdraw/card    → pages/Account/withdraw/WithdrawCard.tsx
/account/withdraw/crypto  → pages/Account/withdraw/WithdrawCrypto.tsx
/account/withdraw/flashpay → pages/Account/withdraw/WithdrawFlashpay.tsx
/affiliate                → pages/Affiliate/index.tsx
/agency                   → pages/Agency/index.tsx
/crypto-wallet            → pages/CryptoWallet/index.tsx
/vip                      → pages/VIP/index.tsx
/store                    → pages/Store/index.tsx
/wallet                   → pages/Wallet/index.tsx
/wallet/deposit           → pages/Wallet/Deposit.tsx
/wallet/withdraw          → pages/Wallet/Withdraw.tsx
```

**Cấu trúc App.tsx mới:**
```typescript
import React, { Suspense, lazy } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './store'
import { LanguageProvider } from './i18n/LanguageContext'
import { SiteProvider } from './contexts/SiteContext'
import ProtectedRoute from './routes/ProtectedRoute'
import LanguageSwitcher from './components/shared/LanguageSwitcher'

// Lazy imports cho tất cả pages
const Promo = lazy(() => import('./pages/Promo/index'))
// ... thêm tất cả pages

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0d131c]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
  </div>
)

export default function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <SiteProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-[#0d131c] text-white flex flex-col">
              <header ...>TC GAMING + LanguageSwitcher</header>
              <main className="flex-1">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Public */}
                    <Route path="/promotions" element={<Promo />} />
                    ...
                    {/* Protected */}
                    <Route path="/account/*" element={<ProtectedRoute>...</ProtectedRoute>} />
                    ...
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </BrowserRouter>
        </SiteProvider>
      </LanguageProvider>
    </Provider>
  )
}
```

**Lưu ý:** Kiểm tra từng page file tồn tại trước khi import. Nếu chưa có `pages/Wallet/index.tsx`, tạo minimal wrapper.

---

## SUB-TASK 3 — Frontend-web: Implement Redux-Saga auth effects

**File cần sửa:**
- `/var/app/game/apps/frontend-web/src/features/auth/authSaga.ts` — rewrite
- `/var/app/game/apps/frontend-web/src/store/rootSaga.ts` — update

**authService.ts API (đã có):**
```typescript
login(username, password) → ApiResponse<{ user: User, token: string }>
register(userData) → ApiResponse<any>
getProfile() → ApiResponse<User>
logout() → void (clears localStorage)
```

**authSlice.ts actions (đã có):**
`setLoading, setUser, setToken, setError, updateBalance, logout`

**authSaga.ts cần implement:**

```typescript
import { all, call, put, takeLatest } from 'redux-saga/effects'
import * as authService from '../../services/authService'
import { setLoading, setUser, setToken, setError, logout as logoutAction } from './authSlice'

// Action type constants
export const AUTH_ACTIONS = {
  LOGIN_REQUEST:          'auth/loginRequest',
  LOGOUT_REQUEST:         'auth/logoutRequest',
  FETCH_PROFILE_REQUEST:  'auth/fetchProfileRequest',
}

// Login saga
function* handleLogin(action: { type: string; payload: { username: string; password: string } }) {
  yield put(setLoading(true))
  const { username, password } = action.payload
  const result: Awaited<ReturnType<typeof authService.login>> = yield call(authService.login, username, password)
  if (result.success && result.data?.token) {
    yield put(setToken(result.data.token))
    yield put(setUser(result.data.user ?? null))
  } else {
    yield put(setError(result.message ?? 'Đăng nhập thất bại'))
  }
}

// Logout saga
function* handleLogout() {
  yield call(authService.logout)
  yield put(logoutAction())
}

// Fetch profile saga
function* handleFetchProfile() {
  const result: Awaited<ReturnType<typeof authService.getProfile>> = yield call(authService.getProfile)
  if (result.success && result.data) {
    yield put(setUser(result.data))
  }
}

// Watchers
function* watchLogin() { yield takeLatest(AUTH_ACTIONS.LOGIN_REQUEST, handleLogin) }
function* watchLogout() { yield takeLatest(AUTH_ACTIONS.LOGOUT_REQUEST, handleLogout) }
function* watchFetchProfile() { yield takeLatest(AUTH_ACTIONS.FETCH_PROFILE_REQUEST, handleFetchProfile) }

export function* authSaga() {
  yield all([watchLogin(), watchLogout(), watchFetchProfile()])
}
```

**rootSaga.ts:**
```typescript
import { all } from 'redux-saga/effects'
import { authSaga } from '../features/auth/authSaga'

export function* rootSaga() {
  yield all([authSaga()])
}
```

---

## VALIDATION CUỐI (sau khi hoàn thành tất cả)

```bash
# Backend
cd /var/app/game/apps/backend && npm run build
# Phải: tạo dist/index.js không có lỗi mới

# Frontend
cd /var/app/game/apps/frontend-web && npm run build
# Phải: tạo dist/ với nhiều chunks không có lỗi

# Admin
cd /var/app/game/apps/admin-dashboard && npm run build
# Phải: tạo dist/ không có lỗi (ngoại trừ lỗi pre-existing đã biết)

# Smoke test
bash /var/app/game/infra/test.sh
```

---

## GHI CHÚ TRIỂN KHAI

- Mỗi sub-task làm xong: verify build/typecheck trước khi sang task tiếp
- Nếu gặp lỗi TS mới (không phải pre-existing): fix trước khi tiếp tục
- Pre-existing errors (biết trước): currency.service, setting.service, deposit.service, withdraw.service, public-chat.service — KHÔNG cần fix trong plan này
- File plan: `/var/app/game/docs/optimization-plan.md` — update status sau mỗi task
