import mongoose, { Document, Schema } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export type SupportConversationStatus = 'open' | 'pending' | 'closed';
export type SupportLastMessageBy = 'user' | 'admin' | 'system';

export interface ISupportConversation extends Document {
    userId: Schema.Types.ObjectId;
    /** Cache username để filter / list nhanh không cần populate. */
    username: string;
    /** Admin đang phụ trách (nếu có). */
    assignedAdminId?: Schema.Types.ObjectId | null;
    assignedAdminName?: string;
    status: SupportConversationStatus;
    /** Tin nhắn cuối (snippet, max 200). */
    lastMessage: string;
    lastMessageBy?: SupportLastMessageBy;
    lastMessageAt: Date;
    /** Đếm tin chưa đọc của từng phía (sẽ reset khi mở thread). */
    unreadByAdmin: number;
    unreadByUser: number;
    /** Tag tự do để admin gắn (vd: "VIP", "khiếu nại nạp"). */
    tags: string[];
    /** Note nội bộ cho admin khác đọc. */
    internalNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new mongoose.Schema<ISupportConversation>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, unique: true, index: true },
        username: { type: String, default: '', index: true },
        assignedAdminId: { type: Schema.Types.ObjectId, ref: 'users', default: null },
        assignedAdminName: { type: String, default: '' },
        status: {
            type: String,
            enum: ['open', 'pending', 'closed'],
            default: 'open',
            index: true
        },
        lastMessage: { type: String, default: '', maxlength: 200 },
        lastMessageBy: { type: String, enum: ['user', 'admin', 'system'], default: 'system' },
        lastMessageAt: { type: Date, default: Date.now, index: true },
        unreadByAdmin: { type: Number, default: 0 },
        unreadByUser: { type: Number, default: 0 },
        tags: { type: [String], default: [] },
        internalNote: { type: String, default: '' }
    },
    { timestamps: true }
);

ConversationSchema.plugin(toJSON);
ConversationSchema.plugin(paginate);

const SupportConversationModel = mongoose.model<ISupportConversation>(
    'support_conversations',
    ConversationSchema
);

export default SupportConversationModel;
