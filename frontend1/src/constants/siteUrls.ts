/**
 * URL / email công khai khi deploy — dùng env để đổi môi trường, mặc định cuocbong99.live.
 */

function trimOrigin(url: string): string {
  return url.replace(/\/+$/, '')
}

const rawSite = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim()
export const SITE_ORIGIN = trimOrigin(rawSite || 'https://cuocbong99.live')

export const SUPPORT_EMAIL =
  (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || 'support@cuocbong99.live'

export const PRIVACY_EMAIL =
  (import.meta.env.VITE_PRIVACY_EMAIL as string | undefined)?.trim() || 'privacy@cuocbong99.live'

const rawTg = (import.meta.env.VITE_TELEGRAM_SUPPORT_URL as string | undefined)?.trim()
export const TELEGRAM_SUPPORT_URL = rawTg || 'https://t.me/cuocbong99_support'

export const TELEGRAM_SUPPORT_HANDLE = '@cuocbong99_support'

/** Trang đăng ký với query chuẩn backend (ưu tiên inviteCode, fallback ref = username). */
export function referralRegisterUrl(user?: { inviteCode?: string; username?: string } | null): string {
  const base = `${SITE_ORIGIN}/register`
  const code = user?.inviteCode?.trim()
  if (code) return `${base}?inviteCode=${encodeURIComponent(code)}`
  const ref = user?.username?.trim()
  if (ref) return `${base}?ref=${encodeURIComponent(ref)}`
  return base
}

export function mailtoSupport(): string {
  return `mailto:${SUPPORT_EMAIL}`
}

/** Chuẩn hóa link Telegram từ cấu hình site (username, @user, hoặc URL đầy đủ). */
export function telegramHrefFromSetting(raw?: string | null): string {
  const s = (raw || '').trim()
  if (!s) return TELEGRAM_SUPPORT_URL
  if (s.startsWith('http')) return s
  return `https://t.me/${s.replace(/^@/, '')}`
}
