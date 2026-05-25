import express, { Request, Response } from 'express';
import catchAsync from '@utils/catchAsync';
import vipTiersConfigService from '@main/services/vip-tiers-config.service';

const router = express.Router();

/** GET /api/vip-tiers-config — public, frontend1 fetch để render trang VIP. */
router.get(
    '/',
    catchAsync(async (_req: Request, res: Response) => {
        const value = await vipTiersConfigService.getVipTiers();
        return res.send({ value });
    })
);

export default router;
