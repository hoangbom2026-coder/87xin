import { RootFilterQuery, Types, UpdateQuery } from 'mongoose';
// model
import PlayerBonusModel, { IPlayerBonus } from '@main/models/player-bonus.model';
import { IBonus } from '@main/models/bonus.model';

export interface ICreatePlayerBonus {
    userId: string;
    bonusId: string;
    amount: number;
    goalAmount: number;
}

const createPlayerBonus = async (newBonus: ICreatePlayerBonus) => {
    return await PlayerBonusModel.create(newBonus);
};

const getPlayerBonuses = async (userId: string) => {
    return await PlayerBonusModel.find({ userId });
};

interface IPlayerBonusFilter {
    status: string;
    isAll?: boolean;
    currentPage: number;
    rowsPerPage: number;
    date?: {
        start: string | Date;
        end: string | Date;
    };
}

const getPlayerBonusList = async (filter: IPlayerBonusFilter) => {
    // eslint-disable-next-line
    const conditions: any = {};
    if (filter.status) conditions.status = filter.status;

    if (!filter.isAll && filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await PlayerBonusModel.countDocuments(conditions);

    const data = await PlayerBonusModel.aggregate([
        {
            $match: conditions
        },
        {
            $skip: skip
        },
        {
            $limit: filter.rowsPerPage
        }
    ]);

    return { data, total };
};

const getPlayerBonusById = async (id: string) => {
    return await PlayerBonusModel.findOne({ _id: id });
};

const patchUpdate = async (condition: RootFilterQuery<IPlayerBonus>, data: UpdateQuery<IPlayerBonus>) => {
    return await PlayerBonusModel.findOneAndUpdate(condition, data, { new: true });
};

const deleteBonus = async (id: string) => {
    return await PlayerBonusModel.findOneAndDelete({ _id: id });
};

interface IPlayerBonusFilter {
    status: string;
    userId: string;
    currentPage: number;
    rowsPerPage: number;
    date?: {
        start: string | Date;
        end: string | Date;
    };
}
const getPlayerBonus = async (filter: IPlayerBonusFilter) => {
    // eslint-disable-next-line
    const conditions: any = { userId: filter.userId };

    if (filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    if (filter.status !== 'all') {
        conditions.status = filter.status;
    }

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await PlayerBonusModel.countDocuments(conditions);

    const data = await PlayerBonusModel.aggregate([
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
                from: 'bonuses',
                as: 'bonus',
                localField: 'bonusId',
                foreignField: '_id'
            }
        },
        {
            $unwind: '$bonus'
        }
    ]);

    return { data, total };
};

const getPlayerActiveBonus = async (bonusId: string, userId: string | Types.ObjectId) => {
    if (!Types.ObjectId.isValid(bonusId)) return null;
    const uid = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return await PlayerBonusModel.findOne({
        _id: new Types.ObjectId(bonusId),
        userId: uid,
        status: 'active'
    });
};

interface IBonusType {
    bonus: IBonus;
    amount: number;
    processAmount: number;
    goalAmount: number;
    status: string;
}

const checkBonusCondition = (bonusItem: IBonusType, amount: number, provider: string) => {
    const bonus = bonusItem.bonus;

    if (provider === 'casino') {
        if (!bonus.casino) return { status: false };
    } else if (provider === 'slot') {
        if (!bonus.slot) return { status: false };
    }

    if (bonus.minBet > amount) {
        return { status: false };
    }
    if (bonus.maxBet !== 0 && bonus.maxBet < amount) {
        return { status: false };
    }
    return { status: true };
};

const updateProcess = async (userId: string, amount: number, provider: string, betId: string) => {
    try {
        const bonuses = await PlayerBonusModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    status: 'pending'
                }
            },
            {
                $lookup: {
                    from: 'bonus',
                    localField: 'bonusId',
                    foreignField: '_id',
                    as: 'bonus',
                    pipeline: [
                        {
                            $match: {
                                status: true,
                                isExpired: false,
                                expireDate: { $gte: new Date() }
                            }
                        }
                    ]
                }
            },
            {
                $unwind: { path: '$bonus' }
            },
            {
                $sort: {
                    createdAt: 1
                }
            }
        ]);

        for (const i in bonuses) {
            const validateData = checkBonusCondition(bonuses[i], amount, provider);

            if (!validateData.status) return false;

            let updateQuery: any = {};
            bonuses[i].betsIds.push(betId);

            const processAmount = amount;
            updateQuery = { $inc: { processAmount }, betsIds: bonuses[i].betsIds };
            if (bonuses[i].goalAmount <= bonuses[i].processAmount + processAmount && bonuses[i].betsIds.length === 0) {
                updateQuery.status = 'active';
            }
            const updated = await PlayerBonusModel.findOneAndUpdate({ _id: bonuses[i]._id }, updateQuery, {
                new: true
            });
            // if (bonus[i].bonus.autoCalc && updated.status === 'active') {
            //     this.handleAllow(updated);
            // }
            return updated;
        }
    } catch (error) {
        console.log('----update bonus error start----');
        console.log(error);
        console.log('----update bonus error end----');
    }
};

export default {
    createPlayerBonus,
    getPlayerBonuses,
    getPlayerBonusList,
    getPlayerBonusById,
    getPlayerBonus,
    getPlayerActiveBonus,
    patchUpdate,
    updateProcess,
    deleteBonus
};
