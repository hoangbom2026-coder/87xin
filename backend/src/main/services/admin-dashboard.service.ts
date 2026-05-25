import UserModel from '@main/models/user.model';
import DepositModel from '@main/models/deposit.model';
import WithdrawModel from '@main/models/withdraw.model';
import TransactionModel from '@main/models/transaction.model';
import BalanceModel from '@main/models/balance.model';
import KycModel from '@main/models/kyc.model';
import BonusModel from '@main/models/bonus.model';
import NotificationModel from '@main/models/notification.model';
import SettingModel from '@main/models/setting.model';
import SessionModel from '@main/models/session.model';
import ReferralCodeModel from '@main/models/referral-code.model';
import AffiliateLogModel from '@main/models/affiliate-log.model';
import { normalizeMarketingOps } from '@main/constants/marketing-ops-defaults';

function clampDays(days: number): number {
    return Math.min(90, Math.max(1, Math.floor(days) || 14));
}

/** Chuỗi ngày YYYY-MM-DD (UTC) từ today đếm ngược `n` ngày (bao gồm hôm nay). */
function lastNDayKeys(n: number): string[] {
    const keys: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i -= 1) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
        keys.push(d.toISOString().slice(0, 10));
    }
    return keys;
}

export type OperationalBriefSeverity = 'critical' | 'warning' | 'info' | 'positive';

export interface OperationalBriefAction {
    label: string;
    href: string;
}

export interface OperationalBriefItem {
    id: string;
    severity: OperationalBriefSeverity;
    title: string;
    detail: string;
    actions: OperationalBriefAction[];
}

const SEVERITY_RANK: Record<OperationalBriefSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    positive: 3
};

/** Gợi ý “đánh giá nhanh” + link thao tác — heuristic vận hành (không thay SLA nội bộ). */
function buildOperationalBriefing(args: {
    maintenanceMode: boolean;
    promotionsCmsEnabled: boolean;
    depositBonusHighlight: boolean;
    affiliateProgramEnabled?: boolean;
    affiliateAutoPayoutEnabled?: boolean;
    pendingWithdraws: number;
    pendingDeposits: number;
    pendingKyc: number;
    activeBonuses: number;
    withdrawalsSuccessUsd: number;
    depositsSuccessUsd: number;
    registrationsInPeriod: number;
    affiliateNewLedgerInPeriod: number;
    rtpPercent: number | null;
    referralCodesTotal: number;
}): OperationalBriefItem[] {
    const items: OperationalBriefItem[] = [];
    const {
        maintenanceMode,
        promotionsCmsEnabled,
        depositBonusHighlight,
        affiliateProgramEnabled,
        affiliateAutoPayoutEnabled,
        pendingWithdraws,
        pendingDeposits,
        pendingKyc,
        activeBonuses,
        withdrawalsSuccessUsd,
        depositsSuccessUsd,
        registrationsInPeriod,
        affiliateNewLedgerInPeriod,
        rtpPercent,
        referralCodesTotal
    } = args;

    if (maintenanceMode) {
        items.push({
            id: 'maintenance-mode',
            severity: 'critical',
            title: 'Đang bật chế độ bảo trì',
            detail: 'Người chơi có thể không vào được site. Sau khi xử lý sự cố, tắt bảo trì trong cài đặt.',
            actions: [{ label: 'Tắt / chỉnh cài đặt site', href: '/site-settings' }]
        });
    }

    if (pendingWithdraws >= 20) {
        items.push({
            id: 'wd-backlog-heavy',
            severity: 'critical',
            title: `Rút tiền tồn động cao (${pendingWithdraws})`,
            detail: 'Ưu tiên duyệt / thanh toán để giảm khiếu nại và rủi ro uy tín.',
            actions: [
                { label: 'Mở hàng chờ rút', href: '/financial?tab=withdrawals' },
                { label: 'CSKH / ticket', href: '/customer-care' }
            ]
        });
    } else if (pendingWithdraws >= 8) {
        items.push({
            id: 'wd-backlog-med',
            severity: 'warning',
            title: `Có ${pendingWithdraws} lệnh rút đang chờ`,
            detail: 'Theo dõi SLA team thanh toán; tách các lệnh nghi ngờ để AML kiểm tra.',
            actions: [{ label: 'Xử lý rút tiền', href: '/financial?tab=withdrawals' }]
        });
    } else if (pendingWithdraws >= 1) {
        items.push({
            id: 'wd-backlog-lite',
            severity: 'info',
            title: `${pendingWithdraws} lệnh rút chờ`,
            detail: 'Duyệt sớm khi đủ hồ sơ.',
            actions: [{ label: 'Rút tiền', href: '/financial?tab=withdrawals' }]
        });
    }

    if (pendingDeposits >= 15) {
        items.push({
            id: 'dep-backlog',
            severity: 'warning',
            title: `Nạp chờ xác nhận: ${pendingDeposits}`,
            detail: 'Đối chiếu gateway / chứng từ; tránh chồng backlog khi traffic cao.',
            actions: [{ label: 'Nạp tiền', href: '/financial?tab=deposits' }]
        });
    } else if (pendingDeposits >= 5) {
        items.push({
            id: 'dep-backlog-lite',
            severity: 'info',
            title: `${pendingDeposits} nạp đang chờ`,
            detail: 'Kiểm tra pending queue.',
            actions: [{ label: 'Nạp tiền', href: '/financial?tab=deposits' }]
        });
    }

    if (pendingKyc >= 8) {
        items.push({
            id: 'kyc-heavy',
            severity: 'warning',
            title: `KYC chờ duyệt: ${pendingKyc}`,
            detail: 'Tăng throughput KYC để không chặn rút / nạp lớn.',
            actions: [{ label: 'Duyệt KYC', href: '/kyc' }]
        });
    } else if (pendingKyc >= 1) {
        items.push({
            id: 'kyc-pending',
            severity: 'info',
            title: `${pendingKyc} hồ sơ KYC chờ`,
            detail: '',
            actions: [{ label: 'KYC', href: '/kyc' }]
        });
    }

    const dep = depositsSuccessUsd;
    const wdr = withdrawalsSuccessUsd;
    if (dep >= 300 && wdr > dep * 1.35) {
        items.push({
            id: 'liquidity-pressure',
            severity: 'warning',
            title: 'Rút thành công trong kỳ vượt nạp thành công đáng kể',
            detail: `Nạp ~$${dep.toFixed(0)} vs rút ~$${wdr.toFixed(
                0
            )}. Kiểm tra thanh khoản, reserve và các lệnh rút đồng loạt.`,
            actions: [
                { label: 'Giao dịch / báo cáo', href: '/financial?tab=transactions' },
                { label: 'Rút tiền', href: '/financial?tab=withdrawals' }
            ]
        });
    }

    if (rtpPercent != null && rtpPercent >= 97.8) {
        items.push({
            id: 'rtp-high',
            severity: 'warning',
            title: `RTP giai đoạn cao (${rtpPercent.toFixed(2)}%)`,
            detail: 'Có thể do variance — theo dõi GGR, game risk và jackpot.',
            actions: [{ label: 'Casino games', href: '/casino-games' }]
        });
    }

    if (!promotionsCmsEnabled) {
        items.push({
            id: 'promo-cms-off',
            severity: 'info',
            title: 'Khuyến mãi CMS đang tắt (theo cờ marketingOps)',
            detail: 'Nếu cần camp trên landing/affiliate, bật lại và kiểm tra nội dung.',
            actions: [{ label: 'Trung tâm Marketing — Tích hợp/cờ', href: '/marketing-hub?tab=integrations' }]
        });
    }

    if (!depositBonusHighlight) {
        items.push({
            id: 'dep-highlight-off',
            severity: 'info',
            title: 'Cờ “nhấn mạnh bonus nạp” đang tắt',
            detail: 'UI có thể ẩn highlight nạp — bật nếu đang push campaign.',
            actions: [{ label: 'Cài đặt marketing Ops', href: '/marketing-hub?tab=integrations' }]
        });
    }

    if (activeBonuses === 0) {
        items.push({
            id: 'no-active-bonus',
            severity: 'info',
            title: 'Không có bonus đang bật trong hệ thống bonus',
            detail: 'Cân nhắc chiến dịch nạp/signup trong trang Promotion bonus.',
            actions: [{ label: 'Quản lý bonus', href: '/promotions' }]
        });
    }

    if (referralCodesTotal >= 5 && affiliateNewLedgerInPeriod === 0) {
        items.push({
            id: 'affiliate-flat',
            severity: 'info',
            title: 'Có mã referral nhưng không có ghi nhận ledger mới trong kỳ',
            detail: 'Kiểm tra cron hoa hồng, cấu hình affiliate và traffic F1/F2.',
            actions: [{ label: 'Chương trình Affiliate', href: '/affiliate-program' }]
        });
    }

    if (
        affiliateAutoPayoutEnabled &&
        (affiliateProgramEnabled === true || affiliateProgramEnabled === undefined)
    ) {
        items.push({
            id: 'aff-auto-payout',
            severity: 'positive',
            title: 'Tự động chi payout affiliate đã bật',
            detail: 'Theo dõi log cron và ví thanh khoản hệ thống.',
            actions: [{ label: 'Cấu hình payout', href: '/affiliate-program' }]
        });
    }

    if (registrationsInPeriod >= 30) {
        items.push({
            id: 'reg-up',
            severity: 'positive',
            title: `Đăng ký trong kỳ: ${registrationsInPeriod}`,
            detail: '',
            actions: [{ label: 'Marketing hub', href: '/marketing-hub' }]
        });
    }

    const hasAlerts = items.some((i) => i.severity === 'critical' || i.severity === 'warning');
    if (!hasAlerts && !items.some((i) => i.severity === 'positive')) {
        items.push({
            id: 'steady',
            severity: 'positive',
            title: 'Không có cảnh báo đỏ/cam trong bộ chỉ báo tự động',
            detail: 'Vẫn nên chủ động rà Financial, Affiliate và Audit theo SLA nội bộ.',
            actions: [
                { label: 'Thanh toán', href: '/financial' },
                { label: 'Marketing', href: '/marketing-hub' },
                { label: 'Audit logs', href: '/audit-logs' }
            ]
        });
    }

    return items.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

function fillDaily(
    keys: string[],
    rows: { _id: string; count?: number; amount?: number }[]
): { date: string; count: number; amount: number }[] {
    const map = new Map<string, { count: number; amount: number }>();
    rows.forEach((r) => {
        map.set(r._id, {
            count: Number(r.count ?? 0),
            amount: Number(r.amount ?? 0)
        });
    });
    return keys.map((date) => ({
        date,
        count: map.get(date)?.count ?? 0,
        amount: map.get(date)?.amount ?? 0
    }));
}

export async function getAdminDashboardOverview(daysInput: number) {
    const days = clampDays(daysInput);
    const keys = lastNDayKeys(days);
    const start = new Date(`${keys[0]}T00:00:00.000Z`);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const playerFilter = { role: 'user' };

    const [
        totalUsers,
        totalPlayers,
        activePlayers,
        pendingKyc,
        activeBonuses,
        notificationActiveCount,
        settingBrief,
        balanceAgg,
        depositPeriodAgg,
        withdrawPeriodAgg,
        depositSuccessPeriod,
        withdrawSuccessPeriod,
        txBetSum,
        txWinSum,
        txBonusSum,
        txTypeMix,
        dailyUsers,
        dailyDepCounts,
        dailyDepAmounts,
        dailyWdCounts,
        dailyWdAmounts,
        recentTx,
        adminUsersCount,
        activeSessionsCount,
        uniqueOnlinePlayers,
        topSingleWins,
        referralCodesTotal,
        referredPlayersTotal,
        affiliateTotalsAgg,
        affiliateNewRowsInPeriod
    ] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments(playerFilter),
        UserModel.countDocuments({ ...playerFilter, status: 'active' }),
        KycModel.countDocuments({ status: 'pending' }),
        BonusModel.countDocuments({ status: true, isExpired: false }),
        NotificationModel.countDocuments({ status: true }),
        SettingModel.findOne({ name: 'setting' }).select('maintenanceMode marketingOps affiliateProgram').lean(),
        BalanceModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalWithdrawable: { $sum: '$withdrawable' },
                    totalAmount: { $sum: '$amount' },
                    totalBonus: { $sum: '$bonus' }
                }
            }
        ]),
        DepositModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        WithdrawModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        DepositModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$actuallyAmount' },
                    count: { $sum: 1 }
                }
            }
        ]),
        WithdrawModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]),
        TransactionModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    type: 'bet'
                }
            },
            { $group: { _id: null, s: { $sum: { $abs: '$amount' } } } }
        ]),
        TransactionModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    type: 'win'
                }
            },
            { $group: { _id: null, s: { $sum: { $abs: '$amount' } } } }
        ]),
        TransactionModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    type: 'bonus'
                }
            },
            { $group: { _id: null, s: { $sum: { $abs: '$amount' } } } }
        ]),
        TransactionModel.aggregate([
            {
                $match: { createdAt: { $gte: start, $lte: end } }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]),
        UserModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    role: 'user'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        DepositModel.aggregate([
            {
                $match: { createdAt: { $gte: start, $lte: end } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        DepositModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' }
                    },
                    amount: { $sum: '$actuallyAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        WithdrawModel.aggregate([
            {
                $match: { createdAt: { $gte: start, $lte: end } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        WithdrawModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' }
                    },
                    amount: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        TransactionModel.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate({ path: 'userId', select: 'username' })
            .lean(),
        UserModel.countDocuments({ role: 'admin' }),
        SessionModel.countDocuments({ expiredTime: { $gt: new Date() } }),
        SessionModel.aggregate([
            { $match: { expiredTime: { $gt: new Date() } } },
            { $group: { _id: '$userId' } },
            { $count: 'c' }
        ]),
        TransactionModel.aggregate([
            {
                $match: {
                    type: 'win',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            { $addFields: { winAbs: { $abs: '$amount' } } },
            { $sort: { winAbs: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'u'
                }
            },
            { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    username: { $ifNull: ['$u.username', '-'] },
                    gameName: { $ifNull: ['$gameName', ''] },
                    winAmount: '$winAbs',
                    currencyName: 1,
                    createdAt: 1
                }
            }
        ]),
        ReferralCodeModel.countDocuments(),
        UserModel.countDocuments({ ...playerFilter, invitorId: { $exists: true, $ne: null } }),
        AffiliateLogModel.aggregate([
            {
                $group: {
                    _id: null,
                    commissionAccrued: { $sum: '$commissionAmount' },
                    referralAccrued: { $sum: '$referralAmount' },
                    rows: { $sum: 1 }
                }
            }
        ]),
        AffiliateLogModel.countDocuments({ createdAt: { $gte: start, $lte: end } })
    ]);

    const depSuccess = depositSuccessPeriod[0] || { total: 0, count: 0 };
    const wdSuccess = withdrawSuccessPeriod[0] || { total: 0, count: 0 };
    const betSum = txBetSum[0]?.s || 0;
    const winSum = txWinSum[0]?.s || 0;
    const bonusTxSum = txBonusSum[0]?.s || 0;
    const ggr = betSum - winSum;
    const rtp = betSum > 0 ? (winSum / betSum) * 100 : null;

    const bal = balanceAgg[0] || {
        totalWithdrawable: 0,
        totalAmount: 0,
        totalBonus: 0
    };

    const pendingDeposits = await DepositModel.countDocuments({ status: 'pending' });
    const pendingWithdraws = await WithdrawModel.countDocuments({
        status: { $in: ['pending', 'process', 'payoutPending'] }
    });

    const registrationsSeries = fillDaily(
        keys,
        dailyUsers.map((r: any) => ({ _id: r._id, count: r.count }))
    );
    const depCountSeries = fillDaily(
        keys,
        dailyDepCounts.map((r: any) => ({ _id: r._id, count: r.count }))
    );
    const depAmountSeries = fillDaily(
        keys,
        dailyDepAmounts.map((r: any) => ({ _id: r._id, amount: r.amount }))
    );
    const wdCountSeries = fillDaily(
        keys,
        dailyWdCounts.map((r: any) => ({ _id: r._id, count: r.count }))
    );
    const wdAmountSeries = fillDaily(
        keys,
        dailyWdAmounts.map((r: any) => ({ _id: r._id, amount: r.amount }))
    );

    const mixTotal =
        txTypeMix.reduce((a: number, r: any) => a + (r.count || 0), 0) || 1;
    const transactionsMix = txTypeMix.map((r: any) => ({
        type: r._id || 'unknown',
        count: r.count,
        share: r.count / mixTotal
    }));

    const activity = (recentTx as any[]).map((t) => ({
        time: t.createdAt,
        username: (t.userId as any)?.username || '-',
        type: t.type,
        amount: t.amount,
        currencyName: t.currencyName,
        category: t.category || ''
    }));

    const onlineUnique = uniqueOnlinePlayers[0]?.c ?? 0;

    const affSnap = affiliateTotalsAgg[0] || {
        commissionAccrued: 0,
        referralAccrued: 0,
        rows: 0
    };

    const registeredInPeriod = dailyUsers.reduce((s: number, r: any) => s + r.count, 0);
    const sb = settingBrief as {
        maintenanceMode?: boolean;
        marketingOps?: unknown;
        affiliateProgram?: { enabled?: boolean; autoPayout?: { enabled?: boolean } };
    } | null;
    const moNorm = normalizeMarketingOps(sb?.marketingOps ?? null);
    const affiliateProg = sb?.affiliateProgram;
    const operationalBriefing = buildOperationalBriefing({
        maintenanceMode: Boolean(sb?.maintenanceMode),
        promotionsCmsEnabled: moNorm.featureFlags.promotionsCmsEnabled,
        depositBonusHighlight: moNorm.featureFlags.depositBonusHighlight,
        affiliateProgramEnabled: affiliateProg?.enabled,
        affiliateAutoPayoutEnabled: affiliateProg?.autoPayout?.enabled,
        pendingWithdraws,
        pendingDeposits,
        pendingKyc,
        activeBonuses,
        withdrawalsSuccessUsd: Number(wdSuccess.total || 0),
        depositsSuccessUsd: Number(depSuccess.total || 0),
        registrationsInPeriod: registeredInPeriod,
        affiliateNewLedgerInPeriod: affiliateNewRowsInPeriod,
        rtpPercent: rtp,
        referralCodesTotal
    });

    return {
        generatedAt: new Date().toISOString(),
        period: { days, start: start.toISOString(), end: end.toISOString() },
        operationalBriefing,
        site: {
            maintenanceMode: Boolean(sb?.maintenanceMode)
        },
        users: {
            total: totalUsers,
            players: totalPlayers,
            activePlayers,
            admins: adminUsersCount,
            registeredInPeriod
        },
        finance: {
            deposits: {
                periodCount: depositPeriodAgg,
                successCount: depSuccess.count || 0,
                successAmount: depSuccess.total || 0,
                pendingCount: pendingDeposits
            },
            withdrawals: {
                periodCount: withdrawPeriodAgg,
                successCount: wdSuccess.count || 0,
                successAmount: wdSuccess.total || 0,
                pendingCount: pendingWithdraws
            },
            balances: {
                totalWalletAmount: bal.totalAmount || 0,
                totalWithdrawable: bal.totalWithdrawable || 0,
                totalBonusWallet: bal.totalBonus || 0
            }
        },
        gaming: {
            betVolume: betSum,
            winVolume: winSum,
            bonusTransactionsSum: bonusTxSum,
            ggrEstimate: ggr,
            rtpPercent: rtp
        },
        /** Phiên JWT còn hạn (ước lượng thiết bị đang đăng nhập). */
        sessions: {
            activeCount: activeSessionsCount,
            uniquePlayersOnline: onlineUnique
        },
        topWinners: (topSingleWins as any[]).map((w, idx) => ({
            rank: idx + 1,
            username: w.username,
            gameName: w.gameName || '—',
            winAmount: Number(w.winAmount ?? 0),
            currencyName: w.currencyName || '',
            createdAt: w.createdAt
        })),
        operations: {
            pendingKyc,
            activeBonuses,
            activeNotifications: notificationActiveCount
        },
        affiliate: {
            referralCodesTotal,
            referredPlayersTotal,
            ledgerRowsTotal: Number(affSnap.rows ?? 0),
            commissionAccruedTotal: Number(affSnap.commissionAccrued ?? 0),
            referralAccruedTotal: Number(affSnap.referralAccrued ?? 0),
            newLedgerRowsInPeriod: affiliateNewRowsInPeriod
        },
        charts: {
            registrationsDaily: registrationsSeries,
            depositsDailyCount: depCountSeries,
            depositsDailyAmount: depAmountSeries,
            withdrawalsDailyCount: wdCountSeries,
            withdrawalsDailyAmount: wdAmountSeries,
            depositWithdrawRatioDaily: keys.map((date, i) => {
                const d = depAmountSeries[i]?.amount ?? 0;
                const w = wdAmountSeries[i]?.amount ?? 0;
                const sum = d + w;
                return {
                    date,
                    depositShare: sum > 0 ? d / sum : 0,
                    withdrawShare: sum > 0 ? w / sum : 0
                };
            }),
            /** Tiện cho biểu đồ: nạp vs rút số tiền theo ngày */
            volumeDaily: keys.map((date, i) => ({
                date,
                deposits: depAmountSeries[i]?.amount ?? 0,
                withdrawals: wdAmountSeries[i]?.amount ?? 0
            }))
        },
        transactionsMix,
        recentActivity: activity
    };
}

export default {
    getAdminDashboardOverview
};
