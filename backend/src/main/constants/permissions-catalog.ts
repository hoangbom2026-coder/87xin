/**
 * Catalog quyền chia theo nhóm — admin sẽ chọn checkbox theo nhóm.
 * Key permission đặt theo namespace: <module>.<action>.
 */
export interface IPermDef {
    key: string;
    label: string;
}
export interface IPermGroup {
    key: string;
    label: string;
    icon?: string;
    perms: IPermDef[];
}

export const PERMISSION_GROUPS: IPermGroup[] = [
    {
        key: 'users',
        label: 'Người dùng & KYC',
        icon: 'users',
        perms: [
            { key: 'users.view', label: 'Xem danh sách người dùng' },
            { key: 'users.edit', label: 'Sửa hồ sơ / chặn / mở khóa' },
            { key: 'users.password_reset', label: 'Đặt lại mật khẩu' },
            { key: 'kyc.view', label: 'Xem KYC' },
            { key: 'kyc.review', label: 'Duyệt / từ chối KYC' }
        ]
    },
    {
        key: 'support',
        label: 'Chăm sóc khách hàng',
        icon: 'heart',
        perms: [
            { key: 'support.chat', label: 'Live chat CSKH' },
            { key: 'tickets.view', label: 'Xem tickets' },
            { key: 'tickets.reply', label: 'Trả lời / đóng tickets' },
            { key: 'help_center.edit', label: 'Sửa Help Center / FAQ' },
            { key: 'notifications.send', label: 'Gửi thông báo đẩy' }
        ]
    },
    {
        key: 'finance',
        label: 'Tài chính',
        icon: 'wallet',
        perms: [
            { key: 'finance.view', label: 'Xem tổng hợp tài chính' },
            { key: 'deposits.review', label: 'Duyệt / từ chối nạp' },
            { key: 'withdrawals.review', label: 'Duyệt / từ chối rút' },
            { key: 'manual_payments.process', label: 'Xử lý thanh toán tay' },
            { key: 'gateways.edit', label: 'Cấu hình cổng thanh toán' },
            { key: 'currencies.edit', label: 'Cấu hình tiền tệ' }
        ]
    },
    {
        key: 'affiliate',
        label: 'Affiliate',
        icon: 'network',
        perms: [
            { key: 'affiliate.view', label: 'Xem dashboard affiliate' },
            { key: 'affiliate.edit', label: 'Sửa cấu hình chương trình' },
            { key: 'affiliate.payout', label: 'Chạy/duyệt payout' },
            { key: 'rewards.edit', label: 'Sửa rewards' }
        ]
    },
    {
        key: 'marketing',
        label: 'Marketing & Nội dung',
        icon: 'megaphone',
        perms: [
            { key: 'banners.edit', label: 'Sửa banner' },
            { key: 'promotions.edit', label: 'Sửa promotions / bonus rules' },
            { key: 'content_blocks.edit', label: 'Sửa khối nội dung' },
            { key: 'media.upload', label: 'Upload thư viện' },
            { key: 'media.delete', label: 'Xóa thư viện' }
        ]
    },
    {
        key: 'games',
        label: 'Game & VIP',
        icon: 'briefcase',
        perms: [
            { key: 'games.view', label: 'Xem danh sách game' },
            { key: 'games.edit', label: 'Bật/tắt game / sửa metadata' },
            { key: 'vip.edit', label: 'Cấu hình VIP' }
        ]
    },
    {
        key: 'system',
        label: 'Hệ thống',
        icon: 'settings',
        perms: [
            { key: 'system.settings', label: 'Cài đặt site' },
            { key: 'system.email', label: 'Cấu hình email' },
            { key: 'system.telegram', label: 'Cấu hình Telegram' },
            { key: 'system.cache', label: 'Quản lý cache' },
            { key: 'system.languages', label: 'Quản lý ngôn ngữ' },
            { key: 'plugins.manage', label: 'Quản lý plugins' }
        ]
    },
    {
        key: 'admins',
        label: 'Quản trị viên',
        icon: 'shield',
        perms: [
            { key: 'admins.view', label: 'Xem danh sách admin' },
            { key: 'admins.create', label: 'Thêm admin' },
            { key: 'admins.edit', label: 'Sửa / hạ quyền admin' },
            { key: 'roles.manage', label: 'Quản lý vai trò' }
        ]
    },
    {
        key: 'reports',
        label: 'Báo cáo & Nhật ký',
        icon: 'bar-chart',
        perms: [
            { key: 'reports.view', label: 'Xem báo cáo' },
            { key: 'audit.view', label: 'Xem audit log' },
            { key: 'logs.commissions', label: 'Xem hoa hồng' },
            { key: 'newsletter.manage', label: 'Quản lý newsletter' }
        ]
    }
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) =>
    g.perms.map((p) => p.key)
);

export const ALL_PERMISSION_KEY_SET = new Set<string>(ALL_PERMISSION_KEYS);

/** 3 system roles mặc định, sẽ được seed nếu chưa tồn tại (slug duy nhất). */
export interface ISystemRoleDef {
    slug: string;
    name: string;
    description: string;
    permissions: string[];
    /** Hiển thị trên UI nhưng không cho sửa quyền & xóa. */
    locked: boolean;
}

export const SYSTEM_ROLES: ISystemRoleDef[] = [
    {
        slug: 'owner',
        name: 'Owner',
        description: 'Toàn quyền hệ thống — không thể chỉnh sửa hoặc xóa.',
        permissions: ALL_PERMISSION_KEYS, // *
        locked: true
    },
    {
        slug: 'administrator',
        name: 'Administrator',
        description: 'Quản trị viên đầy đủ quyền vận hành.',
        permissions: ALL_PERMISSION_KEYS,
        locked: true
    },
    {
        slug: 'moderator',
        name: 'Moderator',
        description: 'Vai trò mẫu cho moderator chat & ticket — có thể clone.',
        permissions: [
            'support.chat',
            'tickets.view',
            'tickets.reply',
            'users.view',
            'users.edit',
            'help_center.edit',
            'notifications.send'
        ],
        locked: false
    }
];
