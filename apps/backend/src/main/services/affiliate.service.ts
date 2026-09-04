import bcrypt from 'bcryptjs';
import { RootFilterQuery, UpdateQuery } from 'mongoose';
// models
import AffiliateModel, { IAffiliate } from '@main/models/affiliate.model';
import moment from 'moment';
import UserModel from '@main/models/user.model';
import TransactionModel from '@main/models/transaction.model';
import settingService from './setting.service';

const usernameTaken = async (username: string, id?: string) => {
    return await AffiliateModel.isUsernameTaken(username, id);
};

const emailTaken = async (email: string, id?: string) => {
    return await AffiliateModel.isEmailTaken(email, id);
};

const getAffiliateById = async (id: string) => {
    return await AffiliateModel.findById(id);
};

const getAffiliateByparentId = async (parentId: string) => {
    return await AffiliateModel.find({ parentId });
};

const getAffiliateByUsername = async (username: string) => {
    return await AffiliateModel.findOne({ username: username.toLowerCase().replaceAll(' ', '') });
};

const getAffiliateByReferralCode = async (referralCode: string) => {
    return await AffiliateModel.findOne({ referralCode });
};

const getAffiliateByEmail = async (email: string) => {
    return await AffiliateModel.findOne({ email: email.toLowerCase().replaceAll(' ', '') });
};

interface ICreateAffiliate {
    username: string;
    firstName: string;
    lastName: string;
    status: string;
    email: string;
    role: string;
    referralCode: string;
    parentId: string;
    path: string[];
}

const createAffiliate = async (data: ICreateAffiliate) => {
    return await AffiliateModel.create(data);
};

const updatePassword = async (id: string, password: string) => {
    const newPassword = await bcrypt.hash(password, 8);
    return await AffiliateModel.findOneAndUpdate({ _id: id }, { password: newPassword });
};

const patchUpdate = async (condition: RootFilterQuery<IAffiliate>, data: UpdateQuery<IAffiliate>) => {
    return await AffiliateModel.findOneAndUpdate(condition, data, { new: true });
};

interface IAffiliatesFilter {
    username?: string;
    email?: string;
    isAll?: boolean;
    currentPage: number;
    rowsPerPage: number;
    date?: {
        start: string | Date;
        end: string | Date;
    };
}

const getAffiliates = async (filter: IAffiliatesFilter) => {
    // eslint-disable-next-line
    const conditions: any = { role: 'user' };
    if (filter.username) conditions.username = { $regex: new RegExp(filter.username, 'i') };
    if (filter.email) conditions.email = filter.email;

    if (!filter.isAll && filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await AffiliateModel.countDocuments(conditions);

    const data = await AffiliateModel.aggregate([
        {
            $match: conditions
        },
        {
            $skip: skip
        },
        {
            $limit: filter.rowsPerPage
        }
    ]);

    return { data, total };
};

const getDashboard = async (filter: { parentId: string; duration: string }) => {
    // eslint-disable-next-line
    const conditions: any = { path: filter.parentId };
    if (filter.duration === '30') {
        const today = new Date();
        const startDate = moment().add(-30, 'days').startOf('day').toDate();
        conditions.createdAt = {
            $gte: startDate,
            $lte: today
        };
    }

    console.log(conditions);
    const data = await AffiliateModel.aggregate([
        {
            $match: conditions
        },
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 } // or other aggregations
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    return data;
};

const getAnalysis = async (parentId: string, { startDate, endDate }: { startDate: string; endDate: string }) => {
    const data = await TransactionModel.aggregate([
        {
            $match: {
                path: parentId,
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                type: { $in: ['win', 'bet'] }
            }
        },
        {
            $group: {
                _id: { type: '$type', currency: '$currencyName' },
                total: { $sum: '$amount' }
            }
        },
        {
            $project: {
                _id: 0,
                type: '$_id.type',
                currency: '$_id.currency',
                total: 1
            }
        }
    ]);
    return data;
};

const getDashboardChildren = async (
    parentId: string,
    { startDate, endDate }: { startDate: string; endDate: string }
) => {
    const affiliates: any = await AffiliateModel.find({
        parentId,
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    }).lean();

    const data = await TransactionModel.aggregate([
        {
            $match: {
                path: parentId,
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$userId',
                totalAmount: { $sum: '$amount' },
                path: { $first: '$path' },
                currency: { $first: '$currencyName' }
            }
        }
    ]);

    const setting = await settingService.getSetting();

    for (let i = 0; i < affiliates.length; i++) {
        let profit = 0;
        for (const item of data) {
            if (item.path.includes(String(affiliates[i]._id))) {
                const rate = setting.rates[item.currency];
                profit += item.amount * rate;
            }
        }
        affiliates[i].profit = profit;
        const commission = setting.commission[affiliates[i].role];
        affiliates[i].comission = profit * (commission / 100);
    }
    return affiliates;
};

interface IAffiliateFilter {
    username?: string;
    currentPage: number;
    rowsPerPage: number;
}
const getChildrenAffiliate = async (parentId: string, filter: IAffiliateFilter) => {
    const conditions: any = { path: parentId, status: 'active' };
    // if (filter.status) conditions.status = filter.status;
    if (filter.username) conditions.username = { $regex: new RegExp(filter.username, 'i') };

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await AffiliateModel.countDocuments(conditions);

    const data = await AffiliateModel.aggregate([
        {
            $match: conditions
        },
        {
            $skip: skip
        },
        {
            $limit: filter.rowsPerPage
        }
    ]);

    return { data, total };
};

const getTreeAffiliate = async (parentId: string) => {
    const affiliates = await AffiliateModel.find(
        { $or: [{ path: parentId }, { _id: parentId }] },
        { username: 1, role: 1, parentId: 1 }
    ).lean();
    const users = await UserModel.aggregate([
        {
            $match: {
                path: parentId
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                role: 'user',
                parentId: '$invitorId'
            }
        }
    ]);
    return [...affiliates, ...users];
};

interface IAffiliateUserFilter {
    username?: string;
    currentPage: number;
    rowsPerPage: number;
}
const getAffiliateUsers = async (parentId: string, filter: IAffiliateUserFilter) => {
    const conditions: any = { path: parentId, status: 'active' };
    // if (filter.status) conditions.status = filter.status;
    if (filter.username) conditions.username = { $regex: new RegExp(filter.username, 'i') };

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await UserModel.countDocuments(conditions);

    const data = await UserModel.aggregate([
        {
            $match: conditions
        },
        {
            $skip: skip
        },
        {
            $limit: filter.rowsPerPage
        },
        {
            $lookup: {
                from: 'affiliates',
                as: 'affiliate',
                localField: 'invitorId',
                foreignField: '_id'
            }
        },
        {
            $unwind: '$affiliate'
        }
    ]);

    return { data, total };
};

export default {
    usernameTaken,
    emailTaken,

    getAffiliateById,
    getAffiliateByparentId,
    getAffiliateByUsername,
    getAffiliateByReferralCode,
    getAffiliateByEmail,
    getAffiliates,
    getDashboard,
    getAnalysis,
    getDashboardChildren,
    getChildrenAffiliate,
    getAffiliateUsers,
    getTreeAffiliate,

    createAffiliate,

    updatePassword,

    patchUpdate
};
