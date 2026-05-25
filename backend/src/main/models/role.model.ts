import mongoose, { Schema, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IRole extends Document {
    /** Slug duy nhất, dùng để tham chiếu (ex: 'administrator', 'moderator', 'cs_support'). */
    slug: string;
    name: string;
    description: string;
    permissions: string[];
    /** Vai trò hệ thống (Owner/Admin) — không thể đổi quyền/đổi tên/xóa. */
    isSystem: boolean;
    /** Số user đang được gán role này (cập nhật khi list — không phải nguồn chân lý). */
    userCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const RoleSchema = new mongoose.Schema<IRole>(
    {
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        name: { type: String, required: true, trim: true },
        permissions: { type: [String], default: [] },
        description: { type: String, default: '' },
        isSystem: { type: Boolean, default: false }
    },
    { timestamps: true }
);

RoleSchema.plugin(toJSON);
RoleSchema.plugin(paginate);

const RoleModel = mongoose.model<IRole>('roles', RoleSchema);
export default RoleModel;
