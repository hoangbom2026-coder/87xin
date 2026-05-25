// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import VipLevelModel, { IVipLevel } from '@main/models/vip-level.model';

export interface ICreateVipLevel {
    parentId: string;
    levelName: string;
    xp: number;
}

const createVipLevel = async (log: ICreateVipLevel) => {
    return await VipLevelModel.create(log);
};

const patchUpdate = async (condition: RootFilterQuery<IVipLevel>, data: UpdateQuery<IVipLevel>) => {
    return await VipLevelModel.findOneAndUpdate(condition, data, { new: true });
};

const getVipLevelById = async (id: string) => {
    return await VipLevelModel.findOne({ _id: id }).lean();
};

const getVipLevels = async () => {
    return await VipLevelModel.aggregate([
        {
            $lookup: {
                from: 'vip-tierses',
                as: 'data',
                foreignField: '_id',
                localField: 'parentId',
                pipeline: [
                    {
                        $project: {
                            tiersName: 1,
                            icon: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: '$data'
        },
        {
            $sort: { xp: 1 }
        },
        {
            $project: {
                levelName: 1,
                xp: 1,
                tiersName: '$data.tiersName',
                icon: '$data.icon'
            }
        }
    ]);
};

const getVipLevelList = async (parentId: string) => {
    return await VipLevelModel.find({ parentId });
};

const deleteVipLevelById = async (id: string) => {
    return await VipLevelModel.deleteOne({ _id: id });
};

const deleteVipLevelByParentId = async (parentId: string) => {
    return await VipLevelModel.deleteMany({ parentId });
};

export default {
    createVipLevel,
    getVipLevels,
    getVipLevelList,
    getVipLevelById,
    patchUpdate,
    deleteVipLevelById,
    deleteVipLevelByParentId
};
