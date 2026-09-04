import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import adminAuditService from '@main/services/admin-audit.service';

export const listAuditLogs = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 100));
    const rows = await adminAuditService.listRecentAuditLogs(page * limit);
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);
    return res.send({ items, total: rows.length, page, limit });
});
