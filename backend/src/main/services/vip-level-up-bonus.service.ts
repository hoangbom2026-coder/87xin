// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import VipLevelModel from '@main/models/vip-level.model';
import VipLevelUpBonus, { IVipLevelUpBonus } from '@main/models/vip-level-up-bonus.model';
import affiliateLogService from './affiliate-log.service';
import userService from './user.service';

const REWARD_WAGER_STEP = [
    { wager: 1000, amount: 0.5 },
    { wager: 5000, amount: 2.5 },
    { wager: 17000, amount: 5 },
    { wager: 49000, amount: 12 },
    { wager: 129000, amount: 25 },
    { wager: 321000, amount: 50 },
    { wager: 769000, amount: 80 },
    { wager: 1793000, amount: 120 },
    { wager: 4097000, amount: 205 },
    { wager: 9217000, amount: 500 }
];

function getClosestStep(value: number) {
    let left = 0;
    let right = REWARD_WAGER_STEP.length - 1;
    let result = null;

    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (REWARD_WAGER_STEP[mid].wager <= value) {
            result = REWARD_WAGER_STEP[mid];
            left = mid + 1; // Try to find a closer (larger but still ≤ value)
        } else {
            right = mid - 1;
        }
    }

    return result;
}

export interface ICreateVipLevelUpBonus {
    userId: string;
    amount: number;
    levelName: string;
    levelXp: number;
}

const createVipLevelUpBonus = async (log: ICreateVipLevelUpBonus) => {
    return await VipLevelUpBonus.create(log);
};

const patchUpdate = async (condition: RootFilterQuery<IVipLevelUpBonus>, data: UpdateQuery<IVipLevelUpBonus>) => {
    return await VipLevelUpBonus.findOneAndUpdate(condition, data, { new: true });
};

const getVipLevelUpBonusById = async (id: string) => {
    return await VipLevelUpBonus.findOne({ _id: id }).lean();
};

const getAvailableBonus = async (userId: string) => {
    return await VipLevelUpBonus.findOne({ userId }).sort({ createdAt: -1 }).limit(1);
};

const getVipLevelUpBonusList = async () => {
    return await VipLevelUpBonus.find().sort('order');
};

const deleteVipLevelUpBonusById = async (id: string) => {
    return await VipLevelUpBonus.deleteOne({ _id: id });
};

const calculateLevelUp = async (userId: string, turnover: number) => {
    let nextLevel;

    const stringNextLevel = await global.redis.get(`${userId}-nexLevel`);
    if (stringNextLevel) {
        nextLevel = JSON.parse(stringNextLevel);
    } else {
        const lastItem = await VipLevelUpBonus.findOne({ userId }).sort({ levelXp: -1 }).limit(1);
        const query = lastItem ? { xp: { $gt: lastItem.levelXp } } : { xp: { $ne: 0 } };
        nextLevel = await VipLevelModel.findOne(query).sort({ xp: -1 }).limit(1).populate('parentId');
    }

    if (nextLevel.xp < turnover) {
        await createVipLevelUpBonus({
            userId,
            amount: nextLevel.parentId.levelUpBonus,
            levelName: nextLevel.levelName,
            levelXp: nextLevel.xp
        });
        nextLevel = await VipLevelModel.findOne({ xp: { $gt: nextLevel.xp } })
            .sort({ xp: -1 })
            .limit(1)
            .populate('parentId');
        global.redis.set(`${userId}-nexLevel`, JSON.stringify(nextLevel));

        const userMetaString = await global.redis.get(`${userId}-info`);
        const userMeta = JSON.parse(userMetaString);

        const archiveValue = getClosestStep(turnover);
        if (userMeta.inviteCode && archiveValue && archiveValue.wager !== userMeta.lastVipValue) {
            if (userMeta.affiliateInit) {
                await affiliateLogService.createAffiliateLog({
                    invitorId: userMeta.invitorId,
                    childId: userId,
                    currency: userMeta.currency,
                    referralCode: userMeta.invitorCode,
                    totalReferralAmount: archiveValue.amount,
                    referralAmount: archiveValue.amount,
                    lastVipLevelAmount: archiveValue.wager
                });
                await userService.patchUpdate({ _id: userId }, { affiliateInit: true });

                await global.redis.set(`${userId}-info`, JSON.stringify({ ...userMeta, affiliateInit: true }));
            } else {
                await affiliateLogService.updateAffiliateLog(
                    { invitorId: userMeta.invitorId, childId: userId },
                    { $inc: { referralAmount: archiveValue.amount }, lastUnlockAmount: archiveValue.wager }
                );
            }
        }
    } else {
        if (!stringNextLevel) {
            global.redis.set(`${userId}-nexLevel`, nextLevel ? JSON.stringify(nextLevel) : '');
        }
    }
};

export default {
    createVipLevelUpBonus,
    getVipLevelUpBonusList,
    getVipLevelUpBonusById,
    getAvailableBonus,
    patchUpdate,
    deleteVipLevelUpBonusById,
    calculateLevelUp
};
