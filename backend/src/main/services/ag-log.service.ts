// model
import AgLogModel from '@main/models/ag-log.model';

export interface ITransaction {
    playerUniqueId: string;
    gameCode: string;
    roundId: string;
    currencyCode: string;
    orderNo: string;
    betAmount: number;
    type?: string;
    status?: string;
    winAmount?: number;
    isEnd?: boolean;
}

const createTransaction = async (log: ITransaction) => {
    return await AgLogModel.create(log);
};

const updateTransaction = async (id: string, log: Partial<ITransaction>) => {
    return await AgLogModel.findOneAndUpdate({ _id: id }, log, { new: true });
};

export default {
    createTransaction,
    updateTransaction
};
