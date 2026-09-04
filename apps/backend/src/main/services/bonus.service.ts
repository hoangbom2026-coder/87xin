// model
import BonusModel, { IBonus } from '@main/models/bonus.model';
// service
import { RootFilterQuery, UpdateQuery } from 'mongoose';

export interface ICreateBonus {
    name: string;
    percent: number;
    multiply: number;
    option: string;
    bonusCap: number;
    minBet: number;
    maxBet: number;
    slot: boolean;
    casino: boolean;
    status: boolean;
    autoCalc: boolean;
    expireDate: Date;
    banner: string;
    description: string;
    particularData: object;
}

const createBonus = async (newBonus: ICreateBonus) => {
    return await BonusModel.create(newBonus);
};

const getBonuses = async () => {
    return await BonusModel.find({ status: true });
};

const getBonusList = async () => {
    return await BonusModel.find();
};

const getBonusById = async (id: string) => {
    return await BonusModel.findOne({ _id: id });
};

const getAvailableBonusByOption = async (option: string) => {
    return await BonusModel.findOne({ option, status: true, isExpired: false });
};

const patchUpdate = async (condition: RootFilterQuery<IBonus>, data: UpdateQuery<IBonus>) => {
    return await BonusModel.findOneAndUpdate(condition, data, { new: true });
};

const deleteBonus = async (id: string) => {
    return await BonusModel.findOneAndDelete({ _id: id });
};

export default {
    createBonus,
    getBonuses,
    getBonusList,
    getBonusById,
    getAvailableBonusByOption,
    patchUpdate,
    deleteBonus
};
