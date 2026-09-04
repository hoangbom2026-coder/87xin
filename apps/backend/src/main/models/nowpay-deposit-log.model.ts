import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface INowpayDepositLog extends Document {
    userId: Schema.Types.ObjectId;
    depositId: Schema.Types.ObjectId;
    payment_id: string;
    payment_status: string;
    pay_address: string;
    price_amount: number;
    price_currency: string;
    pay_amount: number;
    amount_received: number;
    pay_currency: string;
    order_id: string;
    order_description: string;
    payin_extra_id: string;
    ipn_callback_url: string;
    customer_email: string;
    created_at: string;
    updated_at: string;
    purchase_id: string;
    smart_contract: string;
    network?: string;
    network_precision: string;
    time_limit: string;
    burning_percent: string;
    expiration_estimate_date: string;
    is_fixed_rate: boolean;
    is_fee_paid_by_user: boolean;
    valid_until: string;
    type: string;
    product: string;
    origin_ip: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<INowpayDepositLog>(
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
        payment_id: {
            type: String,
            required: true
        },
        payment_status: {
            type: String,
            required: true
        },
        pay_address: {
            type: String,
            required: true
        },
        price_amount: {
            type: Number,
            required: true
        },
        price_currency: {
            type: String,
            required: true
        },
        pay_amount: {
            type: Number,
            required: true
        },
        amount_received: {
            type: Number,
            required: true
        },
        pay_currency: {
            type: String,
            required: true
        },
        order_id: {
            type: String,
            required: true
        },
        order_description: {
            type: String,
            required: true
        },
        payin_extra_id: {
            type: String,
            default: ''
        },
        ipn_callback_url: {
            type: String,
            required: true
        },
        customer_email: {
            type: String,
            default: ''
        },
        created_at: {
            type: String,
            required: true
        },
        updated_at: {
            type: String,
            required: true
        },
        purchase_id: {
            type: String,
            required: true
        },
        smart_contract: {
            type: String,
            default: ''
        },
        network: {
            type: String,
            default: ''
        },
        network_precision: {
            type: String,
            default: ''
        },
        time_limit: {
            type: String,
            default: ''
        },
        burning_percent: {
            type: String,
            default: ''
        },
        expiration_estimate_date: {
            type: String,
            required: true
        },
        is_fixed_rate: {
            type: Boolean,
            required: true
        },
        is_fee_paid_by_user: {
            type: Boolean,
            required: true
        },
        valid_until: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        product: {
            type: String,
            required: true
        },
        origin_ip: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    userId: 1,
    payment_id: 1,
    payment_status: 1
});

const NowpayDepositLogModel = mongoose.model<INowpayDepositLog>('nowpay-deposit-logs', ModelSchema);

export default NowpayDepositLogModel;
