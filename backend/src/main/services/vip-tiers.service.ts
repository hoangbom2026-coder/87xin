import { RootFilterQuery, UpdateQuery } from 'mongoose';
import VipTiersModel, { IVipTiers } from '@main/models/vip-tiers.model';

const createVipTiers = async (data: Partial<IVipTiers>) => {
    return await VipTiersModel.create(data);
};

const patchUpdate = async (
    condition: RootFilterQuery<IVipTiers>,
    data: UpdateQuery<IVipTiers>
) => {
    return await VipTiersModel.findOneAndUpdate(condition, data, { new: true });
};

const getVipTiersById = async (id: string) => {
    return await VipTiersModel.findOne({ _id: id }).lean();
};

const getVipTiersList = async () => {
    return await VipTiersModel.find().sort({ order: 1 }).lean();
};

const deleteVipTiersById = async (id: string) => {
    return await VipTiersModel.deleteOne({ _id: id });
};

export default {
    createVipTiers,
    patchUpdate,
    getVipTiersById,
    getVipTiersList,
    deleteVipTiersById
};
