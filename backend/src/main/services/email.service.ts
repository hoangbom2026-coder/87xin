import nodemailer, { Transporter } from 'nodemailer';
import settingService from './setting.service';
import { EMAIL_EVENTS, EMAIL_EVENT_MAP, renderEmailTemplate } from '@main/constants/email-templates';

interface ICachedTransport {
    key: string;
    transporter: Transporter;
}
let cached: ICachedTransport | null = null;

async function getConfig() {
    const setting = await settingService.getSetting();
    return setting?.toObject?.()?.emailConfig as
        | {
              enabled: boolean;
              from: string;
              replyTo?: string;
              smtpHost: string;
              smtpPort: number;
              smtpSecure: boolean;
              smtpUser: string;
              smtpPass: string;
              templates?: Record<string, { enabled: boolean; subject: string; html: string }>;
          }
        | undefined;
}

async function getTransporter(): Promise<Transporter | null> {
    const cfg = await getConfig();
    if (!cfg || !cfg.enabled || !cfg.smtpHost || !cfg.smtpUser) return null;
    const key = `${cfg.smtpHost}:${cfg.smtpPort}:${cfg.smtpUser}:${cfg.smtpSecure}`;
    if (cached && cached.key === key) return cached.transporter;
    const transporter = nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort,
        secure: !!cfg.smtpSecure,
        auth: { user: cfg.smtpUser, pass: cfg.smtpPass }
    });
    cached = { key, transporter };
    return transporter;
}

/** Gửi email theo eventKey với template lưu trong setting (fallback default). */
async function sendEvent(eventKey: string, to: string, vars: Record<string, string | number>) {
    const cfg = await getConfig();
    if (!cfg || !cfg.enabled) return { sent: false, reason: 'disabled' };
    const def = EMAIL_EVENT_MAP[eventKey];
    if (!def) return { sent: false, reason: 'unknown_event' };
    const stored = cfg.templates?.[eventKey];
    const enabled = stored?.enabled ?? true;
    if (!enabled) return { sent: false, reason: 'event_disabled' };
    const subjectTpl = stored?.subject?.trim() || def.defaultSubject;
    const htmlTpl = stored?.html?.trim() || def.defaultHtml;
    if (!subjectTpl || !htmlTpl) return { sent: false, reason: 'empty_template' };
    const transporter = await getTransporter();
    if (!transporter) return { sent: false, reason: 'no_transporter' };

    try {
        const info = await transporter.sendMail({
            from: cfg.from || cfg.smtpUser,
            to,
            replyTo: cfg.replyTo || undefined,
            subject: renderEmailTemplate(subjectTpl, vars),
            html: renderEmailTemplate(htmlTpl, vars)
        });
        return { sent: true, messageId: info.messageId };
    } catch (e) {
        return { sent: false, reason: 'smtp_error', error: (e as Error).message };
    }
}

/** Gửi raw email (dùng cho test). */
async function sendRaw(to: string, subject: string, html: string) {
    const cfg = await getConfig();
    if (!cfg || !cfg.enabled) throw new Error('Email service disabled');
    const transporter = await getTransporter();
    if (!transporter) throw new Error('Cannot create SMTP transporter (check config)');
    const info = await transporter.sendMail({
        from: cfg.from || cfg.smtpUser,
        to,
        replyTo: cfg.replyTo || undefined,
        subject,
        html
    });
    return info;
}

function getEffectiveTemplates(stored?: Record<string, { enabled: boolean; subject: string; html: string }>) {
    return EMAIL_EVENTS.map((def) => {
        const s = stored?.[def.key];
        return {
            ...def,
            enabled: s?.enabled ?? true,
            subject: s?.subject ?? def.defaultSubject,
            html: s?.html ?? def.defaultHtml
        };
    });
}

function clearTransporterCache() {
    cached = null;
}

export default {
    sendEvent,
    sendRaw,
    getEffectiveTemplates,
    clearTransporterCache
};
