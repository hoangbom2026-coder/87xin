import mongoose, { Document, Schema } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface IMediaFolder extends Document {
    /** Tên hiển thị, ví dụ "Banner Tết". */
    name: string;
    /** Slug duy nhất (a-z, 0-9, '-'), cũng là path tương đối trong /public/media/<slug>. */
    slug: string;
    description?: string;
    createdBy?: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MediaFolderSchema = new Schema<IMediaFolder>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        description: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
    },
    { timestamps: true }
);

MediaFolderSchema.plugin(toJSON);

export default mongoose.model<IMediaFolder>('media_folders', MediaFolderSchema);
