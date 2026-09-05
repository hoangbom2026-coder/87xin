import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import settingService from '@main/services/setting.service';
import affiliateLogService from '@main/services/affiliate-log.service';
import referralCodeService from '@main/services/referral-code.service';
import userService from '@main/services/user.service';
import transactionService from '@main/services/transaction.service';
import balanceService from '@main/services/balance.service';
import { affiliateLogCron } from './cron.controller';

export const getRewardStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = String(req.user!._id);
    const currency = req.user!.currency;

    const setting = await settingService.getSetting();
    const commissionRewards = await affiliateLogService.getCommissionRewardStatus(userId);

    let commissionReward = 0;
    let commissionAvailable = 0;
    let referralReward = 0;
    let referralAvailable = 0;

    commissionRewards.forEach((c) => {
        const rate = setting.rates[c._id];
        commissionReward += c.totalCommissionWager * (1 / rate);
        commissionAvailable += c.totalCommissionAmount * (1 / rate);
        referralReward += c.totalReferralWager * (1 / rate);
        referralAvailable += c.totalReferralAmount * (1 / rate);
    });
    const userRate = setting.rates[currency];
    return res.send({
        commissionReward: commissionReward * userRate,
        commissionAvailable: commissionAvailable * userRate,
        referralReward: referralReward * userRate,
        referralAvailable: referralAvailable * userRate
    });
});

export const getRewardLog = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = String(req.user!._id);
    const logs = await affiliateLogService.getRewardLog({ ...req.body, userId });
    return res.send(logs);
});

export const getRewardDashboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = String(req.user!._id);
    const currency = req.user!.currency;
    const codeData = await referralCodeService.getLastCode(userId);
    const friends = await userService.getUserByinvitorId(userId);
    const rewardData = await affiliateLogService.getRewardDashboard(userId, currency);
    return res.send({ ...rewardData, code: codeData?.code || '', friends: friends.length });
});

export const getRewardConvert = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = String(req.user!._id);
    const currency = req.user!.currency;
    const { type } = req.body;
    const data = await affiliateLogService.getRewardDashboard(userId, currency);
    if (type === 'commission') {
        await affiliateLogService.convertCommission(userId);
        const updatedBalance = await balanceService.depositBalance(userId, data.totalCommissionAmount);

        await transactionService.createTransaction({
            userId,
            tnxId: new Date().valueOf().toString(),
            amount: Number(data.totalCommissionAmount.toFixed(2)),
            beforeAmount: Number(updatedBalance.amount - data.totalCommissionAmount),
            afterAmount: Number(updatedBalance.amount.toFixed(2)),
            currencyName: currency,
            type: 'commission',
            typeDescription: 'Commission Rewards',
            provider: 'referral-system'
        });
        return res.send({ status: false });
    }
    if (type === 'referral') {
        await affiliateLogService.convertReferral(userId);
        const updatedBalance = await balanceService.depositBalance(userId, data.totalAvailableReferral);

        await transactionService.createTransaction({
            userId,
            tnxId: new Date().valueOf().toString(),
            amount: Number(data.totalAvailableReferral.toFixed(2)),
            beforeAmount: Number(updatedBalance.amount - data.totalAvailableReferral),
            afterAmount: Number(updatedBalance.amount.toFixed(2)),
            currencyName: currency,
            type: 'referral',
            typeDescription: 'Referral Rewards',
            provider: 'referral-system'
        });
        return res.send({ status: true });
    }
    return res.send({ status: false });
});

export const getRewardActivity = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = String(req.user!._id);
    const currency = req.user!.currency;
    const data = await affiliateLogService.getRewardActivity(userId, currency);
    return res.send(data);
});

export const intervalCheck = catchAsync(async (req: Request, res: Response) => {
    await affiliateLogCron();
    return res.send('ok');
});
