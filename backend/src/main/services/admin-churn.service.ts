import TransactionModel from '@main/models/transaction.model';

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

/**
 * Người chơi có hoạt động cược gần nhất (bet/win) trước mốc inactiveDays — MVP churn / giữ chân.
 * riskScore: 0–100 (càng lâu không cược càng cao, có trần).
 */
export async function getChurnAtRisk(inactiveDaysInput: number, limitInput: number) {
    const inactiveDays = clamp(Math.floor(inactiveDaysInput || 5), 3, 90);
    const limit = clamp(Math.floor(limitInput || 30), 1, 100);
    const cutoff = new Date(Date.now() - inactiveDays * 86400000);
    const now = new Date();

    const rows = await TransactionModel.aggregate([
        {
            $match: {
                type: { $in: ['bet', 'win'] }
            }
        },
        {
            $group: {
                _id: '$userId',
                lastBetAt: { $max: '$createdAt' }
            }
        },
        {
            $match: {
                lastBetAt: { $lt: cutoff }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'u'
            }
        },
        { $unwind: '$u' },
        {
            $match: {
                'u.role': 'user',
                'u.status': 'active'
            }
        },
        {
            $addFields: {
                daysQuiet: {
                    $divide: [
                        { $subtract: [{ $literal: now }, '$lastBetAt'] },
                        86400000
                    ]
                }
            }
        },
        {
            $addFields: {
                riskScore: {
                    $min: [
                        100,
                        {
                            $multiply: [{ $ceil: '$daysQuiet' }, 4]
                        }
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0,
                userId: '$_id',
                username: '$u.username',
                depositCount: '$u.depositCount',
                lastBetAt: '$lastBetAt',
                daysQuiet: { $round: ['$daysQuiet', 1] },
                riskScore: 1
            }
        },
        { $sort: { lastBetAt: 1 } },
        { $limit: limit }
    ]);

    return {
        generatedAt: now.toISOString(),
        inactiveDays,
        cutoff: cutoff.toISOString(),
        users: rows
    };
}

export default {
    getChurnAtRisk
};
