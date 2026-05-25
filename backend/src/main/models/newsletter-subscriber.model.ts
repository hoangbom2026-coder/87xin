import mongoose, { Document, Schema } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface INewsletterSubscriber extends Document {
    email: string;
    source: string;
    status: 'active' | 'unsubscribed';
    tags?: string[];
    ip?: string;
    userId?: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        source: { type: String, default: 'web', maxlength: 64 },
        status: { type: String, enum: ['active', 'unsubscribed'], default: 'active', index: true },
        tags: { type: [String], default: [] },
        ip: { type: String, default: '' },
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null }
    },
    { timestamps: true }
);

NewsletterSubscriberSchema.plugin(toJSON);

export default mongoose.model<INewsletterSubscriber>('newsletter_subscribers', NewsletterSubscriberSchema);
