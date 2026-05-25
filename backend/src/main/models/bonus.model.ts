import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IBonus extends Document {
    name: string;
    percent: number;
    multiply: number;
    option: string;
    bonusCap: number;
    minBet: number;
    maxBet: number;
    slot: boolean;
    casino: boolean;
    status: boolean;
    autoCalc: boolean;
    expireDate: Date;
    banner: string;
    description: string;
    particularData: object;
    isExpired: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IBonus>(
    {
        name: {
            type: String,
            required: true
        },
        option: {
            type: String,
            required: true
        },
        percent: {
            type: Number,
            required: true
        },
        multiply: {
            type: Number,
            required: true
        },
        bonusCap: {
            type: Number,
            required: true
        },
        minBet: {
            type: Number,
            required: true
        },
        maxBet: {
            type: Number,
            required: true
        },
        slot: {
            type: Boolean,
            required: true
        },
        casino: {
            type: Boolean,
            required: true
        },
        status: {
            type: Boolean,
            required: true
        },
        autoCalc: {
            type: Boolean,
            required: true
        },
        expireDate: {
            type: Date,
            required: true
        },
        banner: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        particularData: {
            type: Object
        },
        isExpired: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ status: 1, expireDate: 1, isExpired: 1, createdAt: 1, updatedAt: 1 });

const BonusModel = mongoose.model<IBonus>('bonuses', ModelSchema);

export default BonusModel;
