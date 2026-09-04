/**
 * Root Application component for frontend-web.
 * Wires Redux, LanguageProvider, SiteProvider, routing for all public and protected player pages.
 */
import React, { Suspense, lazy } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { store } from './store';
import { LanguageProvider } from './i18n/LanguageContext';
import { SiteProvider } from './contexts/SiteContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LanguageSwitcher from './components/shared/LanguageSwitcher';

// Lazy loaded public pages
const PromoPage = lazy(() => import('./pages/Promo/index'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenter/index'));
const AboutUsPage = lazy(() => import('./pages/AboutUs/index'));
const ContactUsPage = lazy(() => import('./pages/ContactUs/index'));
const PrivacyPage = lazy(() => import('./pages/Privacy/index'));
const TermsPage = lazy(() => import('./pages/Terms/index'));
const ResponsibleGamingPage = lazy(() => import('./pages/ResponsibleGaming/index'));
const LiveCasinoMenuPage = lazy(() => import('./pages/LiveCasino/LiveCasinoMenu'));
const NotFoundPage = lazy(() => import('./pages/NotFound/index'));

// Lazy loaded protected pages
const BetHistoryPage = lazy(() => import('./pages/Account/BetHistory'));
const DepositCryptoPage = lazy(() => import('./pages/Account/deposit/DepositCrypto'));
const DepositEwalletPage = lazy(() => import('./pages/Account/deposit/DepositEwallet'));
const DepositFlashpayPage = lazy(() => import('./pages/Account/deposit/DepositFlashpay'));
const DepositTpayPage = lazy(() => import('./pages/Account/deposit/DepositTpay'));
const WithdrawCardPage = lazy(() => import('./pages/Account/withdraw/WithdrawCard'));
const WithdrawCryptoPage = lazy(() => import('./pages/Account/withdraw/WithdrawCrypto'));
const WithdrawFlashpayPage = lazy(() => import('./pages/Account/withdraw/WithdrawFlashpay'));
const AffiliatePage = lazy(() => import('./pages/Affiliate/index'));
const AgencyPage = lazy(() => import('./pages/Agency/index'));
const CryptoWalletPage = lazy(() => import('./pages/CryptoWallet/index'));
const VIPPage = lazy(() => import('./pages/VIP/index'));
const StorePage = lazy(() => import('./pages/Store/index'));
const WalletPage = lazy(() => import('./pages/Wallet/index'));
const WalletDepositPage = lazy(() => import('./pages/Wallet/Deposit'));
const WalletWithdrawPage = lazy(() => import('./pages/Wallet/Withdraw'));

const LoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
  </div>
);

const HomePage = () => (
  <div className="max-w-6xl mx-auto py-8">
    <div className="text-center mb-10">
      <h1 className="text-4xl font-extrabold mb-3 text-amber-400">TC GAMING</h1>
      <p className="text-white/70 text-lg max-w-2xl mx-auto">
        Trải nghiệm đa dạng trò chơi casino, thể thao, và nạp rút nhanh chóng 24/7.
      </p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Link to="/live-casino" className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-center">
        <span className="text-2xl block mb-2 font-bold text-amber-300">Live Casino</span>
        <span className="text-sm text-white/50">Baccarat, Roulette, Blackjack</span>
      </Link>
      <Link to="/promotions" className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-center">
        <span className="text-2xl block mb-2 font-bold text-emerald-400">Khuyến Mãi</span>
        <span className="text-sm text-white/50">Thưởng nạp & hoàn trả VIP</span>
      </Link>
      <Link to="/vip" className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-center">
        <span className="text-2xl block mb-2 font-bold text-purple-400">VIP Club</span>
        <span className="text-sm text-white/50">Đặc quyền cấp bậc & quà tặng</span>
      </Link>
      <Link to="/affiliate" className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-center">
        <span className="text-2xl block mb-2 font-bold text-blue-400">Đại Lý</span>
        <span className="text-sm text-white/50">Hoa hồng hấp dẫn trọn đời</span>
      </Link>
    </div>
  </div>
);

export default function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <SiteProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-[#0d131c] text-white flex flex-col font-sans">
              {/* Main Navigation Header */}
              <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-6">
                  <Link to="/" className="text-xl font-black tracking-wider text-amber-400 hover:opacity-90">
                    TC GAMING
                  </Link>
                  <nav className="hidden md:flex items-center gap-4 text-sm text-white/70">
                    <Link to="/live-casino" className="hover:text-amber-400 transition-colors">Casino</Link>
                    <Link to="/promotions" className="hover:text-amber-400 transition-colors">Khuyến Mãi</Link>
                    <Link to="/vip" className="hover:text-amber-400 transition-colors">VIP</Link>
                    <Link to="/affiliate" className="hover:text-amber-400 transition-colors">Đại Lý</Link>
                    <Link to="/help-center" className="hover:text-amber-400 transition-colors">Trợ Giúp</Link>
                  </nav>
                </div>
                <div className="flex items-center gap-4">
                  <LanguageSwitcher />
                </div>
              </header>

              {/* Main App Content Viewport */}
              <main className="flex-1 p-4 md:p-6">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/promotions" element={<PromoPage />} />
                    <Route path="/help-center" element={<HelpCenterPage />} />
                    <Route path="/about" element={<AboutUsPage />} />
                    <Route path="/contact" element={<ContactUsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/responsible-gaming" element={<ResponsibleGamingPage />} />
                    <Route path="/live-casino" element={<LiveCasinoMenuPage />} />

                    {/* Protected Player & Wallet Routes */}
                    <Route path="/account/history" element={<ProtectedRoute><BetHistoryPage /></ProtectedRoute>} />
                    <Route path="/account/deposit/crypto" element={<ProtectedRoute><DepositCryptoPage /></ProtectedRoute>} />
                    <Route path="/account/deposit/ewallet" element={<ProtectedRoute><DepositEwalletPage /></ProtectedRoute>} />
                    <Route path="/account/deposit/flashpay" element={<ProtectedRoute><DepositFlashpayPage /></ProtectedRoute>} />
                    <Route path="/account/deposit/tpay" element={<ProtectedRoute><DepositTpayPage /></ProtectedRoute>} />
                    <Route path="/account/withdraw/card" element={<ProtectedRoute><WithdrawCardPage /></ProtectedRoute>} />
                    <Route path="/account/withdraw/crypto" element={<ProtectedRoute><WithdrawCryptoPage /></ProtectedRoute>} />
                    <Route path="/account/withdraw/flashpay" element={<ProtectedRoute><WithdrawFlashpayPage /></ProtectedRoute>} />
                    <Route path="/affiliate" element={<ProtectedRoute><AffiliatePage /></ProtectedRoute>} />
                    <Route path="/agency" element={<ProtectedRoute><AgencyPage /></ProtectedRoute>} />
                    <Route path="/crypto-wallet" element={<ProtectedRoute><CryptoWalletPage /></ProtectedRoute>} />
                    <Route path="/vip" element={<ProtectedRoute><VIPPage /></ProtectedRoute>} />
                    <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
                    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                    <Route path="/wallet/deposit" element={<ProtectedRoute><WalletDepositPage /></ProtectedRoute>} />
                    <Route path="/wallet/withdraw" element={<ProtectedRoute><WalletWithdrawPage /></ProtectedRoute>} />

                    {/* 404 Fallback */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </BrowserRouter>
        </SiteProvider>
      </LanguageProvider>
    </Provider>
  );
}
