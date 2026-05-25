import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface INowpayWithdrawLog extends Document {
    userId: Schema.Types.ObjectId;
    address: string;
    amount: number;
    batch_withdrawal_id: string;
    currency: string;
    error: string;
    extra_id: string;
    fee: number;
    hash: string;
    id: string;
    status: string;
    requested_at: string;
    created_at: string;
    updated_at: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<INowpayWithdrawLog>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        address: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        batch_withdrawal_id: {
            type: String,
            default: ''
        },
        currency: {
            type: String,
            required: true
        },
        error: {
            type: String,
            default: ''
        },
        extra_id: {
            type: String,
            default: ''
        },
        fee: {
            type: Number,
            default: 0
        },
        hash: {
            type: String,
            default: ''
        },
        id: {
            type: String,
            required: true
        },
        status: {
            type: String,
            default: 'CREAING'
        },
        requested_at: {
            type: String,
            default: ''
        },
        created_at: {
            type: String,
            default: ''
        },
        updated_at: {
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
    address: 1,
    amount: 1,
    batch_withdrawal_id: 1,
    currency: 1,
    extra_id: 1,
    id: 1,
    status: 1,
    requested_at: 1,
    created_at: 1,
    updated_at: 1
});

const NowpayWithdrawLogModel = mongoose.model<INowpayWithdrawLog>('nowpay-withdraw-logs', ModelSchema);

export default NowpayWithdrawLogModel;
