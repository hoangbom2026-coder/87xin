import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

/** Ghi nhận thao tác admin (audit append-only). */
export interface IAdminAuditLog extends Document {
    adminUserId: Schema.Types.ObjectId;
    adminUsername: string;
    action: string;
    targetType: string;
    targetId: string;
    details: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAdminAuditLog>(
    {
        adminUserId: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        adminUsername: { type: String, default: '' },
        action: { type: String, required: true },
        targetType: { type: String, default: 'unknown' },
        targetId: { type: String, default: '' },
        details: { type: String, default: '' }
    },
    { timestamps: true }
);

ModelSchema.plugin(toJSON);
ModelSchema.index({ createdAt: -1 });
ModelSchema.index({ adminUserId: 1, createdAt: -1 });

const AdminAuditLogModel = mongoose.model<IAdminAuditLog>('admin_audit_logs', ModelSchema);

export default AdminAuditLogModel;
