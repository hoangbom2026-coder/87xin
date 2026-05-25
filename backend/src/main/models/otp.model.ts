import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IOtp extends Document {
    userId: Schema.Types.ObjectId;
    code: string;
    type: string;
    data: string;
    isExpired: boolean;
    expireTime: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IOtp>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        code: {
            type: String,
            required: true,
            private: true
        },
        type: {
            type: String,
            required: true
        },
        data: {
            type: String,
            required: true
        },
        isExpired: {
            type: Boolean,
            default: false
        },
        expireTime: {
            type: Date,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1, code: 1, type: 1, expireTime: 1, isExpired: 1 });

const OtpModel = mongoose.model<IOtp>('otps', ModelSchema);

export default OtpModel;
