import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IVipLevelUpBonus extends Document {
    userId: Schema.Types.ObjectId | string;
    claimed: boolean;
    amount: number;
    levelName: string;
    levelXp: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IVipLevelUpBonus>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        claimed: {
            type: Boolean,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        levelXp: {
            type: Number,
            required: true
        },
        levelName: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1, claimed: 1, amount: 1, levelXp: 1, createdAt: 1, updatedAt: 1 });

const VipLevelUpBonusModel = mongoose.model<IVipLevelUpBonus>('vip-levelup-bonuses', ModelSchema);

export default VipLevelUpBonusModel;
