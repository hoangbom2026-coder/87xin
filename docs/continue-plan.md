# TC-Gaming — Kế hoạch tiếp tục triển khai (Phase P1–P7)

## Tổng quan

Hệ thống TC-Gaming đã hoàn thành phần hạ tầng (deploy scripts, PM2 config, Nginx, Redis, .env.production).
Backend `routes.ts` đã mount **đủ 57 router** (đã hoàn thành).
Còn lại 4 nhóm việc cần làm để production-ready:

1. **Frontend-web App.tsx** — Wire tất cả 20+ trang vào React Router với lazy loading
2. **Frontend-web authSaga.ts** — Implement login/logout/fetchProfile effects
3. **Admin sidebar** — Mở rộng ADMIN_SIDEBAR khớp với 60+ trang trong App.tsx
4. **GitHub Actions CI/CD** — Pipeline tự động build → test → deploy lên VPS

---

## Trạng thái hiện tại (đã verify thực tế)

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `apps/backend/src/routes.ts` | ✅ **XONG** | 57 router đã mount đủ |
| `apps/frontend-web/src/services/siteService.ts` | ✅ **XONG** | Đã tồn tại và đầy đủ |
| `apps/admin-dashboard/client/lib/adminAuth.ts` | ✅ **XONG** | Token normalization đúng |
| `apps/frontend-web/src/App.tsx` | ❌ Cần rewrite | Chỉ có 1 catch-all route |
| `apps/frontend-web/src/features/auth/authSaga.ts` | ❌ Cần implement | Yields empty array |
| `apps/admin-dashboard/client/components/layout/adminSidebarData.ts` | ❌ Cần mở rộng | Chỉ có 5 items |
| `.github/workflows/` | ❌ Chưa tồn tại | Cần tạo mới |

---

## Sub-Task P1: Wire Frontend-web Router (App.tsx)

### Intent
`App.tsx` hiện chỉ có 1 `*` catch-all route. Cần wire tất cả 20+ trang đã có sẵn trong `src/pages/`
thành các route thực tế với lazy loading, ProtectedRoute cho trang cần đăng nhập, và AuthModal tích hợp.

### Trang đã có trong src/pages/
- `AboutUs/index.tsx`
- `Affiliate/index.tsx`
- `Agency/index.tsx`
- `ContactUs/index.tsx`
- `CryptoWallet/index.tsx`
- `HelpCenter/index.tsx`
- `LiveCasino/LiveCasinoMenu.tsx`
- `NotFound/index.tsx`
- `Privacy/index.tsx`
- `Promo/index.tsx`
- `ResponsibleGaming/index.tsx`
- `Store/index.tsx`
- `Terms/index.tsx`
- `VIP/index.tsx`
- `Wallet/index.tsx`, `Wallet/Deposit.tsx`, `Wallet/Withdraw.tsx`
- `Account/BetHistory.tsx`
- `Account/deposit/DepositCrypto.tsx`, `DepositEwallet.tsx`, `DepositFlashpay.tsx`, `DepositTpay.tsx`
- `Account/withdraw/WithdrawCard.tsx`, `WithdrawCrypto.tsx`, `WithdrawFlashpay.tsx`

### Routes phải wire (mapping)
```
/                     → lazy(LiveCasinoMenu) hoặc landing component (có thể dùng LiveCasinoMenu)
/games                → lazy(LiveCasinoMenu)
/promo                → lazy(Promo)
/vip                  → lazy(VIP)
/affiliate            → lazy(Affiliate)
/agency               → lazy(Agency)
/store                → lazy(Store)
/help                 → lazy(HelpCenter)
/crypto-wallet        → lazy(CryptoWallet)
/contact              → lazy(ContactUs)
/about                → lazy(AboutUs)
/privacy              → lazy(Privacy)
/terms                → lazy(Terms)
/responsible-gaming   → lazy(ResponsibleGaming)

[Protected — cần token]
/wallet               → lazy(Wallet)
/wallet/deposit       → lazy(Deposit)
/wallet/withdraw      → lazy(Withdraw)
/account/bets         → lazy(BetHistory)
/account/deposit/crypto   → lazy(DepositCrypto)
/account/deposit/ewallet  → lazy(DepositEwallet)
/account/deposit/flashpay → lazy(DepositFlashpay)
/account/deposit/tpay     → lazy(DepositTpay)
/account/withdraw/card    → lazy(WithdrawCard)
/account/withdraw/crypto  → lazy(WithdrawCrypto)
/account/withdraw/flashpay → lazy(WithdrawFlashpay)

*                     → lazy(NotFound)
```

### Expected Outcomes
- Tất cả trang navigate được bằng URL trực tiếp
- Protected routes redirect về `/` và mở AuthModal
- Lazy loading hoạt động (code splitting)
- AuthModal lắng nghe `app:open-auth` custom event (đã có `openAuthModal()`)

### Files liên quan
- `apps/frontend-web/src/App.tsx` — file cần rewrite
- `apps/frontend-web/src/routes/ProtectedRoute.tsx` — dùng lại, không sửa
- `apps/frontend-web/src/utils/openAuthModal.ts` — đã có
- `apps/frontend-web/src/components/ui/AuthModal.tsx` — đã có
- `apps/frontend-web/src/components/layout/MobileAppShell.tsx` — layout wrapper có thể dùng

### Status
[ ] pending

---

## Sub-Task P2: Implement authSaga.ts

### Intent
`authSaga.ts` hiện là stub rỗng. Cần implement 3 flow:
1. **Login** — gọi POST `/auth/login`, dispatch setToken + setUser, lưu localStorage
2. **Logout** — dispatch logout action, clear localStorage
3. **Fetch Profile** — gọi GET `/auth/me` khi app khởi động (có token trong localStorage)

### Redux Actions đã có (authSlice.ts)
- `setLoading(bool)` — bật/tắt loading
- `setUser(User | null)` — set user object
- `setToken(string | null)` — set token + sync localStorage
- `setError(string | null)` — set lỗi
- `logout()` — clear user + token + redirect

### Expected Outcomes
- App tự động fetch profile khi có token trong localStorage khi khởi động
- Login action từ AuthModal trigger đúng saga
- Logout xóa state + localStorage

### Files liên quan
- `apps/frontend-web/src/features/auth/authSaga.ts` — rewrite
- `apps/frontend-web/src/features/auth/authSlice.ts` — actions đã có, không sửa
- `apps/frontend-web/src/services/api.ts` — axios instance với interceptors
- `apps/frontend-web/src/store/rootSaga.ts` — đã import authSaga, không sửa

### Lưu ý kỹ thuật
- Dùng `takeLatest` cho login (hủy request cũ nếu gọi 2 lần liên tiếp)
- Dùng `call()` cho API calls, `put()` cho dispatch
- Fetch profile chỉ chạy 1 lần khi khởi động nếu `token` tồn tại

### Status
[ ] pending

---

## Sub-Task P3: Mở rộng Admin Sidebar Data

### Intent
`ADMIN_SIDEBAR` hiện chỉ có 5 items (Dashboard, Users, Games, Audit, Settings).
Admin App.tsx có 60+ lazy-loaded pages. Sidebar cần phản ánh đủ tất cả section quan trọng.

### Sections cần thêm (dựa trên App.tsx)
```
Management:
  Dashboard → /admin
  Users → /admin/users
  KYC → /admin/kyc
  Roles → /admin/roles
  Staff → /admin/staff
  Audit Logs → /admin/audit
  IP Management → /admin/ip
  Churn Risk → /admin/churn

Finance:
  Deposits → /admin/deposits
  Withdrawals → /admin/withdrawals
  Manual Payments → /admin/manual-payments
  Transactions → /admin/transactions
  Currencies → /admin/currencies
  Investment Logs → /admin/invest-logs

Games:
  Games Hub → /admin/games
  Game Menu → /admin/game-menu
  Daily Challenges → /admin/daily-challenges
  Store Hub → /admin/store
  Packages → /admin/packages

VIP & Bonuses:
  VIP Hub → /admin/vip
  VIP Levels → /admin/vip-levels
  VIP Tiers → /admin/vip-tiers
  Bonuses → /admin/bonuses
  Rewards → /admin/rewards
  Plans → /admin/plans
  Referrals → /admin/referrals

Affiliate & Agents:
  Affiliate Hub → /admin/affiliate
  Agents Hub → /admin/agents
  Commission Logs → /admin/commission-logs
  Affiliate Signups → /admin/affiliate-signups

Marketing & CMS:
  Banners → /admin/banners
  Promotions → /admin/promotions
  Articles → /admin/articles
  Content Blocks → /admin/content-blocks
  Media Library → /admin/media
  Newsletter → /admin/newsletter
  Bot Automation → /admin/bot-automation
  Plugins → /admin/plugins

Support:
  Tickets → /admin/tickets
  Help Center → /admin/help
  Customer Care → /admin/customer-care
  Support Chat → /admin/support-chat

Settings:
  Preference → /admin/preference
  Theme Editor → /admin/theme
  Email Settings → /admin/email-settings
  Telegram Templates → /admin/telegram
  Manage Languages → /admin/languages
  Schedules → /admin/schedules
  System Updates → /admin/system-updates
  Realtime Monitor → /admin/realtime
```

### Expected Outcomes
- Sidebar hiển thị đủ 8 sections với expand/collapse
- filterAdminSidebar() vẫn hoạt động với cấu trúc mới
- Không sửa gì AdminNavTree.tsx hay AdminLayout.tsx

### Files liên quan
- `apps/admin-dashboard/client/components/layout/adminSidebarData.ts` — rewrite
- `apps/admin-dashboard/client/App.tsx` — source of truth cho route names (chỉ đọc)

### Lucide icons cần import thêm
```
DollarSign, CreditCard, Receipt, Coins, TrendingDown, 
BarChart2, Gamepad2, Trophy, Zap, Star, Gift, Tag,
Users2, Network, PieChart, UserPlus,
Megaphone, Image, FileText, BookOpen, Library, Mail, Bot, Puzzle,
MessageSquare, HeadphonesIcon, MessagesSquare,
SlidersHorizontal, Palette, AtSign, Globe, Clock, RefreshCw, Activity
```

### Status
[ ] pending

---

## Sub-Task P4: GitHub Actions CI/CD Pipeline

### Intent
Tạo pipeline tự động khi push lên `main`:
1. **CI (pr-check.yml)**: Chạy trên PR — type-check + lint frontend-web và admin
2. **CD (deploy.yml)**: Chạy khi merge vào `main` — build → SSH upload → symlink swap → PM2 reload

### Yêu cầu VPS
- SSH key đã cấu hình trong GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- VPS path: `/var/app/game`
- PM2 đã cài, process name: `tc-api` (backend)
- Build output: `apps/backend/dist/`, `apps/frontend-web/dist/`, `apps/admin-dashboard/dist/`

### Chiến lược deploy (sequential, không song song)
```
1. Build backend (TypeScript compile)
2. Build frontend-web
3. Build admin-dashboard
4. Upload dist/ + ecosystem.production.cjs qua rsync/scp
5. SSH: npm install --production trong backend
6. SSH: pm2 reload tc-api
7. SSH: copy frontend-web/dist → /var/www/html/
8. SSH: copy admin-dashboard/dist → /var/www/admin/
9. SSH: curl health check
```

### Files cần tạo
- `.github/workflows/deploy.yml`
- `.github/workflows/pr-check.yml`

### Expected Outcomes
- Push lên `main` → tự động deploy lên VPS
- PR → type-check chạy trên CI, không deploy
- Deploy script `infra/scripts/deploy.sh` vẫn hoạt động độc lập (không thay thế)

### Status
[ ] pending

---

## Thứ tự thực hiện

```
P1 → P2 → P3 → P4
```

- P1 và P2 có thể làm song song (khác file)
- P3 độc lập hoàn toàn
- P4 cần biết build output path từ P1/P2/P3 để configure correctly

---

## Ràng buộc quan trọng

1. **Không sửa** `ProtectedRoute.tsx`, `authSlice.ts`, `rootSaga.ts`, `adminAuth.ts`, `api.ts`
2. **Không thêm dependency mới** — chỉ dùng package đã có
3. **Không thay đổi API contract** — giữ nguyên request/response shape
4. **TypeScript only** — tất cả file mới/sửa phải là `.ts` hoặc `.tsx`
5. **ag-callback + gs-callback** đã mount trong `app.ts` — KHÔNG mount lại trong routes.ts (đã đúng)
6. **backend routes.ts** — ĐÃ HOÀN THÀNH, không cần sửa
