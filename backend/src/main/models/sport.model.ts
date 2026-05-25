import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface ISport extends Document {
    image: string;
    order: number;
    provider: string;
    currency: string[];
    status: string;
    state: boolean;
    provider_id: number;
    product_id: number;
    product_code: number;
    game_type: string;
    product_title: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<ISport>(
    {
        image: {
            type: String,
            default: 'sports.png'
        },
        provider: {
            type: String,
            required: true
        },
        currency: {
            type: [String],
            required: true
        },
        status: {
            type: String,
            required: true
        },
        state: {
            type: Boolean,
            default: true
        },
        provider_id: {
            type: Number,
            required: true
        },
        product_id: {
            type: Number,
            required: true
        },
        product_code: {
            type: Number,
            required: true
        },
        game_type: {
            type: String,
            required: true
        },
        product_title: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    provider: 1,
    currency: 1,
    status: 1,
    provider_id: 1,
    product_id: 1,
    product_code: 1,
    game_type: 1
});

const SportModel = mongoose.model<ISport>('sports', ModelSchema);

export default SportModel;
