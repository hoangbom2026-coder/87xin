/**
 * Admin Dynamic Config — Game Menu (dải icon ngang trang Home / CategoryTabs).
 * - GET   /admin/game-menu        → cấu hình hiện hành.
 * - POST  /admin/game-menu        → ghi đè toàn bộ array (atomic).
 * - POST  /admin/game-menu/upload → upload 1 file ảnh icon, trả URL.
 */
import httpStatus from 'http-status';
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import gameMenuService from '@main/services/game-menu.service';
import type { IGameMenuItem } from '@main/constants/game-menu-defaults';

export const getGameMenuConfig = catchAsync(async (_req: AuthRequest, res: Response) => {
    const items = await gameMenuService.getGameMenu(true);
    return res.send({ items });
});

export const updateGameMenuConfig = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin only');
    }
    const items = req.body?.items as Partial<IGameMenuItem>[];
    if (!Array.isArray(items)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'items[] required');
    }
    const saved = await gameMenuService.updateGameMenu({
        adminUserId: String(req.user._id),
        adminUsername: req.user.username,
        input: items
    });
    return res.send({ items: saved });
});

/** Trả về URL public của ảnh icon vừa upload (multer field `gameIcon`). */
export const uploadGameIconAsset = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Admin only');
    }
    if (!req.file?.filename) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'File required');
    }
    const url = `/game-icons/${req.file.filename}`;
    return res.send({ filename: req.file.filename, url });
});
