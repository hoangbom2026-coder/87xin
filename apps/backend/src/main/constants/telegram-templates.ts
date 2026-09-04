/**
 * Danh sách event Telegram + template mặc định cho dự án (Casino · Sport · Ví · Affiliate).
 * Template dùng placeholder `{var}`. Ngôn ngữ chấp nhận Markdown của Telegram.
 */

export type TelegramTarget = 'admin' | 'user';

export type TelegramEventKey =
    | 'new_deposit_admin'
    | 'deposit_success_user'
    | 'manual_deposit_pending_admin'
    | 'new_withdraw_admin'
    | 'withdraw_processed_user'
    | 'affiliate_withdraw_admin'
    | 'new_ticket_admin'
    | 'ticket_user_reply_admin'
    | 'ticket_admin_reply_user'
    | 'new_kyc_admin'
    | 'new_register_admin'
    | 'login_user'
    | 'big_win_admin'
    | 'gateway_error_admin'
    | 'system_action_admin';

export interface ITelegramEventDef {
    key: TelegramEventKey;
    label: string;
    target: TelegramTarget;
    color: 'success' | 'info' | 'warning' | 'danger' | 'primary' | 'secondary';
    icon: string;
    variables: string[];
    defaultContent: string;
}

export const TELEGRAM_EVENTS: ITelegramEventDef[] = [
    {
        key: 'new_deposit_admin',
        label: 'Yêu cầu nạp tiền mới (Admin)',
        target: 'admin',
        color: 'success',
        icon: 'shopping-cart',
        variables: ['domain', 'username', 'amount', 'currency', 'method', 'trans_id', 'ip', 'time'],
        defaultContent:
            '🔔 *YÊU CẦU NẠP TIỀN MỚI*\n\n' +
            '👤 *Người dùng:* `{username}`\n' +
            '💰 *Số tiền:* *{amount} {currency}*\n' +
            '🏦 *Phương thức:* {method}\n' +
            '🆔 *Mã GD:* `{trans_id}`\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'deposit_success_user',
        label: 'Nạp tiền thành công (User)',
        target: 'user',
        color: 'info',
        icon: 'check-circle',
        variables: ['domain', 'username', 'amount', 'currency', 'new_balance', 'trans_id', 'time'],
        defaultContent:
            '✅ *NẠP TIỀN THÀNH CÔNG!*\n\n' +
            'Xin chào *{username}*! 🎉\n' +
            'Bạn vừa nạp *{amount} {currency}* vào tài khoản.\n\n' +
            '💳 *Số dư hiện tại:* {new_balance} {currency}\n' +
            '🆔 *Mã GD:* `{trans_id}`\n' +
            '🕐 {time}\n\n' +
            'Cảm ơn bạn đã tin tưởng {domain}! 💖'
    },
    {
        key: 'manual_deposit_pending_admin',
        label: 'Nạp tay chờ duyệt (Admin)',
        target: 'admin',
        color: 'warning',
        icon: 'clock',
        variables: ['domain', 'username', 'amount', 'currency', 'channel', 'trans_id', 'ip', 'time'],
        defaultContent:
            '⏳ *NẠP TAY CHỜ DUYỆT*\n\n' +
            '👤 *Khách hàng:* `{username}`\n' +
            '💰 *Số tiền:* *{amount} {currency}*\n' +
            '🏦 *Kênh:* {channel}\n' +
            '🆔 *Mã GD:* `{trans_id}`\n\n' +
            '⚠️ Vui lòng kiểm tra & duyệt!\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'new_withdraw_admin',
        label: 'Yêu cầu rút tiền (Admin)',
        target: 'admin',
        color: 'warning',
        icon: 'money-bill-wave',
        variables: [
            'domain',
            'username',
            'amount',
            'currency',
            'bank',
            'account_number',
            'account_name',
            'ip',
            'time'
        ],
        defaultContent:
            '💸 *YÊU CẦU RÚT TIỀN*\n\n' +
            '👤 *Người dùng:* `{username}`\n' +
            '💰 *Số tiền:* *{amount} {currency}*\n\n' +
            '🏦 *Thông tin ngân hàng:*\n' +
            '• Ngân hàng: {bank}\n' +
            '• Số TK: `{account_number}`\n' +
            '• Chủ TK: {account_name}\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'withdraw_processed_user',
        label: 'Rút tiền đã xử lý (User)',
        target: 'user',
        color: 'info',
        icon: 'check',
        variables: ['domain', 'username', 'amount', 'currency', 'status', 'time'],
        defaultContent:
            '🏦 *KẾT QUẢ RÚT TIỀN*\n\n' +
            'Xin chào *{username}*!\n' +
            'Lệnh rút *{amount} {currency}* của bạn đã *{status}*.\n\n' +
            '🕐 {time}\n' +
            '🌐 {domain}'
    },
    {
        key: 'affiliate_withdraw_admin',
        label: 'Rút hoa hồng affiliate (Admin)',
        target: 'admin',
        color: 'info',
        icon: 'badge-percent',
        variables: ['domain', 'username', 'amount', 'currency', 'bank', 'account_number', 'account_name', 'ip', 'time'],
        defaultContent:
            '💵 *YÊU CẦU RÚT HOA HỒNG*\n\n' +
            '👤 *Người dùng:* `{username}`\n' +
            '💰 *Số tiền:* *{amount} {currency}*\n\n' +
            '🏦 *Ngân hàng:* {bank}\n' +
            '🔢 *Số TK:* `{account_number}`\n' +
            '👤 *Chủ TK:* {account_name}\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'new_ticket_admin',
        label: 'Ticket hỗ trợ mới (Admin)',
        target: 'admin',
        color: 'secondary',
        icon: 'ticket-alt',
        variables: ['domain', 'username', 'subject', 'content', 'category', 'ip', 'time'],
        defaultContent:
            '🎫 *TICKET MỚI*\n\n' +
            '👤 *Khách hàng:* `{username}`\n' +
            '📋 *Tiêu đề:* {subject}\n' +
            '📁 *Danh mục:* {category}\n\n' +
            '💬 *Nội dung:*\n{content}\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'ticket_user_reply_admin',
        label: 'User trả lời ticket (Admin)',
        target: 'admin',
        color: 'secondary',
        icon: 'reply',
        variables: ['domain', 'username', 'subject', 'message', 'category', 'ip', 'time'],
        defaultContent:
            '💬 *PHẢN HỒI TICKET*\n\n' +
            '👤 *Khách hàng:* `{username}`\n' +
            '📋 *Tiêu đề:* {subject}\n\n' +
            '💬 {message}\n\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'ticket_admin_reply_user',
        label: 'Admin trả lời ticket (User)',
        target: 'user',
        color: 'secondary',
        icon: 'reply',
        variables: ['username', 'subject', 'message', 'time'],
        defaultContent:
            '📩 *ADMIN ĐÃ TRẢ LỜI TICKET*\n\n' +
            'Xin chào *{username}*!\n' +
            'Ticket *"{subject}"* vừa có phản hồi:\n\n' +
            '💬 {message}\n\n' +
            '🕐 {time}'
    },
    {
        key: 'new_kyc_admin',
        label: 'Yêu cầu xác minh KYC (Admin)',
        target: 'admin',
        color: 'primary',
        icon: 'id-card',
        variables: ['domain', 'username', 'ip', 'time'],
        defaultContent:
            '🆔 *YÊU CẦU XÁC MINH KYC*\n\n' +
            '👤 *Người dùng:* `{username}`\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'new_register_admin',
        label: 'Đăng ký mới (Admin)',
        target: 'admin',
        color: 'primary',
        icon: 'user-plus',
        variables: ['domain', 'username', 'email', 'referral', 'ip', 'time'],
        defaultContent:
            '👋 *ĐĂNG KÝ MỚI*\n\n' +
            '👤 *Username:* `{username}`\n' +
            '📧 *Email:* {email}\n' +
            '🎁 *Mã giới thiệu:* {referral}\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'login_user',
        label: 'Đăng nhập (User)',
        target: 'user',
        color: 'secondary',
        icon: 'sign-in-alt',
        variables: ['domain', 'username', 'ip', 'device', 'time'],
        defaultContent:
            '🔐 *ĐĂNG NHẬP THÀNH CÔNG*\n\n' +
            'Xin chào *{username}*!\n' +
            'Tài khoản vừa đăng nhập:\n\n' +
            '📍 *IP:* {ip}\n' +
            '📱 *Thiết bị:* {device}\n' +
            '🕐 *Thời gian:* {time}\n\n' +
            '🌐 {domain}\n' +
            'Nếu không phải bạn, hãy đổi mật khẩu ngay! ⚠️'
    },
    {
        key: 'big_win_admin',
        label: 'Thắng lớn (Admin)',
        target: 'admin',
        color: 'success',
        icon: 'trophy',
        variables: ['domain', 'username', 'game', 'bet', 'win', 'currency', 'time'],
        defaultContent:
            '🏆 *THẮNG LỚN!*\n\n' +
            '👤 *Người chơi:* `{username}`\n' +
            '🎰 *Game:* {game}\n' +
            '💰 *Cược:* {bet} {currency}\n' +
            '🎉 *Thắng:* *{win} {currency}*\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time}'
    },
    {
        key: 'gateway_error_admin',
        label: 'Lỗi cổng thanh toán (Admin)',
        target: 'admin',
        color: 'danger',
        icon: 'plug',
        variables: ['domain', 'gateway', 'username', 'amount', 'currency', 'http_code', 'reason', 'ip', 'time'],
        defaultContent:
            '🔴 *LỖI CỔNG THANH TOÁN*\n\n' +
            '⚠️ Cổng *{gateway}* gặp sự cố!\n\n' +
            '👤 *Người dùng:* `{username}`\n' +
            '💰 *Số tiền:* {amount} {currency}\n' +
            '🔴 *HTTP:* `{http_code}`\n' +
            '📝 *Lý do:* {reason}\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    },
    {
        key: 'system_action_admin',
        label: 'Hành động hệ thống (Admin)',
        target: 'admin',
        color: 'info',
        icon: 'tasks',
        variables: ['domain', 'username', 'action', 'ip', 'time'],
        defaultContent:
            '📝 *HÀNH ĐỘNG HỆ THỐNG*\n\n' +
            '👤 *Người dùng:* `{username}`\n' +
            '🔧 *Hành động:* {action}\n\n' +
            '🌐 {domain}\n' +
            '🕐 {time} | 📍 {ip}'
    }
];

export const TELEGRAM_EVENT_KEYS: TelegramEventKey[] = TELEGRAM_EVENTS.map((e) => e.key);

export const TELEGRAM_EVENT_MAP = TELEGRAM_EVENTS.reduce(
    (acc, e) => {
        acc[e.key] = e;
        return acc;
    },
    {} as Record<TelegramEventKey, ITelegramEventDef>
);

export interface ITelegramTemplate {
    enabled: boolean;
    content: string;
}

/** Trả về map mặc định { key: { enabled, content } }. */
export const buildDefaultTelegramTemplates = (): Record<string, ITelegramTemplate> => {
    const out: Record<string, ITelegramTemplate> = {};
    for (const ev of TELEGRAM_EVENTS) {
        out[ev.key] = { enabled: true, content: ev.defaultContent };
    }
    return out;
};

/** Render template — thay {var} bằng giá trị, biến chưa có giá trị giữ nguyên. */
export const renderTelegramTemplate = (
    template: string,
    vars: Record<string, string | number | undefined | null>
): string => {
    return String(template ?? '').replace(/\{(\w+)\}/g, (_, name: string) => {
        const v = vars[name];
        if (v === undefined || v === null) return `{${name}}`;
        return String(v);
    });
};
