import mongoose, { Schema, Document } from 'mongoose';

import { toJSON, paginate } from '@utils/model-plugins';

export interface IBanner extends Document {
    image: string;
    /** Đích khi click (route nội bộ hoặc URL đầy đủ) */
    link?: string;
    order: number;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IBanner>(
    {
        image: {
            type: String,
            required: true
        },
        link: {
            type: String,
            default: ''
        },
        status: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.plugin(paginate);
ModelSchema.index({
    order: 1,
    createdAt: 1,
    updatedAt: 1
});

const BannerModel = mongoose.model<IBanner>('banners', ModelSchema);

export default BannerModel;
