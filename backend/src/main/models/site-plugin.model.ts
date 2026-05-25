import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export type SitePluginStatus = 'installed' | 'available' | 'disabled';

export interface ISitePlugin extends Document {
    /** Khóa duy nhất, ví dụ soloCurrency */
    key: string;
    title: string;
    version: string;
    description: string;
    author: string;
    iconUrl: string;
    status: SitePluginStatus;
    /** Gợi ý route hoặc key cấu hình */
    configPath?: string;
    configJson?: Record<string, unknown>;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<ISitePlugin>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        title: { type: String, required: true, trim: true },
        version: { type: String, default: '1.0.0' },
        description: { type: String, default: '' },
        author: { type: String, default: '' },
        iconUrl: { type: String, default: '' },
        status: {
            type: String,
            enum: ['installed', 'available', 'disabled'],
            default: 'available'
        },
        configPath: { type: String, default: '' },
        configJson: { type: Schema.Types.Mixed, default: {} },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

ModelSchema.plugin(toJSON);
ModelSchema.index({ order: 1, title: 1 });

export default mongoose.model<ISitePlugin>('SitePlugin', ModelSchema);
