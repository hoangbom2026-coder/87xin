# Frontend Web — apps/frontend-web

## Tổng quan

React 18 + Vite + TypeScript + Redux Toolkit + Redux-Saga.
Giao diện người chơi (player-facing site).
Domain: `https://tc-gaming.live`
Port dev: `5173`.

---

## Cấu trúc thư mục

```
apps/frontend-web/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
│
└── src/
    ├── main.tsx                ← Entry point: StrictMode + render App
    ├── App.tsx                 ← Root component (149 lines)
    ├── index.css               ← Global styles
    ├── vite-env.d.ts
    │
    ├── api/                    ← API call functions (Axios-based)
    │   └── ...
    │
    ├── components/
    │   ├── layout/             ← Header, Footer, MainLayout
    │   ├── shared/             ← LanguageSwitcher, ThemeToggle, ...
    │   └── ...                 ← Domain components
    │
    ├── contexts/
    │   └── SiteContext/        ← Site-wide settings (site name, logo, config)
    │
    ├── features/               ← Feature-based modules (slice + saga + service)
    │
    ├── hooks/                  ← Custom React hooks
    │
    ├── i18n/
    │   └── LanguageContext/    ← i18n provider, t() function
    │
    ├── lib/                    ← Utilities (format, date, ...)
    │
    ├── pages/
    │   ├── Home/               ← Trang chủ (/)
    │   ├── Promo/              ← Khuyến mãi (/promotions)
    │   ├── HelpCenter/         ← Trung tâm hỗ trợ (/help-center)
    │   ├── AboutUs/            ← Giới thiệu (/about)
    │   ├── ContactUs/          ← Liên hệ (/contact)
    │   ├── Privacy/            ← Chính sách bảo mật (/privacy)
    │   ├── Terms/              ← Điều khoản (/terms)
    │   ├── ResponsibleGaming/  ← Chơi có trách nhiệm (/responsible-gaming)
    │   ├── LiveCasino/         ← Casino trực tiếp (/live-casino)
    │   ├── VIP/                ← Chương trình VIP (/vip)
    │   ├── Store/              ← Cửa hàng (/store)
    │   ├── Affiliate/          ← Affiliate portal (/affiliate)
    │   ├── Agency/             ← Đại lý (/agency)
    │   ├── CryptoWallet/       ← Ví crypto (/crypto-wallet)
    │   ├── Wallet/
    │   │   ├── Deposit/        ← Nạp tiền (/wallet/deposit)
    │   │   └── Withdraw/       ← Rút tiền (/wallet/withdraw)
    │   └── Account/            ← Tài khoản người dùng (/account/*)
    │       ├── BetHistory/     ← Lịch sử cược
    │       ├── deposit/        ← Phương thức nạp
    │       │   ├── Crypto/     ← Crypto (ETH, BNB, USDT...)
    │       │   ├── Ewallet/    ← Ví điện tử
    │       │   ├── Flashpay/   ← FlashPay
    │       │   └── Tpay/       ← TPay
    │       └── withdraw/       ← Phương thức rút
    │           ├── Card/       ← Thẻ ngân hàng
    │           ├── Crypto/     ← Crypto
    │           └── Flashpay/   ← FlashPay
    │
    ├── routes/
    │   └── ProtectedRoute.tsx  ← Guard: yêu cầu đăng nhập
    │
    ├── services/               ← Axios service functions (gọi từ sagas)
    │
    ├── store/                  ← Redux store setup
    │   ├── index.ts            ← configureStore
    │   ├── rootSaga.ts         ← all sagas
    │   └── slices/             ← Redux slices (auth, ui, domain...)
    │
    ├── types/                  ← TypeScript types
    │   └── index.ts            ← User, ApiResponse, DepositCryptoNetwork, etc.
    │
    └── utils/                  ← Helper functions
```

---

## App.tsx — Provider Stack & Routes

### Provider Stack (ngoài → trong)
```tsx
<Provider store={reduxStore}>
  <LanguageProvider>         ← i18n (vi / en)
    <SiteProvider>           ← site config context
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SiteProvider>
  </LanguageProvider>
</Provider>
```

### Routes
```
Public:
  /                         → Home (trang chủ)
  /promotions               → Promo
  /help-center              → HelpCenter
  /about                    → AboutUs
  /contact                  → ContactUs
  /privacy                  → Privacy
  /terms                    → Terms
  /responsible-gaming       → ResponsibleGaming
  /live-casino              → LiveCasino

Protected (yêu cầu đăng nhập):
  /vip                      → VIP
  /store                    → Store
  /affiliate                → Affiliate
  /agency                   → Agency
  /crypto-wallet            → CryptoWallet
  /wallet/deposit           → Deposit
  /wallet/withdraw          → Withdraw
  /account/*                → Account + sub-routes
```

---

## Redux + Saga Pattern

### Cấu trúc feature module
```
features/wallet/
├── wallet.slice.ts         ← state, actions, reducers
├── wallet.saga.ts          ← async effects (API calls)
├── wallet.service.ts       ← Axios functions
└── wallet.selectors.ts     ← memoized selectors
```

### Luồng dữ liệu
```
Component dispatch(action)
      │
      ▼
Redux store
      │ Redux-Saga watcher
      ▼
Saga (call service)
      │ Axios
      ▼
Backend API
      │
      ▼
Saga put(successAction | failAction)
      │
      ▼
Redux store → Component re-render
```

### Khi nào dùng Redux vs Local state
| Loại state | Giải pháp |
|---|---|
| Server data (fetch, cache) | Redux-Saga + slice |
| Auth user info | Redux auth slice |
| UI local (modal open, form) | `useState` |
| Shared cross-component | Redux slice hoặc Context |

---

## i18n (Internationalization)

### Sử dụng
```typescript
import { useLanguage } from '@/i18n/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  return <span>{t('common.login')}</span>;
}
```

### Locale files
```
libs/i18n/
├── vi.json      ← Tiếng Việt (default, ~12 keys hiện tại)
├── en.json      ← English
└── index.ts
```

⚠ **Status**: Chỉ có ~12 keys (FAQ agency). Hầu hết string còn hard-code. Mở rộng lên 80+ keys là Phase 5.6 trong Roadmap.

---

## VIP Page — Đọc config từ backend

```typescript
// Trang VIP fetch public endpoint (không cần auth)
GET /api/vip-tiers-config

Response: { value: IVipTier[] }

// IVipTier fields hiển thị trên trang VIP:
// - name, level, colorCode, badgeImage, cardImage
// - minValidBet (mốc cược)
// - upReward (thưởng lên cấp)
// - cashbackRate, lossReturnRate, lossReturnMax
// - fridayBonusRate, fridayBonusMax
```

Cache: Redis TTL 60s — bust ngay khi admin cập nhật config.

---

## Payment Methods (frontend)

### Nạp tiền (Deposit)
| Method | Component | Endpoint |
|---|---|---|
| Crypto | `pages/Account/deposit/Crypto/` | `/api/nowpay/*` |
| E-wallet | `pages/Account/deposit/Ewallet/` | `/api/gs-pay/*` |
| FlashPay | `pages/Account/deposit/Flashpay/` | `/api/gs-pay/*` |
| TPay | `pages/Account/deposit/Tpay/` | `/api/ag-pay/*` |

### Rút tiền (Withdraw)
| Method | Component | Endpoint |
|---|---|---|
| Thẻ ngân hàng | `pages/Account/withdraw/Card/` | `/api/wallet/withdraw` |
| Crypto | `pages/Account/withdraw/Crypto/` | `/api/nowpay/*` |
| FlashPay | `pages/Account/withdraw/Flashpay/` | `/api/gs-pay/*` |

---

## Types (src/types/index.ts)

```typescript
type User = {
  _id: string;
  username: string;
  email: string;
  role: 'player' | 'admin' | 'owner' | 'affiliate';
  vipLevel: number;
  vipXp: number;
  balance?: number;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}

type DepositCryptoNetwork = 'ETH' | 'BNB' | 'TRC20' | ...
```

---

## Build & Dev

```bash
# Dev
cd apps/frontend-web
npm run dev       # vite dev :5173, proxy /api → :8701

# Build
npm run build     # → dist/

# Typecheck
npx tsc --noEmit
```

### Env vars (VITE_*)
```
VITE_API_URL=https://tc-gaming.live/api
VITE_SOCKET_URL=https://tc-gaming.live
VITE_SITE_NAME=TC Gaming
VITE_PUBLIC_SITE_URL=https://tc-gaming.live
VITE_SUPPORT_EMAIL=support@tc-gaming.live
VITE_TELEGRAM_SUPPORT_URL=https://t.me/tcgaming_support
```
