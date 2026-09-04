import AdminAuditLogModel from '@main/models/admin-audit-log.model';

export async function logAdminAction(params: {
    adminUserId: string;
    adminUsername: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: string;
}): Promise<void> {
    try {
        await AdminAuditLogModel.create({
            adminUserId: params.adminUserId,
            adminUsername: params.adminUsername,
            action: params.action,
            targetType: params.targetType ?? 'unknown',
            targetId: params.targetId ?? '',
            details: params.details ?? ''
        });
    } catch {
        /* không chặn luồng chính nếu log lỗi */
    }
}

export async function listRecentAuditLogs(limit = 100) {
    const n = Math.min(500, Math.max(1, Math.floor(limit)));
    return AdminAuditLogModel.find()
        .sort({ createdAt: -1 })
        .limit(n)
        .lean()
        .exec();
}

export default {
    logAdminAction,
    listRecentAuditLogs
};
