import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import BannerService from '@main/services/banner.service';

function parseBool(v: unknown): boolean {
    return v === true || v === 'true' || v === 1 || v === '1';
}

export const getBannerList = catchAsync(async (req: AuthRequest, res: Response) => {
    const banners = await BannerService.getBannerList();
    return res.send(banners);
});

export const getBanners = catchAsync(async (req: AuthRequest, res: Response) => {
    const banners = await BannerService.getBanners();
    return res.send(banners);
});

export const createBanner = catchAsync(async (req: AuthRequest, res: Response) => {
    const { order, status, link } = req.body;
    const image = req.file?.filename || req.body.image;
    
    if (!image) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Thiếu ảnh: upload file hoặc nhập URL');
    }

    const banner = await BannerService.createBanner({
        image,
        order: Number(order || 0),
        status: parseBool(status),
        link: link || ''
    });
    return res.status(httpStatus.CREATED).send(banner);
});

export const updateBanner = catchAsync(async (req: AuthRequest, res: Response) => {
    const { bannerId } = (req.params as any);
    const data: Record<string, unknown> = {};
    if (typeof req.body.order !== 'undefined') {
        data.order = Number(req.body.order);
    }
    if (typeof req.body.status !== 'undefined') {
        data.status = parseBool(req.body.status);
    }
    if (req.file?.filename) {
        data.image = req.file.filename;
    } else if (typeof req.body.image === 'string' && req.body.image.trim()) {
        data.image = req.body.image.trim();
    }
    if (typeof req.body.link === 'string') {
        data.link = req.body.link.trim().substring(0, 2048);
    }
    const banner = await BannerService.patchUpdate({ _id: bannerId }, data);
    return res.send(banner);
});

export const deleteBanner = catchAsync(async (req: AuthRequest, res: Response) => {
    const { bannerId } = (req.params as any);
    const banner = await BannerService.deleteBannerById(bannerId);
    if (!banner?.deletedCount) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Banner not found');
    }
    return res.status(httpStatus.NO_CONTENT).send();
});
