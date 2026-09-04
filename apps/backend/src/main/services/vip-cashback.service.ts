// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import VipCashback, { IVipCashback } from '@main/models/vip-cashback.model';
import VipTiersModel from '@main/models/vip-tiers.model';
import BalanceModel from '@main/models/balance.model';
import TransactionModel from '@main/models/transaction.model';
import moment from 'moment';

export interface ICreateVipCashback {
    userId: string;
    amount: number;
    currency: string;
    tiersName: string;
    type: string;
}

const createVipCashback = async (log: ICreateVipCashback) => {
    return await VipCashback.create(log);
};

const bulkCreateVipCashback = async (logs: ICreateVipCashback[]) => {
    return await VipCashback.insertMany(logs);
};

const patchUpdate = async (condition: RootFilterQuery<IVipCashback>, data: UpdateQuery<IVipCashback>) => {
    return await VipCashback.findOneAndUpdate(condition, data, { new: true });
};

const getVipCashbackById = async (id: string) => {
    return await VipCashback.findOne({ _id: id }).lean();
};

const getVipCashbackList = async (parentId: string) => {
    return await VipCashback.find({ parentId });
};

const deleteVipCashbackById = async (id: string) => {
    return await VipCashback.deleteOne({ _id: id });
};

const deleteVipCashbackByParentId = async (parentId: string) => {
    return await VipCashback.deleteMany({ parentId });
};

type VipLevel = {
    parentId: any;
    levelName: string;
    xp: number;
    createdAt: Date;
    updatedAt: Date;
};

function getMinMaxXpLevels(levels: VipLevel[]) {
    if (levels.length === 0) return { min: null, max: null };

    let min = levels[0];
    let max = levels[0];

    for (const level of levels) {
        if (level.xp < min.xp) min = level;
        if (level.xp > max.xp) max = level;
    }

    return { min, max };
}

const weeklyCashback = async () => {
    const availableLevels = await VipTiersModel.aggregate([
        {
            $match: { weeklyCashback: true }
        },
        {
            $lookup: {
                foreignField: 'parentId',
                localField: '_id',
                from: 'vip-levels',
                as: 'level'
            }
        }
    ]);

    for (let i = 0; i < availableLevels.length; i++) {
        const tiers = availableLevels[i];
        const { min, max } = getMinMaxXpLevels(tiers.level);
        const balances = await BalanceModel.aggregate([
            {
                $match: {
                    turnover: { $gte: min, $lte: max }
                }
            },
            {
                $lookup: {
                    foreignField: '_id',
                    localField: 'currencyId',
                    from: 'currencies',
                    as: 'currency'
                }
            },
            {
                $unwind: '$currency'
            }
        ]);

        const userIds = [];
        const currencyObj = {};
        for (const item of balances) {
            userIds.push(item.userId);
            currencyObj[item.userId] = item.currency.name;
        }

        const startWeek = moment().add(-1, 'week').startOf('week').startOf('day').toDate();
        const endWeek = moment().add(-1, 'week').endOf('week').endOf('day').toDate();

        let betAmounts = await TransactionModel.aggregate([
            {
                $match: {
                    userId: { $in: userIds },
                    type: 'bet',
                    createdAt: { $gte: startWeek, $lte: endWeek }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    total: { $sum: '$amount' }
                }
            },
            {
                $match: {
                    total: { $gte: tiers.weeklyCashbackMin }
                }
            }
        ]);

        const logs = betAmounts.map((item) => ({
            userId: item._id,
            amount: item.total,
            currency: currencyObj[item._id],
            type: 'weekly',
            tiersName: tiers.tiersName
        }));
        await bulkCreateVipCashback(logs);
    }
};

const monthlyCashback = async () => {
    const availableLevels = await VipTiersModel.aggregate([
        {
            $match: { monthlyCashback: true }
        },
        {
            $lookup: {
                foreignField: 'parentId',
                localField: '_id',
                from: 'vip-levels',
                as: 'level'
            }
        }
    ]);

    for (let i = 0; i < availableLevels.length; i++) {
        const tiers = availableLevels[i];
        const { min, max } = getMinMaxXpLevels(tiers.level);
        const balances = await BalanceModel.aggregate([
            {
                $match: {
                    turnover: { $gte: min, $lte: max }
                }
            },
            {
                $lookup: {
                    foreignField: '_id',
                    localField: 'currencyId',
                    from: 'currencies',
                    as: 'currency'
                }
            },
            {
                $unwind: '$currency'
            }
        ]);

        const userIds = [];
        const currencyObj = {};
        for (const item of balances) {
            userIds.push(item.userId);
            currencyObj[item.userId] = item.currency.name;
        }

        const startMonth = moment().add(-1, 'month').startOf('month').startOf('day').toDate();
        const endMonth = moment().add(-1, 'month').endOf('month').endOf('day').toDate();

        console.log(startMonth);
        console.log(endMonth);

        let betAmounts = await TransactionModel.aggregate([
            {
                $match: {
                    userId: { $in: userIds },
                    type: 'bet',
                    createdAt: { $gte: startMonth, $lte: endMonth }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    total: { $sum: '$amount' }
                }
            },
            {
                $match: {
                    total: { $gte: tiers.weeklyCashbackMin }
                }
            }
        ]);

        const logs = betAmounts.map((item) => ({
            userId: item._id,
            amount: item.total,
            currency: currencyObj[item._id],
            type: 'monthly',
            tiersName: tiers.tiersName
        }));
        await bulkCreateVipCashback(logs);
    }
};

export default {
    bulkCreateVipCashback,
    createVipCashback,
    getVipCashbackList,
    getVipCashbackById,
    patchUpdate,
    deleteVipCashbackById,
    deleteVipCashbackByParentId,
    weeklyCashback,
    monthlyCashback
};
