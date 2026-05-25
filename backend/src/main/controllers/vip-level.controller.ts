import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import vipLevelService from '@main/services/vip-level.service';

export const getVipLevels = catchAsync(async (req: AuthRequest, res: Response) => {
    const levels = await vipLevelService.getVipLevels();
    return res.send(levels);
});

export const getVipLevelList = catchAsync(async (req: AuthRequest, res: Response) => {
    const { parentId } = (req.params as any);
    const levels = await vipLevelService.getVipLevelList(parentId);
    return res.send(levels);
});

export const createVipLevel = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const level = await vipLevelService.createVipLevel(data);
    return res.send(level);
});

export const updateVipLevel = catchAsync(async (req: AuthRequest, res: Response) => {
    const { vipLevelId } = (req.params as any);
    const data = req.body;
    const level = await vipLevelService.patchUpdate({ _id: vipLevelId }, data);
    return res.send(level);
});

export const deleteVipLevel = catchAsync(async (req: AuthRequest, res: Response) => {
    const { vipLevelId } = (req.params as any);
    const level = await vipLevelService.deleteVipLevelById(vipLevelId);
    if (!level) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Vip Level not found');
    }

    await vipLevelService.deleteVipLevelById(vipLevelId);
    return res.status(httpStatus.NO_CONTENT).send();
});
