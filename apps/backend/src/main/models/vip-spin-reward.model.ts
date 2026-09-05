import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IVipSpinReward extends Document {
    userId: Schema.Types.ObjectId | string;
    amount: number;
    claimed: boolean;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IVipSpinReward>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        claimed: {
            type: Boolean,
            default: false
        },
        currency: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1, amount: 1, currency: 1 });

const VipSpinRewardModel = mongoose.model<IVipSpinReward>('vip-spin-rewards', ModelSchema);

export default VipSpinRewardModel;
