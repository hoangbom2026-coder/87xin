import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';
import { WITHDRAW_STATUS_OPTION } from '@config/static';

export interface IWithdraw extends Document {
    userId: Schema.Types.ObjectId;
    currencyId: Schema.Types.ObjectId;
    currency: string;
    amount: number;
    status: string;
    payoutType: string;
    description: string;
    gatewayOrderId: string;
    data: Object;
    createdAt: Date;
    updatedAt: Date;
}
// data: {
//     fromCurrency
//     toCurrency
//     fromAmount
//     toAmount
//     address
// }
const ModelSchema = new mongoose.Schema<IWithdraw>(
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
        status: {
            type: String,
            enum: {
                values: WITHDRAW_STATUS_OPTION,
                message: '{VALUE} status is not supported.'
            },
            required: true
        },
        payoutType: {
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
    status: 1,
    payoutType: 1,
    createdAt: 1,
    updatedAt: 1
});

const WithdrawModel = mongoose.model<IWithdraw>('withdraws', ModelSchema);

export default WithdrawModel;
