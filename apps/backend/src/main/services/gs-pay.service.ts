import axios from 'axios';
import crypto from 'crypto';
import config from '@config/index';
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';

function hashMD5(hashString: string): string {
    return crypto.createHash('md5').update(hashString).digest('hex');
}

const getDepositStatus = (status: number): string => {
    switch (status) {
        case 0:
            return 'failed';
        case 1:
            return 'success';
        default:
            return 'pending';
    }
};

/** Build GS Pay request payload with MD5 signature */
function buildGsPayPayload(params: object, timestamp: number): { signature: string; bodyData: object } {
    const hashString = `${config.gsPay.merchantId}${JSON.stringify(params)}MD5${timestamp}${config.gsPay.apiKey}`;
    const signature = hashMD5(hashString);
    return {
        signature,
        bodyData: {
            merchant_no: config.gsPay.merchantId,
            timestamp,
            sign_type: 'MD5',
            params: JSON.stringify(params),
            sign: signature,
        },
    };
}

/** Verify GS Pay callback signature */
function verifyGsPaySignature(data: any): boolean {
    const hashString = `${config.gsPay.merchantId}${data.params}MD5${data.timestamp}${config.gsPay.apiKey}`;
    const signature = hashMD5(hashString);
    return signature === data.sign;
}

/** 1. Create Deposit Payment Request */
export const createDepositPayment = async (data: {
    userId: string;
    currency: string;
    currencyId: string;
    amount: number;
}) => {
    const { userId, currency, currencyId, amount } = data;
    const timestamp = new Date().valueOf();
    const params = {
        merchant_ref: String(timestamp),
        product: 'TRC20Buy',
        amount,
        extra: {
            fiat_currency: currency,
        },
        notify_url: `${config.backendUrl}/api/gs-pay/deposit-callback`,
        return_url: `${config.backendUrl}/wallet/deposit`,
    };

    const { signature, bodyData } = buildGsPayPayload(params, timestamp);

    const response = await axios.post(`${config.gsPay.host}/api/gateway/pay`, bodyData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const responseData = response.data;
    if (responseData.code !== 200) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, responseData.message || 'GS Pay payment creation failed');
    }

    const parsedParams = JSON.parse(responseData.params);
    return {
        status: true,
        params: parsedParams,
        depositData: {
            userId,
            currencyId,
            currency,
            amount,
            status: 'pending',
            payinType: 'gspayment',
            description: '',
            gatewayOrderId: parsedParams.merchant_ref,
            data: {
                payurl: parsedParams.payurl,
                product: parsedParams.product,
                fee: parsedParams.fee,
            },
        },
    };
};

/** 2. Handle Deposit Callback */
export const handleDepositCallback = async (data: any) => {
    if (!verifyGsPaySignature(data)) {
        console.log('gs pay deposit callback sign failed');
        return { status: 'skipped', reason: 'invalid_signature' };
    }

    const params = JSON.parse(data.params);
    return { params, valid: true };
};

/** 3. Process Successful Deposit */
export const processSuccessfulDeposit = async (data: {
    payment: any;
    params: any;
    userService: any;
    currencyService: any;
    balanceService: any;
    transactionService: any;
    bonusService: any;
    playerBonusService: any;
}) => {
    const { payment, params, userService, currencyService, balanceService, transactionService, bonusService, playerBonusService } = data;

    if (params.status !== payment.status && params.status === 1) {
        const user = await userService.getUserById(String(payment.userId));
        const currency = await currencyService.getCurrencyById(String(user.currencyId));

        const depositAmount = Number(params.pay_amount);

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

    return { status: 'processed' };
};

/** 4. Check Payment Status */
export const checkPaymentStatus = async (params: { orderId: string; timestamp: number }) => {
    const { orderId, timestamp } = params;
    const hashString = `${config.gsPay.merchantId}${orderId}MD5${timestamp}${config.gsPay.apiKey}`;
    const signature = hashMD5(hashString);

    const response = await axios.post(`${config.gsPay.host}/api/gateway/payment/status`, {
        merchant_no: config.gsPay.merchantId,
        timestamp,
        sign_type: 'MD5',
        order_id: orderId,
        sign: signature,
    }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = response.data;
    if (data.code !== 200) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, data.message || 'Payment status check failed');
    }

    const parsedParams = JSON.parse(data.params);
    return { status: true, data: parsedParams };
};

/** 5. Create Withdraw Request */
export const createWithdrawRequest = async (data: { userId: string; amount: number }) => {
    const { userId, amount } = data;
    const timestamp = new Date().valueOf();
    const params = {
        merchant_ref: String(timestamp),
        product: 'TRC20Buy',
        amount,
        extra: {},
        notify_url: `${config.backendUrl}/api/gs-pay/withdraw-callback`,
    };

    const { signature, bodyData } = buildGsPayPayload(params, timestamp);

    const response = await axios.post(`${config.gsPay.host}/api/gateway/withdraw`, bodyData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const responseData = response.data;
    if (responseData.code !== 200) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, responseData.message || 'GS Pay withdraw failed');
    }

    const parsedParams = JSON.parse(responseData.params);
    return { status: true, data: parsedParams, userId };
};

/** 6. Handle Withdraw Callback */
export const handleWithdrawCallback = async (data: any) => {
    if (!verifyGsPaySignature(data)) {
        console.log('gs pay withdraw callback sign failed');
        return { status: 'skipped', reason: 'invalid_signature' };
    }

    const params = JSON.parse(data.params);
    return { params, valid: true };
};

/** 7. Process Successful Withdraw */
export const processSuccessfulWithdraw = async (data: {
    payment: any;
    params: any;
    userService: any;
    balanceService: any;
    transactionService: any;
}) => {
    const { payment, params, userService, balanceService, transactionService } = data;

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
            path: user.path,
        });

        // Emit socket update if user is online
        const storedSocketId = await global.redis?.get?.(String(payment.userId));
        if (storedSocketId && global.io) {
            const updatedBalance = await balanceService.getBalanceByUserId(String(payment.userId));
            global.io.to(storedSocketId).emit('balance', {
                amount: updatedBalance?.amount,
                bonus: updatedBalance?.bonus,
                pending: updatedBalance?.pending,
                turnover: updatedBalance?.turnover,
            });
        }
    }

    return { status: 'processed' };
};

export default {
    hashMD5,
    getDepositStatus,
    createDepositPayment,
    handleDepositCallback,
    processSuccessfulDeposit,
    checkPaymentStatus,
    createWithdrawRequest,
    handleWithdrawCallback,
    processSuccessfulWithdraw,
};