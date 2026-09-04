import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IVipTiers extends Document {
    tiersName: String;
    icon: string;
    order: number;
    levelUpBonus: number;
    weeklyCashback: boolean;
    weeklyCashbackMin: number;
    weeklyCashbackPercent: number;
    monthlyCashback: boolean;
    monthlyCashbackMin: number;
    monthlyCashbackPercent: number;
    noFeeWithdrawal: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IVipTiers>(
    {
        tiersName: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            required: true
        },
        levelUpBonus: {
            type: Number,
            default: 0
        },
        weeklyCashback: {
            type: Boolean,
            default: false
        },
        weeklyCashbackMin: {
            type: Number,
            default: 0
        },
        weeklyCashbackPercent: {
            type: Number,
            default: 0
        },
        monthlyCashback: {
            type: Boolean,
            default: false
        },
        monthlyCashbackMin: {
            type: Number,
            default: 0
        },
        monthlyCashbackPercent: {
            type: Number,
            default: 0
        },
        noFeeWithdrawal: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ tiersName: 1, icon: 1, order: 1, createdAt: 1, updatedAt: 1 });

const VipTiersModel = mongoose.model<IVipTiers>('vip-tierses', ModelSchema);

export default VipTiersModel;
