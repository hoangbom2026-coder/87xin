/**
 * Admin: chương trình VIP — HTTP layer thuần. Toàn bộ query logic (countDocuments,
 * aggregate, find, findByIdAndUpdate) nằm ở admin-vip.service.ts.
 */
import httpStatus from 'http-status';
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import vipTiersConfigService from '@main/services/vip-tiers-config.service';
import adminVipService from '@main/services/admin-vip.service';
import type { IVipTier } from '@main/constants/vip-tiers-defaults';

/** Tổng quan VIP: số bậc, phân bố user theo bậc, top XP. */
export const getStats = catchAsync(async (_req: AuthRequest, res: Response) => {
    const result = await adminVipService.getStats();
    return res.send(result);
});

/** Danh sách user theo level VIP — có filter level, search username/email. */
export const listVipUsers = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await adminVipService.listVipUsers({
        page: req.query.page,
        limit: req.query.limit,
        level: req.query.level,
        q: req.query.q
    });
    return res.send(result);
});

/** GET /api/admin/vip/tiers — đọc Dynamic Config 10 cấp VIP. */
export const getVipTiersConfig = catchAsync(async (_req: AuthRequest, res: Response) => {
    const value = await vipTiersConfigService.getVipTiers(true);
    return res.send({ value, defaults: vipTiersConfigService.DEFAULT_VIP_TIERS });
});

/** POST /api/admin/vip/tiers — cập nhật 10 cấp VIP + audit log + bust cache. */
export const updateVipTiersConfig = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.user || !['admin', 'owner'].includes(String(req.user!.role))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    const raw = req.body?.value ?? req.body?.tiers ?? req.body;
    if (!Array.isArray(raw)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Body must contain `value` array');
    }
    const value = await vipTiersConfigService.updateVipTiers({
        adminUserId: String(req.user!._id ?? req.user!.id ?? ''),
        adminUsername: String(req.user!.username ?? req.user!.email ?? 'admin'),
        input: raw as Partial<IVipTier>[]
    });
    return res.send({ success: true, message: 'Cập nhật VIP Tiers thành công!', value });
});

/** POST /api/admin/vip/users/:id/set-level — set thủ công cấp VIP cho user (quà tặng / đại lý lớn). */
export const setUserVipLevel = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.user || !['admin', 'owner'].includes(String(req.user!.role))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    const userId = String((req.params as any).id || '');
    const updated = await adminVipService.setUserVipLevel(userId, req.body?.level);
    return res.send({ success: true, user: updated });
});