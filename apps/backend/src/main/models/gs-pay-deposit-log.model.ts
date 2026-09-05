import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IGsPayDepositLog extends Document {
    userId: Schema.Types.ObjectId | string;
    depositId: Schema.Types.ObjectId | string;
    merchant_ref: string;
    system_ref: string;
    amount: number;
    fee: number;
    pay_amount: number;
    status: number;
    success_time: string;
    payurl: string;
    extend_params: string;
    product: string;
    product_ref: string;
    fiat_currency: string;
    extra: Object;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IGsPayDepositLog>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        depositId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'deposits',
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
        fee: {
            type: Number,
            default: 0
        },
        pay_amount: {
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
        payurl: {
            type: String,
            default: ''
        },
        extend_params: {
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
        fiat_currency: {
            type: String,
            default: ''
        },
        extra: {
            type: Object,
            default: {}
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    userId: 1,
    depositId: 1,
    merchant_ref: 1,
    system_ref: 1,
    amount: 1,
    fee: 1,
    status: 1,
    success_time: 1,
    product: 1
});

const GsPayDepositLogModel = mongoose.model<IGsPayDepositLog>('gs-pay-deposit-logs', ModelSchema);

export default GsPayDepositLogModel;
