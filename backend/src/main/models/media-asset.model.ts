import mongoose, { Document, Schema } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface IMediaAsset extends Document {
    /** Tên file gốc khi upload. */
    originalName: string;
    /** Tên file đã lưu trên đĩa (đã unique-hóa). */
    filename: string;
    /** Slug folder (rỗng = root), cũng là tên thư mục trên đĩa. */
    folder: string;
    /** URL public phục vụ qua express.static (vd /media/2026/05/abc.png). */
    url: string;
    mime: string;
    size: number;
    width?: number;
    height?: number;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
    title?: string;
    alt?: string;
    tags?: string[];
    uploadedBy?: Schema.Types.ObjectId;
    uploadedByName?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
    {
        originalName: { type: String, required: true },
        filename: { type: String, required: true, index: true },
        folder: { type: String, default: '', lowercase: true, trim: true, index: true },
        url: { type: String, required: true },
        mime: { type: String, required: true, index: true },
        size: { type: Number, required: true, min: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'document', 'other'],
            default: 'other',
            index: true
        },
        title: { type: String, default: '' },
        alt: { type: String, default: '' },
        tags: { type: [String], default: [] },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        uploadedByName: { type: String, default: '' }
    },
    { timestamps: true }
);

MediaAssetSchema.plugin(toJSON);
MediaAssetSchema.index({ folder: 1, createdAt: -1 });

export default mongoose.model<IMediaAsset>('media_assets', MediaAssetSchema);
