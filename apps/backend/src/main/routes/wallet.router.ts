/**
 * Wallet routes.
 * Endpoints for querying user balance, deposits, withdrawals, and financial history.
 */
import express, { Response } from 'express';
import httpStatus from 'http-status';
import auth, { AuthRequest } from '@middlewares/auth';
import catchAsync from '@utils/catchAsync';
import balanceService from '@main/services/balance.service';
import paymentService from '@main/services/payment.service';
import transactionService from '@main/services/transaction.service';

const router = express.Router();

router.get(
    '/balance',
    auth,
    catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = String(req.user?._id);
        const balances = await balanceService.getBalanceByUser(userId);
        res.send({ balances });
    })
);

router.post(
    '/deposit',
    auth,
    catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = String(req.user?._id);
        const { currencyId, amount } = req.body;
        const result = await paymentService.deposit({
            userId,
            currencyId,
            amount: Number(amount)
        });
        res.status(httpStatus.CREATED).send(result);
    })
);

router.post(
    '/withdraw',
    auth,
    catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = String(req.user?._id);
        const { currencyId, amount } = req.body;
        const result = await paymentService.withdraw({
            userId,
            currencyId,
            amount: Number(amount)
        });
        res.send(result);
    })
);

router.get(
    '/history',
    auth,
    catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = String(req.user?._id);
        const currentPage = Number(req.query.currentPage || 1);
        const rowsPerPage = Number(req.query.rowsPerPage || 20);
        const history = await transactionService.getPlayerTransaction(userId, {
            currentPage,
            rowsPerPage,
            type: req.query.type as string | undefined
        });
        res.send(history);
    })
);

export default router;
