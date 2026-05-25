import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface ISession extends Document {
    userId: Schema.Types.ObjectId;
    token: string;
    expiredTime: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<ISession>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        token: {
            type: String,
            required: true,
            private: true
        },
        expiredTime: {
            type: Date,
            default: Date.now,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ userId: 1, token: 1, createdAt: 1, updatedAt: 1 });

const SessionModel = mongoose.model<ISession>('sessions', ModelSchema);

export default SessionModel;
