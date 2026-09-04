import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import * as svc from '@main/services/affiliate-extras.service';

export const getConfig = catchAsync(async (_req: AuthRequest, res: Response) => {
    const ex = await svc.getExtras();
    return res.send(ex);
});

export const patchConfig = catchAsync(async (req: AuthRequest, res: Response) => {
    const next = await svc.patchExtras(req.body || {});
    return res.send(next);
});

export const listFeed = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await svc.listFeed({
        source: req.query.source as never,
        visible: req.query.visible as never,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50
    });
    return res.send(r);
});

export const createFeed = catchAsync(async (req: AuthRequest, res: Response) => {
    const { username, amount, currency, notes } = req.body || {};
    if (!username || amount === undefined) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'username & amount required');
    }
    const item = await svc.createManualFeed({ username, amount: Number(amount), currency, notes });
    return res.status(httpStatus.CREATED).send(item);
});

export const generateNow = catchAsync(async (_req: AuthRequest, res: Response) => {
    const r = await svc.generateFakeOne();
    return res.send(r);
});

export const updateFeed = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await svc.patchFeed(((req.params as any) as any).id, req.body || {});
    if (!r) throw new ApiError(httpStatus.NOT_FOUND, 'Feed not found');
    return res.send(r);
});

export const removeFeed = catchAsync(async (req: AuthRequest, res: Response) => {
    await svc.deleteFeed(((req.params as any) as any).id);
    return res.send({ ok: true });
});

export const purgeAuto = catchAsync(async (_req: AuthRequest, res: Response) => {
    const r = await svc.deleteAllAuto();
    return res.send(r);
});

export const getCounter = catchAsync(async (_req: AuthRequest, res: Response) => {
    const r = await svc.getCounter();
    return res.send(r);
});

export const getSignupsByDay = catchAsync(async (req: AuthRequest, res: Response) => {
    const days = Math.max(7, Math.min(90, Number(req.query.days) || 14));
    const r = await svc.signupsByDay(days);
    return res.send(r);
});

export const getCommissionSplit = catchAsync(async (_req: AuthRequest, res: Response) => {
    const r = await svc.commissionSplit();
    return res.send(r);
});

export const listAffiliateUsers = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await svc.listAffiliateUsers({
        q: req.query.q as never,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 30
    });
    return res.send(r);
});
