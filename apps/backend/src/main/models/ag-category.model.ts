import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IAgCategory extends Document {
    categoryName: string;
    categoryCode: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAgCategory>(
    {
        categoryName: {
            type: String,
            required: true
        },
        categoryCode: {
            type: String,
            required: true
        },
        status: {
            type: String,
            default: 'active'
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    categoryName: 1,
    categoryCode: 1,
    status: 1
});

const AgCategoryModel = mongoose.model<IAgCategory>('ag-categories', ModelSchema);

export default AgCategoryModel;
