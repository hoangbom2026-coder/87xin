// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import SportModel, { ISport } from '@main/models/sport.model';

export interface ICreateSport {
    image?: string;
    order: number;
    provider: string;
    currency: string[];
    status: string;
    state: boolean;
    provider_id: number;
    product_id: number;
    product_code: number;
    game_type: string;
    product_title: string;
}

const createSport = async (log: ICreateSport) => {
    return await SportModel.create(log);
};

const createSports = async (data: ICreateSport[]) => {
    return await SportModel.insertMany(data);
};

const patchUpdate = async (condition: RootFilterQuery<ISport>, data: UpdateQuery<ISport>) => {
    return await SportModel.findOneAndUpdate(condition, data, { new: true });
};

const getSportById = async (id: string) => {
    return await SportModel.findOne({ _id: id }).lean();
};

const getSports = async () => {
    return await SportModel.find({ status: 'ACTIVATED' });
};

const getSportList = async () => {
    return await SportModel.find();
};

const deleteSportById = async (id: string) => {
    return await SportModel.deleteOne({ _id: id });
};

export default {
    createSport,
    createSports,
    getSports,
    getSportList,
    getSportById,
    patchUpdate,
    deleteSportById
};
