/**
 * Admin: chương trình VIP — thống kê tổng quan + danh sách user theo level
 * + set thủ công cấp VIP. Toàn bộ query logic (countDocuments, aggregate, find)
 * nằm ở service; controller chỉ giữ HTTP layer.
 */
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import UserModel from '@main/models/user.model';
import VipTiersModel from '@main/models/vip-tiers.model';

const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

/** Tổng quan VIP: số bậc, phân bố user theo bậc, top XP. */
export const getStats = async (): Promise<{
    tiersCount: number;
    totalUsers: number;
    distribution: { _id: number; count: number }[];
    topByXp: Record<string, unknown>[];
}> => {
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

    return { tiersCount, totalUsers, distribution, topByXp };
};

/** Danh sách user theo level VIP — có filter level, search username/email. */
export const listVipUsers = async (query: {
    page?: unknown;
    limit?: unknown;
    level?: unknown;
    q?: unknown;
}): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
}> => {
    const page = Math.max(1, num(query.page, 1));
    const limit = Math.min(100, Math.max(1, num(query.limit, 20)));
    const level =
        query.level !== undefined && query.level !== '' ? num(query.level, -1) : -1;
    const q = String(query.q ?? '').trim();

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

    return { items, total, page, limit };
};

/** Set thủ công cấp VIP cho user (quà tặng / đại lý lớn). */
export const setUserVipLevel = async (
    userId: string,
    rawLevel: unknown
): Promise<Record<string, unknown>> => {
    const level = Math.floor(Number(rawLevel));
    if (!userId || !Number.isFinite(level) || level < 0 || level > 10) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid userId or level (0..10)');
    }
    const updated = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { vipLevel: level } },
        { new: true }
    ).select('username email vipLevel vipXp').lean();
    if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    return updated;
};

export default {
    getStats,
    listVipUsers,
    setUserVipLevel
};