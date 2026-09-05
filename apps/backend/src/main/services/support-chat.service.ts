import mongoose from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import SupportConversationModel, {
    type ISupportConversation,
    type SupportConversationStatus
} from '@main/models/support-conversation.model';
import SupportMessageModel, {
    type ISupportMessage,
    type SupportMessageRole
} from '@main/models/support-message.model';
import telegramService from './telegram.service';

const ADMIN_ROOM = 'support:admins';

const userRoom = (userId: string) => `support:user:${userId}`;
const conversationRoom = (conversationId: string) => `support:conv:${conversationId}`;

const emit = (room: string, event: string, payload: unknown) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const io = (global as any).io;
        if (io) io.to(room).emit(event, payload);
    } catch (err) {
        console.error('[support-chat] emit error', err);
    }
};

const truncateSnippet = (text: string) => {
    const t = (text ?? '').replace(/\s+/g, ' ').trim();
    return t.length > 200 ? t.slice(0, 197) + '…' : t;
};

const getOrCreateConversationByUser = async (userId: string, username = '') => {
    let conv = await SupportConversationModel.findOne({ userId });
    if (!conv) {
        conv = await SupportConversationModel.create({
            userId,
            username,
            status: 'open',
            lastMessage: '',
            lastMessageBy: 'system',
            lastMessageAt: new Date()
        });
    } else if (username && conv.username !== username) {
        conv.username = username;
        await conv.save();
    }
    return conv;
};

const listConversations = async (filter: {
    status?: SupportConversationStatus | 'all';
    keyword?: string;
    page?: number;
    limit?: number;
}) => {
    const q: Record<string, unknown> = {};
    if (filter.status && filter.status !== 'all') q.status = filter.status;
    if (filter.keyword && filter.keyword.trim()) {
        const re = new RegExp(filter.keyword.trim(), 'i');
        q.$or = [{ username: re }, { lastMessage: re }, { tags: re }];
    }
    const limit = Math.min(Math.max(Number(filter.limit) || 30, 1), 100);
    const page = Math.max(Number(filter.page) || 1, 1);
    const [items, total] = await Promise.all([
        SupportConversationModel.find(q)
            .sort({ lastMessageAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        SupportConversationModel.countDocuments(q)
    ]);
    return { items, total, page, limit };
};

const getConversationById = async (id: string) => SupportConversationModel.findById(id);

const listMessages = async (conversationId: string, page = 1, limit = 50) => {
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const pg = Math.max(Number(page) || 1, 1);
    const [items, total] = await Promise.all([
        SupportMessageModel.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip((pg - 1) * lim)
            .limit(lim)
            .lean(),
        SupportMessageModel.countDocuments({ conversationId })
    ]);
    return { items: items.reverse(), total, page: pg, limit: lim };
};

const postMessage = async (
    conversationId: string,
    sender: { id?: string | null; name: string; role: SupportMessageRole },
    text: string,
    attachments: ISupportMessage['attachments'] = []
): Promise<ISupportMessage> => {
    const conv = await SupportConversationModel.findById(conversationId);
    if (!conv) throw new ApiError(httpStatus.NOT_FOUND, 'Conversation not found');

    const msg = await SupportMessageModel.create({
        conversationId,
        senderId: sender.id ? new mongoose.Types.ObjectId(sender.id) : null,
        senderName: sender.name,
        senderRole: sender.role,
        text,
        attachments,
        readByUserAt: sender.role === 'user' ? new Date() : null,
        readByAdminAt: sender.role === 'admin' ? new Date() : null
    });

    const snippet = truncateSnippet(text);
    conv.lastMessage = snippet;
    conv.lastMessageBy = sender.role;
    conv.lastMessageAt = msg.createdAt;
    if (sender.role === 'user') {
        conv.unreadByAdmin += 1;
        if (conv.status === 'closed') conv.status = 'open';
    } else if (sender.role === 'admin') {
        conv.unreadByUser += 1;
        if (conv.status === 'open') conv.status = 'pending';
    }
    await conv.save();

    const payload = { conversation: conv.toJSON(), message: msg.toJSON() };
    emit(ADMIN_ROOM, 'support_chat:new_message', payload);
    emit(conversationRoom(String(conv._id)), 'support_chat:new_message', payload);
    emit(userRoom(String(conv.userId)), 'support_chat:new_message', payload);

    if (sender.role === 'user') {
        telegramService
            .notify('new_ticket_admin', {
                username: sender.name,
                subject: 'CSKH chat',
                content: snippet,
                category: 'support_chat'
            })
            .catch(() => undefined);
    }
    return msg;
};

const markRead = async (conversationId: string, by: 'user' | 'admin') => {
    const conv = await SupportConversationModel.findById(conversationId);
    if (!conv) return null;
    const now = new Date();
    const update = by === 'admin' ? { readByAdminAt: now } : { readByUserAt: now };
    await SupportMessageModel.updateMany(
        { conversationId, ...(by === 'admin' ? { readByAdminAt: null } : { readByUserAt: null }) },
        { $set: update }
    );
    if (by === 'admin') conv.unreadByAdmin = 0;
    else conv.unreadByUser = 0;
    await conv.save();
    return conv;
};

const setStatus = async (conversationId: string, status: SupportConversationStatus) => {
    const conv = await SupportConversationModel.findByIdAndUpdate(
        conversationId,
        { status },
        { new: true }
    );
    if (conv) {
        emit(ADMIN_ROOM, 'support_chat:conversation_updated', { conversation: conv.toJSON() });
        emit(userRoom(String(conv.userId)), 'support_chat:conversation_updated', {
            conversation: conv.toJSON()
        });
    }
    return conv;
};

const assignAdmin = async (
    conversationId: string,
    admin: { id: string; name: string } | null
): Promise<ISupportConversation | null> => {
    const conv = await SupportConversationModel.findByIdAndUpdate(
        conversationId,
        {
            assignedAdminId: admin ? new mongoose.Types.ObjectId(admin.id) : null,
            assignedAdminName: admin?.name ?? ''
        },
        { new: true }
    );
    if (conv) {
        emit(ADMIN_ROOM, 'support_chat:conversation_updated', { conversation: conv.toJSON() });
    }
    return conv;
};

const updateMeta = async (
    conversationId: string,
    patch: { tags?: string[]; internalNote?: string }
) => {
    const conv = await SupportConversationModel.findByIdAndUpdate(
        conversationId,
        {
            ...(Array.isArray(patch.tags) ? { tags: patch.tags.slice(0, 20) } : {}),
            ...(typeof patch.internalNote === 'string'
                ? { internalNote: patch.internalNote.slice(0, 4000) }
                : {})
        },
        { new: true }
    );
    if (conv) {
        emit(ADMIN_ROOM, 'support_chat:conversation_updated', { conversation: conv.toJSON() });
    }
    return conv;
};

const stats = async () => {
    const [open, pending, closed, totalUnread] = await Promise.all([
        SupportConversationModel.countDocuments({ status: 'open' }),
        SupportConversationModel.countDocuments({ status: 'pending' }),
        SupportConversationModel.countDocuments({ status: 'closed' }),
        SupportConversationModel.aggregate([
            { $group: { _id: null, n: { $sum: '$unreadByAdmin' } } }
        ]).then((r) => (r[0]?.n as number) || 0)
    ]);
    return { open, pending, closed, totalUnread };
};

export default {
    ADMIN_ROOM,
    userRoom,
    conversationRoom,
    getOrCreateConversationByUser,
    listConversations,
    getConversationById,
    listMessages,
    postMessage,
    markRead,
    setStatus,
    assignAdmin,
    updateMeta,
    stats
};
