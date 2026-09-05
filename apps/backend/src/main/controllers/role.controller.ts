import httpStatus from 'http-status';
import { Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import * as roleService from '@main/services/role.service';

/** GET /role/permissions — catalog quyền theo nhóm để FE render checkbox. */
export const getPermissionCatalog = catchAsync(async (_req: AuthRequest, res: Response) => {
    return res.send(roleService.getPermissionCatalog());
});

export const getRoles = catchAsync(async (_req: AuthRequest, res: Response) => {
    await roleService.seedSystemRoles();
    const roles = await roleService.listRoles();
    return res.send(roles);
});

export const getRole = catchAsync(async (req: AuthRequest, res: Response) => {
    const role = await roleService.getRoleById((req.params as any).roleId);
    if (!role) throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    return res.send(role);
});

export const createRole = catchAsync(async (req: AuthRequest, res: Response) => {
    const role = await roleService.createRole(req.body || {});
    return res.status(httpStatus.CREATED).send(role);
});

export const updateRole = catchAsync(async (req: AuthRequest, res: Response) => {
    const role = await roleService.updateRole((req.params as any).roleId, req.body || {});
    return res.send(role);
});

export const deleteRole = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await roleService.deleteRole((req.params as any).roleId);
    return res.send(result);
});
