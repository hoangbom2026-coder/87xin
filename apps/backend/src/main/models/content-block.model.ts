import mongoose, { Schema, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IContentBlock extends Document {
    key: string;
    value: any;
    description?: string;
    order: number;
    isVisible: boolean;
    isMaintenance: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IContentBlock>(
    {
        key: {
            type: String,
            required: true,
            unique: true
        },
        value: {
            type: Schema.Types.Mixed,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        isVisible: {
            type: Boolean,
            default: true
        },
        isMaintenance: {
            type: Boolean,
            default: false
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

ModelSchema.plugin(toJSON);
ModelSchema.plugin(paginate);

ModelSchema.index({
    key: 1
});
ModelSchema.index({
    order: 1,
    isVisible: 1
});

const ContentBlockModel = mongoose.model<IContentBlock>('content_blocks', ModelSchema);

export default ContentBlockModel;
