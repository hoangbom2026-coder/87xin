import httpStatus from 'http-status';
import { Types } from 'mongoose';
import crypto from 'crypto';
import ApiError from '@utils/ApiError';
import UserModel from '@main/models/user.model';
import InvestLogModel, { IInvestLog } from '@main/models/invest-log.model';
import PlanModel, { IPlan } from '@main/models/plan.model';
import { planService } from '@main/services/plan.service';
import balanceService from '@main/services/balance.service';
import userService from '@main/services/user.service';
import transactionService from '@main/services/transaction.service';
import affiliateLogService from '@main/services/affiliate-log.service';
import { investLogService } from '@main/services/invest-log.service';

/** Giống comment plan.model: 1=6 tháng, 2=3 tháng, 3=tháng, 4=tuần, 5=ngày, 6=giờ, 7=năm */
export function mapPlanTimesToMs(times: number): number {
    const H = 3600000;
    const D = 24 * H;
    switch (times) {
        case 1:
            return 180 * D;
        case 2:
            return 90 * D;
        case 3:
            return 30 * D;
        case 4:
            return 7 * D;
        case 5:
            return D;
        case 6:
            return H;
        case 7:
            return 365 * D;
        default:
            return D;
    }
}

export function interestPerPeriod(plan: IPlan, principal: number): number {
    if (plan.interestStatus === 'percentage') {
        return (principal * Number(plan.interest || 0)) / 100;
    }
    return Number(plan.interest || 0);
}

function validatePrincipal(plan: IPlan, amount: number): string | null {
    if (!Number.isFinite(amount) || amount <= 0) return 'amount phải > 0';
    if (plan.amountType === 0) {
        if (amount < plan.minimum || amount > plan.maximum) {
            return `amount phải trong [${plan.minimum}, ${plan.maximum}]`;
        }
    } else if (Math.abs(amount - plan.amount) > 0.0001) {
        return `gói cố định, amount phải bằng ${plan.amount}`;
    }
    return null;
}

function maxReferralPctCap(): number {
    const raw = Number(process.env.AGENCY_REFERRAL_MAX_PCT_PER_LEVEL ?? 50);
    if (!Number.isFinite(raw) || raw <= 0) return 50;
    return Math.min(raw, 100);
}

/**
 * Trả hoa hồng theo plan.referral (giốt Laravel refferMoney type invest):
 * F1 = path[path.length-1] hoặc invitorId.
 */
async function accrueInvestReferralUpline(opts: {
    investor: {
        path?: unknown[];
        invitorId?: unknown;
        inviteCode?: string;
    };
    plan: IPlan;
    investAmount: number;
    childId: string;
    currency: string;
}): Promise<void> {
    const { investor, plan, investAmount, childId, currency } = opts;
    const commissions = plan.referral?.commissions;
    if (!commissions?.length) return;

    const path = Array.isArray(investor.path) ? investor.path.map(String) : [];
    const invitorIds: string[] = [];
    if (path.length) {
        for (let i = 0; i < path.length; i++) {
            const id = path[path.length - 1 - i];
            if (id) invitorIds.push(String(id));
        }
    } else if (investor.invitorId) {
        invitorIds.push(String(investor.invitorId));
    }
    if (!invitorIds.length) return;

    const capPct = maxReferralPctCap();
    const refCode = typeof investor.inviteCode === 'string' && investor.inviteCode.trim() ? investor.inviteCode : 'agency-invest';

    const n = Math.min(commissions.length, invitorIds.length);
    for (let tier = 0; tier < n; tier++) {
        let pct = Number(commissions[tier]) || 0;
        if (pct <= 0) continue;
        pct = Math.min(pct, capPct);
        const commissionAmount = (investAmount * pct) / 100;
        await affiliateLogService.accrueTierLog({
            invitorId: invitorIds[tier],
            childId,
            currency,
            referralCode: refCode,
            level: tier + 1,
            tierRatio: pct / 100,
            betAmount: 0,
            commissionAmount
        });
    }
}

/**
 * Trả hoa hồng lãi (invest_interest) trực tiếp vào balance upline.
 */
async function accrueInterestReferralDirect(opts: {
    investor: any;
    plan: IPlan;
    interestAmount: number;
    childId: string;
    currency: string;
}): Promise<void> {
    const { investor, plan, interestAmount, childId, currency } = opts;
    const commissions = plan.referral?.commissions;
    if (!commissions?.length) return;

    const path = Array.isArray(investor.path) ? investor.path.map(String) : [];
    const invitorIds: string[] = [];
    if (path.length) {
        for (let i = 0; i < path.length; i++) {
            const id = path[path.length - 1 - i];
            if (id) invitorIds.push(String(id));
        }
    } else if (investor.invitorId) {
        invitorIds.push(String(investor.invitorId));
    }
    if (!invitorIds.length) return;

    const capPct = maxReferralPctCap();
    const refCode = investor.inviteCode || 'agency-interest';

    const n = Math.min(commissions.length, invitorIds.length);
    for (let tier = 0; tier < n; tier++) {
        let pct = Number(commissions[tier]) || 0;
        if (pct <= 0) continue;
        pct = Math.min(pct, capPct);
        const commissionAmount = Number(((interestAmount * pct) / 100).toFixed(2));
        if (commissionAmount <= 0) continue;

        const uplineUser = await UserModel.findById(invitorIds[tier]);
        if (!uplineUser) continue;

        const beforeAmt = uplineUser.agencyBalance ?? 0;
        const afterAmt = beforeAmt + commissionAmount;
        const unlockAt = new Date(Date.now() + 7 * 86400000);

        await UserModel.updateOne(
            { _id: uplineUser._id },
            {
                $inc: { agencyBalance: commissionAmount },
                $set: { unlockAt }
            }
        );

        const tnxId = `COMM_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        await transactionService.createTransaction({
            userId: invitorIds[tier],
            tnxId,
            amount: commissionAmount,
            beforeAmount: Number(beforeAmt.toFixed(2)),
            afterAmount: Number(afterAmt.toFixed(2)),
            currencyName: currency,
            type: 'commission',
            typeDescription: `Hoa hồng lãi từ ${investor.username} (F${tier + 1})`,
            provider: 'Agency',
            relatedId: childId,
            category: 'payment'
        });

        const invitorSocketId = await global.redis.get(invitorIds[tier]);
        if (invitorSocketId) {
            global.io.to(invitorSocketId).emit('balance', {
                agencyBalance: afterAmt
            });
        }

        await affiliateLogService.accrueTierLog({
            invitorId: invitorIds[tier],
            childId,
            currency,
            referralCode: refCode,
            level: tier + 1,
            tierRatio: pct / 100,
            betAmount: 0,
            commissionAmount
        });
    }
}

async function countActiveInvestmentsForPlan(userId: string, planId: string): Promise<number> {
    return InvestLogModel.countDocuments({
        userId: new Types.ObjectId(userId),
        planId: new Types.ObjectId(planId),
        status: { $in: ['pending', 'active'] }
    });
}

const agencyService = {
    preview(plan: IPlan, amount: number) {
        const err = validatePrincipal(plan, amount);
        if (err) throw new ApiError(httpStatus.BAD_REQUEST, err);
        const per = interestPerPeriod(plan, amount);
        const periodMs = mapPlanTimesToMs(plan.times);
        const maxPayCount = plan.returnFor === 1 ? plan.repeatTime : null;
        return {
            amount,
            interestPerPeriod: per,
            interestStatus: plan.interestStatus,
            planInterest: plan.interest,
            periodMs,
            nextPayoutPreview: new Date(Date.now() + periodMs).toISOString(),
            maxPayCount,
            returnFor: plan.returnFor,
            capitalBack: plan.capitalBack,
            referral: plan.referral ?? null
        };
    },

    async listActivePlans(page = 1, limit = 20) {
        return planService.getAll({ status: 'active', page, limit });
    },

    async getDashboard(userId: string) {
        const [agg] = await InvestLogModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalPrincipal: { $sum: '$amount' },
                    totalRemuneration: { $sum: '$remuneration' },
                    activePositions: {
                        $sum: { $cond: [{ $in: ['$status', ['active', 'pending']] }, 1, 0] }
                    }
                }
            }
        ]).exec();

        const affiliateByCurrency = await affiliateLogService.getCommissionRewardStatus(userId);

        return {
            investment: agg || {
                totalPrincipal: 0,
                totalRemuneration: 0,
                activePositions: 0
            },
            affiliateRewards: affiliateByCurrency
        };
    },

    async subscribe(userId: string, planId: string, amount: number): Promise<IInvestLog> {
        const plan = await planService.getById(planId);
        if (!plan || plan.status !== 'active') {
            throw new ApiError(httpStatus.NOT_FOUND, 'Gói đầu tư không tồn tại hoặc đã tắt');
        }

        const err = validatePrincipal(plan, amount);
        if (err) throw new ApiError(httpStatus.BAD_REQUEST, err);

        const activeCount = await countActiveInvestmentsForPlan(userId, planId);
        if (activeCount >= plan.userInvestLimit) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Đã đạt giới hạn số lần đầu tư cho gói này');
        }

        const user = await userService.getUserById(userId);
        if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User không tồn tại');

        const balance = await balanceService.getBalanceByUserId(userId);
        if (!balance || balance.amount < amount) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Số dư không đủ');
        }

        const beforeAmount = balance.amount;
        const debited = await balanceService.debitBalance(userId, amount);
        if (!debited) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Không thể trừ số dư');
        }

        const trxId = `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const periodMs = mapPlanTimesToMs(plan.times);
        const per = interestPerPeriod(plan, amount);
        const maxPayCount = plan.returnFor === 1 ? plan.repeatTime : null;
        const nextPayoutDate = new Date(Date.now() + periodMs);

        const log = await investLogService.createLog({
            userId: new Types.ObjectId(userId),
            planId: new Types.ObjectId(planId),
            trxId,
            gateway: 'Balance',
            amount,
            currency: String(user.currency || 'VND'),
            remuneration: 0,
            status: 'active',
            nextPayoutDate,
            payCount: 0,
            maxPayCount,
            interestPerPeriod: per,
            periodMs,
            capitalBack: plan.capitalBack === 1 ? 1 : 0
        });

        await transactionService.createTransaction({
            userId,
            relatedId: String(log._id),
            tnxId: trxId,
            amount: Number((amount * -1).toFixed(2)),
            beforeAmount: Number(beforeAmount.toFixed(2)),
            afterAmount: Number(debited.amount.toFixed(2)),
            currencyName: String(user.currency || 'VND'),
            type: 'invest',
            typeDescription: `Đầu tư gói: ${plan.name}`,
            provider: 'agency',
            category: 'payment',
            path: Array.isArray(user.path) ? user.path.map(String) : []
        });

        await accrueInvestReferralUpline({
            investor: user,
            plan,
            investAmount: amount,
            childId: userId,
            currency: String(user.currency || 'VND')
        });

        return log;
    },

    /**
     * Chạy cron trả lãi thực tế: cộng balance, UserInterest log,
     * hoa hồng giới thiệu theo kỳ (type interest), hoàn gốc capitalBack.
     */
    async runInterestCron(): Promise<{ processed: number; errors: number }> {
        const now = new Date();
        const logs = await InvestLogModel.find({
            status: 'active',
            nextPayoutDate: { $lte: now }
        }).populate('userId');

        let processed = 0;
        let errors = 0;

        for (const log of logs) {
            try {
                const user = log.userId as any;
                if (!user) continue;
                const userIdStr = String(user._id);
                const interest = Number(log.interestPerPeriod.toFixed(2));

                // 1. Cộng vào ví độc lập agencyBalance cho user
                const beforeAmt = user.agencyBalance ?? 0;
                const afterAmt = beforeAmt + interest;
                await UserModel.updateOne(
                    { _id: user._id },
                    { $inc: { agencyBalance: interest } }
                );

                // 2. Ghi log transaction với category payment
                const tnxId = `INT_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
                await transactionService.createTransaction({
                    userId: userIdStr,
                    tnxId,
                    amount: interest,
                    beforeAmount: Number(beforeAmt.toFixed(2)),
                    afterAmount: Number(afterAmt.toFixed(2)),
                    currencyName: log.currency,
                    type: 'invest_interest',
                    typeDescription: `Trả lãi định kỳ cho hợp đồng ${log.trxId}`,
                    provider: 'Agency',
                    relatedId: String(log._id),
                    category: 'payment'
                });

                user.agencyBalance = afterAmt;
                const storedSocketId = await global.redis.get(userIdStr);
                if (storedSocketId) {
                    global.io.to(storedSocketId).emit('balance', {
                        agencyBalance: afterAmt
                    });
                }

                // 3. Cập nhật InvestLog
                log.remuneration += interest;
                log.payCount += 1;
                log.payoutDate = now;

                // 4. Hoa hồng MLM (Direct Credit)
                const plan = await PlanModel.findById(log.planId);
                if (plan) {
                    await accrueInterestReferralDirect({
                        investor: user,
                        plan,
                        interestAmount: interest,
                        childId: userIdStr,
                        currency: log.currency
                    });
                }

                // 5. Kiểm tra hoàn thành / Hoàn gốc
                const isFinished = log.maxPayCount !== null && log.payCount >= log.maxPayCount;
                if (isFinished) {
                    log.status = 'completed';
                    if (log.capitalBack === 1) {
                        const principal = Number(log.amount.toFixed(2));
                        const capBefore = user.agencyBalance ?? 0;
                        const capAfter = capBefore + principal;
                        await UserModel.updateOne(
                            { _id: user._id },
                            { $inc: { agencyBalance: principal } }
                        );

                        const capTnxId = `CAP_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
                        await transactionService.createTransaction({
                            userId: userIdStr,
                            tnxId: capTnxId,
                            amount: principal,
                            beforeAmount: Number(capBefore.toFixed(2)),
                            afterAmount: Number(capAfter.toFixed(2)),
                            currencyName: log.currency,
                            type: 'invest',
                            typeDescription: `Hoàn gốc cho hợp đồng ${log.trxId}`,
                            provider: 'Agency',
                            relatedId: String(log._id),
                            category: 'payment'
                        });

                        user.agencyBalance = capAfter;
                        if (storedSocketId) {
                            global.io.to(storedSocketId).emit('balance', {
                                agencyBalance: capAfter
                            });
                        }
                    }
                } else {
                    log.nextPayoutDate = new Date(log.nextPayoutDate.getTime() + log.periodMs);
                }

                await log.save();
                processed++;
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(`Error processing interest for log ${log._id}:`, err);
                errors++;
            }
        }
        return { processed, errors };
    },

    /**
     * Stub cũ giữ lại để tương thích (chuyển hướng sang runInterestCron).
     */
    async runInterestCronStub(): Promise<{ due: number; message: string }> {
        const r = await this.runInterestCron();
        return {
            due: r.processed,
            message: `Đã xử lý ${r.processed} hợp đồng trả lãi, ${r.errors} lỗi.`
        };
    },

    /**
     * Can thiệp thủ công từ Admin Panel.
     */
    async manualAdjustment(adminUser: { _id: unknown; username?: string }, userId: string, payload: {
        agencyBalance?: number;
        lockUntil?: string | null;
        unlockAt?: string | null;
        reason?: string;
    }) {
        const user = await UserModel.findById(userId);
        if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User không tồn tại');

        const updateFields: Record<string, unknown> = {};
        const logEntry: Record<string, unknown> = {
            adminUserId: String(adminUser._id),
            adminUsername: adminUser.username || 'Admin',
            action: 'manual_adjustment',
            reason: payload.reason || 'Điều chỉnh thủ công từ Admin',
            createdAt: new Date()
        };

        if (payload.agencyBalance !== undefined && payload.agencyBalance !== null && !Number.isNaN(Number(payload.agencyBalance))) {
            logEntry.beforeBalance = user.agencyBalance ?? 0;
            logEntry.afterBalance = Number(payload.agencyBalance);
            updateFields.agencyBalance = Number(payload.agencyBalance);
        }
        if (payload.lockUntil !== undefined) {
            logEntry.beforeLockUntil = user.lockUntil;
            const targetDate = payload.lockUntil ? new Date(payload.lockUntil) : null;
            logEntry.afterLockUntil = targetDate;
            updateFields.lockUntil = targetDate;
        }
        if (payload.unlockAt !== undefined) {
            const targetUnlock = payload.unlockAt ? new Date(payload.unlockAt) : null;
            updateFields.unlockAt = targetUnlock;
        }

        await UserModel.updateOne(
            { _id: user._id },
            {
                $set: updateFields,
                $push: { manualAdjustmentLogs: logEntry }
            }
        );

        return { success: true, updatedFields: updateFields };
    }
};

export default agencyService;
