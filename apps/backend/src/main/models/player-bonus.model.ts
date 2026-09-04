import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IPlayerBonus extends Document {
    userId: Schema.Types.ObjectId;
    bonusId: Schema.Types.ObjectId;
    amount: number;
    betsIds: string[];
    processAmount: number;
    goalAmount: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IPlayerBonus>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        bonusId: {
            type: Schema.Types.ObjectId,
            ref: 'bonuses',
            required: true
        },
        betsIds: {
            type: [String],
            default: []
        },
        amount: {
            type: Number,
            default: 0
        },
        processAmount: {
            type: Number,
            default: 0
        },
        goalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            default: 'pending'
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ status: 1, userId: 1, bonusId: 1, processAmount: 1, goalAmount: 1, createdAt: 1, updatedAt: 1 });

const PlayerBonusModel = mongoose.model<IPlayerBonus>('player-bonuses', ModelSchema);

export default PlayerBonusModel;
