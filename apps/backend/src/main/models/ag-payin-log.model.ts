import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IAgPayinLog extends Document {
    userId: Schema.Types.ObjectId | string;
    depositId: Schema.Types.ObjectId | string;
    msg: string;
    status: number;
    orderStatusDesc: string;
    amount: number;
    merchantOrderId: string;
    agOrderId: string;
    payType: number;
    createTime: number;
    realPayAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAgPayinLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        depositId: {
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
        orderStatusDesc: {
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
        realPayAmount: {
            type: Number,
            default: 0
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

const AgPayinLogModel = mongoose.model<IAgPayinLog>('ag-payins', ModelSchema);

export default AgPayinLogModel;
