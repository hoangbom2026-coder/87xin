import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import bonusService from '@main/services/bonus.service';

export const createBonus = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    if (req.file) {
        data.banner = req.file.filename;
    }
    const bonus = await bonusService.createBonus(data);
    return res.send(bonus);
});

export const getBonus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { bonusId } = (req.params as any);
    const bonus = await bonusService.getBonusById(bonusId);
    if (!bonus) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bonus not found');
    }
    return res.send(bonus);
});

export const getBonuses = catchAsync(async (req: AuthRequest, res: Response) => {
    const bonuses = await bonusService.getBonuses();
    return res.send(bonuses);
});

export const getBonusList = catchAsync(async (req: AuthRequest, res: Response) => {
    const bonuses = await bonusService.getBonusList();
    return res.send(bonuses);
});

export const updateBonuse = catchAsync(async (req: AuthRequest, res: Response) => {
    const { bonusId } = (req.params as any);
    const data = req.body;
    if (req.file) {
        data.banner = req.file.filename;
    }

    const bonus = await bonusService.getBonusById(bonusId);
    if (!bonus) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bonus not found');
    }
    const updatedBonus = await bonusService.patchUpdate({ _id: bonusId }, data);
    return res.send(updatedBonus);
});

export const deleteBonus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { bonusId } = (req.params as any);
    const bonus = await bonusService.getBonusById(bonusId);
    if (!bonus) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bonus not found');
    }

    await bonusService.deleteBonus(bonusId);
    return res.status(httpStatus.NO_CONTENT).send();
});
