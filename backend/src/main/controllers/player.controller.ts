import httpStatus from 'http-status';
import { Response } from 'express';
import * as UAParser from 'ua-parser-js';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { getGeoInfo } from '@utils/getCountry';
import { getIpAddress } from '@utils/utils';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import userService from '@main/services/user.service';
import passwordLogService from '@main/services/password-log.service';
import kycService from '@main/services/kyc.service';
import balanceService from '@main/services/balance.service';
import withdrawService from '@main/services/withdraw.service';
import bonusService from '@main/services/bonus.service';
import playerBonusService from '@main/services/player-bonus.service';
import transactionService from '@main/services/transaction.service';
import currencyService from '@main/services/currency.service';
import depositService from '@main/services/deposit.service';
import telegramService from '@main/services/telegram.service';

export const updateUsername = catchAsync(async (req: AuthRequest, res: Response) => {
    const updateData = req.body;

    if (updateData.username) {
        if (await userService.usernameTaken(updateData.username, String(req.user._id))) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
        }
    }
    const updatedUser = await userService.patchUpdate({ _id: req.user._id }, updateData);
    return res.send(updatedUser);
});

export const updateCurrency = catchAsync(async (req: AuthRequest, res: Response) => {
    const updateData = req.body;
    const updatedUser = await userService.patchUpdate({ _id: req.user._id }, updateData);
    return res.send(updatedUser);
});

export const updateAvatar = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Avatar upload is incorrect');
    }
    const updatedUser = await userService.patchUpdate({ _id: req.user._id }, { avatar: req.file.filename });
    return res.send(updatedUser);
});

export const updatePassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!(await req.user.isPasswordMatch(oldPassword))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
    }
    await userService.updatePassword(String(req.user._id), newPassword);

    const userIp = getIpAddress(req);

    const userAgent = req.headers['user-agent'];
    const parser = new UAParser.UAParser(userAgent);
    const result = parser.getResult();

    const country = {
        code: 'Unknown',
        name: 'Unknown'
    };

    if (userIp) {
        const { data } = await getGeoInfo(userIp);
        country.code = data.countryCode;
        country.name = data.country;
    }
    await passwordLogService.createPasswordLog({
        userId: String(req.user._id),
        actorId: String(req.user._id),
        ip: userIp,
        userAgent,
        device: result.device.type || 'desktop',
        os: result.os.name + ' ' + result.os.version,
        browser: result.browser.name + ' ' + result.browser.version,
        country
    });

    return res.status(httpStatus.NO_CONTENT).send();
});

export const getPlayerBalance = catchAsync(async (req: AuthRequest, res: Response) => {
    const balance = await balanceService.getBalanceByUser(String(req.user._id));
    return res.send(balance);
});

export const getKyc = catchAsync(async (req: AuthRequest, res: Response) => {
    const kyc = await kycService.getKycByUser(String(req.user._id));
    return res.send(kyc);
});

export const createKyc = catchAsync(async (req: AuthRequest, res: Response) => {
    const oldkyc = await kycService.getKycByUser(String(req.user._id));
    if (oldkyc) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Your KYC already exists');
    }

    let frontImg = '';
    let backImg = '';
    if (req.files && req.files['frontImg'] && req.files['frontImg'][0]) {
        frontImg = req.files['frontImg'][0].filename;
    }
    if (req.files && req.files['backImg'] && req.files['backImg'][0]) {
        backImg = req.files['backImg'][0].filename;
    }

    const { type, countryCode, country } = req.body;

    const kyc = await kycService.createKYC({
        userId: String(req.user._id),
        frontImg,
        backImg,
        type,
        country: {
            code: countryCode,
            name: country
            }
            });

            // Notify admin via Telegram
            telegramService.notifyNewKyc(String(req.user.username)).catch(() => undefined);

            return res.send(kyc);
            });
export const getPlayerTransactions = catchAsync(async (req: AuthRequest, res: Response) => {
    const transactions = await transactionService.getPlayerTransaction(req.user._id, req.body);
    return res.send(transactions);
});

export const getPlayerDeposit = catchAsync(async (req: AuthRequest, res: Response) => {
    const withdraws = await depositService.getPlayerDeposit({ ...req.body, userId: req.user._id });
    return res.send(withdraws);
});

export const getPlayerWithdraw = catchAsync(async (req: AuthRequest, res: Response) => {
    const withdraws = await withdrawService.getPlayerWithdraw({ ...req.body, userId: req.user._id });
    return res.send(withdraws);
});

export const getPlayerBonus = catchAsync(async (req: AuthRequest, res: Response) => {
    const bonuses = await playerBonusService.getPlayerBonus({ ...req.body, userId: req.user._id });
    return res.send(bonuses);
});

export const claimBonus = catchAsync(async (req: AuthRequest, res: Response) => {
    const bonusId = (req.params as any).bonusId;
    const userId = req.user._id;
    const uid = String(userId);

    const bonus = await playerBonusService.getPlayerActiveBonus(bonusId, userId);
    if (!bonus) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bonus not found or not claimable');
    }

    const currency = await currencyService.getCurrencyById(req.user.currencyId);
    const prevBal = await balanceService.getBalanceByUserId(uid);
    const beforeAmount = Number(prevBal?.amount ?? 0);
    const credited = Number(Number(bonus.amount).toFixed(2));
    const balance = await balanceService.creditBalance(uid, credited);
    if (!balance) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Balance update failed');
    }
    const afterAmount = Number(balance.amount.toFixed(2));

    await transactionService.createTransaction({
        userId,
        relatedId: String(bonus._id),
        tnxId: new Date().valueOf().toString(),
        amount: credited,
        beforeAmount,
        afterAmount,
        currencyName: currency.name,
        type: 'deposit',
        typeDescription: 'Bonus',
        provider: 'bonus'
    });

    const storedSocketId = await global.redis.get(uid);
    if (storedSocketId) {
        global.io.to(storedSocketId).emit('balance', { amount: balance.amount });
    }
    const updatedBonus = await playerBonusService.patchUpdate({ _id: bonus._id }, { status: 'claimed' });
    return res.send(updatedBonus);
});

export const getPlayerGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const games = await transactionService.getPlayerGames(req.user._id);
    return res.send(games);
});
