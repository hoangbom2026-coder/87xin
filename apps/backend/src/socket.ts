import jwt from 'jsonwebtoken';
import type { Server } from 'socket.io';
import config from './config';
import publicChatService from '@main/services/public-chat.service';

const ADMIN_ROOM = 'support:admins';
const userRoom = (id: string) => `support:user:${id}`;

function resolveSocketToken(handshake: {
    query: Record<string, unknown>;
    auth?: Record<string, unknown>;
}): string {
    const fromQuery = handshake.query?.auth;
    if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();
    const fromAuth = handshake.auth?.token ?? handshake.auth?.auth;
    if (typeof fromAuth === 'string' && fromAuth.trim()) return fromAuth.trim();
    return '';
}

export default function socketServer(io: Server): void {
    io.on('connection', async (socket) => {
        const token = resolveSocketToken(socket.handshake);
        if (token) {
            try {
                const userData = jwt.verify(token, config.jwt.secret) as {
                    id?: string;
                    role?: string;
                };
                if (userData?.id) {
                    socket.data.userId = String(userData.id);
                    socket.data.role = String(userData.role || '');
                    await global.redis.set(userData.id, socket.id);
                    socket.join(userRoom(String(userData.id)));
                    if (socket.data.role === 'admin') socket.join(ADMIN_ROOM);
                }
            } catch (err) {
                console.warn('⚠️ Invalid socket token attempt:', (err as Error).message);
            }
        }

        socket.join(publicChatService.PUBLIC_CHAT_ROOM);
        publicChatService.broadcastOnlineCount().catch(() => undefined);

        socket.on('support_chat:join', (payload: { conversationId?: string }) => {
            if (payload?.conversationId) socket.join(`support:conv:${payload.conversationId}`);
        });

        socket.on('support_chat:leave', (payload: { conversationId?: string }) => {
            if (payload?.conversationId) socket.leave(`support:conv:${payload.conversationId}`);
        });

        socket.on('public-message', async (payload: { content?: string; level?: number }) => {
            if (!socket.data.userId) {
                socket.emit('public-chat:error', { message: 'Please log in to chat' });
                return;
            }
            try {
                const content = String(payload?.content ?? '').trim();
                if (!content) return;
                const msg = await publicChatService.createUserMessage(String(socket.data.userId), {
                    content,
                    level: Number(payload?.level) || 1
                });
                io.to(publicChatService.PUBLIC_CHAT_ROOM).emit('public-message', msg);
            } catch (err) {
                socket.emit('public-chat:error', {
                    message: (err as Error).message || 'Failed to send message'
                });
            }
        });

        socket.on('disconnect', async () => {
            const userId = socket.data.userId;
            if (userId) {
                const storedSocketId = await global.redis.get(userId);
                if (storedSocketId === socket.id) {
                    await global.redis.del(userId);
                }
            }
            publicChatService.broadcastOnlineCount().catch(() => undefined);
        });
    });
}
