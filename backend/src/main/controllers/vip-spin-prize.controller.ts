import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import vipSpinPrizeService from '@main/services/vip-spin-prize.service';

export const getVipSpinPrizeList = catchAsync(async (req: AuthRequest, res: Response) => {
    const vipSpinPrizes = await vipSpinPrizeService.getVipSpinPrizeList();
    return res.send(vipSpinPrizes);
});

export const getVipSpinPrizes = catchAsync(async (req: AuthRequest, res: Response) => {
    const vipSpinPrizes = await vipSpinPrizeService.getVipSpinPrizes();
    return res.send(vipSpinPrizes);
});

export const createVipSpinPrize = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const prize = await vipSpinPrizeService.createVipSpinPrize(data);
    const newPrize = await vipSpinPrizeService.getVipSpinPrizeById(String(prize._id));
    return res.send(newPrize);
});

export const updateVipSpinPrize = catchAsync(async (req: AuthRequest, res: Response) => {
    const { vipSpinPrizeId } = (req.params as any);
    const data = req.body;
    await vipSpinPrizeService.patchUpdate({ _id: vipSpinPrizeId }, data);
    const updatedPrize = await vipSpinPrizeService.getVipSpinPrizeById(vipSpinPrizeId);
    return res.send(updatedPrize);
});

export const deleteVipSpinPrize = catchAsync(async (req: AuthRequest, res: Response) => {
    const { vipSpinPrizeId } = (req.params as any);
    const vipSpinPrize = await vipSpinPrizeService.getVipSpinPrizeById(vipSpinPrizeId);
    if (!vipSpinPrize) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
    }

    await vipSpinPrizeService.deleteVipSpinPrizeById(vipSpinPrizeId);
    return res.status(httpStatus.NO_CONTENT).send();
});
