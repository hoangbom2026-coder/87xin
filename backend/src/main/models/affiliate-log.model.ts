import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IAffiliateLog extends Document {
    invitorId: Schema.Types.ObjectId;
    childId: Schema.Types.ObjectId;
    referralCode: string;
    betAmount: number;
    commissionAmount: number;
    commissionWager: number;
    totalReferralAmount: number;
    referralAmount: number;
    referralWager: number;
    lastVipLevelAmount: number;
    currency: string;
    /** F-tier level (1 = direct invitor). Documents created before multi-tier support default to 1. */
    level: number;
    /** Snapshot ratio applied at accrual time (used for audit). */
    tierRatio: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAffiliateLog>(
    {
        invitorId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        childId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        referralCode: {
            type: String,
            required: true
        },
        currency: {
            type: String,
            required: true
        },
        betAmount: {
            type: Number,
            default: 0
        },
        commissionAmount: {
            type: Number,
            default: 0
        },
        commissionWager: {
            type: Number,
            default: 0
        },
        totalReferralAmount: {
            type: Number,
            default: 0
        },
        referralAmount: {
            type: Number,
            default: 0
        },
        referralWager: {
            type: Number,
            default: 0
        },
        lastVipLevelAmount: {
            type: Number,
            default: 0
        },
        level: {
            type: Number,
            default: 1,
            min: 1
        },
        tierRatio: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

ModelSchema.plugin(toJSON);
ModelSchema.index({ invitorId: 1, childId: 1, level: 1, referralCode: 1 }, { unique: false });
ModelSchema.index({ invitorId: 1, level: 1 });

const AffiliateLogModel = mongoose.model<IAffiliateLog>('affiliate-logs', ModelSchema);

export default AffiliateLogModel;
