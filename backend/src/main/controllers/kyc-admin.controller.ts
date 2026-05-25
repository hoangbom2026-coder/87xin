import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// services
import kycService from '@main/services/kyc.service';
import userService from '@main/services/user.service';

export const getKycList = catchAsync(async (req: AuthRequest, res: Response) => {
    const kycs = await kycService.getKycs(req.body);
    return res.send(kycs);
});

export const getKycItem = catchAsync(async (req: AuthRequest, res: Response) => {
    const { kycId } = (req.params as any);
    const kyc = await kycService.getKycById(kycId);
    if (!kyc) throw new ApiError(httpStatus.BAD_REQUEST, 'KYC not found');
    return res.send(kyc);
});

export const updateKyc = catchAsync(async (req: AuthRequest, res: Response) => {
    const { kycId } = (req.params as any);
    const { status, reason } = req.body as { status: 'pending' | 'verified' | 'rejected'; reason?: string };

    const kyc = await kycService.getKycById(kycId);
    if (!kyc) throw new ApiError(httpStatus.BAD_REQUEST, 'KYC not found');

    const updated = await kycService.patchUpdate(
        { _id: kycId },
        { status, reason: reason || '', actionDate: new Date() } as any
    );

    // reflect on user flag
    try {
        await userService.patchUpdate({ _id: updated.userId }, { kycVerified: status === 'verified' } as any);
    } catch {}

    return res.send(updated);
});
