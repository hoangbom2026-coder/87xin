import httpStatus from 'http-status';
import { NextFunction, Response } from 'express';

import ApiError from '@utils/ApiError';
import { AuthRequest } from './auth';

const ADMIN_ROLES = new Set(['admin', 'owner', 'superadmin', 'manager', 'staff']);

/** Chỉ user đăng nhập có role admin | owner (session giống người chơi). */
export default function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    if (!ADMIN_ROLES.has(req.user.role)) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Admin access required'));
    }
    return next();
}
