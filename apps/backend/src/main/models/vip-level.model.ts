import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IVipLevel extends Document {
    parentId: Schema.Types.ObjectId;
    levelName: String;
    xp: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IVipLevel>(
    {
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'vip-tierses',
            required: true
        },
        levelName: {
            type: String,
            required: true
        },
        xp: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ levelName: 1, xp: 1, createdAt: 1, updatedAt: 1 });

const VipLevelModel = mongoose.model<IVipLevel>('vip-levels', ModelSchema);

export default VipLevelModel;
