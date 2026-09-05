import httpStatus from 'http-status';
import { Request, Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import gsPayService from '@main/services/gs-pay.service';
import balanceService from '@main/services/balance.service';
import gsPayLogService from '@main/services/gs-pay-log.service';
import currencyService from '@main/services/currency.service';
import userService from '@main/services/user.service';
import transactionService from '@main/services/transaction.service';
import bonusService from '@main/services/bonus.service';
import playerBonusService from '@main/services/player-bonus.service';
import depositService from '@main/services/deposit.service';

/** POST /gs-pay/deposit — tạo yêu cầu nạp tiền */
export const gsDeposit = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await gsPayService.createDepositPayment({
        userId: String(req.user!._id),
        currency: req.user!.currency,
        currencyId: String(req.user!.currencyId),
        amount: req.body.amount,
    });

    const deposit = await depositService.createDeposit(result.depositData);
    await gsPayLogService.createGsPayDeposit({ ...result.params, userId: String(req.user!._id), depositId: deposit._id });

    const pendingDeposit = await depositService.getPendingDeposit(String(req.user!._id));
    return res.send({ status: true, pendingDeposit });
});

/** POST /gs-pay/deposit-callback — callback nạp tiền */
export const gsDepositCallback = catchAsync(async (req: Request, res: Response) => {
    const { params, valid } = await gsPayService.handleDepositCallback(req.body);
    if (!valid) return res.send('SUCCESS');

    const payment = await gsPayLogService.updateDepositLog({ merchant_ref: params.merchant_ref }, params);
    if (!payment) return res.send('SUCCESS');

    await gsPayService.processSuccessfulDeposit({
        payment,
        params,
        userService,
        currencyService,
        balanceService,
        transactionService,
        bonusService,
        playerBonusService,
    });

    return res.send('SUCCESS');
});

/** POST /gs-pay/deposit-status — kiểm tra trạng thái nạp tiền */
export const gsDepositStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.body;
    const timestamp = new Date().valueOf();
    const result = await gsPayService.checkPaymentStatus({ orderId, timestamp });

    const params = result.data;
    const payment = await gsPayLogService.updateDepositLog({ merchant_ref: params.merchant_ref }, params);

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    const depositStatus = gsPayService.getDepositStatus(payment.status);
    const query: any = { status: depositStatus };

    if (params.status !== payment.status && params.status === 1) {
        const user = await userService.getUserById(String(payment.userId));
        const currency = await currencyService.getCurrencyById(String(user.currencyId));
        const depositAmount = Number(params.pay_amount);

        query.actuallyAmount = depositAmount;
        const balance = await balanceService.depositBalance(String(payment.userId), depositAmount);
        await transactionService.createTransaction({
            userId: String(payment.userId),
            relatedId: payment.merchant_ref,
            tnxId: payment.merchant_ref,
            amount: depositAmount,
            beforeAmount: Number((balance.amount - depositAmount).toFixed(2)),
            afterAmount: Number(balance.amount.toFixed(2)),
            currencyName: currency.name,
            type: 'deposit',
            typeDescription: 'Deposit',
            provider: 'gspayment',
            path: user.path,
        });

        if (user.depositCount === 0) {
            const bonus = await bonusService.getAvailableBonusByOption('welcome');
            if (bonus) {
                const bonusAmount =
                    (depositAmount * bonus.percent) / 100 > bonus.bonusCap
                        ? bonus.bonusCap
                        : (depositAmount * bonus.percent) / 100;
                const goalAmount = bonusAmount * bonus.multiply;
                await playerBonusService.createPlayerBonus({
                    userId: String(payment.userId),
                    bonusId: String(bonus._id),
                    amount: Number(bonusAmount.toFixed(2)),
                    goalAmount: Number(goalAmount.toFixed(2)),
                });
                await balanceService.depositBonus(String(payment.userId), Number(bonusAmount.toFixed(2)));
            }
        }
    }

    await gsPayLogService.updateDepositLog({ merchant_ref: params.merchant_ref }, query);
    return res.send({ status: true, message: 'Payment status updated' });
});

/** POST /gs-pay/withdraw — tạo yêu cầu rút tiền */
export const gsWithdraw = catchAsync(async (req: AuthRequest, res: Response) => {
    const { amount } = req.body;
    const result = await gsPayService.createWithdrawRequest({ userId: String(req.user!._id), amount });

    await gsPayLogService.createGsPayWithdraw({ userId: String(req.user!._id), ...result.data });
    return res.send({ status: true, data: result.data });
});

/** POST /gs-pay/withdraw-callback — callback rút tiền */
export const gsWithdrawCallback = catchAsync(async (req: Request, res: Response) => {
    const { params, valid } = await gsPayService.handleWithdrawCallback(req.body);
    if (!valid) return res.send('SUCCESS');

    const payment = await gsPayLogService.updateWithdrawLog({ merchant_ref: params.merchant_ref }, params);
    if (!payment) return res.send('SUCCESS');

    await gsPayService.processSuccessfulWithdraw({
        payment,
        params,
        userService,
        balanceService,
        transactionService,
    });

    return res.send('SUCCESS');
});