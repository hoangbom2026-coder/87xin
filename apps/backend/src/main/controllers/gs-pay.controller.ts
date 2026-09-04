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
import balanceService from '@main/services/balance.service';
import gsPayLogService from '@main/services/gs-pay-log.service';
import currencyService from '@main/services/currency.service';
import userService from '@main/services/user.service';
import transactionService from '@main/services/transaction.service';
import bonusService from '@main/services/bonus.service';
import playerBonusService from '@main/services/player-bonus.service';
import depositService from '@main/services/deposit.service';

function hashMD5(hashString: string) {
    return crypto.createHash('md5').update(hashString).digest('hex');
}

const getDepositStatus = (status: number) => {
    switch (status) {
        case 0:
            return 'failed';
        case 1:
            return 'success';
    }
};

export const gsDeposit = catchAsync(async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const currency = req.user.currency;
        const currencyId = req.user.currencyId;

        const { amount } = req.body;

        const timestamp = new Date().valueOf();
        const params = {
            merchant_ref: String(timestamp),
            product: 'TRC20Buy',
            amount,
            extra: {
                fiat_currency: currency
            },
            notify_url: `${config.backendUrl}/api/gs-pay/deposit-callback`,
            return_url: `${config.backendUrl}/wallet/deposit`
        };

        const hashString = `${config.gsPay.merchantNo}${JSON.stringify(params)}MD5${timestamp}${config.gsPay.apiKey}`;
        const signature = hashMD5(hashString);

        const bodyData = {
            merchant_no: config.gsPay.merchantNo,
            timestamp: timestamp,
            sign_type: 'MD5',
            params: JSON.stringify(params),
            sign: signature
        };

        console.log('---gspay create payment request start---');
        console.log(bodyData);
        console.log('---gspay create payment request end---');

        const response = await axios.post(`${config.gsPay.host}/api/gateway/pay`, bodyData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = response.data;
        console.log('---gspay create payment response start---');
        console.log(data);
        console.log('---gspay create payment response end---');

        if (data.code === 200) {
            const params = JSON.parse(data.params);

            const depositData = {
                userId,
                currencyId,
                currency,
                amount: amount,
                status: 'pending',
                payinType: 'gspayment',
                description: '',
                gatewayOrderId: params.merchant_ref,
                data: {
                    payurl: params.payurl,
                    product: params.product,
                    fee: params.fee
                }
            };
            const deposit = await depositService.createDeposit(depositData);

            await gsPayLogService.createGsPayDeposit({ ...params, userId, depositId: deposit._id });
            const pendingDeposit = await depositService.getPendingDeposit(userId);
            res.send({ status: true, pendingDeposit });
            return;
        }
        return res.send({ status: false, message: data.message });
    } catch (error) {
        console.log('---gspayment create payment errors start---');
        console.log(error);
        console.log('---gspayment create payment errors end---');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
});

export const gsDepositCallback = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log('---gspay deposit callback start---');
        console.log(data);
        console.log('---gspay deposit callback end---');

        const hashString = `${config.gsPay.merchantNo}${data.params}MD5${data.timestamp}${config.gsPay.apiKey}`;
        const signature = hashMD5(hashString);

        if (signature !== data.sign) {
            console.log('gs pay deposit callback sign failed');
            res.send('SUCCESS');
            return;
        }

        const params = JSON.parse(data.params);
        const payment = await gsPayLogService.updateDepositLog({ merchant_ref: params.merchant_ref }, params);

        if (!payment) {
            console.log('gs pay deposit callback tnx not found');
            res.send('SUCCESS');
            return;
        }
        const depositStatus = getDepositStatus(payment.status);
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
        res.send('SUCCESS');
        return;
    } catch (error) {
        console.log('---gspay deposit callback errors start---');
        console.log(error);
        console.log('---gspay deposit callback errors end---');
        res.send('SUCCESS');
        return;
    }
};

export const gsDepositStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    try {
        const { transactionId } = req.body;

        const tnx = await gsPayLogService.getGsPayDepositLog({ merchant_ref: transactionId });

        if (!tnx) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
        }

        const signature = hashMD5(transactionId);
        const response = await axios.get(
            `${config.gsPay.host}/api/v1/payments/${transactionId}?oAuthKey=${config.gsPay.authKey}&signature=${signature}`
        );
        const responseData = response.data;

        if (!responseData.result) {
            throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Request failed');
        }

        const data = responseData.data;

        const hashString = `${data.paymentId}${data.transactionId}${Number(data.amount).toFixed(2)}`;
        const responseSignature = hashMD5(hashString);
        if (responseSignature !== data.signature) {
            throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Invalid reponse signature');
        }

        const updatedTnx = await gsPayLogService.updateDepositLog({ transactionId: data.transactionId }, data);

        // if (updatedTnx.success && updatedTnx.completed) {
        //     const currency = await currencyService.getCurrencyByName(data.currency);
        //     const balance = await balanceService.getBalanceByUserId(String(tnx.userId));
        //     if (!balance) {
        //         await balanceService.createBalance(String(tnx.userId), String(currency._id));
        //     }
        //     await balanceService.depositBalance(String(tnx.userId), Number(data.amount));
        // }
        res.send(updatedTnx);
    } catch (error) {
        console.info('===AG payment status error===');
        console.error((error as any).response.data);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
});

export const gsWithdraw = async ({ amount, userId }: { userId: string; amount: number }) => {
    try {
        const timestamp = new Date().valueOf();
        const params = {
            merchant_ref: String(timestamp),
            product: 'TRC20Buy',
            amount,
            extra: {},
            // extra: { account_name: "sUXub", account_no: "11111", bank_code: "CBC" },
            notify_url: `${config.backendUrl}/api/gs-pay/withdraw-callback`
        };

        const hashString = `${config.gsPay.merchantNo}${JSON.stringify(params)}MD5${timestamp}${config.gsPay.apiKey}`;
        const signature = hashMD5(hashString);

        const bodyData = {
            merchant_no: config.gsPay.merchantNo,
            timestamp: timestamp,
            sign_type: 'MD5',
            params: JSON.stringify(params),
            sign: signature
        };

        console.log('--gs pay withdraw--');
        console.log(bodyData);
        console.log('--gs pay withdraw--');
        const response = await axios.post(`${config.gsPay.host}/api/gateway/withdraw`, bodyData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = response.data;
        console.log(data);
        if (data.code === 200) {
            const params = JSON.parse(data.params);
            await gsPayLogService.createGsPayWithdraw({
                userId: userId,
                ...params
            });
            return { status: true, data: params };
        }
        return { status: false };
    } catch (error) {
        console.info('===get gs payment request error===');
        console.error((error as any).response.data);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
};

export const gsWithdrawCallback = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log('gs pay withdraw callback start');
        console.log(data);
        console.log('gs pay withdraw callback end');

        const hashString = `${config.gsPay.merchantNo}${data.params}MD5${data.timestamp}${config.gsPay.apiKey}`;
        const signature = hashMD5(hashString);

        if (signature !== data.sign) {
            console.log('gs pay withdraw callback sign failed');
            res.send('SUCCESS');
            return;
        }

        const params = JSON.parse(data.params);
        const payment = await gsPayLogService.updateWithdrawLog({ merchant_ref: params.merchant_ref }, params);

        if (!payment) {
            console.log('gs pay withdraw callback tnx not found');
            res.send('SUCCESS');
            return;
        }
        if (params.status !== payment.status && params.status === 1) {
            const withdrawAmount = Number(params.pay_amount);

            const balance = await balanceService.patchUpdate(
                { userId: payment.userId },
                { $in: { pending: withdrawAmount * -1 } }
            );

            const user = await userService.getUserById(String(payment.userId));
            await transactionService.createTransaction({
                userId: String(payment.userId),
                relatedId: payment.system_ref,
                tnxId: payment.merchant_ref,
                amount: withdrawAmount * -1,
                beforeAmount: Number((balance.amount + withdrawAmount).toFixed(2)),
                afterAmount: Number(balance.amount.toFixed(2)),
                currencyName: params.fiat_currency,
                type: 'withdraw',
                typeDescription: 'Withdraw',
                provider: 'gspayment',
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
        res.send('SUCCESS');
        return;
    } catch (error) {
        console.info('===GS withdraw callback error===');
        console.log(error);
        res.send('SSUCCESS');
        return;
    }
};
