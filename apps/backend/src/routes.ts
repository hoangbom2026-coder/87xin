/**
 * Central router manifest for TC-Gaming backend API.
 * Mounts all domain, payment, game, VIP, CMS, and admin routers under unified API prefixes.
 */
import express from 'express';

// Auth & User
import authRouter from '@main/routes/auth.router';
import verifyRouter from '@main/routes/verify.router';
import roleRouter from '@main/routes/role.router';
import kycRouter from '@main/routes/kyc.router';

// Player & Wallet
import transactionRouter from '@main/routes/transaction.router';
import walletRouter from '@main/routes/wallet.router';
import currencyRouter from '@main/routes/currency.router';
import preferenceRouter from '@main/routes/preference.router';
import settingRouter from '@main/routes/setting.router';

// Payment Gateways
import gsPayRouter from '@main/routes/gs-pay.router';
import gsCallbackRouter from '@main/routes/gs-callback.router';
import agPayRouter from '@main/routes/ag-pay.router';
import agCallbackRouter from '@main/routes/ag-callback.router';
import nowpayRouter from '@main/routes/nowpay.router';

// Game & Casino
import gameMenuRouter from '@main/routes/game-menu.router';
import sportRouter from '@main/routes/sport.router';
import dailyChallengeRouter from '@main/routes/daily-challenge.router';

// Affiliate & Agency
import affiliateRouter from '@main/routes/affiliate.router';
import agencyRouter from '@main/routes/agency.router';
import userAffiliateRouter from '@main/routes/user-affiliate.router';
import publicAffiliateRouter from '@main/routes/public-affiliate.router';
import reagentProgramRouter from '@main/routes/reagent-program.router';
import referralCodeRouter from '@main/routes/referral-code.router';

// VIP, Bonuses & Rewards
import vipTiersRouter from '@main/routes/vip-tiers.router';
import vipTiersConfigRouter from '@main/routes/vip-tiers-config.router';
import vipLevelRouter from '@main/routes/vip-level.router';
import vipSpinRouter from '@main/routes/vip-spin.router';
import vipSpinPrizeRouter from '@main/routes/vip-spin-prize.router';
import vipBonusRouter from '@main/routes/vip-bonus.router';
import bonusRouter from '@main/routes/bonus.router';
import rewardRouter from '@main/routes/reward.router';
import packageRouter from '@main/routes/package.router';
import planRouter from '@main/routes/plan.router';
import storeRouter from '@main/routes/store.router';

// Content & CMS
import bannerRouter from '@main/routes/banner.router';
import promotionRouter from '@main/routes/promotion.router';
import articleRouter from '@main/routes/article.router';
import contentBlockRouter from '@main/routes/content-block.router';
import sitePluginRouter from '@main/routes/site-plugin.router';
import mediaRouter from '@main/routes/media.router';
import helpRouter from '@main/routes/help.router';
import ticketRouter from '@main/routes/ticket.router';
import newsletterRouter from '@main/routes/newsletter.router';
import botAutomationRouter from '@main/routes/bot-automation.router';

// Admin Routes
import adminAffiliateExtrasRouter from '@main/routes/admin-affiliate-extras.router';
import adminAffiliateRouter from '@main/routes/admin-affiliate.router';
import adminAgentsRouter from '@main/routes/admin-agents.router';
import adminAuditRouter from '@main/routes/admin-audit.router';
import adminChurnRouter from '@main/routes/admin-churn.router';
import adminDashboardRouter from '@main/routes/admin-dashboard.router';
import adminGameMenuRouter from '@main/routes/admin-game-menu.router';
import adminGamesRouter from '@main/routes/admin-games.router';
import adminIpRouter from '@main/routes/admin-ip.router';
import adminStaffRouter from '@main/routes/admin-staff.router';
import adminStoreRouter from '@main/routes/admin-store.router';
import adminVipRouter from '@main/routes/admin-vip.router';

const router = express.Router();

// Health Check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Auth & User
router.use('/auth', authRouter);
router.use('/verify', verifyRouter);
router.use('/role', roleRouter);
router.use('/kyc', kycRouter);

// 2. Player, Wallet & Transactions
router.use('/transactions', transactionRouter);
router.use('/wallet', walletRouter);
router.use('/currency', currencyRouter);
router.use('/preference', preferenceRouter);
router.use('/setting', settingRouter);

// 3. Payment Gateways
router.use('/gs-pay', gsPayRouter);
router.use('/gsc', gsCallbackRouter);
router.use('/ag-pay', agPayRouter);
router.use('/ag-callback', agCallbackRouter);
router.use('/nowpay', nowpayRouter);

// 4. Game & Casino
router.use('/game-menu', gameMenuRouter);
router.use('/sport', sportRouter);
router.use('/daily-challenge', dailyChallengeRouter);

// 5. Affiliate & Agency
router.use('/affiliate', affiliateRouter);
router.use('/agency', agencyRouter);
router.use('/user-affiliate', userAffiliateRouter);
router.use('/public-affiliate', publicAffiliateRouter);
router.use('/reagent-program', reagentProgramRouter);
router.use('/referral-code', referralCodeRouter);

// 6. VIP, Bonuses & Rewards
router.use('/vip-tiers', vipTiersRouter);
router.use('/vip-tiers-config', vipTiersConfigRouter);
router.use('/vip-level', vipLevelRouter);
router.use('/vip-spin', vipSpinRouter);
router.use('/vip-spin-prize', vipSpinPrizeRouter);
router.use('/vip-bonus', vipBonusRouter);
router.use('/bonus', bonusRouter);
router.use('/reward', rewardRouter);
router.use('/package', packageRouter);
router.use('/plan', planRouter);
router.use('/store', storeRouter);

// 7. Content & CMS
router.use('/banner', bannerRouter);
router.use('/promotion', promotionRouter);
router.use('/article', articleRouter);
router.use('/content-block', contentBlockRouter);
router.use('/site-plugin', sitePluginRouter);
router.use('/media', mediaRouter);
router.use('/help', helpRouter);
router.use('/ticket', ticketRouter);
router.use('/newsletter', newsletterRouter);
router.use('/bot-automation', botAutomationRouter);

// 8. Admin Routes
router.use('/admin/affiliate-extras', adminAffiliateExtrasRouter);
router.use('/admin/affiliate', adminAffiliateRouter);
router.use('/admin/agents', adminAgentsRouter);
router.use('/admin/audit', adminAuditRouter);
router.use('/admin/churn', adminChurnRouter);
router.use('/admin/dashboard', adminDashboardRouter);
router.use('/admin/game-menu', adminGameMenuRouter);
router.use('/admin/games', adminGamesRouter);
router.use('/admin/ip', adminIpRouter);
router.use('/admin/staff', adminStaffRouter);
router.use('/admin/store', adminStoreRouter);
router.use('/admin/vip', adminVipRouter);

export default router;
