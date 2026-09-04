import mongoose, { Schema, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IAffiliateFeedItem extends Document {
    /** username hiển thị (có thể fake). */
    username: string;
    amount: number;
    currency: string;
    /** auto = sinh từ cron giả; real = lấy từ payout thật; manual = admin nhập tay. */
    source: 'auto' | 'real' | 'manual';
    /** Ẩn khỏi public widget (giữ trong DB để khôi phục). */
    hidden: boolean;
    /** Note admin nội bộ. */
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const FeedItemSchema = new mongoose.Schema<IAffiliateFeedItem>(
    {
        username: { type: String, required: true, index: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        source: { type: String, enum: ['auto', 'real', 'manual'], default: 'auto', index: true },
        hidden: { type: Boolean, default: false, index: true },
        notes: { type: String, default: '' }
    },
    { timestamps: true }
);

FeedItemSchema.plugin(toJSON);
FeedItemSchema.plugin(paginate);
FeedItemSchema.index({ createdAt: -1 });

const AffiliateFeedItemModel = mongoose.model<IAffiliateFeedItem>('affiliate-feed-items', FeedItemSchema);
export default AffiliateFeedItemModel;
