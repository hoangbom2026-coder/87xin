import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';
import { DEPOSIT_STATUS_OPTION } from '@config/static';

export interface IDeposit extends Document {
    userId: Schema.Types.ObjectId;
    currencyId: Schema.Types.ObjectId;
    balanceId: Schema.Types.ObjectId;
    currency: string;
    amount: number;
    actuallyAmount: number;
    status: string;
    payinType: string;
    description: string;
    gatewayOrderId: string;
    data: Object;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IDeposit>(
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
        currency: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        actuallyAmount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: {
                values: DEPOSIT_STATUS_OPTION,
                message: '{VALUE} status is not supported.'
            },
            required: true
        },
        payinType: {
            type: String,
            required: true
        },
        gatewayOrderId: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        data: {
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
    currencyId: 1,
    currency: 1,
    amount: 1,
    actuallyAmount: 1,
    status: 1,
    payinType: 1,
    createdAt: 1,
    updatedAt: 1
});

const DepositModel = mongoose.model<IDeposit>('deposits', ModelSchema);

export default DepositModel;
