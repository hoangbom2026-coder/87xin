/**
 * Admin: chương trình VIP — thống kê tổng quan + danh sách user theo level
 * + Dynamic config cấu hình 10 cấp VIP (mốc cược, thưởng, hoàn trả).
 */
import httpStatus from 'http-status';
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import UserModel from '@main/models/user.model';
import VipTiersModel from '@main/models/vip-tiers.model';
import vipTiersConfigService from '@main/services/vip-tiers-config.service';
import type { IVipTier } from '@main/constants/vip-tiers-defaults';

const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

/** Tổng quan VIP: số bậc, phân bố user theo bậc, top XP. */
export const getStats = catchAsync(async (_req: AuthRequest, res: Response) => {
    const [tiersCount, totalUsers, distribution, topByXp] = await Promise.all([
        VipTiersModel.countDocuments({}),
        UserModel.countDocuments({}),
        UserModel.aggregate([
            { $group: { _id: { $ifNull: ['$vipLevel', 0] }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]),
        UserModel.find()
            .sort({ vipXp: -1 })
            .limit(10)
            .select('username email vipXp vipLevel')
            .lean()
    ]);

    return res.send({
        tiersCount,
        totalUsers,
        distribution,
        topByXp
    });
});

/** Danh sách user theo level VIP — có filter level, search username/email. */
export const listVipUsers = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, num(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, num(req.query.limit, 20)));
    const level = req.query.level !== undefined && req.query.level !== '' ? num(req.query.level, -1) : -1;
    const q = String(req.query.q ?? '').trim();

    const cond: Record<string, unknown> = {};
    if (level >= 0) cond.vipLevel = level;
    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        cond.$or = [{ username: rx }, { email: rx }];
    }

    const [items, total] = await Promise.all([
        UserModel.find(cond)
            .sort({ vipLevel: -1, vipXp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('username email vipLevel vipXp createdAt')
            .lean(),
        UserModel.countDocuments(cond)
    ]);

    return res.send({ items, total, page, limit });
});

/** GET /api/admin/vip/tiers — đọc Dynamic Config 10 cấp VIP. */
export const getVipTiersConfig = catchAsync(async (_req: AuthRequest, res: Response) => {
    const value = await vipTiersConfigService.getVipTiers(true);
    return res.send({ value, defaults: vipTiersConfigService.DEFAULT_VIP_TIERS });
});

/** POST /api/admin/vip/tiers — cập nhật 10 cấp VIP + audit log + bust cache. */
export const updateVipTiersConfig = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.user || !['admin', 'owner'].includes(String(req.user.role))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    const raw = req.body?.value ?? req.body?.tiers ?? req.body;
    if (!Array.isArray(raw)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Body must contain `value` array');
    }
    const value = await vipTiersConfigService.updateVipTiers({
        adminUserId: String(req.user._id ?? req.user.id ?? ''),
        adminUsername: String(req.user.username ?? req.user.email ?? 'admin'),
        input: raw as Partial<IVipTier>[]
    });
    return res.send({ success: true, message: 'Cập nhật VIP Tiers thành công!', value });
});

/** POST /api/admin/vip/users/:id/set-level — set thủ công cấp VIP cho user (quà tặng / đại lý lớn). */
export const setUserVipLevel = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.user || !['admin', 'owner'].includes(String(req.user.role))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    const userId = String((req.params as any).id || '');
    const level = Math.floor(Number(req.body?.level));
    if (!userId || !Number.isFinite(level) || level < 0 || level > 10) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid userId or level (0..10)');
    }
    const updated = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { vipLevel: level } },
        { new: true }
    ).select('username email vipLevel vipXp');
    if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    return res.send({ success: true, user: updated });
});
