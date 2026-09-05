/**
 * Admin: cửa hàng (Store) — quản lý gói (PackageModel) và đơn mua (transaction provider=store).
 * Tách biệt với chương trình Đại lý/Affiliate/VIP để tránh nhầm dữ liệu.
 * HTTP layer only — mọi query logic ở store-admin.service.
 */
import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import {
    getStoreStats,
    listStorePackages,
    createStorePackage,
    updateStorePackage,
    deleteStorePackage,
    listStoreOrders
} from '@main/services/store-admin.service';

const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

/** Tổng quan store: số gói, doanh thu, đơn 7 ngày. */
export const getStats = catchAsync(async (_req: AuthRequest, res: Response) => {
    return res.send(await getStoreStats());
});

/** Danh sách gói (admin xem đầy đủ, kể cả inactive). */
export const listPackages = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, num(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, num(req.query.limit, 100)));
    return res.send(await listStorePackages(page, limit));
});

export const createPackage = catchAsync(async (req: AuthRequest, res: Response) => {
    const created = await createStorePackage(req.body);
    return res.status(httpStatus.CREATED).send(created);
});

export const updatePackage = catchAsync(async (req: AuthRequest, res: Response) => {
    const updated = await updateStorePackage((req.params as any).id, req.body);
    if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'Package not found');
    return res.send(updated);
});

export const deletePackage = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await deleteStorePackage((req.params as any).id);
    if (!r) throw new ApiError(httpStatus.NOT_FOUND, 'Package not found');
    return res.send({ ok: true });
});

/** Lịch sử đơn mua từ store (transactions provider=store, type=purchase). */
export const listOrders = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, num(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, num(req.query.limit, 20)));
    const userId = String(req.query.userId ?? '');
    return res.send(await listStoreOrders(page, limit, userId));
});