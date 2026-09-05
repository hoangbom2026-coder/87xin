import axios from 'axios';
import crypto from 'crypto';
import httpStatus from 'http-status';
import { Request, Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// config
import config from '@config/index';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// services
import userService from '@main/services/user.service';
import balanceService from '@main/services/balance.service';
import currencyService from '@main/services/currency.service';
import transactionService from '@main/services/transaction.service';
import playerBonusService from '@main/services/player-bonus.service';
import depositService from '@main/services/deposit.service';
import agPayService from '@main/services/ag-pay.service';
import bonusService from '@main/services/bonus.service';
import withdrawService from '@main/services/withdraw.service';

function hmacSHA256Sign(random: number) {
    const input = `${random}${config.agPay.sn}${config.agPay.secretKey}`;
    const hash = crypto.createHash('md5');
    hash.update(input);
    return hash.digest('hex');
}

const getDepositStatus = (status: number) => {
    switch (status) {
        case 0:
        case 6:
            return 'process';
        case 1:
            return 'success';
        case 2:
        case 3:
        case 4:
        case 5:
            return 'failed';
    }
};

const getWithdrawStatus = (status: number) => {
    switch (status) {
        case 0:
        case 6:
            return 'process';
        case 1:
            return 'success';
        case 2:
        case 3:
        case 4:
        case 5:
            return 'failed';
    }
};

export const agPayin = catchAsync(async (req: AuthRequest, res: Response) => {
    try {
        const userId = String(req.user._id);
        const currencyId = req.user.currencyId;
        const { amount } = req.body;
        const userCurrency = await currencyService.getCurrencyById(currencyId);

        const transactionId = new Date().valueOf().toString();
        const random = Math.floor(Math.random() * 10) + 1;
        const sign = hmacSHA256Sign(random);

        const bodyData = {
            amount,
            notifyUrl: `${config.backendUrl}/api/ag-pay/payin-callback`,
            merchantOrderId: transactionId,
            merchantUserId: config.agPay.merchantName,
            currencyCode: 'BR_BRL'
        };
        const response = await axios.post(`${config.agPay.host}/open/agpay/v2/payment/order/create`, bodyData, {
            headers: {
                sn: config.agPay.sn,
                random,
                sign
            }
        });
        const data = response.data;

        console.log('---ag pay response start--');
        console.log(data);
        console.log('---ag pay response end--');

        if (data.success) {
            const depositData = {
                userId,
                currencyId,
                currency: userCurrency.name,
                amount: amount,
                status: 'pending',
                payinType: 'agpayment',
                description: '',
                gatewayOrderId: data.data.merchantOrderId,
                data: {
                    agpayUrl: data.data.payUrl,
                    agpayQR: data.data.qrcodeRaw
                }
            };
            const deposit = await depositService.createDeposit(depositData);

            await agPayService.createAgPayin({ ...data.data, userId, depositId: deposit._id });
            const pendingDeposit = await depositService.getPendingDeposit(userId);
            res.send({ status: true, pendingDeposit });
        } else {
            res.send({
                status: false,
                message: data.msg
            });
        }
    } catch (error) {
        console.log('---agpayment create payment errors start---');
        console.log(error);
        console.log('---agpayment create payment errors end---');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
});

export const agpayinCallback = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log('---agpay deposit callback start---');
        console.log(data);
        console.log('---agpay deposit callback end---');

        const payment = await agPayService.getAgpayLog({
            merchantOrderId: data.merchantOrderId,
            status: { $in: [0, 6] }
        });
        if (payment && payment.status !== data.orderStatus) {
            await agPayService.updateAgPayin({ merchantOrderId: data.merchantOrderId }, req.body);
            const depositStatus = getDepositStatus(data.orderStatus);
            const query: any = { status: depositStatus };

            if (data.orderStatus === 1) {
                const user = await userService.getUserById(String(payment.userId));

                const depositAmount = Number(data.realPayAmount);
                query.actuallyAmount = depositAmount;

                const balance = await balanceService.depositBalance(String(payment.userId), depositAmount);
                await transactionService.createTransaction({
                    userId: String(payment.userId),
                    relatedId: data.merchantOrderId,
                    tnxId: data.merchantOrderId,
                    amount: depositAmount,
                    beforeAmount: Number((balance.amount - depositAmount).toFixed(2)),
                    afterAmount: Number(balance.amount.toFixed(2)),
                    currencyName: 'BRL',
                    type: 'deposit',
                    typeDescription: 'Deposit',
                    provider: 'agpayment',
                    path: user.path
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
                            goalAmount: Number(goalAmount.toFixed(2))
                        });
                        await balanceService.depositBonus(String(payment.userId), Number(bonusAmount.toFixed(2)));
                    }
                }

                const bonus = await bonusService.getAvailableBonusByOption('deposit');
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
                        goalAmount: Number(goalAmount.toFixed(2))
                    });

                    await balanceService.depositBonus(String(payment.userId), Number(bonusAmount.toFixed(2)));
                }

                const storedSocketId = await global.redis.get(String(payment.userId));
                if (storedSocketId) {
                    const updatedBalance = await balanceService.getBalanceByUserId(String(payment.userId));
                    global.io.to(storedSocketId).emit('balance', {
                        amount: updatedBalance.amount,
                        bonus: updatedBalance.bonus,
                        pending: updatedBalance.pending,
                        turnover: updatedBalance.turnover
                    });
                }
            }

            await depositService.patchUpdate({ _id: payment.depositId }, query);
        }
        await agPayService.updateAgPayin(
            { merchantOrderId: data.merchantOrderId },
            { ...data, status: data.orderStatus }
        );
        res.json(true);
    } catch (error) {
        console.log('---agpay deposit callback errors start---');
        console.log(error);
        console.log('---agpay deposit callback errors end---');
        res.status(400).json('Interanal server error');
        return;
    }
};

export const agPayout = async ({ amount, userAccountNum, userAccountType, userCert, userName, userId, withdrawId }) => {
    try {
        const transactionId = new Date().valueOf().toString();
        const random = Math.floor(Math.random() * 10) + 1;
        const sign = hmacSHA256Sign(random);

        const bodyData = {
            amount,
            merchantOrderId: transactionId,
            userAccountNum,
            userAccountType,
            userCert,
            userName,
            validateUserCert: false,
            notifyUrl: `${config.backendUrl}/api/ag-pay/payout-callback`,
            merchantUserId: config.agPay.merchantName,
            currencyCode: 'BR_BRL'
        };

        console.log('--ag payout data--');
        console.log(bodyData);
        console.log('--ag payout data--');
        const response = await axios.post(`${config.agPay.host}/open/agpay/v2/payout/order/create`, bodyData, {
            headers: {
                sn: config.agPay.sn,
                random,
                sign
            }
        });
        const data = response.data;

        console.log('---ag payout request response--');
        console.log(data);
        console.log('---ag payout request response--');
        if (data.success) {
            await agPayService.createAgPayout({ userId, withdrawId, ...data.data });
            return { status: true, data: data.data };
        }
        return { status: false };
    } catch (error) {
        console.log('---agpayment create payout errors start---');
        console.log(error);
        console.log('---agpayment create payout errors end---');
        return { status: false };
    }
};

export const agpayoutCallback = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log('ag pay withdraw data start');
        console.log(data);
        console.log('ag pay withdraw data end');

        const payment = await agPayService.getAgpayoutLog({
            merchantOrderId: data.merchantOrderId,
            status: 0
        });

        if (payment && payment.status !== data.orderStatus) {
            const agpay = await agPayService.updateAgPayout({ merchantOrderId: data.merchantOrderId }, req.body);
            const withdrawStatus = getWithdrawStatus(data.orderStatus);
            const query: any = { status: withdrawStatus };

            if (data.orderStatus === 1) {
                const withdrawAmount = Number(data.realPayAmount);
                query.fromActualAmount = Number(data.amount);
                query.toActualAmount = withdrawAmount;

                const user = await userService.getUserById(String(payment.userId));
                const balance = await balanceService.patchUpdate(
                    { userId: payment.userId },
                    { $in: { pending: withdrawAmount * -1 } }
                );

                await transactionService.createTransaction({
                    userId: String(payment.userId),
                    relatedId: data.merchantOrderId,
                    tnxId: new Date().valueOf().toString(),
                    amount: withdrawAmount * -1,
                    beforeAmount: Number((balance.amount + withdrawAmount).toFixed(2)),
                    afterAmount: Number(balance.amount.toFixed(2)),
                    currencyName: 'BRL',
                    type: 'withdraw',
                    typeDescription: 'Withdraw',
                    provider: 'agpayment',
                    path: user.path
                });

                const storedSocketId = await global.redis.get(String(payment.userId));
                if (storedSocketId) {
                    const updatedBalance = await balanceService.getBalanceByUserId(String(payment.userId));
                    global.io.to(storedSocketId).emit('balance', {
                        amount: updatedBalance.amount,
                        bonus: updatedBalance.bonus,
                        pending: updatedBalance.pending,
                        turnover: updatedBalance.turnover
                    });
                }
            }

            await withdrawService.updateWithdraw(String(agpay.withdrawId), query);
        }
        res.json(true);
    } catch (error) {
        console.log('---agpayment withdraw callback error start---');
        console.error(error);
        console.log('---agpayment withdraw callback error end---');
        res.status(400).json('Interanal server error');
        return;
    }
};
