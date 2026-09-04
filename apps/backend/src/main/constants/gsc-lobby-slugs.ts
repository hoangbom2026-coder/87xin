/**
 * Chuẩn hóa slug lobby FE → một URL/API slug (GSC+ v2.0.6).
 */
export const SLOT_LOBBY_SLUG = 'slots';
export const SLOT_MENU_ALIASES = new Set(['slots', 'slot', 'no-hu', 'nohu', 'no_hu', 'tab3']);

export const LOTTERY_LOBBY_SLUG = 'lottery';
export const LOTTERY_MENU_ALIASES = new Set([
    'lottery',
    'lo-de',
    'lode',
    'lo_de',
    'xo-so',
    'xo_so',
    'xo so',
    'xoso',
    'quay-so',
    'quay_so',
    'dau-trung',
    'dautrung',
    'tab6'
]);

function firstPathSegment(keyOrPath: string): string {
    const raw = String(keyOrPath || '').trim().toLowerCase();
    if (!raw || raw === 'all') return raw;
    const noQuery = raw.split('?')[0];
    const path = noQuery.startsWith('/') ? noQuery.slice(1) : noQuery;
    return path.split('/')[0] || path;
}

export function isSlotLobbySlug(slug: string): boolean {
    return SLOT_MENU_ALIASES.has(firstPathSegment(slug));
}

export function isLotteryLobbySlug(slug: string): boolean {
    return LOTTERY_MENU_ALIASES.has(firstPathSegment(slug));
}

export function normalizeLobbySlug(keyOrPath: string): string {
    const seg = firstPathSegment(keyOrPath);
    if (!seg || seg === 'all') return seg;
    if (SLOT_MENU_ALIASES.has(seg)) return SLOT_LOBBY_SLUG;
    if (LOTTERY_MENU_ALIASES.has(seg)) return LOTTERY_LOBBY_SLUG;
    return seg;
}
