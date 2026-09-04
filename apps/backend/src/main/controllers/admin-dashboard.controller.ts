import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import adminDashboardService from '@main/services/admin-dashboard.service';

export const getAdminDashboard = catchAsync(async (req: AuthRequest, res: Response) => {
    const days = req.query.days != null ? Number(req.query.days) : 14;
    const data = await adminDashboardService.getAdminDashboardOverview(days);
    return res.send(data);
});
