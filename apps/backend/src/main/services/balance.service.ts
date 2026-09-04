import { isValidObjectId, RootFilterQuery, Types, UpdateQuery } from 'mongoose';
// models
import BalanceModel, { IBalance } from '@main/models/balance.model';
import vipLevelUpBonusService from './vip-level-up-bonus.service';
import UserModel from '@main/models/user.model';

const getBalanceByUser = async (userId: string) => {
    const balances = await BalanceModel.aggregate([
        {
            $match: {
                userId: new Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: 'currencies',
                foreignField: '_id',
                localField: 'currencyId',
                as: 'currency',
                pipeline: [
                    {
                        $match: {
                            status: true
                        }
                    }
                ]
            }
        },
        {
            $unwind: '$currency'
        }
    ]);

    if (balances.length) {
        return {
            _id: balances[0]._id,
            amount: balances[0].amount,
            bonus: balances[0].bonus,
            turnover: balances[0].turnover,
            withdrawable: balances[0].withdrawable,
            pending: balances[0].pending,
            currency: balances[0].currency.name,
            icon: balances[0].currency.icon
        };
    }
    return {};
};

const getBalanceByNumberID = async (numberId: string) => {
    const user = await UserModel.findOne({ numberId });
    const balances = await BalanceModel.aggregate([
        {
            $match: {
                userId: user._id
            }
        },
        {
            $lookup: {
                from: 'currencies',
                foreignField: '_id',
                localField: 'currencyId',
                as: 'currency',
                pipeline: [
                    {
                        $match: {
                            status: true
                        }
                    }
                ]
            }
        },
        {
            $unwind: '$currency'
        }
    ]);

    if (balances.length) {
        return {
            _id: balances[0]._id,
            amount: balances[0].amount,
            bonus: balances[0].bonus,
            turnover: balances[0].turnover,
            withdrawable: balances[0].withdrawable,
            pending: balances[0].pending,
            currency: balances[0].currency.name,
            icon: balances[0].currency.icon
        };
    }
    return {};
};

const getBalanceByUserId = async (userId: string) => {
    return await BalanceModel.findOne({ userId });
};

const createBalance = async (userId: string, currencyId: string) => {
    return await BalanceModel.create({ userId, currencyId });
};

const getCasinoCallbackBalances = async (userIds: string[], currencyId: string) => {
    const validIds = userIds.filter((id) => isValidObjectId(id));
    return await BalanceModel.find({ userId: { $in: validIds }, currencyId });
};

const withdrawBalance = async (userId: string, amount: number) => {
    const query: any = {
        userId
    };
    if (amount < 0) {
        query.amount = { $gte: Math.abs(amount) };
    }
    return await BalanceModel.findOneAndUpdate(query, { $inc: { amount: Number(amount.toFixed(2)) } }, { new: true });
};

const depositBalance = async (userId: string, amount: number) => {
    await UserModel.updateOne({ _id: userId }, { $inc: { depositCount: 1 } });
    return await BalanceModel.findOneAndUpdate(
        { userId },
        { $inc: { amount: Number(amount.toFixed(2)) } },
        { new: true }
    );
};

const creditBalance = async (userId: string, amount: number) => {
    return await BalanceModel.findOneAndUpdate(
        { userId },
        { $inc: { amount: Number(amount.toFixed(2)) } },
        { new: true }
    );
};

const debitBalance = async (userId: string, amount: number) => {
    console.log('amt', amount);
    amount = Number(amount.toFixed(2));
    const absAmount = Math.abs(amount);
    const numberAmount = absAmount * -1;

    const query: any = { userId };
    if (amount < 0) {
        query.amount = { $gte: absAmount };
    }

    const balance = await BalanceModel.findOne({ userId });
    if (balance.amount < absAmount) return false;

    const updatedBalance = await BalanceModel.findOneAndUpdate(
        { userId },
        { $inc: { amount: numberAmount, withdrawable: absAmount, turnover: absAmount } },
        { new: true }
    );
    vipLevelUpBonusService.calculateLevelUp(userId, updatedBalance.turnover);
    return updatedBalance;
};

const debitCreditBalance = async (userId: string, debitAmount: number, updateAmount: number) => {
    debitAmount = Number(debitAmount.toFixed(2));
    const absDebit = Math.abs(debitAmount);

    updateAmount = Number(updateAmount.toFixed(2));

    const balance = await BalanceModel.findOneAndUpdate(
        { userId },
        { $inc: { amount: updateAmount, withdrawable: absDebit, turnover: absDebit } },
        { new: true }
    );
    vipLevelUpBonusService.calculateLevelUp(userId, balance.turnover);
    return balance;
};

const depositBonus = async (userId: string, amount: number) => {
    return await BalanceModel.findOneAndUpdate(
        { userId },
        { $inc: { bonus: Number(amount.toFixed(2)) } },
        { new: true }
    );
};

const patchUpdate = async (condition: RootFilterQuery<IBalance>, data: UpdateQuery<IBalance>) => {
    return await BalanceModel.findOneAndUpdate(condition, data, { new: true });
};

export default {
    creditBalance,
    debitBalance,
    debitCreditBalance,
    getBalanceByUser,
    createBalance,
    getCasinoCallbackBalances,
    withdrawBalance,
    depositBalance,
    depositBonus,
    patchUpdate,
    getBalanceByUserId,
    getBalanceByNumberID
};
