import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IAgLog extends Document {
    playerUniqueId: Schema.Types.ObjectId;
    gameCode: string;
    roundId: string;
    currencyCode: string;
    type: string;
    status: string;
    orderNo: string;
    betAmount: number;
    winAmount: number;
    isEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAgLog>(
    {
        playerUniqueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        gameCode: {
            type: String,
            required: true
        },
        roundId: {
            type: String,
            default: ''
        },
        currencyCode: {
            type: String,
            default: ''
        },
        orderNo: {
            type: String,
            default: ''
        },
        betAmount: {
            type: Number,
            required: true
        },
        winAmount: {
            type: Number,
            default: 0
        },
        type: {
            type: String,
            default: 'BET'
        },
        status: {
            type: String,
            default: 'accept'
        },
        isEnd: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    playerUniqueId: 1,
    gameCode: 1,
    roundId: 1,
    currencyCode: 1,
    orderNo: 1,
    betAmount: 1,
    winAmount: 1,
    type: 1,
    status: 1
});

const AgLogModel = mongoose.model<IAgLog>('ag-logs', ModelSchema);

export default AgLogModel;
