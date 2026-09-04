// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import VipSpinReward, { IVipSpinReward } from '@main/models/vip-spin-reward.model';

export interface ICreateVipSpinReward {
    userId: string;
    amount: number;
    currency: string;
}

const createVipSpinReward = async (log: ICreateVipSpinReward) => {
    console.log(log);
    return await VipSpinReward.create(log);
};

const patchUpdate = async (condition: RootFilterQuery<IVipSpinReward>, data: UpdateQuery<IVipSpinReward>) => {
    return await VipSpinReward.findOneAndUpdate(condition, data, { new: true });
};

const getVipSpinRewardById = async (id: string) => {
    return await VipSpinReward.findOne({ _id: id }).lean();
};

const getVipSpinRewardList = async (parentId: string) => {
    return await VipSpinReward.find({ parentId });
};

const deleteVipSpinRewardById = async (id: string) => {
    return await VipSpinReward.deleteOne({ _id: id });
};

const deleteVipSpinRewardByParentId = async (parentId: string) => {
    return await VipSpinReward.deleteMany({ parentId });
};

const getTotalBonus = async () => {
    const amount = await VipSpinReward.aggregate([
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
    if (amount.length) return amount[0];
    return { totalAmount: 0 };
};

const getWinners = async () => {
    const winners = await VipSpinReward.aggregate([
        {
            $sort: { createdAt: -1 }
        },
        {
            $limit: 100
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                playerName: '$user.username',
                avatar: '$user.avatar',
                amount: 1,
                currency: 1
            }
        }
    ]);
    return winners.map((winner) => {
        const visible = winner.playerName.slice(0, 2) + '****';
        return { ...winner, playerName: visible };
    });
};

const getLastSpin = async (userId: string) => {
    return await VipSpinReward.findOne({ userId }).sort({ createdAt: -1 });
};

export default {
    createVipSpinReward,
    getVipSpinRewardList,
    getVipSpinRewardById,
    patchUpdate,
    deleteVipSpinRewardById,
    deleteVipSpinRewardByParentId,
    getTotalBonus,
    getLastSpin,
    getWinners
};
