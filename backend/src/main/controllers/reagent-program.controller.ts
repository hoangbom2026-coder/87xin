import httpStatus from 'http-status';
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import * as reagentEnrollmentService from '@main/services/reagent-enrollment.service';
import settingService from '@main/services/setting.service';
import { mergeReagentPage } from '@main/constants/reagent-page-defaults';

/** Cấu hình enrollment (không cần đăng nhập) — site đã có mergeReagentPage, endpoint này cho API gọn. */
export const getReagentEnrollmentRules = catchAsync(async (_req: AuthRequest, res: Response) => {
    const doc = await settingService.getSetting();
    const merged = mergeReagentPage(doc?.reagentPage as never);
    return res.send({
        gateActive: merged.enrollment.gateEnabled === true,
        enrollment: merged.enrollment
    });
});

export const getReagentEnrollmentStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const payload = await reagentEnrollmentService.getPublicEnrollmentStatus(req.user ?? null);
    return res.send(payload);
});

export const postReagentJoin = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
    const out = await reagentEnrollmentService.joinReagentProgram(String(req.user._id));
    return res.send(out);
});
