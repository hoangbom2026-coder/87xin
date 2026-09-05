import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import * as adminStaffService from '@main/services/admin-staff.service';

function buildActor(req: AuthRequest) {
    return {
        id: String(req.user?.id || ''),
        username: req.user?.username,
        role: req.user?.role || '',
        ip: req.ip
    };
}

/** GET /admin/staff?keyword=&role=&status=&page=&limit= */
export const listStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await adminStaffService.listStaff({
        keyword: req.query.keyword as string,
        role: req.query.role as string,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50
    });
    return res.send(result);
});

/** POST /admin/staff */
export const createStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const staff = await adminStaffService.createStaff(req.body || {}, buildActor(req));
    return res.status(201).send(staff);
});

/** PATCH /admin/staff/:id */
export const updateStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const staff = await adminStaffService.updateStaff(id, req.body || {}, buildActor(req));
    return res.send(staff);
});

/** PATCH /admin/staff/:id/password */
export const resetStaffPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { newPassword } = req.body || {};
    await adminStaffService.resetStaffPassword(id, newPassword, buildActor(req));
    return res.send({ success: true, message: 'Password updated' });
});

/** DELETE /admin/staff/:id */
export const removeStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await adminStaffService.removeStaff(id, buildActor(req));
    return res.send({ success: true, message: 'Staff role removed' });
});
