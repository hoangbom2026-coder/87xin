import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IBalance extends Document {
    userId: Schema.Types.ObjectId | string;
    currencyId: Schema.Types.ObjectId | string;
    amount: number;
    pending: number;
    bonus: number;
    withdrawable: number;
    turnover: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IBalance>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        currencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'currencies',
            required: true
        },
        amount: {
            type: Number,
            default: 0
        },
        pending: {
            type: Number,
            default: 0
        },
        bonus: {
            type: Number,
            default: 0
        },
        withdrawable: {
            type: Number,
            default: 0
        },
        turnover: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1, currencyId: 1, amount: 1, createdAt: 1, updatedAt: 1 });

const BalanceModel = mongoose.model<IBalance>('balances', ModelSchema);

export default BalanceModel;
