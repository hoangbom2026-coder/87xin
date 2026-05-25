/**
 * Logo slider "Nhà cung cấp" trên Home — admin bật/tắt, thêm/bớt, sắp xếp.
 * Trường `logo`: tên file (vd `provider_sports_wbet.png`), đường dẫn `/images/...` hoặc URL đầy đủ.
 */
export interface IGameProviderItem {
    key: string;
    label: string;
    logo: string;
    /** Link khi click (tuỳ chọn). */
    href?: string;
    enabled: boolean;
    order: number;
}

const PROVIDER_FILES = [
    'provider_sports_wbet.png',
    'provider_sports_gss.png',
    'provider_sports_ag.png',
    'provider_sports_dg.png',
    'provider_sports_evo.png',
    'provider_sports_ezugi.png',
    'provider_sports_micro.png',
    'provider_sports_next.png',
    'provider_sports_pg.png',
    'provider_sports_play.png',
    'provider_sports_pp.png',
    'provider_sports_pt.png',
    'provider_sports_sa.png',
    'provider_sports_saba.png',
    'provider_sports_sbo.png'
];

const fileToKey = (f: string): string => {
    const base = f.replace(/^provider_sports_/i, '').replace(/\.(png|webp|svg)$/i, '');
    return base.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'provider';
};

const fileToLabel = (f: string): string => {
    const base = f.replace(/^provider_sports_/i, '').replace(/\.(png|webp|svg)$/i, '');
    return base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const DEFAULT_GAME_PROVIDERS: IGameProviderItem[] = PROVIDER_FILES.map((logo, i) => ({
    key: fileToKey(logo),
    label: fileToLabel(logo),
    logo,
    href: '',
    enabled: true,
    order: i + 1
}));

const asStr = (v: unknown, def: string): string => {
    if (typeof v !== 'string') return def;
    const s = v.trim();
    return s.length ? s : def;
};

const asBool = (v: unknown, def: boolean): boolean => {
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === 1 || v === '1') return true;
    if (v === 'false' || v === 0 || v === '0') return false;
    return def;
};

const asInt = (v: unknown, def: number): number => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? n : def;
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const sanitizeKey = (v: unknown, fallback: string): string => {
    const s = String(v ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');
    if (!s || !SLUG_RE.test(s)) return fallback;
    return s;
};

const normalizeOne = (
    input: Partial<IGameProviderItem>,
    fallbackKey: string,
    fallbackOrder: number
): IGameProviderItem => ({
    key: sanitizeKey(input.key, fallbackKey),
    label: asStr(input.label, fallbackKey),
    logo: asStr(input.logo, ''),
    href: asStr(input.href, ''),
    enabled: asBool(input.enabled, true),
    order: asInt(input.order, fallbackOrder)
});

/** Chuẩn hoá: key duy nhất, sort order, tối đa 80 mục. */
export function normalizeGameProviders(
    input: Partial<IGameProviderItem>[] | null | undefined
): IGameProviderItem[] {
    const arr = Array.isArray(input) ? input : [];
    const seen = new Set<string>();
    const out: IGameProviderItem[] = [];
    for (let i = 0; i < arr.length && out.length < 80; i++) {
        const raw = arr[i];
        if (!raw || typeof raw !== 'object') continue;
        const item = normalizeOne(raw, `p-${i + 1}`, i + 1);
        if (seen.has(item.key)) continue;
        seen.add(item.key);
        out.push(item);
    }
    return out.sort((a, b) => a.order - b.order);
}
