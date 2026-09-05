import httpStatus from 'http-status';
import { Request, Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';

const PROMOTIONS: any[] = [];

/** GET /promotion — danh sách promotion đang active */
export const getActivePromotions = catchAsync(async (_req: Request, res: Response) => {
    const active = PROMOTIONS.filter((p) => p.status === 'active');
    return res.send(active);
});

/** GET /promotion/categories — danh sách categories */
export const getCategories = catchAsync(async (_req: Request, res: Response) => {
    return res.send(['welcome', 'deposit', 'vip', 'seasonal']);
});

/** GET /promotion/slug/:slug — chi tiết promotion theo slug */
export const getPromotionBySlug = catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const promo = PROMOTIONS.find((p) => p.slug === slug);
    if (!promo) throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
    return res.send(promo);
});

/** GET /promotion/admin — danh sách admin */
export const adminList = catchAsync(async (_req: AuthRequest, res: Response) => {
    return res.send(PROMOTIONS);
});

/** GET /promotion/all — toàn bộ */
export const getPromotionList = catchAsync(async (_req: AuthRequest, res: Response) => {
    return res.send(PROMOTIONS);
});

/** POST /promotion — tạo mới */
export const createPromotion = catchAsync(async (req: AuthRequest, res: Response) => {
    const promo = { _id: `p${Date.now()}`, ...req.body, status: req.body.status || 'active' };
    PROMOTIONS.push(promo);
    return res.status(httpStatus.CREATED).send(promo);
});

/** PATCH /promotion/:promotionId — cập nhật */
export const updatePromotion = catchAsync(async (req: AuthRequest, res: Response) => {
    const { promotionId } = req.params;
    const idx = PROMOTIONS.findIndex((p) => p._id === promotionId);
    if (idx === -1) throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
    PROMOTIONS[idx] = { ...PROMOTIONS[idx], ...req.body };
    return res.send(PROMOTIONS[idx]);
});

/** DELETE /promotion/:promotionId — xóa */
export const deletePromotion = catchAsync(async (req: AuthRequest, res: Response) => {
    const { promotionId } = req.params;
    const idx = PROMOTIONS.findIndex((p) => p._id === promotionId);
    if (idx === -1) throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
    PROMOTIONS.splice(idx, 1);
    return res.send({ success: true, message: 'Deleted' });
});