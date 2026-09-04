// model
import TransactionModel, { ITransaction } from '@main/models/transaction.model';
import { RootFilterQuery, Types } from 'mongoose';

type ICreateTransaction = {
    userId: string;
    relatedId?: string;
    tnxId: string;
    amount: number;
    beforeAmount: number;
    afterAmount: number;
    currencyName: string;
    type: string;
    typeDescription: string;
    gameName?: string;
    gameId?: string;
    provider: string;
    category?: string;
    path?: string[];
};

const createTransaction = async (data: ICreateTransaction) => {
    return await TransactionModel.create(data);
};

const updateTransaction = async (condition: RootFilterQuery<ITransaction>, data: Partial<ITransaction>) => {
    return await TransactionModel.findOneAndUpdate(condition, data, { new: true });
};

interface ITransactionFilter {
    type?: string;
    username?: string;
    payoutProvider?: 'all' | 'auto-payout' | 'manual';
    currentPage: number;
    rowsPerPage: number;
    date?: {
        start: string | Date;
        end: string | Date;
    };
}

const getTransactionList = async (filter: ITransactionFilter) => {
    const conditions: any = {};
    if (filter.type && filter.type !== 'all') conditions.type = filter.type;

    if (filter.payoutProvider === 'auto-payout') {
        conditions.provider = 'auto-payout';
    } else if (filter.payoutProvider === 'manual') {
        conditions.provider = { $ne: 'auto-payout' };
    }

    if (filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await TransactionModel.countDocuments(conditions);

    const data = await TransactionModel.aggregate([
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
            $limit: filter.rowsPerPage
        },
        {
            $lookup: {
                from: 'users',
                as: 'user',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        {
            $unwind: { path: '$user' }
        }
    ]);

    return { data, total };
};

const getPlayerTransaction = async (userId: string, filter: ITransactionFilter) => {
    const conditions: any = { userId: new Types.ObjectId(userId) };
    if (filter.type && filter.type !== 'all') conditions.type = filter.type;

    if (filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await TransactionModel.countDocuments(conditions);

    const data = await TransactionModel.aggregate([
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
            $limit: filter.rowsPerPage
        },
        {
            $lookup: {
                from: 'users',
                as: 'user',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        {
            $unwind: { path: '$user' }
        }
    ]);

    return { data, total };
};

const getPlayerGames = async (userId: string) => {
    const data = await TransactionModel.aggregate([
        {
            $match: { userId: new Types.ObjectId(userId), category: 'casino' }
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: '$gameId',
                doc: { $first: '$$ROOT' }
            }
        },
        {
            $replaceRoot: { newRoot: '$doc' }
        },
        {
            $facet: {
                ag: [
                    { $match: { provider: 'ag-casino' } },
                    {
                        $lookup: {
                            from: 'ag-games',
                            localField: 'gameId',
                            foreignField: 'gameCode',
                            as: 'gameDetails'
                        }
                    },
                    { $unwind: '$gameDetails' }
                ],
                gs: [
                    { $match: { provider: 'gs-casino' } },
                    {
                        $lookup: {
                            from: 'games',
                            localField: 'gameId',
                            foreignField: 'game_code',
                            as: 'gameDetails'
                        }
                    },
                    { $unwind: '$gameDetails' }
                ]
            }
        },
        {
            $project: {
                all: { $concatArrays: ['$ag', '$gs'] }
            }
        },
        { $unwind: '$all' },
        {
            $replaceRoot: { newRoot: '$all' }
        },
        {
            $sort: { createdAt: -1 } // This now works because createdAt is present
        }
    ]);
    return data;
};

const getBetTransaction = async (filter: ITransactionFilter) => {
    const conditions: any = { type: { $in: ['bet', 'win'] } };
    if (filter.type && filter.type !== 'all') conditions.type = filter.type;

    if (filter.date) {
        const start = new Date(filter.date.start);
        const end = new Date(filter.date.end);
        conditions.createdAt = { $gte: start, $lte: end };
    }

    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await TransactionModel.countDocuments(conditions);

    const data = await TransactionModel.aggregate([
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
            $limit: filter.rowsPerPage
        },
        {
            $lookup: {
                from: 'users',
                as: 'user',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        {
            $unwind: { path: '$user' }
        }
    ]);

    return { data, total };
};

export default {
    getTransactionList,
    getBetTransaction,
    createTransaction,
    updateTransaction,
    getPlayerTransaction,
    getPlayerGames
};
