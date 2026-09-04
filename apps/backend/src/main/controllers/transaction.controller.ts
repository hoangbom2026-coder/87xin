import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import transactionService from '@main/services/transaction.service';

export const getTransactionList = catchAsync(async (req: AuthRequest, res: Response) => {
    const transactions = await transactionService.getTransactionList(req.body);
    return res.send(transactions);
});

export const getBetTransaction = catchAsync(async (req: AuthRequest, res: Response) => {
    const transactions = await transactionService.getBetTransaction(req.body);
    return res.send(transactions);
});
