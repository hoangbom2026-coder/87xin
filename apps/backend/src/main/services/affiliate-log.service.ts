// model
import AffiliateLogModel, { IAffiliateLog } from '@main/models/affiliate-log.model';
import UserModel from '@main/models/user.model';
import { RootFilterQuery, Types, UpdateQuery } from 'mongoose';
import settingService from './setting.service';
import { IAffiliateTier } from '@main/models/setting.model';
import { groupBy } from 'lodash';

export interface ICreateAffiliateLog {
    invitorId: string;
    childId: string;
    currency: string;
    referralCode: string;
    betAmount?: number;
    commissionAmount?: number;
    commissionWager?: number;
    totalReferralAmount?: number;
    referralAmount?: number;
    referralWager?: number;
    lastVipLevelAmount?: number;
    level?: number;
    tierRatio?: number;
}

export interface IChainEntry {
    invitorId: string;
    level: number;
    ratio: number;
    referralCode: string;
}

/**
 * Build the upline chain for a user from `path[]`. Returns at most `tiers.length` entries,
 * F1 = direct invitor, F2 = invitor's invitor, ...
 *
 * `path` is stored from root → most recent ancestor. So `path[length - 1]` is the direct
 * affiliate ancestor. For player referrals (no `path`), fall back to `invitorId` as F1.
 */
export const computeChain = (
    user: {
        invitorId?: unknown;
        path?: unknown[];
        inviteCode?: unknown;
        inviteCodeChain?: unknown[];
    } | null | undefined,
    tiers: IAffiliateTier[]
): IChainEntry[] => {
    if (!user || !Array.isArray(tiers) || !tiers.length) return [];
    const sortedTiers = [...tiers].sort((a, b) => a.level - b.level);
    const chain: IChainEntry[] = [];

    const path = Array.isArray(user.path) ? user.path.map(String) : [];
    const inviteChain =
        Array.isArray(user.inviteCodeChain) && user.inviteCodeChain.length > 0
            ? user.inviteCodeChain.map(String)
            : [];
    const selfCode =
        typeof user.inviteCode === 'string' && user.inviteCode.trim().length > 0
            ? user.inviteCode
            : '';

    if (path.length > 0) {
        for (let i = 0; i < sortedTiers.length; i++) {
            const ancestor = path[path.length - 1 - i];
            if (!ancestor) break;
            let refCode =
                inviteChain.length >= path.length ? inviteChain[inviteChain.length - 1 - i] : '';

            /** Legacy users: chỉ có mã của chính downline → F1 có mã */
            if (!refCode && i === path.length - 1) refCode = selfCode;

            chain.push({
                invitorId: String(ancestor),
                level: sortedTiers[i].level,
                ratio: sortedTiers[i].ratio,
                referralCode: refCode || selfCode || '—'
            });
        }
        return chain;
    }

    if (user.invitorId) {
        chain.push({
            invitorId: String(user.invitorId),
            level: sortedTiers[0].level,
            ratio: sortedTiers[0].ratio,
            referralCode: selfCode || (inviteChain[inviteChain.length - 1] ?? '—')
        });
    }
    return chain;
};

const createAffiliateLog = async (log: ICreateAffiliateLog) => {
    return await AffiliateLogModel.create(log);
};

const updateAffiliateLog = async (condition: RootFilterQuery<IAffiliateLog>, log: UpdateQuery<IAffiliateLog>) => {
    return await AffiliateLogModel.findOneAndUpdate(condition, log, { new: true });
};

/**
 * Upsert F-tier accrual: if (invitorId, childId, level) exists → $inc; else create.
 * Returns the resulting log doc.
 */
const accrueTierLog = async (
    entry: {
        invitorId: string;
        childId: string;
        currency: string;
        referralCode: string;
        level: number;
        tierRatio: number;
        betAmount: number;
        commissionAmount: number;
    }
): Promise<IAffiliateLog | null> => {
    const filter = {
        invitorId: new Types.ObjectId(entry.invitorId),
        childId: new Types.ObjectId(entry.childId),
        level: entry.level
    };
    return await AffiliateLogModel.findOneAndUpdate(
        filter,
        {
            $inc: { betAmount: entry.betAmount, commissionAmount: entry.commissionAmount },
            $set: {
                referralCode: entry.referralCode,
                currency: entry.currency,
                tierRatio: entry.tierRatio
            }
        },
        { new: true, upsert: true }
    );
};

const getCommissionRewardStatus = async (userId: string) => {
    return await AffiliateLogModel.aggregate([
        {
            $match: {
                invitorId: new Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: '$currency',
                totalCommissionWager: { $sum: '$commissionWager' },
                totalCommissionAmount: { $sum: '$commissionAmount' },
                totalReferralAmount: { $sum: '$referralAmount' },
                totalReferralWager: { $sum: '$referralWager' }
            }
        }
    ]);
};

interface IFilter {
    userId: string;
    type: string;
    currentPage: number;
    rowsPerPage: number;
}

const getRewardLog = async (filter: IFilter) => {
    const conditions = {
        invitorId: filter.userId
    };

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await AffiliateLogModel.countDocuments(conditions);

    if (filter.type === 'commission') {
        const data = await AffiliateLogModel.aggregate([
            {
                $match: conditions
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: filter.rowsPerPage
            },
            {
                $lookup: {
                    from: 'users',
                    as: 'user',
                    localField: 'childId',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$user'
            },
            {
                $lookup: {
                    from: 'referral-codes',
                    as: 'referralData',
                    localField: 'referralCode',
                    foreignField: 'code'
                }
            },
            {
                $unwind: '$referralData'
            }
        ]);

        return { data, total };
    }

    const data = await AffiliateLogModel.aggregate([
        {
            $match: conditions
        },
        {
            $skip: skip
        },
        {
            $limit: filter.rowsPerPage
        },
        {
            $lookup: {
                from: 'users',
                as: 'user',
                localField: 'childId',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: '$user'
        },
        {
            $lookup: {
                from: 'balances',
                as: 'balance',
                localField: 'childId',
                foreignField: 'userId',
                pipeline: [
                    {
                        $project: {
                            turnover: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: '$balance'
        },
        {
            $lookup: {
                from: 'referral-codes',
                as: 'referralData',
                localField: 'referralCode',
                foreignField: 'code'
            }
        },
        {
            $unwind: '$referralData'
        }
    ]);

    return { data, total };
};

const getAffiliateByUser = async (condition: RootFilterQuery<IAffiliateLog>) => {
    return await AffiliateLogModel.findOne(condition);
};

const getRewardDashboard = async (userId: string, currency: string) => {
    const result = await AffiliateLogModel.aggregate([
        {
            $match: {
                invitorId: new Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: '$currency',
                totalBetAmount: { $sum: '$betAmount' },
                totalCommissionAmount: { $sum: '$commissionAmount' },
                totalCommissionWager: { $sum: '$commissionWager' },
                totalReferralAmount: { $sum: '$totalReferralAmount' },
                totalAvailableReferral: { $sum: '$referralAmount' },
                totalReferralWager: { $sum: '$referralWager' }
            }
        }
    ]);

    const data = {
        totalBetAmount: 0,
        totalCommissionAmount: 0,
        totalCommissionWager: 0,
        totalReferralAmount: 0,
        totalAvailableReferral: 0,
        totalReferralWager: 0
    };
    const setting = await settingService.getSetting();

    result.forEach((element) => {
        data.totalBetAmount += element.totalBetAmount * (1 / setting.rates[element._id]);
        data.totalCommissionAmount += element.totalCommissionAmount * (1 / setting.rates[element._id]);
        data.totalCommissionWager += element.totalCommissionWager * (1 / setting.rates[element._id]);
        data.totalReferralAmount += element.totalReferralAmount * (1 / setting.rates[element._id]);
        data.totalAvailableReferral += element.totalAvailableReferral * (1 / setting.rates[element._id]);
        data.totalReferralWager += element.totalReferralWager * (1 / setting.rates[element._id]);
    });

    data.totalBetAmount = data.totalBetAmount * setting.rates[currency];
    data.totalCommissionAmount = data.totalCommissionAmount * setting.rates[currency];
    data.totalCommissionWager = data.totalCommissionWager * setting.rates[currency];
    data.totalReferralAmount = data.totalReferralAmount * setting.rates[currency];
    data.totalAvailableReferral = data.totalAvailableReferral * setting.rates[currency];
    data.totalReferralWager = data.totalReferralWager * setting.rates[currency];

    return data;
};

const getRewardActivity = async (userId: string, currency: string) => {
    const result = await AffiliateLogModel.aggregate([
        {
            $match: {
                invitorId: new Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: {
                    code: '$referralCode',
                    currency: '$currency'
                },
                totalBetAmount: { $sum: '$betAmount' },
                totalCommissionAmount: { $sum: '$commissionAmount' },
                totalCommissionWager: { $sum: '$commissionWager' },
                totalReferralAmount: { $sum: '$totalReferralAmount' },
                totalAvailableReferral: { $sum: '$referralAmount' },
                totalReferralWager: { $sum: '$referralWager' }
            }
        },
        {
            $lookup: {
                from: 'referral-codes',
                as: 'referralData',
                localField: '_id.code',
                foreignField: 'code'
            }
        },
        {
            $unwind: { path: '$referralData', preserveNullAndEmptyArrays: true }
        },
        {
            $sort: {
                'referralData.createdAt': 1
            }
        },
        {
            $project: {
                referralCode: '$_id.code',
                name: '$referralData.name',
                currency: '$_id.currency',
                createdAt: '$referralData.createdAt',
                totalBetAmount: 1,
                totalCommissionAmount: 1,
                totalCommissionWager: 1,
                totalReferralAmount: 1,
                totalAvailableReferral: 1,
                totalReferralWager: 1
            }
        }
    ]);

    const usdData = [];
    const setting = await settingService.getSetting();

    const codeGroup = groupBy(result, 'referralCode');

    Object.keys(codeGroup).forEach((key) => {
        const values = {
            totalBetAmount: 0,
            totalCommissionAmount: 0,
            totalCommissionWager: 0,
            totalReferralAmount: 0,
            totalAvailableReferral: 0,
            totalReferralWager: 0
        };
        codeGroup[key].forEach((item) => {
            values.totalBetAmount += item.totalBetAmount * (1 / setting.rates[item.currency]);
            values.totalCommissionAmount += item.totalCommissionAmount * (1 / setting.rates[item.currency]);
            values.totalCommissionWager += item.totalCommissionWager * (1 / setting.rates[item.currency]);
            values.totalReferralAmount += item.totalReferralAmount * (1 / setting.rates[item.currency]);
            values.totalAvailableReferral += item.totalAvailableReferral * (1 / setting.rates[item.currency]);
            values.totalReferralWager += item.totalReferralWager * (1 / setting.rates[item.currency]);
        });
        usdData.push({
            ...values,
            referralCode: key,
            name: codeGroup[key][0].name,
            createdAt: codeGroup[key][0].createdAt
        });
    });

    const data = usdData.map((item) => ({
        ...item,
        totalBetAmount: item.totalBetAmount * setting.rates[currency],
        totalCommissionAmount: item.totalCommissionAmount * setting.rates[currency],
        totalCommissionWager: item.totalCommissionWager * setting.rates[currency],
        totalReferralAmount: item.totalReferralAmount * setting.rates[currency],
        totalAvailableReferral: item.totalAvailableReferral * setting.rates[currency],
        totalReferralWager: item.totalReferralWager * setting.rates[currency]
    }));

    return data;
};

const convertCommission = async (userId: string) => {
    return await AffiliateLogModel.updateMany({ invitorId: new Types.ObjectId(userId) }, [
        {
            $set: {
                commissionWager: { $add: ['$commissionWager', '$commissionAmount'] },
                commissionAmount: 0
            }
        }
    ]);
};

const convertReferral = async (userId: string) => {
    return await AffiliateLogModel.updateMany({ invitorId: new Types.ObjectId(userId) }, [
        {
            $set: {
                referralWager: { $add: ['$referralWager', '$referralAmount'] },
                referralAmount: 0
            }
        }
    ]);
};

/** Aggregate pending commission per invitor, used by auto-payout cron. */
const aggregatePendingCommission = async () => {
    return await AffiliateLogModel.aggregate([
        {
            $match: {
                $or: [
                    { commissionAmount: { $gt: 0 } },
                    { referralAmount: { $gt: 0 } }
                ]
            }
        },
        {
            $group: {
                _id: { invitorId: '$invitorId', currency: '$currency' },
                totalCommission: { $sum: '$commissionAmount' },
                totalReferral: { $sum: '$referralAmount' }
            }
        }
    ]);
};

/** Admin: toàn bộ affiliate-logs (commission vs referral) có phân trang. */
const listAdminRewardLogs = async (params: {
    type: 'commission' | 'referral';
    invitorUsername?: string;
    page: number;
    limit: number;
}) => {
    const skip = (params.page - 1) * params.limit;
    const match: Record<string, unknown> = {};
    if (params.type === 'commission') {
        match.$or = [{ commissionAmount: { $gt: 0 } }, { betAmount: { $gt: 0 } }];
    } else {
        match.referralAmount = { $gt: 0 };
    }
    const invU = params.invitorUsername?.trim().toLowerCase();
    if (invU) {
        const inv = await UserModel.findOne({ username: invU }).select('_id').lean();
        if (!inv?._id) return { data: [] as Record<string, unknown>[], total: 0 };
        match.invitorId = inv._id;
    }
    const total = await AffiliateLogModel.countDocuments(match);
    const rows = await AffiliateLogModel.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.limit)
        .lean();
    const ids = new Set<string>();
    for (const r of rows) {
        ids.add(String(r.invitorId));
        ids.add(String(r.childId));
    }
    const oid = [...ids].filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const users = await UserModel.find({ _id: { $in: oid } })
        .select('username')
        .lean();
    const uname: Record<string, string> = {};
    for (const u of users) {
        uname[String(u._id)] = String(u.username || '');
    }
    const data = rows.map((r) => ({
        _id: r._id,
        createdAt: r.createdAt,
        level: r.level,
        fromUsername: uname[String(r.childId)],
        toUsername: uname[String(r.invitorId)],
        amount:
            params.type === 'commission'
                ? Number(r.commissionAmount ?? 0)
                : Number(r.referralAmount ?? 0),
        source: r.currency,
        referralCode: r.referralCode,
        betAmount: r.betAmount,
        commissionAmount: r.commissionAmount,
        referralAmount: r.referralAmount,
        tierRatio: r.tierRatio
    }));
    return { data, total };
};

export default {
    getCommissionRewardStatus,
    getAffiliateByUser,
    createAffiliateLog,
    updateAffiliateLog,
    accrueTierLog,
    computeChain,
    aggregatePendingCommission,
    getRewardLog,
    getRewardDashboard,
    getRewardActivity,
    convertCommission,
    convertReferral,
    listAdminRewardLogs
};
