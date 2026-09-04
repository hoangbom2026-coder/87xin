// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import AgPayinLogModel, { IAgPayinLog } from '@main/models/ag-payin-log.model';
import AgPayoutLogModel, { IAgPayoutLog } from '@main/models/ag-payout-log.model';

export interface ICreateAgPayin {
    userId: string;
    depositId: string;
    msg: string;
    status: number;
    amount: number;
    merchantOrderId: string;
    agOrderId: string;
    payType: number;
    createTime: number;
    realPayAmount?: number;
}

const createAgPayin = async (log: ICreateAgPayin) => {
    return await AgPayinLogModel.create(log);
};

const updateAgPayin = async (condition: RootFilterQuery<IAgPayinLog>, data: UpdateQuery<IAgPayinLog>) => {
    return await AgPayinLogModel.findOneAndUpdate(condition, data, { new: true });
};

const getAgPayinById = async (id: string) => {
    return await AgPayinLogModel.findOne({ _id: id }).lean();
};

const getAgPayinList = async () => {
    return await AgPayinLogModel.find();
};

const deleteAgPayinById = async (id: string) => {
    return await AgPayinLogModel.deleteOne({ _id: id });
};

const getAgpayLog = async (filter: RootFilterQuery<ICreateAgPayin>) => {
    return await AgPayinLogModel.findOne(filter);
};

// -------------------------------------------------------------------

export interface ICreateAgPayout {
    userId: string;
    withdrawId: string;
    msg: string;
    status: number;
    statusDesc: string;
    amount: number;
    merchantOrderId: string;
    agOrderId: string;
    payType: number;
    createTime: number;
    userCert: string;
    userName: string;
    validateUserCert: boolean;
}

const createAgPayout = async (log: ICreateAgPayout) => {
    return await AgPayoutLogModel.create(log);
};

const updateAgPayout = async (condition: RootFilterQuery<IAgPayoutLog>, data: UpdateQuery<IAgPayoutLog>) => {
    return await AgPayoutLogModel.findOneAndUpdate(condition, data, { new: true });
};

const getAgPayoutById = async (id: string) => {
    return await AgPayoutLogModel.findOne({ _id: id }).lean();
};

const getAgPayoutList = async () => {
    return await AgPayoutLogModel.find();
};

const deleteAgPayoutById = async (id: string) => {
    return await AgPayoutLogModel.deleteOne({ _id: id });
};

const getAgpayoutLog = async (filter: RootFilterQuery<ICreateAgPayout>) => {
    return await AgPayoutLogModel.findOne(filter);
};

export default {
    createAgPayin,
    getAgpayLog,
    getAgPayinList,
    getAgPayinById,
    updateAgPayin,
    deleteAgPayinById,
    // --------------------
    createAgPayout,
    getAgpayoutLog,
    getAgPayoutList,
    getAgPayoutById,
    updateAgPayout,
    deleteAgPayoutById
};
