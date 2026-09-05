import DepositModel from '@main/models/deposit.model';
import { RootFilterQuery } from 'mongoose';

const createDeposit = async (data: any) => {
    return await DepositModel.create(data);
};

const getPendingDeposit = async (userId: string) => {
    return await DepositModel.findOne({ userId, status: 'pending' }).sort({ createdAt: -1 });
};

const getDepositById = async (id: string) => {
    return await DepositModel.findById(id);
};

const listDeposits = async (q: { userId?: string; status?: string; page?: number; limit?: number }) => {
    const { userId, status, page = 1, limit = 10 } = q;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
        DepositModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        DepositModel.countDocuments(filter)
    ]);
    return { items, total, page, limit };
};

const getPlayerDeposit = async (query: any) => {
    const { userId, page = 1, limit = 10 } = query;
    const filter: any = { userId };
    const [items, total] = await Promise.all([
        DepositModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        DepositModel.countDocuments(filter)
    ]);
    return { items, total, page, limit };
};

const patchUpdate = async (filter: any, update: any) => {
    return await DepositModel.findOneAndUpdate(filter, update, { new: true });
};

export default {
    createDeposit,
    getPendingDeposit,
    getDepositById,
    listDeposits,
    getPlayerDeposit,
    patchUpdate,
};