import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IReferralCode extends Document {
    userId: Schema.Types.ObjectId | string;
    code: string;
    name: string;
    commissionRate: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IReferralCode>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        code: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            default: ''
        },
        commissionRate: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);

const ReferralCodeModel = mongoose.model<IReferralCode>('referral-codes', ModelSchema);

export default ReferralCodeModel;
