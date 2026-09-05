import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import ApiError from '@utils/ApiError';
import UserModel from '@main/models/user.model';
import adminAuditService from '@main/services/admin-audit.service';

const PROJECTION =
    '_id username email phone role status emailVerified phoneVerified avatar firstName lastName createdAt updatedAt';

const ADMIN_STAFF_ROLES = ['admin', 'owner'];
const VALID_STATUSES = ['active', 'blocked'];
const VALID_ROLES_FOR_CREATE = ['admin', 'owner'];
const VALID_ROLES_FOR_UPDATE = ['admin', 'owner', 'user'];

function actorLog(actor: { id: string; username?: string; role: string; ip?: string }) {
    return { adminUserId: actor.id, adminUsername: actor.username || 'unknown' };
}

/** GET /admin/staff — tìm kiếm danh sách staff. */
export async function listStaff(query: {
    keyword?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    const keyword = String(query.keyword || '').trim();
    const role = String(query.role || '').trim();
    const status = String(query.status || '').trim();
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 50, 1), 200);

    const cond: Record<string, unknown> = {
        role: { $in: ADMIN_STAFF_ROLES }
    };
    if (role && ADMIN_STAFF_ROLES.includes(role)) cond.role = role;
    if (status && VALID_STATUSES.includes(status)) cond.status = status;
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
    return { items, total, page, limit };
}

/** POST /admin/staff — tạo mới staff. */
export async function createStaff(
    data: { username: string; email: string; password: string; phone?: string; firstName?: string; lastName?: string; role?: string },
    actor: { id: string; username?: string; role: string; ip?: string }
) {
    const { username, email, password, phone, firstName, lastName } = data;
    if (!username || !email || !password) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields (username, email, password)');
    }

    if (await UserModel.isUsernameTaken(username)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
    }
    if (await UserModel.isEmailTaken(email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    const role = VALID_ROLES_FOR_CREATE.includes(data.role || '') ? data.role! : 'admin';
    const hashed = await bcrypt.hash(password, 8);
    const [created] = await UserModel.create([{
        username,
        email,
        password: hashed,
        phone: phone || '',
        firstName: firstName || '',
        lastName: lastName || '',
        role,
        status: 'active'
    }]);

    await adminAuditService.logAdminAction({
        ...actorLog(actor),
        action: 'staff.create',
        targetType: 'User',
        targetId: String(created._id),
        details: JSON.stringify({ username, email, role })
    });

    return created;
}

/** PATCH /admin/staff/:id — cập nhật thông tin staff. */
export async function updateStaff(
    targetId: string,
    data: { firstName?: string; lastName?: string; phone?: string; status?: string; role?: string },
    actor: { id: string; username?: string; role: string; ip?: string }
) {
    const target = await UserModel.findById(targetId);
    if (!target) throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');
    if (target.role === 'owner') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot modify owner account');
    }

    const update: Record<string, unknown> = {};
    if (data.firstName !== undefined) update.firstName = data.firstName;
    if (data.lastName !== undefined) update.lastName = data.lastName;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.status && VALID_STATUSES.includes(data.status)) update.status = data.status;
    if (data.role && VALID_ROLES_FOR_UPDATE.includes(data.role)) update.role = data.role;

    const updated = await UserModel.findByIdAndUpdate(targetId, update, { new: true, projection: PROJECTION });

    await adminAuditService.logAdminAction({
        ...actorLog(actor),
        action: 'staff.update',
        targetType: 'User',
        targetId,
        details: JSON.stringify(update)
    });

    return updated;
}

/** PATCH /admin/staff/:id/password — đặt lại mật khẩu staff. */
export async function resetStaffPassword(
    targetId: string,
    newPassword: string,
    actor: { id: string; username?: string; role: string; ip?: string }
) {
    if (!newPassword || newPassword.length < 6) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password must be at least 6 characters');
    }

    const target = await UserModel.findById(targetId);
    if (!target) throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');

    const hashed = await bcrypt.hash(newPassword, 8);
    await UserModel.findByIdAndUpdate(targetId, { password: hashed });

    await adminAuditService.logAdminAction({
        ...actorLog(actor),
        action: 'staff.password_reset',
        targetType: 'User',
        targetId,
        details: 'Password reset'
    });
}

/** DELETE /admin/staff/:id — chuyển role staff về user. */
export async function removeStaff(
    targetId: string,
    actor: { id: string; username?: string; role: string; ip?: string }
) {
    const target = await UserModel.findById(targetId);
    if (!target) throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');

    await UserModel.findByIdAndUpdate(targetId, { role: 'user' });

    await adminAuditService.logAdminAction({
        ...actorLog(actor),
        action: 'staff.remove',
        targetType: 'User',
        targetId,
        details: JSON.stringify({ previousRole: target.role })
    });
}
