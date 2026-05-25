import SettingModel from '@main/models/setting.model';
import {
    DEFAULT_VIP_TIERS,
    IVipTier,
    normalizeVipTiers
} from '@main/constants/vip-tiers-defaults';
import { logAdminAction } from '@main/services/admin-audit.service';

const CACHE_TTL_MS = 60_000;
let cached: { value: IVipTier[]; expireAt: number } | null = null;

const readFromDb = async (): Promise<IVipTier[]> => {
    const doc = await SettingModel.findOne({ name: 'setting' }, { vipTiers: 1 }).lean();
    return normalizeVipTiers((doc?.vipTiers as Partial<IVipTier>[]) || null);
};

export const getVipTiers = async (force = false): Promise<IVipTier[]> => {
    const now = Date.now();
    if (!force && cached && cached.expireAt > now) return cached.value;
    const value = await readFromDb();
    cached = { value, expireAt: now + CACHE_TTL_MS };
    return value;
};

export const invalidateVipTiers = (): void => {
    cached = null;
};

/** Diff 2 mảng tiers theo level → list các path đã đổi (audit gọn). */
const diffTiers = (before: IVipTier[], after: IVipTier[]): string[] => {
    const out: string[] = [];
    const beforeMap = new Map(before.map((t) => [t.level, t]));
    for (const a of after) {
        const b = beforeMap.get(a.level);
        if (!b) continue;
        (Object.keys(a) as (keyof IVipTier)[]).forEach((key) => {
            if (key === 'level') return;
            if (a[key] !== b[key]) {
                out.push(`VIP${a.level}.${String(key)}: ${JSON.stringify(b[key])} → ${JSON.stringify(a[key])}`);
            }
        });
    }
    return out;
};

export interface UpdateVipTiersParams {
    adminUserId: string;
    adminUsername: string;
    input: Partial<IVipTier>[];
}

export const updateVipTiers = async ({
    adminUserId,
    adminUsername,
    input
}: UpdateVipTiersParams): Promise<IVipTier[]> => {
    const before = await readFromDb();
    const merged = normalizeVipTiers(input);

    await SettingModel.findOneAndUpdate(
        { name: 'setting' },
        { $set: { vipTiers: merged }, $setOnInsert: { name: 'setting' } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    invalidateVipTiers();

    const changes = diffTiers(before, merged);
    if (changes.length) {
        await logAdminAction({
            adminUserId,
            adminUsername,
            action: 'vip_tiers.update',
            targetType: 'setting',
            targetId: 'vip_tiers',
            details: changes.slice(0, 60).join('; ') + (changes.length > 60 ? ` (+${changes.length - 60} more)` : '')
        });
    }

    return merged;
};

/**
 * Tìm cấp VIP cao nhất user đủ điều kiện theo cược hợp lệ.
 * Dùng trong cron thăng hạng / hiển thị tiến độ next level.
 */
export const findEligibleTier = async (totalValidBet: number): Promise<IVipTier | null> => {
    const tiers = await getVipTiers();
    const v = Math.max(0, Number(totalValidBet) || 0);
    let match: IVipTier | null = null;
    for (const t of tiers) {
        if (t.minValidBet > 0 && t.minValidBet <= v) {
            if (!match || t.level > match.level) match = t;
        }
    }
    return match;
};

/**
 * Trả về thông tin tiến độ (% tới cấp tiếp theo) — UI hiển thị progress bar 80%/100%…
 */
export const getVipProgress = async (
    currentLevel: number,
    totalValidBet: number
): Promise<{
    currentTier: IVipTier | null;
    nextTier: IVipTier | null;
    /** % đã đạt được tới mốc next (0..100). */
    percent: number;
    /** Số tiền cược còn thiếu để lên cấp. */
    remaining: number;
}> => {
    const tiers = await getVipTiers();
    const currentTier = tiers.find((t) => t.level === currentLevel) || null;
    const nextTier = tiers.find((t) => t.level === currentLevel + 1) || null;
    if (!nextTier || nextTier.minValidBet <= 0) {
        return { currentTier, nextTier, percent: 100, remaining: 0 };
    }
    const v = Math.max(0, Number(totalValidBet) || 0);
    const percent = Math.min(100, Math.round((v / nextTier.minValidBet) * 100));
    const remaining = Math.max(0, nextTier.minValidBet - v);
    return { currentTier, nextTier, percent, remaining };
};

export default {
    DEFAULT_VIP_TIERS,
    getVipTiers,
    updateVipTiers,
    invalidateVipTiers,
    findEligibleTier,
    getVipProgress
};
