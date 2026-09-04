import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';
import { TRANSACTION_CATEGORY, TRANSACTION_TYPE } from '@config/static';

export interface ITransaction extends Document {
    userId: Schema.Types.ObjectId;
    relatedId: string;
    tnxId: string;
    amount: number;
    beforeAmount: number;
    afterAmount: number;
    currencyName: string;
    type: string;
    typeDescription: string;
    gameName: string;
    gameId: string;
    path: string[];
    category: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<ITransaction>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        relatedId: {
            type: String
        },
        tnxId: {
            type: String,
            default: ''
        },
        amount: {
            type: Number,
            required: true
        },
        beforeAmount: {
            type: Number,
            required: true
        },
        afterAmount: {
            type: Number,
            required: true
        },
        currencyName: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: {
                values: TRANSACTION_TYPE,
                message: '{VALUE} status is not supported.'
            },
            required: true
        },
        typeDescription: {
            type: String,
            default: ''
        },
        gameName: {
            type: String,
            default: ''
        },
        gameId: {
            type: String,
            default: ''
        },
        provider: {
            type: String,
            default: ''
        },
        category: {
            type: String,
            default: ''
        },
        path: {
            type: [String]
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    tnxId: 1,
    userId: 1,
    currencyName: 1,
    type: 1,
    amount: 1,
    beforeAmount: 1,
    afterAmount: 1,
    gameName: 1,
    gameId: 1,
    provider: 1,
    createdAt: 1,
    updatedAt: 1
});
/** Top winner / báo cáo theo khoảng thời gian */
ModelSchema.index({ type: 1, createdAt: -1 });

const TransactionModel = mongoose.model<ITransaction>('transactions', ModelSchema);

export default TransactionModel;
