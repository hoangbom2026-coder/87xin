import mongoose, { Document, Schema } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IArticleCategory extends Document {
    name: string;
    slug: string;
    description?: string;
    status: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const ArticleCategorySchema = new mongoose.Schema<IArticleCategory>(
    {
        name: { type: String, required: true, trim: true, maxlength: 200 },
        slug: { type: String, required: true, trim: true, maxlength: 220, unique: true, index: true },
        description: { type: String, default: '', maxlength: 2000 },
        status: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0, index: true }
    },
    { timestamps: true }
);

ArticleCategorySchema.plugin(toJSON);
ArticleCategorySchema.plugin(paginate);

const ArticleCategoryModel = mongoose.model<IArticleCategory>('article_categories', ArticleCategorySchema);

export default ArticleCategoryModel;

