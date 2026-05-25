// models
import BalanceModel from '@main/models/balance.model';
import TransactionModel from '@main/models/transaction.model';

export interface IDepositWithdraw {
    userId: string;
    currencyId: string;
    amount: number;
}

const deposit = async ({ userId, currencyId, amount }: IDepositWithdraw) => {
    const balance = await BalanceModel.findOneAndUpdate(
        { userId, currencyId },
        { $inc: { amount } },
        { new: true, upsert: true }
    );
    await makeTransaction({
        userId,
        currencyId,
        balanceId: String(balance._id),
        amount,
        type: 'deposit',
        category: 'payment'
    });
    return balance;
};

const withdraw = async ({ userId, currencyId, amount }: IDepositWithdraw) => {
    const balance = await BalanceModel.findOneAndUpdate(
        { userId, currencyId },
        { $inc: { amount: amount * -1 } },
        { new: true, upsert: true }
    );
    await makeTransaction({
        userId,
        currencyId,
        balanceId: String(balance._id),
        amount,
        type: 'withdraw',
        category: 'payment'
    });
    return balance;
};

export interface ITransaction {
    userId: string;
    currencyId: string;
    balanceId: string;
    amount: number;
    type: string;
    category: string;
}

const makeTransaction = async (transactionData: ITransaction) => {
    return await TransactionModel.create(transactionData);
};

export default {
    deposit,
    withdraw,
    makeTransaction
};
