import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface INowpayCurrency extends Document {
    id: number;
    code: string;
    name: string;
    enable: boolean;
    common: boolean;
    wallet_regex: string;
    priority: number;
    extra_id_exists: boolean;
    extra_id_regex: string;
    logo_url: string;
    track: boolean;
    cg_id: string;
    is_maxlimit: boolean;
    with_code: boolean;
    with_name: boolean;
    with_cgId: boolean;
    status: boolean;
    rate_code: string;
    network?: string;
    usd: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<INowpayCurrency>(
    {
        id: {
            type: Number,
            required: true
        },
        code: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        enable: {
            type: Boolean,
            required: true
        },
        common: {
            type: Boolean,
            default: false
        },
        wallet_regex: {
            type: String,
            required: true
        },
        priority: {
            type: Number,
            required: true
        },
        extra_id_exists: {
            type: Boolean,
            required: true
        },
        extra_id_regex: {
            type: String,
            default: ''
        },
        logo_url: {
            type: String,
            required: true
        },
        track: {
            type: Boolean,
            required: true
        },
        cg_id: {
            type: String,
            required: true
        },
        is_maxlimit: {
            type: Boolean,
            required: true
        },
        network: {
            type: String,
            default: ''
        },
        with_code: {
            type: Boolean,
            default: false
        },
        with_name: {
            type: Boolean,
            default: false
        },
        with_cgId: {
            type: Boolean,
            default: false
        },
        status: {
            type: Boolean,
            default: false
        },
        usd: {
            type: Number,
            default: 0
        },
        rate_code: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);

const NowpayCurrencyModel = mongoose.model<INowpayCurrency>('nowpay-currencies', ModelSchema);

export default NowpayCurrencyModel;
