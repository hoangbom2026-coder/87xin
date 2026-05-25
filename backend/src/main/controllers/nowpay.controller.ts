import axios from 'axios';
import { groupBy } from 'lodash';
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
import nowpayService from '@main/services/nowpay.service';
import balanceService from '@main/services/balance.service';
import settingService from '@main/services/setting.service';
import currencyService from '@main/services/currency.service';
import transactionService from '@main/services/transaction.service';
import nowpayWithdrawService from '@main/services/nowpay-withdraw.service';
import withdrawService from '@main/services/withdraw.service';
import bonusService from '@main/services/bonus.service';
import playerBonusService from '@main/services/player-bonus.service';
import depositService from '@main/services/deposit.service';

const getDepositStatus = (status: string) => {
    switch (status) {
        case 'waiting':
            return 'pending';
        case 'confirming':
        case 'confirmed':
        case 'sending':
            return 'process';
        case 'partially_paid':
        case 'finished':
            return 'success';
        case 'failed':
        case 'expired':
            return 'failed';
    }
};

/** Trả true nếu NowPay đã được cấu hình thực (không phải placeholder). */
export const isNowpayConfigured = (): boolean => {
    const host = String(config.nowpay.host || '').trim();
    if (!host) return false;
    if (/^https?:\/\/(dummy|example|test|localhost|127\.|0\.0\.0\.0)/i.test(host)) return false;
    if (/your_nowpay_host_here/i.test(host)) return false;
    if (!/^https?:\/\//i.test(host)) return false;
    return Boolean(config.nowpay.email && config.nowpay.password);
};

export const initAuth = async () => {
    if (!isNowpayConfigured()) return;
    try {
        const response = await axios.post(`${config.nowpay.host}/v1/auth`, {
            email: config.nowpay.email,
            password: config.nowpay.password
        }, { timeout: 10000 });
        const data = response.data;
        await global.redis.set('nowpay-token', data.token);
    } catch (error) {
        // Lỗi mạng / DNS: log ngắn 1 dòng, không noise
        const msg = (error as any)?.message || 'unknown';
        if (process.env.NODE_ENV !== 'production' || !/ENOTFOUND|ETIMEDOUT|ECONNREFUSED/.test(msg)) {
            console.error('[nowpay] auth failed:', msg);
        }
    }
};

export const initCurrency = async () => {
    try {
        const response = await axios.get(`${config.nowpay.host}/v1/full-currencies`, {
            headers: {
                'x-api-key': config.nowpay.apiKey
            }
        });
        const data = response.data;
        await nowpayService.createCurrencies(data.currencies);
    } catch (error) {
        console.log('---Nowpayment get currency error start---');
        console.error((error as any).message);
        console.log('---Nowpayment get currency error end---');
    }
};

export const loadCurrency = catchAsync(async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${config.nowpay.host}/v1/full-currencies`, {
            headers: {
                'x-api-key': config.nowpay.apiKey
            }
        });
        const data = response.data;
        await nowpayService.createCurrencies(data.currencies);
        res.send(data.currencies);
    } catch (error) {
        console.log('---Nowpayment get currency error start---');
        console.error((error as any).message);
        console.log('---Nowpayment get currency error end---');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
});

export const loadaVailableCurrency = async () => {
    const response = await axios.get(`${config.nowpay.host}/v1/balance`, {
        headers: {
            'x-api-key': config.nowpay.apiKey
        }
    });
    const data = response.data;
    await global.redis.set('nowpay-balance', JSON.stringify(data));
    const keys = Object.keys(data).map((k) => k.toUpperCase());
    const currencies = await nowpayService.getCurrenciesByCodes(keys);
    const balance = currencies.map((currency) => {
        const amount = data[currency.code.toLowerCase()].amount;
        return {
            ...currency,
            availableAmount: amount * currency.usd
        };
    });
    console.log(currencies, '--- now currencies balance ---', balance);
    return balance;
};

export const getCurrency = catchAsync(async (req: Request, res: Response) => {
    try {
        const currencies = await nowpayService.getCurrencies();
        res.send(groupBy(currencies, 'network'));
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
});

export const getNowpayCurrency = catchAsync(async (req: Request, res: Response) => {
    const currencies = await nowpayService.getNowpayCurrency(req.body);
    res.send(currencies);
});

export const updateＣurrency = catchAsync(async (req: AuthRequest, res: Response) => {
    const item = await nowpayService.getCurrencyById((req.params as any).currencyId);
    if (!item) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Currency not found');
    }
    const updated = await nowpayService.updateＣurrency((req.params as any).currencyId, req.body);
    // Sync with admin Currencies collection so it appears across the app immediately
    try {
        const code = (updated?.code || item.code || '').toUpperCase();
        const icon = updated?.logo_url || item.logo_url || '';
        const active = typeof updated?.status === 'boolean' ? Boolean(updated.status) : Boolean(req.body.status);
        if (code) {
            const exist = await currencyService.getCurrencyByName(code);
            if (exist) {
                await currencyService.patchUpdate({ _id: exist._id }, { status: active, ...(icon ? { icon } : {}) });
            } else {
                await currencyService.createCurrency({ name: code, icon: icon || '', status: active });
            }
        }
    } catch (e) {
        console.log('nowpay->currency sync error:', (e as any)?.message || e);
    }
    res.send(updated);
});

export const updateNowpayCurrency = catchAsync(async (req: Request, res: Response) => {
    const id = (req.params as any).id;
    const currency = await nowpayService.updateNowpayCurrency({ _id: id }, req.body);
    res.send(currency);
});

export const createPayment = catchAsync(async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const currencyId = req.user.currencyId;
        const { amount, currency } = req.body;

        const checkResponse = await axios.get(
            `${config.nowpay.host}/v1/min-amount?currency_from=${currency}&is_fixed_rate=False`,
            {
                headers: {
                    'x-api-key': config.nowpay.apiKey
                }
            }
        );

        const checkData = checkResponse.data;
        console.log('---nowpay min amount check start---');
        console.log(checkData, amount);
        console.log('---nowpay min amount check end---');

        if (amount < checkData.min_amount) {
            res.send({ status: false, message: `Min amount is ${checkData.min_amount}` });
            return;
        }

        const userCurrency = await currencyService.getCurrencyById(currencyId);
        if (!userCurrency) {
             throw new ApiError(httpStatus.BAD_REQUEST, 'User currency not found');
        }

        const nowpayCurrency = await nowpayService.getCurrencyByCode(currency);
        if (!nowpayCurrency) {
             throw new ApiError(httpStatus.BAD_REQUEST, 'Payment currency not found');
        }

        let cryptoToUsdRate = 0;
        if (nowpayCurrency.usd > 0 && !nowpayCurrency.rate_code) {
            cryptoToUsdRate = nowpayCurrency.usd;
        } else {
            const rateResponse = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${nowpayCurrency.rate_code}&vs_currencies=usd`
            );
            const responseObject = rateResponse.data;
            console.log('---nowpay crypto to USD start---');
            console.log(responseObject);
            console.log('---nowpay crypto to USD end---');
            cryptoToUsdRate = responseObject[nowpayCurrency.rate_code]?.usd;
        }

        if (!cryptoToUsdRate || isNaN(cryptoToUsdRate)) {
             throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to retrieve exchange rate');
        }

        await nowpayService.updateNowpayCurrency({ rate_code: nowpayCurrency.rate_code }, { usd: cryptoToUsdRate });

        const setting = await settingService.getSetting();
        const usdToFiatRate = setting.rates[userCurrency.name];
        const usdAmount = Number(amount) * Number(cryptoToUsdRate);

        const fiatAmount = usdAmount * usdToFiatRate;
        console.log('---nowpay to Fiat amount start---');
        console.log(fiatAmount);
        console.log('---nowpay to Fiat amount end---');

        const response = await axios.post(
            `${config.nowpay.host}/v1/payment`,
            {
                price_amount: usdAmount,
                price_currency: 'usd',
                pay_amount: amount,
                pay_currency: currency,
                ipn_callback_url: `${config.backendUrl}/api/nowpay/deposit-callback`,
                order_id: new Date().valueOf(),
                order_description: 'deposit'
            },
            {
                headers: {
                    'x-api-key': config.nowpay.apiKey
                }
            }
        );
        const data = response.data;
        console.log('---nowpay create payment response start---');
        console.log(data);
        console.log('---nowpay create payment response end---');

        const depositData = {
            userId,
            currencyId,
            currency: userCurrency.name,
            amount: fiatAmount,
            status: 'pending',
            payinType: 'nowpayment',
            description: '',
            gatewayOrderId: data.order_id,
            data: {
                pay_address: data.pay_address,
                pay_amount: data.pay_amount,
                pay_currency: data.pay_currency,
                network: data.network,
                logo_url: nowpayCurrency.logo_url
            }
        };
        const deposit = await depositService.createDeposit(depositData);

        await nowpayService.createNowpayLog({ ...data, userId, depositId: deposit._id });
        const pendingDeposit = await depositService.getPendingDeposit(userId);
        res.send({ status: true, pendingDeposit });
    } catch (error) {
        console.log('---nowpay create payment errors start---');
        console.log(error);
        console.log('---nowpay create payment errors end---');
        if ((error as any).response && (error as any).response.data) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, (error as any).response.data.message);
        }
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
});

export const depositCallback = async (req: Request, res: Response) => {
    try {
        console.log('---nowpay deposit callback start---');
        console.log(req.body);
        console.log('---nowpay deposit callback end---');

        const { payment_id, actually_paid, payment_status } = req.body;

        const payment = await nowpayService.getNowpayLog({
            payment_id,
            payment_status: { $nin: ['finished', 'expired', 'failed', 'partially_paied'] }
        });
        if (payment && payment.payment_status !== payment_status) {
            const nowpay = await nowpayService.updateNowpayLog({ payment_id }, req.body);
            const depositStatus = getDepositStatus(payment_status);
            const query: any = { status: depositStatus };

            const depositItem = await depositService.getDepositById(String(nowpay.depositId));

            if (depositItem.status === 'canceled') {
                res.json(true);
                return;
            }

            if (payment_status === 'finished' || payment_status === 'partially_paid') {
                const user = await userService.getUserById(String(payment.userId));
                const currency = await currencyService.getCurrencyById(String(user.currencyId));

                const nowpayCurrency = await nowpayService.getCurrencyByCode(payment.pay_currency);
                const cryptoToUsdRate = nowpayCurrency.usd;

                const setting = await settingService.getSetting();
                const usdToFiatRate = setting.rates[currency.name];

                const usdAmount = Number(actually_paid) * cryptoToUsdRate;

                const fiatAmount = usdAmount * usdToFiatRate;
                query.actuallyAmount = fiatAmount;

                const balance = await balanceService.depositBalance(String(payment.userId), fiatAmount);
                await transactionService.createTransaction({
                    userId: String(payment.userId),
                    relatedId: payment.order_id,
                    tnxId: payment.order_id,
                    amount: Number(fiatAmount.toFixed(2)),
                    beforeAmount: Number((balance.amount - fiatAmount).toFixed(2)),
                    afterAmount: Number(balance.amount.toFixed(2)),
                    currencyName: payment.pay_currency.toUpperCase(),
                    type: 'deposit',
                    typeDescription: 'Deposit',
                    provider: 'nowpayment',
                    path: user.path
                });

                if (user.depositCount === 0) {
                    const bonus = await bonusService.getAvailableBonusByOption('welcome');
                    if (bonus) {
                        const bonusAmount =
                            (fiatAmount * bonus.percent) / 100 > bonus.bonusCap
                                ? bonus.bonusCap
                                : (fiatAmount * bonus.percent) / 100;
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
                        (fiatAmount * bonus.percent) / 100 > bonus.bonusCap
                            ? bonus.bonusCap
                            : (fiatAmount * bonus.percent) / 100;
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

            await depositService.patchUpdate({ _id: nowpay.depositId }, query);
        }
        res.json(true);
    } catch (error) {
        console.log('---nowpay depoist callback error start---');
        console.error(error);
        console.log('---nowpay depoist callback error end---');
        res.status(400).json('Interanal server error');
        return;
    }
};

export const withdrawCallback = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log('---nowpay withdraw callback start---');
        console.log(data);
        console.log('---nowpay withdraw callback end---');

        const payment = await nowpayWithdrawService.updateAndCreateWithdraw({ id: data.id }, data);

        const withdrawItem = await withdrawService.getWithdrawById(payment.extra_id);
        if (!withdrawItem) {
             console.log(`Withdraw record not found for extra_id: ${payment.extra_id}`);
             res.json(true);
             return;
        }

        if (!payment.userId) {
             await nowpayWithdrawService.patchUpdate({ _id: payment._id }, { userId: withdrawItem.userId });
        }

        if (payment.status === 'FINISHED') {
            await withdrawService.updateWithdraw(payment.extra_id, { status: 'success' });
            const user = await userService.getUserById(String(withdrawItem.userId));

            const balance = await balanceService.patchUpdate(
                { userId: withdrawItem.userId },
                { $in: { pending: withdrawItem.amount * -1 } }
            );

            await transactionService.createTransaction({
                userId: String(withdrawItem.userId),
                relatedId: payment.id,
                tnxId: payment.id,
                amount: withdrawItem.amount * -1,
                beforeAmount: Number((balance.amount + withdrawItem.amount).toFixed(2)),
                afterAmount: Number(balance.amount.toFixed(2)),
                currencyName: payment.currency,
                type: 'withdraw',
                typeDescription: 'Withdraw',
                provider: 'nowpayment',
                path: user.path
            });

            const storedSocketId = await global.redis.get(String(withdrawItem.userId));
            if (storedSocketId) {
                global.io.to(storedSocketId).emit('balance', {
                    amount: balance.amount,
                    pending: balance.pending,
                    bonus: balance.bonus,
                    turnover: balance.turnover
                });
            }
        } else if (payment.status === 'FAILED' || payment.status === 'REJECTED') {
            await withdrawService.updateWithdraw(payment.extra_id, { status: 'failed' });
            const balance = await balanceService.patchUpdate(
                { userId: withdrawItem.userId },
                { $in: { amount: withdrawItem.amount, pending: withdrawItem.amount * -1 } }
            );
            const storedSocketId = await global.redis.get(String(withdrawItem.userId));
            if (storedSocketId) {
                global.io.to(storedSocketId).emit('balance', {
                    amount: balance.amount,
                    pending: balance.pending,
                    bonus: balance.bonus,
                    turnover: balance.turnover
                });
            }
        }
        res.json(true);
    } catch (error) {
        console.log('---nowpay withdraw callback error start---');
        console.error(error);
        console.log('---nowpay withdraw callback error end---');
        res.status(400).json('Interanal server error');
        return;
    }
};

export const getNowpayToAmount = async (amount: number, fromCurrency: string, toCurrency: string) => {
    const setting = await settingService.getSetting();
    const rates = setting.rates;
    if (rates[fromCurrency.toUpperCase()]) {
        const stringNowpayBalance = await global.redis.get('nowpay-balance');
        if (!stringNowpayBalance) return null;
        const nowpayBalance = JSON.parse(stringNowpayBalance);

        const currency = await nowpayService.getCurrenciesByCode(toCurrency);
        if (!currency) return null;

        const cryptoRate = currency.usd;
        if (!cryptoRate) return null;

        const availableCrypto = nowpayBalance[currency.code.toLowerCase()]?.amount || 0;

        const rate = rates[fromCurrency.toUpperCase()];
        const fiatUsd = amount * (1 / rate);
        const cryptoAmount = fiatUsd * (1 / cryptoRate);
        return {
            toAmount: cryptoAmount,
            availableCrypto
        };
    }
    return null;
};

export const getWithdrawableCurrency = catchAsync(async (req: Request, res: Response) => {
    try {
        const { withdrawAmount, currencyCode } = req.body;
        const setting = await settingService.getSetting();
        const rates = setting.rates;
        if (rates[currencyCode.toUpperCase()]) {
            const validCurrencies = await loadaVailableCurrency();
            const rate = rates[currencyCode.toUpperCase()];
            const usd = withdrawAmount * (1 / rate);
            const nowpayCurrencies = validCurrencies.filter((vc) => vc.availableAmount >= usd);
            res.send(groupBy(nowpayCurrencies, 'network'));
            return;
        }
        console.log(currencyCode);
        console.log('---currency is invalid---');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    } catch (error) {
        console.log(error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
});

export const createPayout = async ({ amount, currency, address, withdrawId }) => {
    try {
        const token = await global.redis.get('nowpay-token');
        const response = await axios.post(
            `${config.nowpay.host}/v1/payout`,
            {
                ipn_callback_url: `${config.backendUrl}/api/nowpay/withdraw-callback`,
                withdrawals: [
                    {
                        address,
                        currency,
                        amount,
                        extra_id: withdrawId,
                        ipn_callback_url: `${config.backendUrl}/api/nowpay/withdraw-callback`
                    }
                ]
            },
            {
                headers: {
                    'x-api-key': config.nowpay.apiKey,
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return { status: true, data: response.data };
    } catch (error) {
        console.log('=======nowpay withdraw======');
        console.log(error);
        const message = (error as any).response?.data?.message || (error as any).message || 'Unknown error';
        return { status: false, message };
    }
};
