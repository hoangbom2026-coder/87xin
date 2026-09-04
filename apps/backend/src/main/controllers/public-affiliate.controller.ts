import catchAsync from '@utils/catchAsync';
import settingService, { mergeAffiliateProgram } from '@main/services/setting.service';
import { Response } from 'express';
import { Request } from 'express';

export const getMarketingMaterials = catchAsync(async (_req: Request, res: Response) => {
    const setting = await settingService.getSetting();
    const program = mergeAffiliateProgram(setting?.affiliateProgram ?? null);
    res.send({ marketingMaterials: program.marketingMaterials ?? [] });
});
