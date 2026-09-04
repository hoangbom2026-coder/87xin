import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import SportService from '@main/services/sport.service';

export const getSports = catchAsync(async (req: AuthRequest, res: Response) => {
    const sports = await SportService.getSports();
    return res.send(sports);
});

export const getSportList = catchAsync(async (req: AuthRequest, res: Response) => {
    const Sports = await SportService.getSportList();
    return res.send(Sports);
});

export const createSport = catchAsync(async (req: AuthRequest, res: Response) => {
    const data: Record<string, unknown> = { ...req.body };
    if (req.file) {
        data.image = req.file.filename;
    }
    const num = (v: unknown): number => {
        const n = typeof v === 'string' ? Number(v) : Number(v);
        return Number.isFinite(n) ? n : 0;
    };
    if (typeof data.provider_id !== 'undefined') data.provider_id = num(data.provider_id);
    if (typeof data.product_id !== 'undefined') data.product_id = num(data.product_id);
    if (typeof data.product_code !== 'undefined') data.product_code = num(data.product_code);
    if (typeof data.order !== 'undefined') data.order = num(data.order);
    if (typeof data.currency === 'string') {
        data.currency = (data.currency as string)
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
    }
    const sport = await SportService.createSport(data as any);
    return res.send(sport);
});

export const updateSport = catchAsync(async (req: AuthRequest, res: Response) => {
    const { sportId } = (req.params as any);
    const data: Record<string, unknown> = { ...req.body };
    if (req.file) {
        data.image = req.file.filename;
    }
    if (typeof data.order !== 'undefined') {
        const n = typeof data.order === 'string' ? Number(data.order) : Number(data.order);
        if (Number.isFinite(n)) data.order = n;
    }
    if (typeof data.state === 'string') {
        data.state = data.state === 'true' || data.state === '1';
    }
    if (typeof data.currency === 'string') {
        data.currency = (data.currency as string)
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
    }

    const Sport = await SportService.patchUpdate({ _id: sportId }, data);
    return res.send(Sport);
});

export const deleteSport = catchAsync(async (req: AuthRequest, res: Response) => {
    const { sportId } = (req.params as any);
    const Sport = await SportService.getSportById(sportId);
    if (!Sport) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Sport not found');
    }

    await SportService.deleteSportById(sportId);
    return res.status(httpStatus.NO_CONTENT).send();
});
