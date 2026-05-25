/**
 * GSC+ Seamless Wallet API v2.0.6 — Appendix Game Type.
 */
import { normalizeLobbySlug } from '@main/constants/gsc-lobby-slugs';

export const GSC_GAME_TYPES = [
    'SLOT',
    'LIVE_CASINO',
    'SPORT_BOOK',
    'VIRTUAL_SPORT',
    'LOTTERY',
    'QIPAI',
    'P2P',
    'FISHING',
    'COCK_FIGHTING',
    'BONUS',
    'ESPORT',
    'POKER',
    'OTHERS',
    'OTHER',
    'LIVE_CASINO_PREMIUM'
] as const;

export type GscGameType = (typeof GSC_GAME_TYPES)[number];

export const LOBBY_SLUG_TO_GSC_TYPES: Record<string, readonly GscGameType[]> = {
    slots: ['SLOT'],
    'no-hu': ['SLOT'],
    nohu: ['SLOT'],
    no_hu: ['SLOT'],
    slot: ['SLOT'],
    live: ['LIVE_CASINO', 'LIVE_CASINO_PREMIUM'],
    'live-casino': ['LIVE_CASINO', 'LIVE_CASINO_PREMIUM'],
    livecasino: ['LIVE_CASINO', 'LIVE_CASINO_PREMIUM'],
    casino: ['LIVE_CASINO', 'LIVE_CASINO_PREMIUM'],
    fishing: ['FISHING'],
    'ban-ca': ['FISHING'],
    table: ['QIPAI', 'P2P'],
    'game-bai': ['QIPAI', 'P2P'],
    'table-games': ['QIPAI', 'P2P'],
    sports: ['SPORT_BOOK', 'VIRTUAL_SPORT'],
    sport: ['SPORT_BOOK', 'VIRTUAL_SPORT'],
    cockfight: ['COCK_FIGHTING'],
    'da-ga': ['COCK_FIGHTING'],
    lottery: ['LOTTERY'],
    'xo-so': ['LOTTERY'],
    xoso: ['LOTTERY'],
    'lo-de': ['LOTTERY'],
    lode: ['LOTTERY'],
    'quay-so': ['LOTTERY'],
    'dau-trung': ['LOTTERY'],
    dautrung: ['LOTTERY'],
    esports: ['ESPORT'],
    'e-sports': ['ESPORT'],
    poker: ['POKER'],
    other: ['OTHER'],
    others: ['OTHER'],
    arcade: ['OTHER']
};

export function normalizeGscGameType(raw: string): string {
    const t = String(raw || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
    if (t === 'OTHERS') return 'OTHER';
    return t;
}

/** §3.4 — `ACTIVAT` (typo GSC) → `ACTIVATED`. */
export function normalizeGscGameStatus(raw: string): string {
    const s = String(raw || '').trim().toUpperCase();
    if (s === 'ACTIVAT' || s === 'ACTIVE' || s.startsWith('ACTIVAT')) return 'ACTIVATED';
    if (s === 'DEACTIVAT' || s.startsWith('DEACTIVAT')) return 'DEACTIVATED';
    return s;
}

export function isGscGameLaunchableStatus(status: string): boolean {
    return normalizeGscGameStatus(status) === 'ACTIVATED';
}

export function lobbySlugToGscGameTypes(slug: string): string[] {
    const key = normalizeLobbySlug(slug).trim().toLowerCase();
    if (!key || key === 'all') return [];
    const mapped = LOBBY_SLUG_TO_GSC_TYPES[key];
    if (mapped?.length) return [...mapped];
    const direct = normalizeGscGameType(key);
    if ((GSC_GAME_TYPES as readonly string[]).includes(direct)) return [direct];
    return [];
}

export function lobbySlugToPrimaryGscGameType(slug: string): string | undefined {
    return lobbySlugToGscGameTypes(slug)[0];
}

export function gameTypesForQuery(gameTypeOrSlug: string): string[] {
    const raw = String(gameTypeOrSlug || '').trim();
    if (!raw || raw.toLowerCase() === 'all') return [];
    if (raw.includes(',')) {
        return [...new Set(raw.split(',').map((p) => normalizeGscGameType(p)).filter(Boolean))];
    }
    const fromSlug = lobbySlugToGscGameTypes(raw);
    if (fromSlug.length) return fromSlug;
    const t = normalizeGscGameType(raw);
    return t ? [t] : [];
}
