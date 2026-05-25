import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IAgPayoutLog extends Document {
    userId: Schema.Types.ObjectId;
    withdrawId: Schema.Types.ObjectId;
    msg: string;
    status: number;
    statusDesc: string;
    amount: number;
    merchantOrderId: string;
    agOrderId: string;
    payType: number;
    createTime: number;
    userCert: string;
    userName: string;
    validateUserCert: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAgPayoutLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        withdrawId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        msg: {
            type: String,
            default: ''
        },
        status: {
            type: Number,
            required: true
        },
        statusDesc: {
            type: String,
            default: ''
        },
        amount: {
            type: Number,
            required: true
        },
        merchantOrderId: {
            type: String,
            required: true
        },
        agOrderId: {
            type: String,
            required: true
        },
        payType: {
            type: Number,
            required: true
        },
        createTime: {
            type: Number,
            required: true
        },
        userCert: {
            type: String,
            default: ''
        },
        userName: {
            type: String,
            default: ''
        },
        validateUserCert: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    payType: 1,
    status: 1,
    merchantOrderId: 1,
    agOrderId: 1,
    amount: 1
});

const AgPayoutLogModel = mongoose.model<IAgPayoutLog>('ag-payouts', ModelSchema);

export default AgPayoutLogModel;
