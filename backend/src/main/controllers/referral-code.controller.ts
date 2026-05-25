import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import referralCodeService from '@main/services/referral-code.service';
import { generateReferral } from '@utils/utils';
import userService from '@main/services/user.service';
import settingService from '@main/services/setting.service';
import { assertMayCreateReferralCode } from '@main/services/reagent-enrollment.service';

export const getReferralStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user._id;
    const friends = await userService.getUserByinvitorId(userId);
    const setting = await settingService.getSetting();
    return res.send({ friendCount: friends.length, referralCount: setting.referralCodeCount });
});

export const getReferralCodes = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user._id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));
    const referralCodes = await referralCodeService.getReferralCodes(String(userId));
    const start = (page - 1) * limit;
    const items = referralCodes.slice(start, start + limit);
    return res.send({ items, total: referralCodes.length, page, limit });
});

export const createReferralCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const userId = req.user._id;

    await assertMayCreateReferralCode(req.user as Record<string, unknown>);

    const setting = await settingService.getSetting();
    const referralCodes = await referralCodeService.getReferralCodes(String(userId));
    if (referralCodes.length >= setting.referralCodeCount) {
        throw new ApiError(httpStatus.NOT_FOUND, 'You can not creat any more');
    }

    let code = generateReferral(9, false);
    let otpCheck = await referralCodeService.getReferralCodeByCode(code);

    while (otpCheck) {
        code = generateReferral(9, false);
        otpCheck = await referralCodeService.getReferralCodeByCode(code);
    }

    const referralCode = await referralCodeService.createReferralCode({
        ...data,
        userId,
        code,
        commissionRate: setting.referralCommissionRate
    });
    return res.send(referralCode);
});

/** Admin: override commissionRate on any referral code document (per-code metadata). */
export const patchReferralCommission = catchAsync(async (req: AuthRequest, res: Response) => {
    const { code } = (req.params as any);
    const { commissionRate } = req.body as { commissionRate: number };
    const doc = await referralCodeService.patchUpdate(
        { code: String(code) },
        { $set: { commissionRate } }
    );
    if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'Referral code not found');
    return res.send(doc);
});

export const deleteReferralCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const { referralCodeId } = (req.params as any);
    const referralCode = await referralCodeService.getReferralCodeById(referralCodeId);
    if (!referralCode) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Referral Code not found');
    }

    await referralCodeService.deleteReferralCodeById(referralCodeId);
    return res.status(httpStatus.NO_CONTENT).send();
});
