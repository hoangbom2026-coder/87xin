import affiliateLogService from './affiliate-log.service';
import balanceService from './balance.service';
import settingService from './setting.service';
import transactionService from './transaction.service';
import userService from './user.service';

interface IPayoutResult {
    invitorId: string;
    currency: string;
    commissionPaid: number;
    referralPaid: number;
}

/**
 * Run a single auto-payout pass:
 *   - Aggregate pending commission/referral per (invitorId, currency).
 *   - For each invitor whose total >= threshold (in user's currency), convert pending to wager
 *     and credit balance + create a Transaction with provider 'auto-payout'.
 *
 * Threshold compares the sum of (commission + referral) in USD-equivalent using `setting.rates`.
 */
const runAutoPayout = async (minThreshold = 0): Promise<IPayoutResult[]> => {
    const setting = await settingService.getSetting();
    const rates = (setting?.rates as Record<string, number>) || { USD: 1 };
    const aggregates = await affiliateLogService.aggregatePendingCommission();

    const byInvitor = new Map<string, { totals: Map<string, { commission: number; referral: number }>; usd: number }>();
    for (const row of aggregates) {
        const invitorId = String(row._id?.invitorId);
        const currency = String(row._id?.currency || 'USD');
        const commission = Number(row.totalCommission || 0);
        const referral = Number(row.totalReferral || 0);
        if (commission <= 0 && referral <= 0) continue;
        const rate = Number(rates[currency] || 1);
        const usdValue = (commission + referral) / (rate || 1);
        const entry = byInvitor.get(invitorId) ?? {
            totals: new Map<string, { commission: number; referral: number }>(),
            usd: 0
        };
        entry.totals.set(currency, { commission, referral });
        entry.usd += usdValue;
        byInvitor.set(invitorId, entry);
    }

    const results: IPayoutResult[] = [];

    for (const [invitorId, info] of byInvitor.entries()) {
        if (minThreshold > 0 && info.usd < minThreshold) continue;
        const user = await userService.getUserById(invitorId);
        if (!user) continue;

        const userCurrency = String((user as { currency?: string }).currency || 'USD');
        const userRate = Number(rates[userCurrency] || 1);

        let commissionInUserCurrency = 0;
        let referralInUserCurrency = 0;
        for (const [currency, totals] of info.totals.entries()) {
            const r = Number(rates[currency] || 1);
            commissionInUserCurrency += (totals.commission / r) * userRate;
            referralInUserCurrency += (totals.referral / r) * userRate;
        }

        if (commissionInUserCurrency > 0) {
            const amt = Number(commissionInUserCurrency.toFixed(2));
            const prev = await balanceService.getBalanceByUserId(invitorId);
            await affiliateLogService.convertCommission(invitorId);
            const updated = await balanceService.creditBalance(invitorId, amt);
            if (updated && prev) {
                await transactionService.createTransaction({
                    userId: invitorId,
                    tnxId: `auto-${Date.now()}-${invitorId.slice(-6)}-c`,
                    amount: amt,
                    beforeAmount: Number(prev.amount.toFixed(2)),
                    afterAmount: Number(updated.amount.toFixed(2)),
                    currencyName: userCurrency,
                    type: 'commission',
                    typeDescription: 'Auto-payout: commission',
                    provider: 'auto-payout'
                });
            }
        }

        if (referralInUserCurrency > 0) {
            const amt = Number(referralInUserCurrency.toFixed(2));
            const prev = await balanceService.getBalanceByUserId(invitorId);
            await affiliateLogService.convertReferral(invitorId);
            const updated = await balanceService.creditBalance(invitorId, amt);
            if (updated && prev) {
                await transactionService.createTransaction({
                    userId: invitorId,
                    tnxId: `auto-${Date.now()}-${invitorId.slice(-6)}-r`,
                    amount: amt,
                    beforeAmount: Number(prev.amount.toFixed(2)),
                    afterAmount: Number(updated.amount.toFixed(2)),
                    currencyName: userCurrency,
                    type: 'referral',
                    typeDescription: 'Auto-payout: referral',
                    provider: 'auto-payout'
                });
            }
        }

        results.push({
            invitorId,
            currency: userCurrency,
            commissionPaid: Number(commissionInUserCurrency.toFixed(2)),
            referralPaid: Number(referralInUserCurrency.toFixed(2))
        });
    }

    return results;
};

export default { runAutoPayout };
