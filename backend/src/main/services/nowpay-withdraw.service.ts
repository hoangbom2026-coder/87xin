// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import NowpayWithdrawLogModel, { INowpayWithdrawLog } from '@main/models/nowpay-withdraw-log.model';

export interface ICreateWithdraw {
    userId: string;
    address: string;
    amount: number;
    batch_withdrawal_id?: string;
    currency: string;
    error?: string;
    extra_id: string;
    fee?: number;
    hash?: string;
    id: string;
    status: string;
    requested_at?: string;
    created_at?: string;
    updated_at?: string;
}

const createWithdraw = async (log: ICreateWithdraw) => {
    return await NowpayWithdrawLogModel.create(log);
};

const updateAndCreateWithdraw = async (
    condition: RootFilterQuery<INowpayWithdrawLog>,
    data: UpdateQuery<INowpayWithdrawLog>
) => {
    return await NowpayWithdrawLogModel.findOneAndUpdate(condition, data, { new: true, upsert: true });
};

const patchUpdate = async (condition: RootFilterQuery<INowpayWithdrawLog>, data: UpdateQuery<INowpayWithdrawLog>) => {
    return await NowpayWithdrawLogModel.findOneAndUpdate(condition, data, { new: true });
};

const getWithdrawById = async (id: string) => {
    return await NowpayWithdrawLogModel.findOne({ _id: id }).lean();
};

const getNowpayWithdrawLog = async (filter: RootFilterQuery<INowpayWithdrawLog>) => {
    return await NowpayWithdrawLogModel.findOne(filter);
};
export default {
    createWithdraw,
    getWithdrawById,
    getNowpayWithdrawLog,
    patchUpdate,
    updateAndCreateWithdraw
};
