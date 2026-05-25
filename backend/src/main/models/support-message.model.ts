import mongoose, { Document, Schema } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export type SupportMessageRole = 'user' | 'admin' | 'system';

export interface ISupportMessage extends Document {
    conversationId: Schema.Types.ObjectId;
    senderId?: Schema.Types.ObjectId | null;
    senderName: string;
    senderRole: SupportMessageRole;
    text: string;
    /** Đính kèm: ảnh / file (tuỳ chọn). */
    attachments: Array<{ url: string; type?: string; name?: string; size?: number }>;
    readByAdminAt?: Date | null;
    readByUserAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<ISupportMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'support_conversations',
            required: true,
            index: true
        },
        senderId: { type: Schema.Types.ObjectId, ref: 'users', default: null },
        senderName: { type: String, default: '' },
        senderRole: { type: String, enum: ['user', 'admin', 'system'], required: true },
        text: { type: String, default: '', maxlength: 5000 },
        attachments: {
            type: [
                {
                    url: { type: String, required: true },
                    type: { type: String, default: '' },
                    name: { type: String, default: '' },
                    size: { type: Number, default: 0 }
                }
            ],
            default: []
        },
        readByAdminAt: { type: Date, default: null },
        readByUserAt: { type: Date, default: null }
    },
    { timestamps: true }
);

MessageSchema.plugin(toJSON);
MessageSchema.plugin(paginate);
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ readByAdminAt: 1, conversationId: 1 });

const SupportMessageModel = mongoose.model<ISupportMessage>('support_messages', MessageSchema);

export default SupportMessageModel;
