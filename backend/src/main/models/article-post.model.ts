import mongoose, { Document, Schema } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IArticlePost extends Document {
    title: string;
    slug: string;
    excerpt?: string;
    contentHtml: string;
    thumbnail?: string;
    categoryId?: Schema.Types.ObjectId | null;
    categorySlug?: string;
    status: 'draft' | 'published';
    featured: boolean;
    publishedAt?: Date | null;
    authorName?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ArticlePostSchema = new mongoose.Schema<IArticlePost>(
    {
        title: { type: String, required: true, trim: true, maxlength: 300 },
        slug: { type: String, required: true, trim: true, maxlength: 320, unique: true, index: true },
        excerpt: { type: String, default: '', maxlength: 2000 },
        contentHtml: { type: String, required: true, maxlength: 2000000 },
        thumbnail: { type: String, default: '', maxlength: 2000 },
        categoryId: { type: Schema.Types.ObjectId, ref: 'article_categories', default: null, index: true },
        categorySlug: { type: String, default: '', maxlength: 220, index: true },
        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
        featured: { type: Boolean, default: false, index: true },
        publishedAt: { type: Date, default: null, index: true },
        authorName: { type: String, default: '' }
    },
    { timestamps: true }
);

ArticlePostSchema.plugin(toJSON);
ArticlePostSchema.plugin(paginate);

const ArticlePostModel = mongoose.model<IArticlePost>('article_posts', ArticlePostSchema);

export default ArticlePostModel;

