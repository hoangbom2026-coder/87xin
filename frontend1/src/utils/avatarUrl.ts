/** Ảnh avatar mặc định (file duy nhất trong `public/images/avatar/`). */
export const DEFAULT_AVATAR = '/images/avatar/avatar-default.png'

/**
 * Trả về URL avatar dạng initials (ui-avatars). Chỉ dùng khi cần avatar
 * sinh động theo tên (ví dụ list đại lý / leaderboard). Mặc định người dùng
 * thường — gọi `resolveAvatar(profile)` để fallback về ảnh local đẹp hơn.
 */
export function uiAvatarUrl(name: string, opts?: { bg?: string; color?: string }): string {
  const n = encodeURIComponent((name || '?').slice(0, 60))
  const bg = opts?.bg ?? '171f2b'
  const color = opts?.color ?? 'fff'
  return `https://ui-avatars.com/api/?name=${n}&background=${bg}&color=${color}&bold=true`
}

const LEGACY_BAD_AVATARS = new Set(['avatar1.png', 'avatar.png', 'avatar.jpg', 'default.png', 'default.jpg'])

/** Avatar cuối cùng cho profile / header — ưu tiên URL/đường dẫn hợp lệ, fallback local. */
export function resolveAvatar(profile?: { avatar?: string | null } | null): string {
  const raw = (profile?.avatar || '').trim()
  if (!raw) return DEFAULT_AVATAR
  const lower = raw.toLowerCase()
  if (LEGACY_BAD_AVATARS.has(lower)) return DEFAULT_AVATAR
  // Chỉ chấp nhận URL tuyệt đối hoặc đường dẫn bắt đầu bằng / (tránh "avatar1.png" → request sai)
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw
  return DEFAULT_AVATAR
}
