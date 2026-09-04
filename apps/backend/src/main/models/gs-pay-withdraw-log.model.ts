import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IGsPayWithdrawLog extends Document {
    userId: Schema.Types.ObjectId;
    merchant_ref: string;
    system_ref: string;
    amount: number;
    fee: number;
    pay_amount: number;
    status: number;
    success_time: string;
    extend_params: string;
    product: string;
    product_ref: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IGsPayWithdrawLog>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        merchant_ref: {
            type: String,
            required: true
        },
        system_ref: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        pay_amount: {
            type: Number,
            default: 0
        },
        fee: {
            type: Number,
            default: 0
        },
        status: {
            type: Number,
            required: true
        },
        success_time: {
            type: String,
            default: ''
        },
        product: {
            type: String,
            required: true
        },
        product_ref: {
            type: String,
            default: ''
        },
        extend_params: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    userId: 1,
    merchant_ref: 1,
    system_ref: 1,
    amount: 1,
    fee: 1,
    status: 1,
    success_time: 1
});

const GsPayWithdrawLogModel = mongoose.model<IGsPayWithdrawLog>('gs-pay-withdraw-logs', ModelSchema);

export default GsPayWithdrawLogModel;
