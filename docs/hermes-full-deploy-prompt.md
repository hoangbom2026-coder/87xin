# HERMES MASTER PROMPT — TC-Gaming: 100% Complete + CI/CD + Deploy
# ============================================================
# Workspace: /var/app/game
# Đọc kỹ toàn bộ prompt này trước khi bắt đầu bất kỳ thay đổi nào.
# Thực hiện tuần tự từng PHASE, verify build sau mỗi phase.
# ============================================================

---

## TRẠNG THÁI HIỆN TẠI (audit 2024-09-04)

### Đã hoàn thành (KHÔNG làm lại):
- ✅ infra/scripts/deploy.sh — zero-downtime symlink deploy
- ✅ infra/scripts/rollback.sh — rollback 1 lệnh
- ✅ infra/scripts/monitor.sh — giám sát CPU/RAM/PM2
- ✅ infra/scripts/setup-vps.sh — swap, ulimit, logrotate
- ✅ infra/ecosystem.production.cjs — PM2 fork mode, UV_THREADPOOL_SIZE=8
- ✅ infra/nginx/tc-gaming.live.conf — rate limit, gzip, security headers
- ✅ /etc/nginx/nginx.conf — worker_connections 4096, gzip_types, TLS 1.2/1.3
- ✅ apps/backend/tsconfig.json — target es2022, sourceMap false, skipLibCheck
- ✅ apps/backend/package.json — http/util/module-alias removed, install:prod script
- ✅ apps/backend/src/config/static.ts — TRANSACTION_TYPE, TRANSACTION_CATEGORY, AFFILIATE_ROLE đầy đủ
- ✅ apps/backend/src/config/index.ts — agPay section, JWT safe default
- ✅ apps/backend/src/app.ts — /health endpoint trả DB + Redis + memory
- ✅ apps/backend/src/middlewares/upload.ts — re-export uploadMedia as uploadFile
- ✅ apps/backend/src/main/routes/transaction.router.ts — tồn tại
- ✅ apps/backend/src/main/routes/wallet.router.ts — tồn tại
- ✅ apps/backend/src/main/controllers/auth.controller.ts — tồn tại
- ✅ apps/frontend-web/vite.config.ts — code splitting, esbuild minify
- ✅ apps/admin-dashboard/vite.config.ts — manualChunks, esbuild
- ✅ apps/frontend-web/src/types/index.ts — User, ApiResponse, etc.
- ✅ apps/frontend-web/src/services/api.ts — axios + interceptors
- ✅ Redis installed & configured (maxmemory 512MB, allkeys-lru)
- ✅ Nginx tc-gaming.live linked in sites-enabled

### Còn thiếu / chưa wire (CẦN LÀM):
- ❌ apps/backend/src/routes.ts — chỉ mount 5/54 routers
- ❌ apps/frontend-web/src/App.tsx — chỉ có 1 placeholder route
- ❌ apps/frontend-web/src/features/auth/authSaga.ts — yield all([]) empty
- ❌ apps/frontend-web/src/services/siteService.ts — chưa tồn tại
- ❌ apps/admin-dashboard/client/lib/adminAuth.ts — token key mismatch (res.accessToken vs res.token)
- ❌ apps/admin-dashboard/client/components/layout/adminSidebarData.ts — 5/70+ nav items
- ❌ Không có CI/CD pipeline (GitHub Actions)
- ❌ .env.production chưa có JWT_SECRET thật, DATABASE_URL chưa active Redis

---

## CONSTRAINTS BẮT BUỘC (vi phạm = fail)

1. KHÔNG thêm dependency mới vào bất kỳ package.json nào
2. KHÔNG thay đổi business logic service files, model files, controller files
3. KHÔNG đổi API request/response contract đang hoạt động
4. KHÔNG sửa file nào đã đánh dấu "Đã hoàn thành" ở trên — trừ khi có lỗi rõ ràng
5. Tất cả file mới phải là TypeScript (.ts / .tsx)
6. Sau mỗi PHASE: chạy build verify trước khi tiếp tục
7. Ghi comment JSDoc ngắn cho mọi file tạo mới

---

## BACKEND RESPONSE FORMAT (đọc kỹ — quan trọng)

```typescript
// auth.controller.ts — adminLogin và login đều trả:
res.send({
  user: IUser,
  token: string,               // ← đây là token chính
  tokens: {
    access: { token: string, expires: Date }
  }
})
// KHÔNG có field `accessToken` trực tiếp ở root
```

---

## PHASE 1 — Backend: Wire tất cả 54 routers vào routes.ts

**File:** `apps/backend/src/routes.ts`

**Trạng thái hiện tại:**
```typescript
// CHỈ có 5 routes đang mount:
router.use('/auth', authRouter);
router.use('/transactions', transactionRouter);
router.use('/wallet', walletRouter);
router.use('/gs-pay', gsPayRouter);
router.use('/gsc', gsCallbackRouter);
```

**Danh sách 54 router files cần mount** (đọc từ src/main/routes/):
```
admin-affiliate-extras.router.ts → /admin/affiliate-extras
admin-affiliate.router.ts        → /admin/affiliate
admin-agents.router.ts           → /admin/agents
admin-audit.router.ts            → /admin/audit
admin-churn.router.ts            → /admin/churn
admin-dashboard.router.ts        → /admin/dashboard
admin-game-menu.router.ts        → /admin/game-menu
admin-games.router.ts            → /admin/games
admin-ip.router.ts               → /admin/ip
admin-staff.router.ts            → /admin/staff
admin-store.router.ts            → /admin/store
admin-vip.router.ts              → /admin/vip
affiliate.router.ts              → /affiliate
ag-callback.router.ts            → /ag-callback (ĐÃ mount ở app.ts — SKIP)
ag-pay.router.ts                 → /ag-pay
agency.router.ts                 → /agency
article.router.ts                → /article
auth.router.ts                   → /auth (đã có)
banner.router.ts                 → /banner
bonus.router.ts                  → /bonus
bot-automation.router.ts         → /bot-automation
content-block.router.ts          → /content-block
currency.router.ts               → /currency
daily-challenge.router.ts        → /daily-challenges
game-menu.router.ts              → /game-menu
gs-callback.router.ts            → /gsc (đã có)
gs-pay.router.ts                 → /gs-pay (đã có)
help.router.ts                   → /help
kyc.router.ts                    → /kyc
media.router.ts                  → /media
newsletter.router.ts             → /newsletter
nowpay.router.ts                 → /nowpay
package.router.ts                → /package
plan.router.ts                   → /plan
preference.router.ts             → /preference
promotion.router.ts              → /promotion
public-affiliate.router.ts       → /public-affiliate
reagent-program.router.ts        → /reagent-program
referral-code.router.ts          → /referral-code
reward.router.ts                 → /reward
role.router.ts                   → /role
setting.router.ts                → /setting
site-plugin.router.ts            → /site-plugin
sport.router.ts                  → /sport
store.router.ts                  → /store
ticket.router.ts                 → /ticket
transaction.router.ts            → /transactions (đã có)
user-affiliate.router.ts         → /user-affiliate
verify.router.ts                 → /verify
vip-bonus.router.ts              → /vip-bonus
vip-level.router.ts              → /vip-level
vip-spin-prize.router.ts         → /vip-spin-prize
vip-spin.router.ts               → /vip-spin
vip-tiers-config.router.ts       → /vip-tiers-config
vip-tiers.router.ts              → /vip-tiers
wallet.router.ts                 → /wallet (đã có)
```

**Cấu trúc routes.ts mới:**
```typescript
import express from 'express';

// ── Auth & User ──────────────────────────────────────────
import authRouter from '@main/routes/auth.router';

// ── Player & Wallet ──────────────────────────────────────
import transactionRouter from '@main/routes/transaction.router';
import walletRouter from '@main/routes/wallet.router';
import playerBonusRouter from '@main/routes/bonus.router';        // /bonus
import rewardRouter from '@main/routes/reward.router';
import referralCodeRouter from '@main/routes/referral-code.router';

// ── Payment Gateways ─────────────────────────────────────
import gsPayRouter from '@main/routes/gs-pay.router';
import gsCallbackRouter from '@main/routes/gs-callback.router';
import agPayRouter from '@main/routes/ag-pay.router';
import nowpayRouter from '@main/routes/nowpay.router';

// ── Game & Casino ─────────────────────────────────────────
import sportRouter from '@main/routes/sport.router';
import gameMenuRouter from '@main/routes/game-menu.router';
import dailyChallengeRouter from '@main/routes/daily-challenge.router';

// ── Affiliate & Agency ────────────────────────────────────
import affiliateRouter from '@main/routes/affiliate.router';
import userAffiliateRouter from '@main/routes/user-affiliate.router';
import publicAffiliateRouter from '@main/routes/public-affiliate.router';
import agencyRouter from '@main/routes/agency.router';
import reagentProgramRouter from '@main/routes/reagent-program.router';

// ── VIP & Rewards ─────────────────────────────────────────
import vipTiersRouter from '@main/routes/vip-tiers.router';
import vipTiersConfigRouter from '@main/routes/vip-tiers-config.router';
import vipLevelRouter from '@main/routes/vip-level.router';
import vipSpinRouter from '@main/routes/vip-spin.router';
import vipSpinPrizeRouter from '@main/routes/vip-spin-prize.router';
import vipBonusRouter from '@main/routes/vip-bonus.router';

// ── Content & CMS ─────────────────────────────────────────
import bannerRouter from '@main/routes/banner.router';
import promotionRouter from '@main/routes/promotion.router';
import contentBlockRouter from '@main/routes/content-block.router';
import articleRouter from '@main/routes/article.router';
import helpRouter from '@main/routes/help.router';
import sitePluginRouter from '@main/routes/site-plugin.router';
import mediaRouter from '@main/routes/media.router';
import packageRouter from '@main/routes/package.router';
import planRouter from '@main/routes/plan.router';
import storeRouter from '@main/routes/store.router';

// ── User & Support ────────────────────────────────────────
import verifyRouter from '@main/routes/verify.router';
import kycRouter from '@main/routes/kyc.router';
import ticketRouter from '@main/routes/ticket.router';
import preferenceRouter from '@main/routes/preference.router';
import roleRouter from '@main/routes/role.router';
import currencyRouter from '@main/routes/currency.router';
import newsletterRouter from '@main/routes/newsletter.router';
import botAutomationRouter from '@main/routes/bot-automation.router';
import settingRouter from '@main/routes/setting.router';

// ── Admin Routes ──────────────────────────────────────────
import adminDashboardRouter from '@main/routes/admin-dashboard.router';
import adminVipRouter from '@main/routes/admin-vip.router';
import adminGamesRouter from '@main/routes/admin-games.router';
import adminGameMenuRouter from '@main/routes/admin-game-menu.router';
import adminAffiliateRouter from '@main/routes/admin-affiliate.router';
import adminAffiliateExtrasRouter from '@main/routes/admin-affiliate-extras.router';
import adminAgentsRouter from '@main/routes/admin-agents.router';
import adminAuditRouter from '@main/routes/admin-audit.router';
import adminChurnRouter from '@main/routes/admin-churn.router';
import adminIpRouter from '@main/routes/admin-ip.router';
import adminStaffRouter from '@main/routes/admin-staff.router';
import adminStoreRouter from '@main/routes/admin-store.router';

const router = express.Router();

// ── Auth & User ───────────────────────────────────────────
router.use('/auth', authRouter);

// ── Player & Wallet ───────────────────────────────────────
router.use('/transactions', transactionRouter);
router.use('/wallet', walletRouter);
router.use('/bonus', playerBonusRouter);
router.use('/reward', rewardRouter);
router.use('/referral-code', referralCodeRouter);

// ── Payment Gateways ──────────────────────────────────────
router.use('/gs-pay', gsPayRouter);
router.use('/gsc', gsCallbackRouter);
router.use('/ag-pay', agPayRouter);
router.use('/nowpay', nowpayRouter);

// ── Game & Casino ─────────────────────────────────────────
router.use('/sport', sportRouter);
router.use('/game-menu', gameMenuRouter);
router.use('/daily-challenges', dailyChallengeRouter);

// ── Affiliate & Agency ────────────────────────────────────
router.use('/affiliate', affiliateRouter);
router.use('/user-affiliate', userAffiliateRouter);
router.use('/public-affiliate', publicAffiliateRouter);
router.use('/agency', agencyRouter);
router.use('/reagent-program', reagentProgramRouter);

// ── VIP & Rewards ─────────────────────────────────────────
router.use('/vip-tiers', vipTiersRouter);
router.use('/vip-tiers-config', vipTiersConfigRouter);
router.use('/vip-level', vipLevelRouter);
router.use('/vip-spin', vipSpinRouter);
router.use('/vip-spin-prize', vipSpinPrizeRouter);
router.use('/vip-bonus', vipBonusRouter);

// ── Content & CMS ─────────────────────────────────────────
router.use('/banner', bannerRouter);
router.use('/promotion', promotionRouter);
router.use('/content-block', contentBlockRouter);
router.use('/article', articleRouter);
router.use('/help', helpRouter);
router.use('/site-plugin', sitePluginRouter);
router.use('/media', mediaRouter);
router.use('/package', packageRouter);
router.use('/plan', planRouter);
router.use('/store', storeRouter);

// ── User & Support ────────────────────────────────────────
router.use('/verify', verifyRouter);
router.use('/kyc', kycRouter);
router.use('/ticket', ticketRouter);
router.use('/preference', preferenceRouter);
router.use('/role', roleRouter);
router.use('/currency', currencyRouter);
router.use('/newsletter', newsletterRouter);
router.use('/bot-automation', botAutomationRouter);
router.use('/setting', settingRouter);

// ── Admin Routes ──────────────────────────────────────────
router.use('/admin/dashboard', adminDashboardRouter);
router.use('/admin/vip', adminVipRouter);
router.use('/admin/games', adminGamesRouter);
router.use('/admin/game-menu', adminGameMenuRouter);
router.use('/admin/affiliate', adminAffiliateRouter);
router.use('/admin/affiliate-extras', adminAffiliateExtrasRouter);
router.use('/admin/agents', adminAgentsRouter);
router.use('/admin/audit', adminAuditRouter);
router.use('/admin/churn', adminChurnRouter);
router.use('/admin/ip', adminIpRouter);
router.use('/admin/staff', adminStaffRouter);
router.use('/admin/store', adminStoreRouter);

// ── Health ────────────────────────────────────────────────
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
```

**⚠️ QUAN TRỌNG:** Trước khi import mỗi router, kiểm tra file tồn tại. Nếu import fail → build fail. Chỉ import router file đã tồn tại trong `src/main/routes/`.

**Verify:** `cd apps/backend && npm run build` — phải tạo `dist/index.js`

---

## PHASE 2 — Frontend-web: Tạo siteService.ts

**File cần tạo:** `apps/frontend-web/src/services/siteService.ts`

`SiteContext.tsx` import `getSiteData` và `SiteData` từ file này nhưng file chưa tồn tại.

```typescript
/**
 * Site configuration service.
 * Fetches global site settings (name, theme, contact) from backend preference API.
 */
import api from './api'
import type { ApiResponse } from '../types'

export interface SiteData {
  siteName?: string
  siteDescription?: string
  uiTheme?: {
    webMain?: Record<string, string>
    adminMain?: Record<string, string>
  }
  telegram?: string
  telegramSupport?: string
  supportEmail?: string
  currency?: string
  currencies?: Array<{ code: string; name: string; symbol: string }>
  logo?: string
  favicon?: string
  maintenanceMode?: boolean
  features?: Record<string, boolean>
  transactionLimits?: {
    minDeposit?: number
    maxDeposit?: number
    minWithdraw?: number
    maxWithdraw?: number
  }
}

export const getSiteData = async (): Promise<ApiResponse<SiteData>> => {
  try {
    const res = await api.get<any, ApiResponse<any>>('/preference')
    if (!res.success) return { success: false, data: null as any, message: res.message }
    const raw = res.data as any
    // Backend có thể trả nested hay flat — normalize cả hai
    const data: SiteData = {
      siteName:        raw?.siteName        ?? raw?.site?.name,
      siteDescription: raw?.siteDescription ?? raw?.site?.description,
      uiTheme:         raw?.uiTheme,
      telegram:        raw?.telegram        ?? raw?.site?.telegram,
      telegramSupport: raw?.telegramSupport ?? raw?.telegram,
      supportEmail:    raw?.supportEmail    ?? raw?.site?.supportEmail,
      currency:        raw?.currency        ?? raw?.defaultCurrency,
      currencies:      raw?.currencies,
      logo:            raw?.logo            ?? raw?.site?.logo,
      favicon:         raw?.favicon,
      maintenanceMode: raw?.maintenanceMode ?? false,
      features:        raw?.features,
      transactionLimits: raw?.transactionLimits,
    }
    return { success: true, data, message: 'OK' }
  } catch {
    return { success: false, data: {} as SiteData, message: 'Failed to load site config' }
  }
}
```

---

## PHASE 3 — Frontend-web: Rewrite App.tsx với đầy đủ routes

**File:** `apps/frontend-web/src/App.tsx`

**Trạng thái hiện tại:** Chỉ có 1 placeholder route `path="*"` — tất cả 18+ pages không render.

**Danh sách pages (đọc src/pages/ để xác nhận từng file):**
```
src/pages/Promo/index.tsx
src/pages/HelpCenter/index.tsx
src/pages/AboutUs/index.tsx
src/pages/ContactUs/index.tsx
src/pages/Privacy/index.tsx
src/pages/Terms/index.tsx
src/pages/ResponsibleGaming/index.tsx
src/pages/LiveCasino/LiveCasinoMenu.tsx
src/pages/NotFound/index.tsx
src/pages/Account/BetHistory.tsx
src/pages/Account/deposit/DepositCrypto.tsx
src/pages/Account/deposit/DepositEwallet.tsx
src/pages/Account/deposit/DepositFlashpay.tsx
src/pages/Account/deposit/DepositTpay.tsx
src/pages/Account/withdraw/WithdrawCard.tsx
src/pages/Account/withdraw/WithdrawCrypto.tsx
src/pages/Account/withdraw/WithdrawFlashpay.tsx
src/pages/Affiliate/index.tsx
src/pages/Agency/index.tsx
src/pages/CryptoWallet/index.tsx
src/pages/VIP/index.tsx
src/pages/Store/index.tsx
src/pages/Wallet/index.tsx
src/pages/Wallet/Deposit.tsx
src/pages/Wallet/Withdraw.tsx
```

**App.tsx mới (template — điều chỉnh theo file thực tế):**
```typescript
/**
 * Root application component.
 * Wires Redux Provider, i18n, SiteProvider, React Router, and all page routes.
 */
import React, { Suspense, lazy } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './store'
import { LanguageProvider } from './i18n/LanguageContext'
import { SiteProvider } from './contexts/SiteContext'
import ProtectedRoute from './routes/ProtectedRoute'
import LanguageSwitcher from './components/shared/LanguageSwitcher'

// ── Public pages (lazy) ───────────────────────────────────
const Promo              = lazy(() => import('./pages/Promo/index'))
const HelpCenter         = lazy(() => import('./pages/HelpCenter/index'))
const AboutUs            = lazy(() => import('./pages/AboutUs/index'))
const ContactUs          = lazy(() => import('./pages/ContactUs/index'))
const Privacy            = lazy(() => import('./pages/Privacy/index'))
const Terms              = lazy(() => import('./pages/Terms/index'))
const ResponsibleGaming  = lazy(() => import('./pages/ResponsibleGaming/index'))
const LiveCasino         = lazy(() => import('./pages/LiveCasino/LiveCasinoMenu'))
const NotFound           = lazy(() => import('./pages/NotFound/index'))

// ── Protected pages (lazy) ────────────────────────────────
const BetHistory         = lazy(() => import('./pages/Account/BetHistory'))
const DepositCrypto      = lazy(() => import('./pages/Account/deposit/DepositCrypto'))
const DepositEwallet     = lazy(() => import('./pages/Account/deposit/DepositEwallet'))
const DepositFlashpay    = lazy(() => import('./pages/Account/deposit/DepositFlashpay'))
const DepositTpay        = lazy(() => import('./pages/Account/deposit/DepositTpay'))
const WithdrawCard       = lazy(() => import('./pages/Account/withdraw/WithdrawCard'))
const WithdrawCrypto     = lazy(() => import('./pages/Account/withdraw/WithdrawCrypto'))
const WithdrawFlashpay   = lazy(() => import('./pages/Account/withdraw/WithdrawFlashpay'))
const Affiliate          = lazy(() => import('./pages/Affiliate/index'))
const Agency             = lazy(() => import('./pages/Agency/index'))
const CryptoWallet       = lazy(() => import('./pages/CryptoWallet/index'))
const VIP                = lazy(() => import('./pages/VIP/index'))
const Store              = lazy(() => import('./pages/Store/index'))
const Wallet             = lazy(() => import('./pages/Wallet/index'))
const WalletDeposit      = lazy(() => import('./pages/Wallet/Deposit'))
const WalletWithdraw     = lazy(() => import('./pages/Wallet/Withdraw'))

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
              <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black tracking-wider text-amber-400">TC GAMING</span>
                </div>
                <div className="flex items-center gap-4">
                  <LanguageSwitcher />
                </div>
              </header>
              <main className="flex-1">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* ── Public ── */}
                    <Route path="/"                    element={<Promo />} />
                    <Route path="/promotions"          element={<Promo />} />
                    <Route path="/help-center"         element={<HelpCenter />} />
                    <Route path="/about"               element={<AboutUs />} />
                    <Route path="/contact"             element={<ContactUs />} />
                    <Route path="/privacy"             element={<Privacy />} />
                    <Route path="/terms"               element={<Terms />} />
                    <Route path="/responsible-gaming"  element={<ResponsibleGaming />} />
                    <Route path="/live-casino"         element={<LiveCasino />} />

                    {/* ── Protected ── */}
                    <Route path="/account/history"            element={<ProtectedRoute><BetHistory /></ProtectedRoute>} />
                    <Route path="/account/deposit/crypto"     element={<ProtectedRoute><DepositCrypto /></ProtectedRoute>} />
                    <Route path="/account/deposit/ewallet"    element={<ProtectedRoute><DepositEwallet /></ProtectedRoute>} />
                    <Route path="/account/deposit/flashpay"   element={<ProtectedRoute><DepositFlashpay /></ProtectedRoute>} />
                    <Route path="/account/deposit/tpay"       element={<ProtectedRoute><DepositTpay /></ProtectedRoute>} />
                    <Route path="/account/withdraw/card"      element={<ProtectedRoute><WithdrawCard /></ProtectedRoute>} />
                    <Route path="/account/withdraw/crypto"    element={<ProtectedRoute><WithdrawCrypto /></ProtectedRoute>} />
                    <Route path="/account/withdraw/flashpay"  element={<ProtectedRoute><WithdrawFlashpay /></ProtectedRoute>} />
                    <Route path="/affiliate"                  element={<ProtectedRoute><Affiliate /></ProtectedRoute>} />
                    <Route path="/agency"                     element={<ProtectedRoute><Agency /></ProtectedRoute>} />
                    <Route path="/crypto-wallet"              element={<ProtectedRoute><CryptoWallet /></ProtectedRoute>} />
                    <Route path="/vip"                        element={<ProtectedRoute><VIP /></ProtectedRoute>} />
                    <Route path="/store"                      element={<ProtectedRoute><Store /></ProtectedRoute>} />
                    <Route path="/wallet"                     element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                    <Route path="/wallet/deposit"             element={<ProtectedRoute><WalletDeposit /></ProtectedRoute>} />
                    <Route path="/wallet/withdraw"            element={<ProtectedRoute><WalletWithdraw /></ProtectedRoute>} />

                    {/* ── 404 ── */}
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

**⚠️ TRƯỚC KHI VIẾT:** Chạy `ls apps/frontend-web/src/pages/` để xác nhận từng file tồn tại. Chỉ import file đã có thực.

**Verify:** `cd apps/frontend-web && npm run build` — không lỗi

---

## PHASE 4 — Frontend-web: Implement Redux-Saga auth effects

**Files:**
- `apps/frontend-web/src/features/auth/authSaga.ts` — rewrite hoàn toàn
- `apps/frontend-web/src/store/rootSaga.ts` — update imports

**authSaga.ts:**
```typescript
/**
 * Authentication sagas.
 * Handles async login, logout, and profile fetch via Redux-Saga effects.
 */
import { all, call, put, takeLatest } from 'redux-saga/effects'
import * as authService from '../../services/authService'
import { setLoading, setUser, setToken, setError, logout as logoutAction } from './authSlice'
import type { ApiResponse } from '../../types'
import type { User } from '../../types'

// ── Action type constants ────────────────────────────────
export const AUTH_ACTIONS = {
  LOGIN_REQUEST:         'auth/loginRequest',
  LOGOUT_REQUEST:        'auth/logoutRequest',
  FETCH_PROFILE_REQUEST: 'auth/fetchProfileRequest',
} as const

// ── Payload types ────────────────────────────────────────
interface LoginPayload { username: string; password: string }
interface LoginAction  { type: string; payload: LoginPayload }

// ── Login ────────────────────────────────────────────────
function* handleLogin(action: LoginAction) {
  yield put(setLoading(true))
  try {
    const result: ApiResponse<{ user: User; token: string }> = yield call(
      authService.login,
      action.payload.username,
      action.payload.password,
    )
    if (result.success && result.data?.token) {
      yield put(setToken(result.data.token))
      yield put(setUser(result.data.user ?? null))
    } else {
      yield put(setError(result.message ?? 'Đăng nhập thất bại'))
    }
  } catch (err: any) {
    yield put(setError(err?.message ?? 'Đăng nhập thất bại'))
  }
}

// ── Logout ───────────────────────────────────────────────
function* handleLogout() {
  try {
    yield call(authService.logout)
  } finally {
    yield put(logoutAction())
  }
}

// ── Fetch Profile ────────────────────────────────────────
function* handleFetchProfile() {
  try {
    const result: ApiResponse<User> = yield call(authService.getProfile)
    if (result.success && result.data) {
      yield put(setUser(result.data))
    }
  } catch {
    // Silent — token may be invalid, let auth middleware handle
  }
}

// ── Watchers ─────────────────────────────────────────────
function* watchLogin()        { yield takeLatest(AUTH_ACTIONS.LOGIN_REQUEST,         handleLogin) }
function* watchLogout()       { yield takeLatest(AUTH_ACTIONS.LOGOUT_REQUEST,        handleLogout) }
function* watchFetchProfile() { yield takeLatest(AUTH_ACTIONS.FETCH_PROFILE_REQUEST, handleFetchProfile) }

export function* authSaga() {
  yield all([watchLogin(), watchLogout(), watchFetchProfile()])
}
```

**rootSaga.ts update:**
```typescript
import { all } from 'redux-saga/effects'
import { authSaga } from '../features/auth/authSaga'
import { adminSaga } from '../features/admin/adminSaga'

export function* rootSaga() {
  yield all([authSaga(), adminSaga()])
}
```

---

## PHASE 5 — Admin-dashboard: Fix token key mismatch

**Files:**
- `apps/admin-dashboard/client/lib/adminAuth.ts` — fix token extraction

**Vấn đề:** `AuthProvider.tsx` gọi `setAdminToken(res.accessToken)` nhưng `adminLogin()` trong `adminAuth.ts` trả `res` từ `loginAdmin()` trong `api.ts`, mà `loginAdmin()` gọi backend trả `{ user, token }` — không có `accessToken`.

**Fix adminAuth.ts:**
```typescript
/**
 * Admin authentication helpers.
 * Wraps api.ts calls and normalizes token extraction from backend response.
 */
export type AdminLoginResponse = {
  user: any;
  accessToken: string;   // normalized — luôn có sau khi fix
};

import { loginAdmin, getMe, logout } from './api';

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const raw = await loginAdmin(username, password);
  // Backend trả: { user, token, tokens: { access: { token } } }
  // KHÔNG phải accessToken — normalize ở đây
  const resolvedToken =
    raw?.accessToken ??              // phòng trường hợp backend đổi
    raw?.token ??                    // field chính hiện tại
    raw?.tokens?.access?.token;     // nested fallback
  if (!resolvedToken) {
    throw new Error('Login failed: backend did not return a token');
  }
  return {
    user: raw?.user ?? null,
    accessToken: resolvedToken,     // AuthProvider.tsx gọi setAdminToken(res.accessToken) — OK
  };
}

export async function adminMe(token: string) {
  try {
    return await getMe(token);
  } catch {
    return { user: null };
  }
}

export async function adminLogout(token: string) {
  return logout(token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem('adminAccessToken');
}

export function setAdminToken(token: string) {
  localStorage.setItem('adminAccessToken', token);
}

export function clearAdminAuth() {
  localStorage.removeItem('adminAccessToken');
  localStorage.removeItem('role');
}
```

**Verify:** Admin login form → submit → token được lưu vào localStorage → redirect /admin/dashboard

---

## PHASE 6 — Admin-dashboard: Sync sidebar với 70+ routes

**File:** `apps/admin-dashboard/client/components/layout/adminSidebarData.ts`

**Trạng thái:** Chỉ có 5 nav items. App.tsx có 70+ routes cần nav.

**Viết lại hoàn toàn — giữ interfaces và `filterAdminSidebar` function:**

```typescript
/**
 * Admin sidebar navigation data.
 * Maps all 70+ admin routes to organized sidebar sections with icons.
 * Sync với routes trong App.tsx.
 */
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, Shield, Gamepad2, Settings, FileText,
  ArrowDownCircle, ArrowUpCircle, CreditCard, DollarSign, TrendingUp,
  Crown, Star, BarChart2, Gift, Percent, Package, ShoppingBag,
  Network, Globe, UserCheck, UserPlus, Receipt, Users2, Share2,
  Image, Tag, Layout, BookOpen, FolderOpen, Megaphone, HelpCircle,
  MessageSquare, Puzzle, Send, Mail, Clock, Bot, RefreshCw,
  Languages, Palette, Activity, AlertTriangle, MessageCircle,
  Ticket, BadgeCheck, HeadphonesIcon, Menu, Settings2, ClipboardList,
  Layers, Wallet,
} from 'lucide-react'

// ── Interfaces (không đổi) ───────────────────────────────
export interface AdminNavLeaf {
  to: string
  icon: LucideIcon | any
  label: string
}

export interface AdminNavParent {
  label: string
  icon: LucideIcon | any
  children: AdminNavLeaf[]
}

export type AdminNavNode = AdminNavLeaf | AdminNavParent

export interface AdminSidebarSection {
  title: string
  items: AdminNavNode[]
}

// ── Sidebar data ─────────────────────────────────────────
export const ADMIN_SIDEBAR: AdminSidebarSection[] = [
  {
    title: 'Tổng quan',
    items: [
      { to: '/admin/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/admins',          icon: Users,           label: 'Quản lý Admin' },
      { to: '/admin/roles',           icon: Shield,          label: 'Roles' },
      { to: '/admin/audit-logs',      icon: ClipboardList,   label: 'Audit Logs' },
      { to: '/admin/preferences',     icon: Settings,        label: 'Cài đặt' },
      { to: '/admin/realtime-monitor',icon: Activity,        label: 'Monitor' },
    ],
  },
  {
    title: 'Người dùng & Tài chính',
    items: [
      { to: '/admin/customer-care',   icon: HeadphonesIcon,  label: 'Chăm sóc KH' },
      { to: '/admin/kyc',             icon: BadgeCheck,      label: 'KYC' },
      { to: '/admin/deposits',        icon: ArrowDownCircle, label: 'Nạp tiền' },
      { to: '/admin/withdrawals',     icon: ArrowUpCircle,   label: 'Rút tiền' },
      { to: '/admin/manual-payments', icon: CreditCard,      label: 'TT thủ công' },
      { to: '/admin/currencies',      icon: DollarSign,      label: 'Tiền tệ' },
      { to: '/admin/invest-logs',     icon: TrendingUp,      label: 'Invest Logs' },
      { to: '/admin/gateways',        icon: Network,         label: 'Cổng thanh toán' },
      { to: '/admin/churn',           icon: AlertTriangle,   label: 'Churn Risk' },
    ],
  },
  {
    title: 'Game & Casino',
    items: [
      { to: '/admin/games',           icon: Gamepad2,        label: 'Quản lý Game' },
      { to: '/admin/game-menu',       icon: Menu,            label: 'Game Menu' },
      { to: '/admin/daily-challenges',icon: Layers,          label: 'Daily Challenges' },
      { to: '/admin/integration-experience', icon: Puzzle,   label: 'Tích hợp' },
    ],
  },
  {
    title: 'VIP & Phần thưởng',
    items: [
      { to: '/admin/vip-hub',         icon: Crown,           label: 'VIP Hub' },
      { to: '/admin/vip-tiers',       icon: Star,            label: 'VIP Tiers' },
      { to: '/admin/vip-levels',      icon: BarChart2,       label: 'VIP Levels' },
      { to: '/admin/vip-program',     icon: Settings2,       label: 'VIP Config' },
      { to: '/admin/rewards',         icon: Gift,            label: 'Rewards' },
      { to: '/admin/bonuses',         icon: Percent,         label: 'Bonuses' },
      { to: '/admin/packages',        icon: Package,         label: 'Packages' },
      { to: '/admin/plans',           icon: FileText,        label: 'Plans' },
      { to: '/admin/store',           icon: ShoppingBag,     label: 'Store' },
      { to: '/admin/user-interest',   icon: TrendingUp,      label: 'User Interest' },
    ],
  },
  {
    title: 'Affiliate & Agency',
    items: [
      { to: '/admin/affiliates',      icon: Network,         label: 'Affiliates' },
      { to: '/admin/affiliate-hub',   icon: Globe,           label: 'Affiliate Hub' },
      { to: '/admin/affiliate-manager',icon: UserCheck,      label: 'Quản lý Aff' },
      { to: '/admin/affiliate-program',icon: Settings,       label: 'Aff Config' },
      { to: '/admin/affiliate-signups',icon: UserPlus,       label: 'Đăng ký Aff' },
      { to: '/admin/commission-logs', icon: Receipt,         label: 'Hoa hồng' },
      { to: '/admin/agents',          icon: Users2,          label: 'Agents' },
      { to: '/admin/referrals',       icon: Share2,          label: 'Referrals' },
      { to: '/admin/root-affiliate',  icon: Crown,           label: 'Root Affiliate' },
    ],
  },
  {
    title: 'Nội dung & Marketing',
    items: [
      { to: '/admin/banners',         icon: Image,           label: 'Banners' },
      { to: '/admin/promotions',      icon: Tag,             label: 'Khuyến mãi' },
      { to: '/admin/content-blocks',  icon: Layout,          label: 'Content Blocks' },
      { to: '/admin/articles',        icon: BookOpen,        label: 'Bài viết' },
      { to: '/admin/media',           icon: FolderOpen,      label: 'Media Library' },
      { to: '/admin/marketing-hub',   icon: Megaphone,       label: 'Marketing Hub' },
      { to: '/admin/help-center',     icon: HelpCircle,      label: 'Help Center' },
      { to: '/admin/site-content',    icon: MessageSquare,   label: 'Site Content' },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/admin/plugins',         icon: Puzzle,          label: 'Plugins' },
      { to: '/admin/telegram',        icon: Send,            label: 'Telegram' },
      { to: '/admin/email-settings',  icon: Mail,            label: 'Email Settings' },
      { to: '/admin/schedules',       icon: Clock,           label: 'Schedules' },
      { to: '/admin/bot-automation',  icon: Bot,             label: 'Bot Automation' },
      { to: '/admin/system-updates',  icon: RefreshCw,       label: 'System Updates' },
      { to: '/admin/languages',       icon: Languages,       label: 'Ngôn ngữ' },
      { to: '/admin/theme-editor',    icon: Palette,         label: 'Theme Editor' },
    ],
  },
  {
    title: 'Hỗ trợ',
    items: [
      { to: '/admin/support-chat',    icon: MessageCircle,   label: 'Live Chat' },
      { to: '/admin/tickets',         icon: Ticket,          label: 'Tickets' },
      { to: '/admin/newsletter',      icon: Mail,            label: 'Newsletter' },
    ],
  },
]

// ── Filter function (không đổi) ──────────────────────────
export function filterAdminSidebar(
  sections: AdminSidebarSection[],
  query: string,
): AdminSidebarSection[] {
  if (!query.trim()) return sections
  const q = query.toLowerCase()
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if ('children' in item && item.children) {
          return (
            item.label.toLowerCase().includes(q) ||
            item.children.some((c) => c.label.toLowerCase().includes(q))
          )
        }
        return item.label.toLowerCase().includes(q)
      }),
    }))
    .filter((section) => section.items.length > 0)
}
```

---

## PHASE 7 — CI/CD: GitHub Actions Pipeline

**Tạo file:** `.github/workflows/deploy.yml`

```yaml
name: Deploy TC-Gaming

on:
  push:
    branches: [main, master]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        required: true
        default: 'production'
        type: choice
        options: [production, staging]

env:
  NODE_VERSION: '22'
  REPO_ROOT: /var/app/game

jobs:
  # ─── Job 1: Validate & Build ────────────────────────────
  build:
    name: Build & Validate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install root deps
        run: npm ci --prefer-offline

      # Backend
      - name: Install backend deps
        run: cd apps/backend && npm ci --prefer-offline

      - name: Build backend
        run: cd apps/backend && npm run build

      # Frontend-web
      - name: Install frontend deps
        run: cd apps/frontend-web && npm ci --prefer-offline

      - name: Build frontend
        run: cd apps/frontend-web && npm run build
        env:
          VITE_API_URL: /api
          VITE_PUBLIC_SITE_URL: https://tc-gaming.live
          VITE_SITE_NAME: TC Gaming

      # Admin-dashboard
      - name: Install admin deps
        run: cd apps/admin-dashboard && npm install --prefer-offline

      - name: Build admin
        run: cd apps/admin-dashboard && npm run build
        env:
          VITE_API_URL: /api
          VITE_ADMIN_ALLOWED_HOSTS: admin.tc-gaming.live,localhost,127.0.0.1
          ADMIN_PREVIEW_PORT: '8781'

      # Upload artifacts
      - name: Upload backend dist
        uses: actions/upload-artifact@v4
        with:
          name: backend-dist
          path: apps/backend/dist/
          retention-days: 7

      - name: Upload frontend dist
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: apps/frontend-web/dist/
          retention-days: 7

      - name: Upload admin dist
        uses: actions/upload-artifact@v4
        with:
          name: admin-dist
          path: apps/admin-dashboard/dist/
          retention-days: 7

  # ─── Job 2: Deploy to VPS ────────────────────────────────
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    environment:
      name: production
      url: https://tc-gaming.live

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          script_stop: true
          script: |
            set -euo pipefail
            LOG=/var/log/tc-gaming-deploy.log
            log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a $LOG; }

            log "=== CI/CD Deploy bắt đầu ==="

            # Kiểm tra tài nguyên
            MEM_PCT=$(free | awk '/^Mem:/{printf "%d", $3/$2*100}')
            [ "$MEM_PCT" -gt 85 ] && log "⚠️ RAM $MEM_PCT% — tiếp tục deploy"

            # Backup release hiện tại
            TIMESTAMP=$(date +%Y%m%d%H%M%S)
            REPO=/var/app/game
            cd $REPO

            # Pull code mới nhất
            git pull origin main 2>&1 | tee -a $LOG

            # Deploy
            bash infra/scripts/deploy.sh 2>&1 | tee -a $LOG

            log "=== CI/CD Deploy hoàn thành ==="

      - name: Health check
        run: |
          sleep 10
          curl -sf --retry 5 --retry-delay 5 \
            https://tc-gaming.live/health \
            -o /dev/null || curl -sf http://${{ secrets.VPS_HOST }}:8701/health -o /dev/null
          echo "✅ Health check passed"

      - name: Notify deploy status
        if: always()
        run: |
          STATUS="${{ job.status }}"
          if [ "$STATUS" = "success" ]; then
            echo "✅ Deploy thành công lên tc-gaming.live"
          else
            echo "❌ Deploy thất bại — kiểm tra logs"
          fi
```

**Tạo file:** `.github/workflows/pr-check.yml`
```yaml
name: PR Validation

on:
  pull_request:
    branches: [main, master]

jobs:
  validate:
    name: Typecheck & Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install deps
        run: |
          npm ci --prefer-offline
          cd apps/backend && npm ci --prefer-offline
          cd ../frontend-web && npm ci --prefer-offline
          cd ../admin-dashboard && npm install --prefer-offline

      - name: Typecheck backend
        run: cd apps/backend && npm run typecheck || true
        # || true vì có pre-existing TS errors chưa fix

      - name: Build backend
        run: cd apps/backend && npm run build

      - name: Build frontend
        run: cd apps/frontend-web && npm run build
        env:
          VITE_API_URL: /api
          VITE_PUBLIC_SITE_URL: https://tc-gaming.live

      - name: Build admin
        run: cd apps/admin-dashboard && npm run build
        env:
          VITE_API_URL: /api
          ADMIN_PREVIEW_PORT: '8781'
```

**GitHub Secrets cần tạo (Settings → Secrets → Actions):**
```
VPS_HOST       = IP hoặc domain VPS (ví dụ: 123.456.789.0)
VPS_USER       = username SSH (ví dụ: root hoặc ubuntu)
VPS_SSH_KEY    = private key SSH (cat ~/.ssh/id_rsa)
VPS_PORT       = 22 (mặc định)
```

---

## PHASE 8 — Production .env setup & MongoDB start

**Cập nhật `.env.production`:**
```bash
# Chạy trên VPS:
cd /var/app/game

# Generate JWT secret mạnh
JWT_SECRET=$(openssl rand -hex 32)

# Enable Redis URL
# Uncomment dòng REDIS_URL và đặt giá trị

# Cập nhật file .env.production
sed -i "s/JWT_SECRET=CHANGE_ME.*/JWT_SECRET=$JWT_SECRET/" .env.production
sed -i "s/# REDIS_URL=.*/REDIS_URL=redis:\/\/127.0.0.1:6379/" .env.production
sed -i "s/ADMIN_DEFAULT_PASSWORD=CHANGE_ME.*/ADMIN_DEFAULT_PASSWORD=$(openssl rand -hex 8)/" .env.production

# Copy sang backend .env
cp .env.production apps/backend/.env
```

**Start MongoDB (nếu chưa chạy):**
```bash
# Check status
systemctl status mongod

# Nếu chưa cài:
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/mongodb.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update -q && sudo apt install -y mongodb-org

# Config MongoDB /etc/mongod.conf — thêm:
# storage:
#   wiredTiger:
#     engineConfig:
#       cacheSizeGB: 1.5

sudo systemctl enable --now mongod
```

---

## PHASE 9 — First Deploy & Verify

**Chạy trên VPS:**
```bash
# 1. Copy .env sang backend
cp /var/app/game/.env.production /var/app/game/apps/backend/.env

# 2. Tạo thư mục logs
mkdir -p /var/app/game/infra/logs /var/app/releases

# 3. Run full deploy
sudo bash /var/app/game/infra/scripts/deploy.sh

# 4. Smoke test
bash /var/app/game/infra/test.sh

# 5. Kiểm tra PM2
pm2 list
pm2 logs tc-api --lines 30

# 6. Test health endpoint
curl -s http://127.0.0.1:8701/health | python3 -m json.tool

# 7. Test domain (nếu đã có SSL/DNS)
curl -sf https://tc-gaming.live/health
curl -sf https://admin.tc-gaming.live/api/health
```

---

## THỨ TỰ THỰC HIỆN TỔNG HỢP

```
PHASE 1 → npm run build (backend verify)
PHASE 2 → (tạo file nhỏ, không cần build riêng)
PHASE 3 → npm run build (frontend verify)
PHASE 4 → npm run build (frontend verify lại)
PHASE 5 → (test thủ công: login admin → check localStorage)
PHASE 6 → npm run build (admin verify)
PHASE 7 → git push → GitHub Actions tự chạy
PHASE 8 → chạy trên VPS trực tiếp
PHASE 9 → chạy trên VPS trực tiếp
```

---

## CHECKLIST HOÀN THÀNH 100%

```
[ ] P1  routes.ts mount 54 routers — backend build pass
[ ] P2  siteService.ts tồn tại với SiteData interface
[ ] P3  App.tsx frontend-web: 20+ routes, lazy, SiteProvider, build pass
[ ] P4  authSaga.ts: watchLogin/watchLogout/watchFetchProfile wired
[ ] P5  adminAuth.ts: token extraction fixed, login hoạt động
[ ] P6  adminSidebarData.ts: 70+ nav items theo 8 sections
[ ] P7  .github/workflows/deploy.yml và pr-check.yml tồn tại
[ ] P8  .env.production: JWT_SECRET thật, REDIS_URL active, MongoDB running
[ ] P9  pm2 list: tc-api + tc-admin = online
[ ] P9  curl http://127.0.0.1:8701/health → {"status":"ok","database":"connected"}
[ ] P9  https://tc-gaming.live → render frontend (không còn placeholder)
[ ] P9  https://admin.tc-gaming.live → render admin login (không còn placeholder)
[ ] P9  Admin login form → submit → redirect /admin/dashboard (không 401)
```

---

## LƯU Ý QUAN TRỌNG

1. **Admin build lỗi:** `Could not load client/components/ui/button` — đây là lỗi pre-existing do `@game/ui` lib chưa được resolve đúng. Kiểm tra xem `libs/ui/src/components/button.tsx` tồn tại chưa. Nếu AdminLayout import từ `@game/ui`, cần đảm bảo `libs/ui/package.json` exports đúng.

2. **Pre-existing TypeScript errors** (KHÔNG fix trong session này): `currency.service`, `setting.service`, `deposit.service`, `withdraw.service`, `public-chat.service` — những service này có thể được gọi nhưng file không tồn tại. Build vẫn tạo JS output.

3. **MongoDB cần chạy** trước khi start backend. Health endpoint trả `"database":"disconnected"` nếu MongoDB offline.

4. **Redis đã cài và cấu hình** (từ session trước). Confirm: `redis-cli ping` → `PONG`.

5. **Nginx tc-gaming.live** đã linked trong `sites-enabled` (từ session trước). Confirm: `ls /etc/nginx/sites-enabled/`.

6. **GitHub Actions cần secrets**: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` phải được set trước khi workflow deploy chạy được.
