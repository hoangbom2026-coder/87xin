import WithdrawModel, { IWithdraw } from '@main/models/withdraw.model';
import { RootFilterQuery, UpdateQuery } from 'mongoose';

const createWithdraw = async (data: any) => {
    return await WithdrawModel.create(data);
};

const getWithdrawById = async (id: string) => {
    return await WithdrawModel.findById(id);
};

const updateWithdraw = async (id: string, data: UpdateQuery<IWithdraw>) => {
    return await WithdrawModel.findByIdAndUpdate(id, data, { new: true });
};

const getPlayerWithdraw = async (query: any) => {
    const { userId, page = 1, limit = 10 } = query;
    const cond: RootFilterQuery<IWithdraw> = { userId };
    const [items, total] = await Promise.all([
        WithdrawModel.find(cond).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        WithdrawModel.countDocuments(cond)
    ]);
    return { items, total, page, limit };
};

export default {
    createWithdraw,
    getWithdrawById,
    updateWithdraw,
    getPlayerWithdraw,
};