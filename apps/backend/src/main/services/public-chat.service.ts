/**
 * Public chat service.
 * Quản lý tin nhắn chat công khai và phát số lượng user online.
 * socket.ts phụ thuộc vào service này — interface phải khớp chính xác.
 */
import mongoose, { Document, Schema } from 'mongoose';

// ─── Inline model (tránh circular dependency với models/) ─────────────────────
interface IPublicMessage extends Document {
    userId: mongoose.Types.ObjectId | string;
    content: string;
    level: number;
    createdAt: Date;
}

const PublicMessageSchema = new Schema<IPublicMessage>(
    {
        userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, maxlength: 500 },
        level:   { type: Number, default: 1, min: 1, max: 99 },
    },
    { timestamps: true }
);

const PublicMessageModel =
    (mongoose.models['PublicMessage'] as mongoose.Model<IPublicMessage>) ??
    mongoose.model<IPublicMessage>('PublicMessage', PublicMessageSchema);

// ─── Constants ────────────────────────────────────────────────────────────────
const PUBLIC_CHAT_ROOM = 'public-chat';

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Tạo tin nhắn chat public và lưu vào DB.
 */
async function createUserMessage(
    userId: string,
    payload: { content: string; level?: number }
): Promise<IPublicMessage> {
    const msg = await PublicMessageModel.create({
        userId,
        content: String(payload.content ?? '').trim().slice(0, 500),
        level:   Number(payload.level) || 1,
    });
    return msg;
}

/**
 * Lấy tin nhắn gần đây nhất (mặc định 50 tin).
 */
async function getRecentMessages(limit = 50): Promise<IPublicMessage[]> {
    return PublicMessageModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean() as unknown as IPublicMessage[];
}

/**
 * Phát số lượng user đang online trong PUBLIC_CHAT_ROOM qua global.io.
 * Không throw — gọi từ socket event handler, lỗi im lặng.
 */
function broadcastOnlineCount(): Promise<void> {
    return Promise.resolve().then(() => {
        try {
            if (!global.io) return;
            const room = global.io.sockets.adapter.rooms.get(PUBLIC_CHAT_ROOM);
            const count = room ? room.size : 0;
            global.io.to(PUBLIC_CHAT_ROOM).emit('public-chat:online', { count });
        } catch {
            // fail silently — không ảnh hưởng connection
        }
    });
}

// ─── Export ───────────────────────────────────────────────────────────────────
const publicChatService = {
    PUBLIC_CHAT_ROOM,
    createUserMessage,
    getRecentMessages,
    broadcastOnlineCount,
};

export default publicChatService;
