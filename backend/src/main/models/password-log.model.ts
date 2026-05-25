import mongoose, { Document, Schema } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface IPasswordLog extends Document {
    userId: Schema.Types.ObjectId;
    actorId: Schema.Types.ObjectId;
    ip: string;
    userAgent: string;
    device: string;
    os: string;
    browser: string;
    country: {
        code: string;
        name: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const ModelSchema = new mongoose.Schema<IPasswordLog>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        ip: {
            type: String,
            default: ''
        },
        userAgent: {
            type: String,
            required: true
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
        }
    },
    { timestamps: true }
);

ModelSchema.index({ userId: 1, actorId: 1, ip: 1, device: 1, createdAt: 1, updatedAt: 1 });
ModelSchema.plugin(toJSON);

const PasswordLogModel = mongoose.model<IPasswordLog>('password-logs', ModelSchema);

export default PasswordLogModel;
