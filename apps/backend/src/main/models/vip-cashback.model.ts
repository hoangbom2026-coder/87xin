import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IVipCashback extends Document {
    userId: Schema.Types.ObjectId | string;
    amount: number;
    tiersName: string;
    claimed: boolean;
    currency: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IVipCashback>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        tiersName: {
            type: String,
            required: true
        },
        claimed: {
            type: Boolean,
            default: false
        },
        currency: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1, amount: 1, currency: 1, type: 1 });

const VipCashbackModel = mongoose.model<IVipCashback>('vip-cashbacks', ModelSchema);

export default VipCashbackModel;
