import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IKyc extends Document {
    userId: Schema.Types.ObjectId | string;
    frontImg: string;
    backImg: string;
    type: string;
    status: string;
    reason: string;
    country: {
        code: string;
        name: string;
    };
    actionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IKyc>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        frontImg: {
            type: String,
            required: true
        },
        backImg: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        reason: {
            type: String,
            default: ''
        },
        country: {
            code: {
                type: String
            },
            name: {
                type: String
            }
        },
        actionDate: {
            type: Date
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1, createdAt: 1, updatedAt: 1 });

const KycModel = mongoose.model<IKyc>('kycs', ModelSchema);

export default KycModel;
