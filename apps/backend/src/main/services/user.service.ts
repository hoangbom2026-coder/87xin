import moment from 'moment';
import bcrypt from 'bcryptjs';
import { RootFilterQuery, UpdateQuery } from 'mongoose';
// models
import UserModel, { IUser } from '@main/models/user.model';

const usernameTaken = async (username: string, id?: string) => {
    return await UserModel.isUsernameTaken(username, id);
};

const emailTaken = async (email: string, id?: string) => {
    return await UserModel.isEmailTaken(email, id);
};

const phoneTaken = async (phone: string, id?: string) => {
    return await UserModel.isPhoneTaken(phone, id);
};

const getUserById = async (id: string) => {
    return await UserModel.findById(id);
};

const getInviteCodeByUserId = async (userId: string) => {
    return await UserModel.findById(userId).select('inviteCode');
};

const getUserByinvitorId = async (invitorId: string) => {
    return await UserModel.find({ invitorId });
};

const getUserByUsername = async (username: string) => {
    return await UserModel.findOne({ username: username.toLowerCase().replaceAll(' ', '') });
};

const getUserByEmail = async (email: string) => {
    return await UserModel.findOne({ email: email.toLowerCase().replaceAll(' ', '') });
};

const getUserByPhone = async (phone: string) => {
    return await UserModel.findOne({ phone: phone.toLowerCase().replaceAll(' ', '') });
};

const getUserNumberId = async (userId: string): Promise<number> => {
    const user = await UserModel.findById(userId);
    if (user.numberId) return user.numberId;
    const numberId = Date.now() + Math.floor(Math.random() * 1000);
    user.numberId = numberId;
    await user.save();
    return numberId;
};

interface ICreateUser {
    username: string;
    email?: string;
    password: string;
    role: string;
    currencyId: string;
    currency: string;
    country: {
        code: string;
        name: string;
    };
    invitorId?: string;
    inviteCode?: string;
    path?: string[];
}

const createUser = async (data: ICreateUser) => {
    return await UserModel.create(data);
};

const updatePassword = async (id: string, password: string) => {
    const newPassword = await bcrypt.hash(password, 8);
    return await UserModel.findOneAndUpdate({ _id: id }, { password: newPassword });
};

const patchUpdate = async (condition: RootFilterQuery<IUser>, data: UpdateQuery<IUser>) => {
    return await UserModel.findOneAndUpdate(condition, data, { new: true });
};

interface IUsersFilter {
    status: string;
    username?: string;
    phone?: string;
    email?: string;
    isAll?: boolean;
    currentPage: number;
    rowsPerPage: number;
    date?: {
        start: string | Date;
        end: string | Date;
    };
}

const getUsers = async (filter: IUsersFilter) => {
    // eslint-disable-next-line
    const conditions: any = { role: 'user' };
    if (filter.status && filter.status !== 'all') conditions.status = filter.status;
    if (filter.username) conditions.username = { $regex: new RegExp(filter.username, 'i') };
    if (filter.phone) conditions.phone = filter.phone;
    if (filter.email) conditions.email = filter.email;

    if (!filter.isAll && filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    const page = Math.max(1, Number(filter.currentPage || 1));
    const limit = Math.max(1, Number(filter.rowsPerPage || 20));
    const skip = (page - 1) * limit;
    const total = await UserModel.countDocuments(conditions);

    const items = await UserModel.aggregate([
        {
            $match: conditions
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'balances',
                as: 'balance',
                localField: '_id',
                foreignField: 'userId'
            }
        },
        {
            $unwind: '$balance'
        }
    ]);

    return { items, total, page, limit };
};

const getAffiliateUsers = async (filter: { parentId: string; duration: string }) => {
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

    const data = await UserModel.countDocuments(conditions);
    return data;
};

const getUserCount = async () => {
    const data = await UserModel.aggregate([
        {
            $match: {
                role: 'user'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                    }
                },
                blocked: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                active: 1,
                blocked: 1
            }
        }
    ]);
    if (data.length) {
        return data[0];
    }
    return { total: 0, active: 0, blocked: 0 };
};

export default {
    usernameTaken,
    emailTaken,
    phoneTaken,
    getUserNumberId,
    getUserById,
    getInviteCodeByUserId,
    getUserByinvitorId,
    getUserByUsername,
    getUserByEmail,
    getUserByPhone,
    getUsers,
    getUserCount,
    getAffiliateUsers,

    createUser,

    updatePassword,

    patchUpdate
};
