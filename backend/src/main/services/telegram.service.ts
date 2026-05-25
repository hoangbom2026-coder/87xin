import axios from 'axios';
import SettingService from './setting.service';
import {
    buildDefaultTelegramTemplates,
    renderTelegramTemplate,
    TELEGRAM_EVENT_MAP,
    type ITelegramTemplate,
    type TelegramEventKey
} from '@main/constants/telegram-templates';

interface IBotConfig {
    enabled?: boolean;
    token?: string;
    adminChatId?: string;
    templates?: Record<string, ITelegramTemplate>;
    /** Backward-compat flags. */
    notifyNewDeposit?: boolean;
    notifyNewWithdraw?: boolean;
    notifyNewTicket?: boolean;
    notifyNewKyc?: boolean;
}

const getBotConfig = async (): Promise<IBotConfig | null> => {
    const settings = await SettingService.getSetting();
    if (!settings) return null;
    return (settings as unknown as { telegramBot?: IBotConfig }).telegramBot ?? null;
};

/** Gửi tin nhắn raw — bỏ qua nếu bot tắt hoặc thiếu config. */
const sendRaw = async (
    text: string,
    opts?: { chatId?: string; parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2' }
): Promise<{ ok: boolean; error?: string }> => {
    try {
        const cfg = await getBotConfig();
        if (!cfg || !cfg.enabled || !cfg.token) {
            return { ok: false, error: 'Bot disabled or missing token' };
        }
        const chatId = opts?.chatId ?? cfg.adminChatId;
        if (!chatId) return { ok: false, error: 'Missing chat id' };

        const url = `https://api.telegram.org/bot${cfg.token}/sendMessage`;
        await axios.post(
            url,
            {
                chat_id: chatId,
                text,
                parse_mode: opts?.parseMode ?? 'Markdown',
                disable_web_page_preview: true
            },
            { timeout: 10_000 }
        );
        return { ok: true };
    } catch (error) {
        const msg = (error as Error).message ?? 'Unknown error';
        console.error('Telegram sendRaw error:', msg);
        return { ok: false, error: msg };
    }
};

/**
 * Gửi notification dựa trên template. Nếu user không cấu hình template hoặc disabled → fallback default.
 * Nếu admin set `content` rỗng → KHÔNG gửi (theo HTML mẫu).
 */
const notify = async (
    eventKey: TelegramEventKey,
    vars: Record<string, string | number | undefined | null>,
    opts?: { chatId?: string }
): Promise<{ ok: boolean; error?: string }> => {
    const def = TELEGRAM_EVENT_MAP[eventKey];
    if (!def) return { ok: false, error: `Unknown event: ${eventKey}` };

    const cfg = await getBotConfig();
    if (!cfg) return { ok: false, error: 'No setting' };

    const tpl = cfg.templates?.[eventKey];
    if (tpl !== undefined) {
        if (tpl.enabled === false) return { ok: false, error: 'Event disabled' };
        if (typeof tpl.content === 'string' && tpl.content.trim() === '') {
            return { ok: false, error: 'Empty content (silenced)' };
        }
    }

    const content = (tpl && typeof tpl.content === 'string' && tpl.content.trim()) || def.defaultContent;

    const enrichedVars = {
        domain: vars.domain ?? process.env.PUBLIC_DOMAIN ?? '',
        time: vars.time ?? new Date().toLocaleString('vi-VN'),
        ...vars
    };
    const text = renderTelegramTemplate(content, enrichedVars);

    return sendRaw(text, { chatId: opts?.chatId, parseMode: 'Markdown' });
};

const notifyNewDeposit = async (
    username: string,
    amount: number,
    currency: string,
    extra?: Record<string, string | number>
) =>
    notify('new_deposit_admin', {
        username,
        amount: amount.toLocaleString('vi-VN'),
        currency,
        method: extra?.method ?? '',
        trans_id: extra?.trans_id ?? '',
        ip: extra?.ip ?? ''
    });

const notifyManualDepositPending = async (
    username: string,
    amount: number,
    currency: string,
    extra?: Record<string, string | number>
) =>
    notify('manual_deposit_pending_admin', {
        username,
        amount: amount.toLocaleString('vi-VN'),
        currency,
        channel: extra?.channel ?? 'manual',
        trans_id: extra?.trans_id ?? '',
        ip: extra?.ip ?? ''
    });

const notifyNewWithdraw = async (
    username: string,
    amount: number,
    currency: string,
    extra?: Record<string, string | number>
) =>
    notify('new_withdraw_admin', {
        username,
        amount: amount.toLocaleString('vi-VN'),
        currency,
        bank: extra?.bank ?? '',
        account_number: extra?.account_number ?? '',
        account_name: extra?.account_name ?? '',
        ip: extra?.ip ?? ''
    });

const notifyAffiliateWithdraw = async (
    username: string,
    amount: number,
    currency: string,
    extra?: Record<string, string | number>
) =>
    notify('affiliate_withdraw_admin', {
        username,
        amount: amount.toLocaleString('vi-VN'),
        currency,
        bank: extra?.bank ?? '',
        account_number: extra?.account_number ?? '',
        account_name: extra?.account_name ?? '',
        ip: extra?.ip ?? ''
    });

const notifyNewTicket = async (username: string, subject: string, extra?: Record<string, string>) =>
    notify('new_ticket_admin', {
        username,
        subject,
        content: extra?.content ?? '',
        category: extra?.category ?? '',
        ip: extra?.ip ?? ''
    });

const notifyTicketUserReply = async (
    username: string,
    subject: string,
    message: string,
    extra?: Record<string, string>
) =>
    notify('ticket_user_reply_admin', {
        username,
        subject,
        message,
        category: extra?.category ?? '',
        ip: extra?.ip ?? ''
    });

const notifyTicketAdminReply = async (
    userChatId: string | null,
    username: string,
    subject: string,
    message: string
) => {
    if (!userChatId) return { ok: false, error: 'No user chat id' };
    return notify('ticket_admin_reply_user', { username, subject, message }, { chatId: userChatId });
};

const notifyNewKyc = async (username: string, extra?: Record<string, string>) =>
    notify('new_kyc_admin', { username, ip: extra?.ip ?? '' });

const notifyNewRegister = async (
    username: string,
    email?: string,
    referral?: string,
    extra?: Record<string, string>
) =>
    notify('new_register_admin', {
        username,
        email: email ?? '',
        referral: referral ?? '',
        ip: extra?.ip ?? ''
    });

const notifyBigWin = async (
    username: string,
    game: string,
    bet: number,
    win: number,
    currency: string
) =>
    notify('big_win_admin', {
        username,
        game,
        bet: bet.toLocaleString('vi-VN'),
        win: win.toLocaleString('vi-VN'),
        currency
    });

const notifyGatewayError = async (
    gateway: string,
    username: string,
    amount: number,
    currency: string,
    httpCode: number | string,
    reason: string,
    extra?: Record<string, string>
) =>
    notify('gateway_error_admin', {
        gateway,
        username,
        amount: amount.toLocaleString('vi-VN'),
        currency,
        http_code: String(httpCode),
        reason,
        ip: extra?.ip ?? ''
    });

const notifyAction = async (username: string, action: string, extra?: Record<string, string>) =>
    notify('system_action_admin', { username, action, ip: extra?.ip ?? '' });

/** Trả về template hiệu lực (đã merge với mặc định). */
const getEffectiveTemplates = async (): Promise<Record<string, ITelegramTemplate>> => {
    const defaults = buildDefaultTelegramTemplates();
    const cfg = await getBotConfig();
    const stored = cfg?.templates ?? {};
    const out: Record<string, ITelegramTemplate> = {};
    for (const [k, v] of Object.entries(defaults)) {
        const t = stored[k];
        out[k] = {
            enabled: t?.enabled !== undefined ? Boolean(t.enabled) : v.enabled,
            content: typeof t?.content === 'string' ? t.content : v.content
        };
    }
    return out;
};

export default {
    sendRaw,
    notify,
    notifyNewDeposit,
    notifyManualDepositPending,
    notifyNewWithdraw,
    notifyAffiliateWithdraw,
    notifyNewTicket,
    notifyTicketUserReply,
    notifyTicketAdminReply,
    notifyNewKyc,
    notifyNewRegister,
    notifyBigWin,
    notifyGatewayError,
    notifyAction,
    getEffectiveTemplates,
    /** Alias backward-compat (controllers cũ đang gọi như vậy). */
    sendTelegramMessage: sendRaw
};
