/**
 * Root Application component for admin-dashboard.
 * Sets up TanStack Query, authentication provider, router, lazy-loaded pages, and AdminLayout.
 */
import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AdminLayout from '@/components/layout/AdminLayout';
import { AuthProvider } from '@/components/auth/AuthProvider';
import '@/global.css';

// Lazy load pages
const AuthPage = lazy(() => import('@/pages/Auth'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Admins = lazy(() => import('@/pages/admin/Admins'));
const AffiliateDashboard = lazy(() => import('@/pages/admin/AffiliateDashboard'));
const AffiliateHub = lazy(() => import('@/pages/admin/AffiliateHub'));
const AffiliateImpersonation = lazy(() => import('@/pages/admin/AffiliateImpersonation'));
const AffiliateManager = lazy(() => import('@/pages/admin/AffiliateManager'));
const AffiliateProgramConfig = lazy(() => import('@/pages/admin/AffiliateProgramConfig'));
const AffiliateSignups = lazy(() => import('@/pages/admin/AffiliateSignups'));
const AgentsHub = lazy(() => import('@/pages/admin/AgentsHub'));
const ArticleCategories = lazy(() => import('@/pages/admin/ArticleCategories'));
const ArticleCreate = lazy(() => import('@/pages/admin/ArticleCreate'));
const ArticleEdit = lazy(() => import('@/pages/admin/ArticleEdit'));
const ArticlePosts = lazy(() => import('@/pages/admin/ArticlePosts'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));
const Banners = lazy(() => import('@/pages/admin/Banners'));
const Bonuses = lazy(() => import('@/pages/admin/Bonuses'));
const BrandSettings = lazy(() => import('@/pages/admin/BrandSettings'));
const BotAutomation = lazy(() => import('@/pages/admin/BotAutomation'));
const ChurnRisk = lazy(() => import('@/pages/admin/ChurnRisk'));
const CommissionLogs = lazy(() => import('@/pages/admin/CommissionLogs'));
const ContentBlocks = lazy(() => import('@/pages/admin/ContentBlocks'));
const CreateRootAffiliate = lazy(() => import('@/pages/admin/CreateRootAffiliate'));
const Currencies = lazy(() => import('@/pages/admin/Currencies'));
const CustomerCare = lazy(() => import('@/pages/admin/CustomerCare'));
const DailyChallenges = lazy(() => import('@/pages/admin/DailyChallenges'));
const DepositsPage = lazy(() => import('@/pages/admin/DepositsPage'));
const EmailSettings = lazy(() => import('@/pages/admin/EmailSettings'));
const GameMenuManager = lazy(() => import('@/pages/admin/GameMenuManager'));
const GamesHub = lazy(() => import('@/pages/admin/GamesHub'));
const GatewayDetailPage = lazy(() => import('@/pages/admin/GatewayDetailPage'));
const GatewayListPage = lazy(() => import('@/pages/admin/GatewayListPage'));
const HelpCenter = lazy(() => import('@/pages/admin/HelpCenter'));
const IntegrationExperiencePage = lazy(() => import('@/pages/admin/IntegrationExperiencePage'));
const InvestLogs = lazy(() => import('@/pages/admin/InvestLogs'));
const KYC = lazy(() => import('@/pages/admin/KYC'));
const ManageLanguagesPage = lazy(() => import('@/pages/admin/ManageLanguagesPage'));
const ManualPaymentsPage = lazy(() => import('@/pages/admin/ManualPaymentsPage'));
const MarketingAffiliateWeb = lazy(() => import('@/pages/admin/MarketingAffiliateWeb'));
const MarketingHubPage = lazy(() => import('@/pages/admin/MarketingHubPage'));
const MediaLibrary = lazy(() => import('@/pages/admin/MediaLibrary'));
const NewsletterSubscribers = lazy(() => import('@/pages/admin/NewsletterSubscribers'));
const Packages = lazy(() => import('@/pages/admin/Packages'));
const PlanEditor = lazy(() => import('@/pages/admin/PlanEditor'));
const Plans = lazy(() => import('@/pages/admin/Plans'));
const PluginsPage = lazy(() => import('@/pages/admin/PluginsPage'));
const Preference = lazy(() => import('@/pages/admin/Preference'));
const Promotions = lazy(() => import('@/pages/admin/Promotions'));
const RealtimeMonitor = lazy(() => import('@/pages/admin/RealtimeMonitor'));
const Referrals = lazy(() => import('@/pages/admin/Referrals'));
const Rewards = lazy(() => import('@/pages/admin/Rewards'));
const Roles = lazy(() => import('@/pages/admin/Roles'));
const SchedulesPage = lazy(() => import('@/pages/admin/SchedulesPage'));
const SiteContentFaqs = lazy(() => import('@/pages/admin/SiteContentFaqs'));
const StoreHub = lazy(() => import('@/pages/admin/StoreHub'));
const SupportChat = lazy(() => import('@/pages/admin/SupportChat'));
const SystemUpdates = lazy(() => import('@/pages/admin/SystemUpdates'));
const TelegramTemplates = lazy(() => import('@/pages/admin/TelegramTemplates'));
const ThemeEditor = lazy(() => import('@/pages/admin/ThemeEditor'));
const TicketDetail = lazy(() => import('@/pages/admin/TicketDetail'));
const Tickets = lazy(() => import('@/pages/admin/Tickets'));
const UserInterestLogPage = lazy(() => import('@/pages/admin/UserInterestLogPage'));
const VIP = lazy(() => import('@/pages/admin/VIP'));
const VIPHub = lazy(() => import('@/pages/admin/VIPHub'));
const VIPLevels = lazy(() => import('@/pages/admin/VIPLevels'));
const VIPProgramConfig = lazy(() => import('@/pages/admin/VIPProgramConfig'));
const VipTiersManager = lazy(() => import('@/pages/admin/VipTiersManager'));
const WithdrawalsTab = lazy(() => import('@/pages/admin/WithdrawalsTab'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = () => {
  const token = localStorage.getItem('adminAccessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="text-sm text-muted-foreground">Đang tải trang...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<AuthPage />} />

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

              {/* Protected admin routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/admins" element={<Admins />} />
                <Route path="/admin/affiliates" element={<AffiliateDashboard />} />
                <Route path="/admin/affiliate-hub" element={<AffiliateHub />} />
                <Route path="/admin/affiliate-impersonation" element={<AffiliateImpersonation />} />
                <Route path="/admin/affiliate-manager" element={<AffiliateManager />} />
                <Route path="/admin/affiliate-program" element={<AffiliateProgramConfig />} />
                <Route path="/admin/affiliate-signups" element={<AffiliateSignups />} />
                <Route path="/admin/agents" element={<AgentsHub />} />
                <Route path="/admin/articles" element={<ArticlePosts />} />
                <Route path="/admin/articles/create" element={<ArticleCreate />} />
                <Route path="/admin/articles/:id" element={<ArticleEdit />} />
                <Route path="/admin/article-categories" element={<ArticleCategories />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/admin/banners" element={<Banners />} />
                <Route path="/admin/bonuses" element={<Bonuses />} />
                <Route path="/admin/brand-settings" element={<BrandSettings />} />
                <Route path="/admin/bot-automation" element={<BotAutomation />} />
                <Route path="/admin/churn" element={<ChurnRisk />} />
                <Route path="/admin/commission-logs" element={<CommissionLogs />} />
                <Route path="/admin/content-blocks" element={<ContentBlocks />} />
                <Route path="/admin/root-affiliate" element={<CreateRootAffiliate />} />
                <Route path="/admin/currencies" element={<Currencies />} />
                <Route path="/admin/customer-care" element={<CustomerCare />} />
                <Route path="/admin/daily-challenges" element={<DailyChallenges />} />
                <Route path="/admin/deposits" element={<DepositsPage />} />
                <Route path="/admin/email-settings" element={<EmailSettings />} />
                <Route path="/admin/game-menu" element={<GameMenuManager />} />
                <Route path="/admin/games" element={<GamesHub />} />
                <Route path="/admin/gateways" element={<GatewayListPage />} />
                <Route path="/admin/gateways/:id" element={<GatewayDetailPage />} />
                <Route path="/admin/help-center" element={<HelpCenter />} />
                <Route path="/admin/integration-experience" element={<IntegrationExperiencePage />} />
                <Route path="/admin/invest-logs" element={<InvestLogs />} />
                <Route path="/admin/kyc" element={<KYC />} />
                <Route path="/admin/languages" element={<ManageLanguagesPage />} />
                <Route path="/admin/manual-payments" element={<ManualPaymentsPage mode="pending" />} />
                <Route path="/admin/marketing-affiliate" element={<MarketingAffiliateWeb />} />
                <Route path="/admin/marketing-hub" element={<MarketingHubPage />} />
                <Route path="/admin/media" element={<MediaLibrary />} />
                <Route path="/admin/newsletter" element={<NewsletterSubscribers />} />
                <Route path="/admin/packages" element={<Packages />} />
                <Route path="/admin/plan-editor" element={<PlanEditor />} />
                <Route path="/admin/plans" element={<Plans />} />
                <Route path="/admin/plugins" element={<PluginsPage />} />
                <Route path="/admin/preferences" element={<Preference />} />
                <Route path="/admin/promotions" element={<Promotions />} />
                <Route path="/admin/realtime-monitor" element={<RealtimeMonitor />} />
                <Route path="/admin/referrals" element={<Referrals />} />
                <Route path="/admin/rewards" element={<Rewards />} />
                <Route path="/admin/roles" element={<Roles />} />
                <Route path="/admin/schedules" element={<SchedulesPage />} />
                <Route path="/admin/site-content" element={<SiteContentFaqs />} />
                <Route path="/admin/store" element={<StoreHub />} />
                <Route path="/admin/support-chat" element={<SupportChat />} />
                <Route path="/admin/system-updates" element={<SystemUpdates />} />
                <Route path="/admin/telegram" element={<TelegramTemplates />} />
                <Route path="/admin/theme-editor" element={<ThemeEditor />} />
                <Route path="/admin/tickets" element={<Tickets />} />
                <Route path="/admin/tickets/:id" element={<TicketDetail />} />
                <Route path="/admin/user-interest" element={<UserInterestLogPage />} />
                <Route path="/admin/vip" element={<VIP />} />
                <Route path="/admin/vip-hub" element={<VIPHub />} />
                <Route path="/admin/vip-levels" element={<VIPLevels />} />
                <Route path="/admin/vip-program" element={<VIPProgramConfig />} />
                <Route path="/admin/vip-tiers" element={<VipTiersManager />} />
                <Route path="/admin/withdrawals" element={<WithdrawalsTab />} />
              </Route>

              {/* 404 fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
