import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import * as gameSvc from '@main/services/game-config.service';
import { GAME_CATEGORIES, GAME_KINDS } from '@main/constants/game-catalog';

/** Catalog (categories + kinds) — FE render filter pills. */
export const getCatalog = catchAsync(async (_req: AuthRequest, res: Response) => {
    return res.send({
        categories: GAME_CATEGORIES,
        kinds: GAME_KINDS
    });
});

/** Đếm theo category + kind, dùng cho pill counters. */
export const getCounts = catchAsync(async (_req: AuthRequest, res: Response) => {
    const data = await gameSvc.getCategoryCounts();
    return res.send(data);
});

export const listGames = catchAsync(async (req: AuthRequest, res: Response) => {
    await gameSvc.seedOriginalsIfMissing();
    const r = await gameSvc.listGames({
        category: req.query.category as never,
        kind: req.query.kind as never,
        q: req.query.q as never,
        enabled: req.query.enabled as never,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 60
    });
    return res.send(r);
});

export const createGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const created = await gameSvc.createGame(req.body || {});
    return res.status(httpStatus.CREATED).send(created);
});

export const updateGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await gameSvc.updateGame((req.params as any).id, req.body || {});
    return res.send(r);
});

export const deleteGame = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await gameSvc.deleteGame((req.params as any).id);
    return res.send(r);
});

export const bulkPatchFlags = catchAsync(async (req: AuthRequest, res: Response) => {
    const { ids, flags } = (req.body || {}) as { ids?: string[]; flags?: Record<string, unknown> };
    if (!Array.isArray(ids) || !ids.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'ids required');
    }
    const r = await gameSvc.patchManyFlags(ids, (flags || {}) as never);
    return res.send(r);
});

export const reorderGames = catchAsync(async (req: AuthRequest, res: Response) => {
    const items = (req.body?.items ?? []) as Array<{ id: string; order: number }>;
    const r = await gameSvc.reorderGames(items);
    return res.send(r);
});
