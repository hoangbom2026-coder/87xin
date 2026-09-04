import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import vipTiersService from '@main/services/vip-tiers.service';
import vipLevelService from '@main/services/vip-level.service';

export const getVipTiersList = catchAsync(async (req: AuthRequest, res: Response) => {
    const vipTierss = await vipTiersService.getVipTiersList();
    return res.send(vipTierss);
});

export const createVipTiers = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    if (req.file) {
        data.icon = req.file.filename;
    }
    const bonus = await vipTiersService.createVipTiers(data);
    return res.send(bonus);
});

export const updateVipTiers = catchAsync(async (req: AuthRequest, res: Response) => {
    const { vipTiersId } = (req.params as any);
    const data = req.body;
    if (req.file) {
        data.icon = req.file.filename;
    }

    const vipTiers = await vipTiersService.patchUpdate({ _id: vipTiersId }, data);
    return res.send(vipTiers);
});

export const deleteVipTiers = catchAsync(async (req: AuthRequest, res: Response) => {
    const { vipTiersId } = (req.params as any);
    const vipTiers = await vipTiersService.getVipTiersById(vipTiersId);
    if (!vipTiers) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Vip Level not found');
    }

    await vipTiersService.deleteVipTiersById(vipTiersId);
    await vipLevelService.deleteVipLevelByParentId(vipTiersId);
    return res.status(httpStatus.NO_CONTENT).send();
});
