import mongoose, { Schema, Document } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface IPasswordReset extends Document {
    userId: Schema.Types.ObjectId | string;
    token: string;
    /** Mã ngắn 6 chữ số (OTP), có thể dùng song song với token. */
    otp: string;
    expiresAt: Date;
    used: boolean;
    requestIp: string;
    createdAt: Date;
    updatedAt: Date;
}

const ResetSchema = new mongoose.Schema<IPasswordReset>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
        token: { type: String, required: true, unique: true, index: true, private: true },
        otp: { type: String, default: '', private: true },
        expiresAt: { type: Date, required: true, index: true },
        used: { type: Boolean, default: false },
        requestIp: { type: String, default: '' }
    },
    { timestamps: true }
);

ResetSchema.plugin(toJSON);
// Auto cleanup hết hạn sau 24h.
ResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetModel = mongoose.model<IPasswordReset>('password-resets', ResetSchema);
export default PasswordResetModel;
