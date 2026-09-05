import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthLog extends Document {
    userId: Schema.Types.ObjectId | string;
    ip: string;
    userAgent: string;
    device: string;
    os: string;
    browser: string;
    endReason: string;
    isLive: boolean;
    country: {
        code: string;
        name: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

import { toJSON } from '@utils/model-plugins';

const ModelSchema = new mongoose.Schema<IAuthLog>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        ip: {
            type: String,
            default: ''
        },
        userAgent: {
            type: String,
            required: true
        },
        isLive: {
            type: Boolean,
            default: true
        },
        country: {
            code: {
                type: String
            },
            name: {
                type: String
            }
        },
        device: {
            type: String,
            enum: {
                values: ['desktop', 'mobile', ''],
                message: '{VALUE} status is not supported.'
            },
            required: true
        },
        os: {
            type: String,
            default: 'Unknown'
        },
        browser: {
            type: String,
            default: 'Unknown'
        },
        endReason: { type: String, default: '' }
    },
    { timestamps: true }
);

ModelSchema.index({ userId: 1, ip: 1, device: 1, endReason: 1, createdAt: 1, updatedAt: 1 });
ModelSchema.plugin(toJSON);

const AuthLogModel = mongoose.model<IAuthLog>('auth-logs', ModelSchema);

export default AuthLogModel;
