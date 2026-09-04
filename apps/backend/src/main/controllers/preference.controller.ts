import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import userService from '@main/services/user.service';
import preferenceService from '@main/services/preference.service';

export const getPreference = catchAsync(async (req: AuthRequest, res: Response) => {
    const preference = await preferenceService.getPreference(String(req.user._id), String(req.user.currencyId));
    return res.send(preference);
});

export const updatePreference = catchAsync(async (req: AuthRequest, res: Response) => {
    const preference = await preferenceService.updatePerference(String(req.user._id), req.body);
    return res.send(preference);
});

export const updatePassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const user = await userService.getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const updated = await userService.updatePassword(userId, req.body.password);
    return res.send({ status: !!updated });
});

export const updateUserStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId, status } = req.body;
    const user = await userService.getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const updated = await userService.patchUpdate({ _id: userId }, { status });
    return res.send(updated);
});
