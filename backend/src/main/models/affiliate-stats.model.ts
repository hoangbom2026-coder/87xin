import mongoose, { Document, Schema } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface IAffiliateStats extends Document {
    userId: Schema.Types.ObjectId;
    todayExpected: number;
    yesterdayFinal: number;
    totalInvited: number;
    validInvited: number;
    unclaimedBalance: number;
    lastCalculated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAffiliateStats>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true,
            unique: true
        },
        todayExpected: {
            type: Number,
            default: 0
        },
        yesterdayFinal: {
            type: Number,
            default: 0
        },
        totalInvited: {
            type: Number,
            default: 0
        },
        validInvited: {
            type: Number,
            default: 0
        },
        unclaimedBalance: {
            type: Number,
            default: 0
        },
        lastCalculated: {
            type: Date
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1 });

const AffiliateStatsModel = mongoose.model<IAffiliateStats>('affiliate_stats', ModelSchema);

export default AffiliateStatsModel;
