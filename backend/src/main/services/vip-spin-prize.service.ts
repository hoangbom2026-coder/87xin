// model
import { RootFilterQuery, Types, UpdateQuery } from 'mongoose';
import VipSpinPrizeModel, { IVipSpinPrize, IVipSpinPrizeSlot } from '@main/models/vip-spin-prize.model';

export interface ICreateVipSpinPrize {
    prizes: IVipSpinPrizeSlot[];
    tiersId: string;
}

const createVipSpinPrize = async (prize: ICreateVipSpinPrize) => {
    return await VipSpinPrizeModel.create(prize);
};

const patchUpdate = async (condition: RootFilterQuery<IVipSpinPrize>, data: UpdateQuery<IVipSpinPrize>) => {
    return await VipSpinPrizeModel.findOneAndUpdate(condition, data, { new: true });
};

const getVipSpinPrizeById = async (id: string) => {
    const prize = await VipSpinPrizeModel.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: 'vip-tierses',
                as: 'tiers',
                localField: 'tiersId',
                foreignField: '_id'
            }
        },
        {
            $unwind: '$tiers'
        }
    ]);

    if (prize.length) return prize[0];
    return null;
};

const getVipSpinPrizeList = async () => {
    return await VipSpinPrizeModel.aggregate([
        {
            $lookup: {
                from: 'vip-tierses',
                as: 'tiers',
                localField: 'tiersId',
                foreignField: '_id'
            }
        },
        {
            $unwind: '$tiers'
        }
    ]);
};

const getVipSpinPrizes = async () => {
    return await VipSpinPrizeModel.aggregate([
        {
            $lookup: {
                from: 'vip-tierses',
                as: 'tiers',
                localField: 'tiersId',
                foreignField: '_id'
            }
        },
        {
            $unwind: '$tiers'
        },
        {
            $lookup: {
                from: 'vip-levels',
                as: 'level',
                let: { tiersId: '$tiersId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$parentId', '$$tiersId'] }
                        }
                    },
                    {
                        $sort: { xp: 1 }
                    },
                    {
                        $limit: 1
                    }
                ]
            }
        },
        {
            $unwind: '$level'
        },
        {
            $project: {
                prizes: 1,
                tiersName: '$tiers.tiersName',
                levelName: '$level.levelName',
                xp: '$level.xp'
            }
        },
        {
            $sort: { xp: -1 }
        }
    ]);
};

const deleteVipSpinPrizeById = async (id: string) => {
    return await VipSpinPrizeModel.deleteOne({ _id: id });
};

export default {
    createVipSpinPrize,
    getVipSpinPrizeList,
    getVipSpinPrizeById,
    patchUpdate,
    getVipSpinPrizes,
    deleteVipSpinPrizeById
};
