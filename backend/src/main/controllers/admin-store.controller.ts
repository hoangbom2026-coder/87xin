/**
 * Admin: cửa hàng (Store) — quản lý gói (PackageModel) và đơn mua (transaction provider=store).
 * Tách biệt với chương trình Đại lý/Affiliate/VIP để tránh nhầm dữ liệu.
 */
import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import { PackageModel } from '@main/models/packages.model';
import TransactionModel from '@main/models/transaction.model';

const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

/** Tổng quan store: số gói, doanh thu, đơn 7 ngày. */
export const getStats = catchAsync(async (_req: AuthRequest, res: Response) => {
    const [totalPkgs, activePkgs, allTimeAgg, last7Agg] = await Promise.all([
        PackageModel.countDocuments({}),
        PackageModel.countDocuments({ status: 'active' }),
        TransactionModel.aggregate([
            { $match: { provider: 'store', type: 'purchase' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        TransactionModel.aggregate([
            {
                $match: {
                    provider: 'store',
                    type: 'purchase',
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
    ]);

    return res.send({
        totalPackages: totalPkgs,
        activePackages: activePkgs,
        revenueAllTime: allTimeAgg[0]?.total ?? 0,
        ordersAllTime: allTimeAgg[0]?.count ?? 0,
        revenue7d: last7Agg[0]?.total ?? 0,
        orders7d: last7Agg[0]?.count ?? 0
    });
});

/** Danh sách gói (admin xem đầy đủ, kể cả inactive). */
export const listPackages = catchAsync(async (_req: AuthRequest, res: Response) => {
    const page = Math.max(1, num(_req.query.page, 1));
    const limit = Math.min(200, Math.max(1, num(_req.query.limit, 100)));
    const [items, total] = await Promise.all([
        PackageModel.find().sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        PackageModel.countDocuments({})
    ]);
    return res.send({ items, total, page, limit });
});

export const createPackage = catchAsync(async (req: AuthRequest, res: Response) => {
    const created = await PackageModel.create(req.body);
    return res.status(httpStatus.CREATED).send(created);
});

export const updatePackage = catchAsync(async (req: AuthRequest, res: Response) => {
    const updated = await PackageModel.findByIdAndUpdate((req.params as any).id, req.body, { new: true });
    if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'Package not found');
    return res.send(updated);
});

export const deletePackage = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await PackageModel.findByIdAndDelete((req.params as any).id);
    if (!r) throw new ApiError(httpStatus.NOT_FOUND, 'Package not found');
    return res.send({ ok: true });
});

/** Lịch sử đơn mua từ store (transactions provider=store, type=purchase). */
export const listOrders = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, num(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, num(req.query.limit, 20)));
    const userId = String(req.query.userId ?? '');
    const cond: Record<string, unknown> = { provider: 'store', type: 'purchase' };
    if (userId) cond.userId = userId;

    const [items, total] = await Promise.all([
        TransactionModel.find(cond)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        TransactionModel.countDocuments(cond)
    ]);

    return res.send({ items, total, page, limit });
});
