import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IHelp extends Document {
    slug: string;
    icon: string;
    title: string;
    lang: string;
    content: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IHelp>(
    {
        slug: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        lang: {
            type: String,
            required: true
        },
        status: {
            type: Boolean,
            default: true
        },
        content: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ slug: 1, lang: 1, status: 1 });

const HelpModel = mongoose.model<IHelp>('helps', ModelSchema);

export default HelpModel;
