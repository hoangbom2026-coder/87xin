/**
 * VIP Tiers — Dynamic Config.
 * Admin chỉnh các cột mốc (cược, thưởng, hoàn trả…) → trang VIP và logic thăng hạng đọc DB.
 *
 * Units gợi ý:
 *  - minValidBet, upReward, lossReturnMax, fridayBonusMax: VND (số nguyên).
 *  - cashbackRate, lossReturnRate, fridayBonusRate: %, ∈ [0, 100] (vd 1.5 = 1.5%).
 */
export interface IVipTier {
    level: number;
    name: string;
    /** Tiền cược hợp lệ tích lũy yêu cầu để giữ/thăng hạng (VND). 0 = không yêu cầu. */
    minValidBet: number;
    /** Tiền thưởng lên cấp (VND). */
    upReward: number;
    /** % hoàn tiền (cashback) (ví dụ 1.5 = 1.5%). */
    cashbackRate: number;
    /** % hoàn trả tổn thất. */
    lossReturnRate: number;
    /** Hoàn trả tổn thất tối đa (VND). */
    lossReturnMax: number;
    /** % thưởng nạp thứ Sáu. */
    fridayBonusRate: number;
    /** Thưởng nạp thứ Sáu tối đa (VND). */
    fridayBonusMax: number;
    /** Ảnh badge VIP (tròn) — vd `/images/pages/vip/vip-3.png`. */
    badgeImage: string;
    /** Ảnh card (nền card) — optional. */
    cardImage: string;
    /** Màu chủ đạo card (HEX). */
    colorCode: string;
}

export const DEFAULT_VIP_TIERS: IVipTier[] = [
    {
        level: 1, name: 'VIP 1',
        minValidBet: 100_000_000, upReward: 90_000,
        cashbackRate: 1.1, lossReturnRate: 0, lossReturnMax: 0,
        fridayBonusRate: 5, fridayBonusMax: 800_000,
        badgeImage: '/images/pages/vip/vip-1.png', cardImage: '', colorCode: '#d97706'
    },
    {
        level: 2, name: 'VIP 2',
        minValidBet: 500_000_000, upReward: 200_000,
        cashbackRate: 1.15, lossReturnRate: 0, lossReturnMax: 0,
        fridayBonusRate: 6, fridayBonusMax: 1_500_000,
        badgeImage: '/images/pages/vip/vip-2.png', cardImage: '', colorCode: '#10b981'
    },
    {
        level: 3, name: 'VIP 3',
        minValidBet: 1_000_000_000, upReward: 500_000,
        cashbackRate: 1.2, lossReturnRate: 5, lossReturnMax: 300_000,
        fridayBonusRate: 6, fridayBonusMax: 2_000_000,
        badgeImage: '/images/pages/vip/vip-3.png', cardImage: '', colorCode: '#3b82f6'
    },
    {
        level: 4, name: 'VIP 4',
        minValidBet: 3_000_000_000, upReward: 1_000_000,
        cashbackRate: 1.25, lossReturnRate: 6, lossReturnMax: 600_000,
        fridayBonusRate: 7, fridayBonusMax: 3_000_000,
        badgeImage: '/images/pages/vip/vip-4.png', cardImage: '', colorCode: '#f43f5e'
    },
    {
        level: 5, name: 'VIP 5',
        minValidBet: 7_000_000_000, upReward: 3_000_000,
        cashbackRate: 1.3, lossReturnRate: 7, lossReturnMax: 1_500_000,
        fridayBonusRate: 8, fridayBonusMax: 4_000_000,
        badgeImage: '/images/pages/vip/vip-5.png', cardImage: '', colorCode: '#7c3aed'
    },
    {
        level: 6, name: 'VIP 6',
        minValidBet: 15_000_000_000, upReward: 6_000_000,
        cashbackRate: 1.35, lossReturnRate: 8, lossReturnMax: 3_000_000,
        fridayBonusRate: 9, fridayBonusMax: 4_500_000,
        badgeImage: '/images/pages/vip/vip-1.png', cardImage: '', colorCode: '#ec4899'
    },
    {
        level: 7, name: 'VIP 7',
        minValidBet: 30_000_000_000, upReward: 10_000_000,
        cashbackRate: 1.4, lossReturnRate: 10, lossReturnMax: 6_000_000,
        fridayBonusRate: 9, fridayBonusMax: 4_500_000,
        badgeImage: '/images/pages/vip/vip-2.png', cardImage: '', colorCode: '#a855f7'
    },
    {
        level: 8, name: 'VIP 8',
        minValidBet: 45_000_000_000, upReward: 15_000_000,
        cashbackRate: 1.45, lossReturnRate: 13, lossReturnMax: 8_000_000,
        fridayBonusRate: 10, fridayBonusMax: 5_000_000,
        badgeImage: '/images/pages/vip/vip-3.png', cardImage: '', colorCode: '#dc2626'
    },
    {
        level: 9, name: 'VIP 9',
        minValidBet: 90_000_000_000, upReward: 50_000_000,
        cashbackRate: 1.5, lossReturnRate: 15, lossReturnMax: 25_000_000,
        fridayBonusRate: 10, fridayBonusMax: 5_000_000,
        badgeImage: '/images/pages/vip/vip-4.png', cardImage: '', colorCode: '#f59e0b'
    },
    {
        level: 10, name: 'VIP 10',
        minValidBet: 0, upReward: 0,
        cashbackRate: 0, lossReturnRate: 0, lossReturnMax: 0,
        fridayBonusRate: 0, fridayBonusMax: 0,
        badgeImage: '/images/pages/vip/vip-5.png', cardImage: '', colorCode: '#ef4444'
    }
];

const clampPct = (v: unknown, def: number): number => {
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
};

const nonNeg = (v: unknown, def: number): number => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return def;
    return n;
};

const asLevel = (v: unknown, fallback: number): number => {
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n) || n < 1 || n > 50) return fallback;
    return n;
};

const asStr = (v: unknown, def: string): string => {
    if (typeof v !== 'string') return def;
    const s = v.trim();
    return s.length ? s : def;
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const asColor = (v: unknown, def: string): string => {
    if (typeof v !== 'string') return def;
    const s = v.trim();
    if (!s) return def;
    if (HEX_RE.test(s)) return s;
    return def;
};

/**
 * Chuẩn hoá một tier — đảm bảo đủ field, kiểu đúng, % trong [0,100], số ≥ 0.
 */
const normalizeOne = (input: Partial<IVipTier>, fallback: IVipTier): IVipTier => ({
    level: asLevel(input.level, fallback.level),
    name: asStr(input.name, fallback.name),
    minValidBet: nonNeg(input.minValidBet, fallback.minValidBet),
    upReward: nonNeg(input.upReward, fallback.upReward),
    cashbackRate: clampPct(input.cashbackRate, fallback.cashbackRate),
    lossReturnRate: clampPct(input.lossReturnRate, fallback.lossReturnRate),
    lossReturnMax: nonNeg(input.lossReturnMax, fallback.lossReturnMax),
    fridayBonusRate: clampPct(input.fridayBonusRate, fallback.fridayBonusRate),
    fridayBonusMax: nonNeg(input.fridayBonusMax, fallback.fridayBonusMax),
    badgeImage: asStr(input.badgeImage, fallback.badgeImage),
    cardImage: typeof input.cardImage === 'string' ? input.cardImage : fallback.cardImage,
    colorCode: asColor(input.colorCode, fallback.colorCode)
});

/**
 * Chuẩn hoá toàn bộ mảng:
 *  - đảm bảo có 10 cấp (level 1..10).
 *  - sort tăng dần theo level.
 *  - nếu admin thiếu cấp nào → lấy từ DEFAULT.
 */
export function normalizeVipTiers(
    input: Partial<IVipTier>[] | null | undefined
): IVipTier[] {
    const arr = Array.isArray(input) ? input : [];
    const byLevel = new Map<number, Partial<IVipTier>>();
    for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        const lv = asLevel(item.level, 0);
        if (lv >= 1 && lv <= 10) byLevel.set(lv, item);
    }
    return DEFAULT_VIP_TIERS.map((def) => {
        const found = byLevel.get(def.level);
        return found ? normalizeOne(found, def) : { ...def };
    }).sort((a, b) => a.level - b.level);
}
