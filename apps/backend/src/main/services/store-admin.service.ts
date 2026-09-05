/**
 * Admin: cửa hàng (Store) — service. Toàn bộ query logic (đọc/ghi) cho PackageModel + TransactionModel.
 */
import { PackageModel } from '@main/models/packages.model';
import TransactionModel from '@main/models/transaction.model';

const WEEK_MS = 7 * 24 * 3600 * 1000;

/** Tổng quan store: số gói, doanh thu, đơn 7 ngày. */
export async function getStoreStats() {
    const [totalPackages, activePackages, allTimeAgg, last7Agg] = await Promise.all([
        PackageModel.countDocuments({}),
        PackageModel.countDocuments({ status: 'active' }),
        TransactionModel.aggregate([
            { $match: { provider: 'store', type: 'purchase' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        TransactionModel.aggregate([
            { $match: { provider: 'store', type: 'purchase', createdAt: { $gte: new Date(Date.now() - WEEK_MS) } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
    ]);

    return {
        totalPackages,
        activePackages,
        revenueAllTime: allTimeAgg[0]?.total ?? 0,
        ordersAllTime: allTimeAgg[0]?.count ?? 0,
        revenue7d: last7Agg[0]?.total ?? 0,
        orders7d: last7Agg[0]?.count ?? 0
    };
}

/** Danh sách gói (admin xem đầy đủ, kể cả inactive). */
export async function listStorePackages(page: number, limit: number) {
    const [items, total] = await Promise.all([
        PackageModel.find()
            .sort({ order: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        PackageModel.countDocuments({})
    ]);
    return { items, total, page, limit };
}

export async function createStorePackage(body: Record<string, unknown>) {
    return PackageModel.create(body);
}

export async function updateStorePackage(id: string, body: Record<string, unknown>) {
    return PackageModel.findByIdAndUpdate(id, body, { new: true });
}

export async function deleteStorePackage(id: string) {
    return PackageModel.findByIdAndDelete(id);
}

/** Lịch sử đơn mua từ store (transactions provider=store, type=purchase). */
export async function listStoreOrders(page: number, limit: number, userId: string) {
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
    return { items, total, page, limit };
}