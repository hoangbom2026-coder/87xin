import httpStatus from 'http-status';
import { Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';

// In-memory lưu trữ mô phỏng cho IP Access quy tắc kiểm soát
interface IPAccessRecord {
    _id: string;
    ipAddress: string;
    type: 'whitelist' | 'blacklist';
    module: 'admin' | 'api' | 'frontend' | 'all';
    reason: string;
    expiresAt: string | null;
    createdBy: string;
    createdAt: string;
    hitCount: number;
    lastHitAt: string | null;
}

let mockIpStore: IPAccessRecord[] = [
    {
        _id: 'ip-101',
        ipAddress: '192.168.1.100',
        type: 'whitelist',
        module: 'admin',
        reason: 'Văn phòng chính (Trụ sở vận hành)',
        expiresAt: null,
        createdBy: 'superadmin',
        createdAt: new Date().toISOString(),
        hitCount: 0,
        lastHitAt: null
    },
    {
        _id: 'ip-102',
        ipAddress: '113.160.0.0/16',
        type: 'blacklist',
        module: 'all',
        reason: 'Dải mạng nghi ngờ tấn công DDoS / Spam tự động',
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        createdBy: 'system_guard',
        createdAt: new Date().toISOString(),
        hitCount: 142,
        lastHitAt: new Date().toISOString()
    },
    {
        _id: 'ip-103',
        ipAddress: '14.248.82.15',
        type: 'blacklist',
        module: 'api',
        reason: 'Brute force đăng nhập API vượt quá ngưỡng cho phép',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdBy: 'security_bot',
        createdAt: new Date().toISOString(),
        hitCount: 18,
        lastHitAt: new Date().toISOString()
    }
];

export const listIPAccess = catchAsync(async (req: AuthRequest, res: Response) => {
    const type = String(req.query.type || '').trim();
    const module = String(req.query.module || '').trim();
    const keyword = String(req.query.keyword || '').trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 20)));

    // Tự động dọn dẹp các IP đã hết hạn thực tế
    const now = Date.now();
    mockIpStore = mockIpStore.filter(item => {
        if (!item.expiresAt) return true;
        return new Date(item.expiresAt).getTime() > now;
    });

    let filtered = [...mockIpStore];

    if (type && type !== 'all') {
        filtered = filtered.filter(item => item.type === type);
    }
    if (module && module !== 'all') {
        filtered = filtered.filter(item => item.module === module);
    }
    if (keyword) {
        filtered = filtered.filter(item => 
            item.ipAddress.toLowerCase().includes(keyword) ||
            item.reason.toLowerCase().includes(keyword)
        );
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return res.send({
        items,
        total: filtered.length,
        page,
        limit
    });
});

export const createIPAccess = catchAsync(async (req: AuthRequest, res: Response) => {
    const { ipAddress, type = 'blacklist', module = 'all', reason = '', expiresAt = null } = req.body;

    if (!ipAddress || typeof ipAddress !== 'string') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Địa chỉ IP / CIDR là bắt buộc');
    }

    const trimmedIp = ipAddress.trim();
    // Kiểm tra trùng lặp
    const exists = mockIpStore.find(item => item.ipAddress === trimmedIp && item.type === type);
    if (exists) {
        throw new ApiError(httpStatus.CONFLICT, 'Quy tắc cho địa chỉ IP này đã tồn tại trong danh sách');
    }

    const newRecord: IPAccessRecord = {
        _id: `ip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ipAddress: trimmedIp,
        type: type as any,
        module: module as any,
        reason: reason.trim() || 'Không có lý do',
        expiresAt: expiresAt ? String(expiresAt) : null,
        createdBy: String(req.user?.username || 'admin'),
        createdAt: new Date().toISOString(),
        hitCount: 0,
        lastHitAt: null
    };

    mockIpStore.unshift(newRecord);
    return res.status(httpStatus.CREATED).send(newRecord);
});

export const updateIPAccess = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    const { type, module, reason, expiresAt } = req.body;

    const targetIndex = mockIpStore.findIndex(item => item._id === id);
    if (targetIndex === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy quy tắc IP');
    }

    const updated = { ...mockIpStore[targetIndex] };
    if (type) updated.type = type;
    if (module) updated.module = module;
    if (reason !== undefined) updated.reason = reason;
    if (expiresAt !== undefined) updated.expiresAt = expiresAt;

    mockIpStore[targetIndex] = updated as any;
    return res.send(updated);
});

export const deleteIPAccess = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    const targetIndex = mockIpStore.findIndex(item => item._id === id);
    if (targetIndex === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy quy tắc IP');
    }

    mockIpStore.splice(targetIndex, 1);
    return res.send({ ok: true });
});

// ==========================================
// THỜI GIAN THỰC (REALTIME STREAM SIMULATOR API)
// ==========================================
export const getRealtimeStream = catchAsync(async (req: AuthRequest, res: Response) => {
    const typesFilter = String(req.query.types || '').split(',').filter(Boolean);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));

    const possibleTypes = ['bet', 'deposit', 'withdraw', 'big_win', 'system_alert'];
    const activeTypes = typesFilter.length ? typesFilter : possibleTypes;

    // Khởi tạo luồng ngẫu nhiên động đậy
    const generatedEvents = [];
    const games = ['Baccarat Live', 'Gates of Olympus', 'Sweet Bonanza', 'Xổ Số Miền Bắc', 'Roulette VIP', 'Tài Xỉu MD5'];
    const users = ['nguyenvan_a', 'hoang_tuan', 'lethi_b', 'tran_minh99', 'jackpot_hunter', 'vip_player88'];

    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const t = activeTypes[Math.floor(Math.random() * activeTypes.length)];
        const evt: any = {
            id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            type: t,
            timestamp: new Date().toISOString(),
            username: users[Math.floor(Math.random() * users.length)]
        };

        if (t === 'bet') {
            evt.amount = (Math.floor(Math.random() * 50) + 10) * 1000;
            evt.gameName = games[Math.floor(Math.random() * games.length)];
            evt.severity = 'info';
        } else if (t === 'deposit') {
            evt.amount = (Math.floor(Math.random() * 200) + 50) * 10000;
            evt.severity = 'positive';
        } else if (t === 'withdraw') {
            evt.amount = (Math.floor(Math.random() * 100) + 20) * 10000;
            evt.severity = 'warning';
        } else if (t === 'big_win') {
            evt.amount = (Math.floor(Math.random() * 500) + 100) * 100000;
            evt.gameName = games[Math.floor(Math.random() * games.length)];
            evt.severity = 'positive';
        } else {
            evt.details = 'Đường truyền Provider BBIN gián đoạn nhẹ, đã tự động kết nối lại thành công.';
            evt.severity = 'error';
            delete evt.username;
        }
        generatedEvents.push(evt);
    }

    return res.send({
        events: generatedEvents.slice(0, limit),
        kpi: {
            eventsPerSec: +(12 + Math.random() * 5).toFixed(1),
            activeConnections: Math.floor(1100 + Math.random() * 300)
        }
    });
});
