import SettingModel from '@main/models/setting.model';
import {
    DEFAULT_AFFILIATE_MECHANISM,
    IAffiliateMechanism,
    normalizeAffiliateMechanism
} from '@main/constants/affiliate-mechanism-defaults';
import { logAdminAction } from '@main/services/admin-audit.service';

/**
 * Cache trong process (TTL ngắn) để tránh đọc Mongo mỗi lần tính commission.
 * Khi admin update → invalidateAffiliateMechanism() bust ngay.
 */
const CACHE_TTL_MS = 60_000;
let cached: { value: IAffiliateMechanism; expireAt: number } | null = null;

const readFromDb = async (): Promise<IAffiliateMechanism> => {
    const doc = await SettingModel.findOne({ name: 'setting' }, { affiliateMechanism: 1 }).lean();
    return normalizeAffiliateMechanism((doc?.affiliateMechanism as Partial<IAffiliateMechanism>) || null);
};

export const getAffiliateMechanism = async (force = false): Promise<IAffiliateMechanism> => {
    const now = Date.now();
    if (!force && cached && cached.expireAt > now) return cached.value;
    const value = await readFromDb();
    cached = { value, expireAt: now + CACHE_TTL_MS };
    return value;
};

export const invalidateAffiliateMechanism = (): void => {
    cached = null;
};

/**
 * Diff 2 object để ghi audit gọn (chỉ list các path đổi).
 */
const diffPaths = (a: any, b: any, prefix = ''): string[] => {
    const out: string[] = [];
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
        const path = prefix ? `${prefix}.${k}` : k;
        const va = a?.[k];
        const vb = b?.[k];
        if (va && typeof va === 'object' && !Array.isArray(va)) {
            out.push(...diffPaths(va, vb, path));
        } else if (va !== vb) {
            out.push(`${path}: ${JSON.stringify(va)} → ${JSON.stringify(vb)}`);
        }
    }
    return out;
};

export interface UpdateAffiliateMechanismParams {
    adminUserId: string;
    adminUsername: string;
    input: Partial<IAffiliateMechanism>;
}

export const updateAffiliateMechanism = async ({
    adminUserId,
    adminUsername,
    input
}: UpdateAffiliateMechanismParams): Promise<IAffiliateMechanism> => {
    const before = await readFromDb();
    const merged = normalizeAffiliateMechanism({
        commission_rates: { ...before.commission_rates, ...(input.commission_rates || {}) },
        referral_bonus: { ...before.referral_bonus, ...(input.referral_bonus || {}) },
        multi_level_ratio:
            input.multi_level_ratio !== undefined ? input.multi_level_ratio : before.multi_level_ratio,
        withdrawal_condition: { ...before.withdrawal_condition, ...(input.withdrawal_condition || {}) }
    });

    await SettingModel.findOneAndUpdate(
        { name: 'setting' },
        { $set: { affiliateMechanism: merged }, $setOnInsert: { name: 'setting' } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    invalidateAffiliateMechanism();

    const changes = diffPaths(before, merged);
    if (changes.length) {
        await logAdminAction({
            adminUserId,
            adminUsername,
            action: 'affiliate_mechanism.update',
            targetType: 'setting',
            targetId: 'affiliate_mechanism',
            details: changes.join('; ')
        });
    }

    return merged;
};

export default {
    DEFAULT_AFFILIATE_MECHANISM,
    getAffiliateMechanism,
    updateAffiliateMechanism,
    invalidateAffiliateMechanism
};
