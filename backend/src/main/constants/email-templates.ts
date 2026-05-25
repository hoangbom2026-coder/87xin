/**
 * Template email mặc định cho 6 sự kiện chính.
 * Dùng placeholder {var} — render bằng `renderEmailTemplate`.
 */
export interface IEmailEventDef {
    key: string;
    label: string;
    target: 'admin' | 'user';
    variables: string[];
    defaultSubject: string;
    defaultHtml: string;
}

export const EMAIL_EVENTS: IEmailEventDef[] = [
    {
        key: 'welcome_user',
        label: 'Chào mừng người chơi mới',
        target: 'user',
        variables: ['domain', 'username', 'support_email'],
        defaultSubject: 'Chào mừng {username} đến với {domain}',
        defaultHtml: `<h2>Xin chào {username}!</h2>
<p>Cảm ơn bạn đã đăng ký tại <strong>{domain}</strong>. Chúc bạn có những trải nghiệm tuyệt vời.</p>
<p>Nếu cần hỗ trợ, liên hệ {support_email}.</p>`
    },
    {
        key: 'otp_user',
        label: 'Mã OTP xác thực',
        target: 'user',
        variables: ['domain', 'username', 'otp', 'expires_in'],
        defaultSubject: 'Mã OTP của bạn — {domain}',
        defaultHtml: `<h2>Xin chào {username}</h2>
<p>Mã OTP của bạn: <h1 style="letter-spacing:6px">{otp}</h1></p>
<p>Mã hết hạn sau {expires_in} phút. Không chia sẻ với bất kỳ ai.</p>`
    },
    {
        key: 'deposit_success_user',
        label: 'Nạp tiền thành công',
        target: 'user',
        variables: ['domain', 'username', 'amount', 'method', 'trans_id', 'time'],
        defaultSubject: 'Đã nhận khoản nạp {amount} — {domain}',
        defaultHtml: `<p>Xin chào {username},</p>
<p>Khoản nạp <strong>{amount}</strong> qua {method} đã được ghi nhận.</p>
<ul><li>Mã giao dịch: {trans_id}</li><li>Thời gian: {time}</li></ul>`
    },
    {
        key: 'withdraw_success_user',
        label: 'Rút tiền thành công',
        target: 'user',
        variables: ['domain', 'username', 'amount', 'bank', 'account_number', 'trans_id', 'time'],
        defaultSubject: 'Đã chuyển khoản rút {amount} — {domain}',
        defaultHtml: `<p>Xin chào {username},</p>
<p>Yêu cầu rút <strong>{amount}</strong> tới {bank} {account_number} đã được xử lý.</p>
<p>Mã GD: {trans_id} — {time}</p>`
    },
    {
        key: 'kyc_status_user',
        label: 'Cập nhật trạng thái KYC',
        target: 'user',
        variables: ['domain', 'username', 'status', 'reason'],
        defaultSubject: 'Cập nhật KYC trên {domain}',
        defaultHtml: `<p>Xin chào {username},</p>
<p>Hồ sơ KYC của bạn hiện ở trạng thái: <strong>{status}</strong>.</p>
<p>Ghi chú: {reason}</p>`
    },
    {
        key: 'reset_password_user',
        label: 'Reset mật khẩu',
        target: 'user',
        variables: ['domain', 'username', 'reset_link', 'expires_in'],
        defaultSubject: 'Yêu cầu đặt lại mật khẩu — {domain}',
        defaultHtml: `<p>Xin chào {username},</p>
<p>Bấm vào link dưới đây để đặt lại mật khẩu (hết hạn sau {expires_in} phút):</p>
<p><a href="{reset_link}">{reset_link}</a></p>
<p>Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>`
    }
];

export const EMAIL_EVENT_MAP = EMAIL_EVENTS.reduce<Record<string, IEmailEventDef>>((acc, e) => {
    acc[e.key] = e;
    return acc;
}, {});

export function renderEmailTemplate(tpl: string, vars: Record<string, string | number | undefined>): string {
    let out = tpl;
    Object.entries(vars).forEach(([k, v]) => {
        out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v == null ? '' : String(v));
    });
    return out;
}
