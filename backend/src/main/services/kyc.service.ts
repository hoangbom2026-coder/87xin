// model
import KycModel from '@main/models/kyc.model';
import { RootFilterQuery, UpdateQuery } from 'mongoose';

export interface IKyc {
    userId: string;
    frontImg: string;
    backImg: string;
    type: string;
    country: {
        code: string;
        name: string;
    };
}

const createKYC = async (kyc: IKyc) => {
    console.log(kyc);
    return await KycModel.create(kyc);
};

const getKycByUser = async (userId: string) => {
    return await KycModel.findOne({ userId });
};

interface IKycFilter {
    status: string;
    email?: string;
    currentPage: number;
    rowsPerPage: number;
    date?: {
        start: string | Date;
        end: string | Date;
    };
}

const getKycs = async (filter: IKycFilter) => {
    const conditions: any = {};
    if (filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    if (filter.status !== 'all') conditions.status = filter.status;

    const page = Math.max(1, Number(filter.currentPage || 1));
    const limit = Math.max(1, Number(filter.rowsPerPage || 20));
    const skip = (page - 1) * limit;
    const total = await KycModel.countDocuments(conditions);

    const items = await KycModel.aggregate([
        {
            $match: conditions
        },
        {
            $sort: { updatedAt: -1 }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: { path: '$user' } }
    ]);
    return { items, total, page, limit };
};

const patchUpdate = async (condition: RootFilterQuery<IKyc>, data: UpdateQuery<IKyc>) => {
    return await KycModel.findOneAndUpdate(condition, data, { new: true });
};

const getKycById = async (id: string) => {
    return await KycModel.findOne({ _id: id });
};

export default {
    createKYC,
    getKycByUser,
    getKycs,
    getKycById,
    patchUpdate
};
