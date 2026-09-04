/** Một lobby duy nhất cho Lô đề · Xổ số · Quay số · Đấu trúng (GSC `LOTTERY`). */
export const LOTTERY_LOBBY_PATH = '/lottery'

/** Slug menu / URL → lobby `lottery`. */
export const LOTTERY_MENU_ALIASES = new Set([
  'lottery',
  'lo-de',
  'lode',
  'lo_de',
  'xo-so',
  'xo_so',
  'xoso',
  'quay-so',
  'quay_so',
  'dau-trung',
  'dautrung',
  'tab6',
])

export function isLotteryMenuKey(key: string): boolean {
  return LOTTERY_MENU_ALIASES.has(String(key || '').trim().toLowerCase())
}

export function isLotteryLobbyPath(pathname: string): boolean {
  const p = String(pathname || '')
    .replace(/\/+$/, '')
    .toLowerCase()
  if (p === LOTTERY_LOBBY_PATH) return true
  return (
    p.startsWith(`${LOTTERY_LOBBY_PATH}/`) ||
    p === '/lo-de' ||
    p.startsWith('/lo-de/') ||
    p === '/xo-so' ||
    p.startsWith('/xo-so/') ||
    p === '/xoso' ||
    p === '/quay-so' ||
    p.startsWith('/quay-so/') ||
    p === '/dau-trung' ||
    p.startsWith('/dau-trung/')
  )
}

/** Slug lobby API (`getGames`) — luôn `lottery`. */
export function lotteryLobbySlugFromKeyOrPath(keyOrPath: string): string {
  const raw = String(keyOrPath || '').trim().toLowerCase()
  if (isLotteryMenuKey(raw) || isLotteryLobbyPath(raw)) return 'lottery'
  return raw
}
