import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import { purchaseService } from '@main/services/purchase.service';
import { packageService } from '@main/services/package.service';

export const getPackages = catchAsync(async (_req: AuthRequest, res: Response) => {
    const packages = await packageService.getAll();
    return res.send(packages);
});

export const purchasePackage = catchAsync(async (req: AuthRequest, res: Response) => {
    const { packageId } = req.body;
    const userId = String(req.user!._id);
    const result = await purchaseService.purchasePackage(userId, packageId);
    return res.send(result);
});
