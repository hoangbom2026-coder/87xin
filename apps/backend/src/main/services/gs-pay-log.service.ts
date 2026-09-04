// model
import GsPayDepositLogModel from '@main/models/gs-pay-deposit-log.model';
import GsPayWithdrawLogModel from '@main/models/gs-pay-withdraw-log.model';
import { RootFilterQuery } from 'mongoose';

export interface IDepsoitLog {
    userId: string;
    depositId: string;
    merchant_ref: string;
    system_ref: string;
    amount: number;
    fee: number;
    pay_amount?: number;
    status: number;
    success_time: string;
    payurl: string;
    extend_params?: string;
    product: string;
    product_ref?: string;
    fiat_currency?: string;
    extra?: Object;
}

const createGsPayDeposit = async (log: IDepsoitLog) => {
    return await GsPayDepositLogModel.create(log);
};

const updateDepositLog = async (filter: RootFilterQuery<IDepsoitLog>, log: Partial<IDepsoitLog>) => {
    return await GsPayDepositLogModel.findOneAndUpdate(filter, log, { new: true });
};

const getGsPayDepositLog = async (filter: RootFilterQuery<IDepsoitLog>) => {
    return await GsPayDepositLogModel.findOne(filter);
};

export interface IWithdrawLog {
    userId: string;
    merchant_ref: string;
    system_ref: string;
    amount: number;
    fee: number;
    pay_amount?: number;
    status: number;
    success_time?: string;
    extend_params?: string;
    product: string;
    product_ref?: string;
}

const createGsPayWithdraw = async (log: IWithdrawLog) => {
    return await GsPayWithdrawLogModel.create(log);
};

const updateWithdrawLog = async (filter: RootFilterQuery<IWithdrawLog>, log: Partial<IWithdrawLog>) => {
    return await GsPayWithdrawLogModel.findOneAndUpdate(filter, log, { new: true });
};

export default {
    getGsPayDepositLog,
    createGsPayDeposit,
    updateDepositLog,

    createGsPayWithdraw,
    updateWithdrawLog
};
