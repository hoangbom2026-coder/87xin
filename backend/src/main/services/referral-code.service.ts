// model
import { RootFilterQuery, Types, UpdateQuery } from 'mongoose';
import ReferralCodeModel, { IReferralCode } from '@main/models/referral-code.model';

export interface ICreateReferral {
    name: string;
    code: string;
    userId: string;
    commissionRate: number;
}

const createReferralCode = async (log: ICreateReferral) => {
    return await ReferralCodeModel.create(log);
};

const patchUpdate = async (condition: RootFilterQuery<IReferralCode>, data: UpdateQuery<IReferralCode>) => {
    return await ReferralCodeModel.findOneAndUpdate(condition, data, { new: true });
};

const getReferralCodes = async (userId: string) => {
    return await ReferralCodeModel.aggregate([
        {
            $match: {
                userId: new Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'code',
                foreignField: 'inviteCode',
                as: 'referrals'
            }
        },
        {
            $addFields: {
                referralCount: { $size: '$referrals' }
            }
        },
        {
            $project: {
                referrals: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);
};

const getReferralCodeById = async (id: string) => {
    return await ReferralCodeModel.findOne({ _id: id });
};

const getReferralCodeByCode = async (code: string) => {
    return await ReferralCodeModel.findOne({ code });
};

const deleteReferralCodeById = async (id: string) => {
    return await ReferralCodeModel.deleteOne({ _id: id });
};

const getLastCode = async (id: string) => {
    return await ReferralCodeModel.findOne({ userId: id }).sort({ createdAt: -1 });
};

export default {
    getReferralCodes,
    getReferralCodeById,
    getReferralCodeByCode,
    createReferralCode,
    patchUpdate,
    deleteReferralCodeById,
    getLastCode
};
