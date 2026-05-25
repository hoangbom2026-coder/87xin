import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import UserModel from '@main/models/user.model';
import adminAuditService from '@main/services/admin-audit.service';

const PROJECTION =
    '_id username email phone role status emailVerified phoneVerified avatar firstName lastName createdAt updatedAt';

/** GET /admin/staff?keyword=&role=&status=&page=&limit= */
export const listStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const keyword = String(req.query.keyword || '').trim();
    const role = String(req.query.role || '').trim();
    const status = String(req.query.status || '').trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

    const cond: Record<string, unknown> = {
        role: { $in: ['admin', 'owner'] }
    };
    if (role && ['admin', 'owner'].includes(role)) cond.role = role;
    if (status && ['active', 'blocked'].includes(status)) cond.status = status;
    if (keyword) {
        const re = new RegExp(keyword, 'i');
        cond.$or = [{ username: re }, { email: re }, { phone: re }];
    }

    const [items, total] = await Promise.all([
        UserModel.find(cond, PROJECTION)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        UserModel.countDocuments(cond)
    ]);
    return res.send({ items, total, page, limit });
});

/** POST /admin/staff */
export const createStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const {
        username,
        email,
        password,
        role = 'admin',
        phone = '',
        firstName = '',
        lastName = ''
    } = req.body as Record<string, string>;

    if (!username || !email || !password) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'username, email, password required');
    }
    if (!['admin', 'owner'].includes(role)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role');
    }
    if (role === 'owner' && req.user.role !== 'owner') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only owner can create owner');
    }
    if (await UserModel.isUsernameTaken(username)) {
        throw new ApiError(httpStatus.CONFLICT, 'Username already taken');
    }
    if (await UserModel.isEmailTaken(email)) {
        throw new ApiError(httpStatus.CONFLICT, 'Email already taken');
    }
    if (password.length < 8) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password too short (min 8)');
    }

    const hashed = await bcrypt.hash(password, 8);
    const created = await UserModel.create([
        {
            username: username.toLowerCase().replace(/\s+/g, ''),
            email: email.toLowerCase().trim(),
            phone,
            firstName,
            lastName,
            password: hashed,
            role,
            status: 'active',
            emailVerified: true,
            country: { code: 'VN', name: 'Vietnam' }
        }
    ] as never);
    const user = (Array.isArray(created) ? created[0] : created) as { _id: unknown; toObject: () => Record<string, unknown> };

    await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'STAFF_CREATE',
        targetType: 'user',
        targetId: String(user._id),
        details: JSON.stringify({ username, role })
    });

    const obj = user.toObject();
    delete obj.password;
    return res.status(httpStatus.CREATED).send(obj);
});

/** PATCH /admin/staff/:id */
export const updateStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    const { role, status, email, phone, firstName, lastName } = req.body as Record<string, string>;
    const target = await UserModel.findById(id);
    if (!target || !['admin', 'owner'].includes(target.role)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');
    }
    if (String(target._id) === String(req.user._id) && role && role !== target.role) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change your own role');
    }
    if (role && !['admin', 'owner', 'user'].includes(role)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role');
    }
    if ((role === 'owner' || target.role === 'owner') && req.user.role !== 'owner') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only owner can promote/demote owner');
    }

    const update: Record<string, unknown> = {};
    if (role) update.role = role;
    if (status && ['active', 'blocked'].includes(status)) update.status = status;
    if (email) update.email = email.toLowerCase().trim();
    if (phone !== undefined) update.phone = phone;
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;

    const updated = await UserModel.findByIdAndUpdate(id, update, { new: true, projection: PROJECTION });
    await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'STAFF_UPDATE',
        targetType: 'user',
        targetId: String(id),
        details: JSON.stringify(update)
    });
    return res.send(updated);
});

/** PATCH /admin/staff/:id/password — đặt MK admin (chỉ owner hoặc admin chính chủ) */
export const resetStaffPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    const { password } = req.body as { password: string };
    if (!password || password.length < 8) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password too short (min 8)');
    }
    const target = await UserModel.findById(id);
    if (!target || !['admin', 'owner'].includes(target.role)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');
    }
    if (target.role === 'owner' && req.user.role !== 'owner' && String(target._id) !== String(req.user._id)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only owner can reset another owner password');
    }
    const hashed = await bcrypt.hash(password, 8);
    await UserModel.findByIdAndUpdate(id, { password: hashed });
    await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'STAFF_RESET_PASSWORD',
        targetType: 'user',
        targetId: String(id)
    });
    return res.send({ ok: true });
});

/** DELETE /admin/staff/:id — chuyển role về 'user' (soft remove staff). */
export const removeStaff = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    if (String(id) === String(req.user._id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot remove yourself');
    }
    const target = await UserModel.findById(id);
    if (!target || !['admin', 'owner'].includes(target.role)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');
    }
    if (target.role === 'owner' && req.user.role !== 'owner') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only owner can remove owner');
    }
    await UserModel.findByIdAndUpdate(id, { role: 'user' });
    await adminAuditService.logAdminAction({
        adminUserId: String(req.user._id),
        adminUsername: String(req.user.username ?? ''),
        action: 'STAFF_DEMOTE',
        targetType: 'user',
        targetId: String(id)
    });
    return res.send({ ok: true });
});
