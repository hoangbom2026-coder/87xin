import settingService from './setting.service';
import AffiliateFeedItemModel from '@main/models/affiliate-feed-item.model';
import AffiliateStatsModel from '@main/models/affiliate-stats.model';
import UserModel from '@main/models/user.model';
import TransactionModel from '@main/models/transaction.model';
import {
    DEFAULT_AFFILIATE_EXTRAS,
    IAffiliateExtras,
    mergeAffiliateExtras
} from '@main/constants/affiliate-extras-defaults';

/** Đọc cấu hình extras (merge default). */
export async function getExtras(): Promise<IAffiliateExtras> {
    const doc = await settingService.getSetting();
    const raw = (doc?.toObject?.() ?? doc ?? {}) as Record<string, unknown>;
    return mergeAffiliateExtras(raw.affiliateExtras);
}

/** Patch cấu hình extras (merge sâu, ghi vào settings.affiliateExtras). */
export async function patchExtras(payload: Partial<IAffiliateExtras>): Promise<IAffiliateExtras> {
    const cur = await getExtras();
    const next = mergeAffiliateExtras({
        ...cur,
        ...payload,
        media: { ...cur.media, ...(payload.media ?? {}) },
        slogans: { ...cur.slogans, ...(payload.slogans ?? {}) },
        signupReward: { ...cur.signupReward, ...(payload.signupReward ?? {}) },
        fakeFeed: { ...cur.fakeFeed, ...(payload.fakeFeed ?? {}) },
        counter: { ...cur.counter, ...(payload.counter ?? {}) },
        vipRebate: Array.isArray(payload.vipRebate) ? payload.vipRebate : cur.vipRebate
    });
    await settingService.updateSetting({ affiliateExtras: next as never });
    return next;
}

const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

/** Sinh 1 entry fake dựa trên config — gọi từ cron hoặc admin. */
export async function generateFakeOne() {
    const ex = await getExtras();
    const fc = ex.fakeFeed;
    const lo = Math.min(fc.amountMin, fc.amountMax);
    const hi = Math.max(fc.amountMin, fc.amountMax);
    const amt = Math.round((lo + Math.random() * (hi - lo)) * 100) / 100;
    const tplArr = fc.fakeUsernames.length ? fc.fakeUsernames : DEFAULT_AFFILIATE_EXTRAS.fakeFeed.fakeUsernames;
    const tpl = tplArr[Math.floor(Math.random() * tplArr.length)] || 'user_***';
    const username = tpl.replace(
        /\*+/g,
        Math.random().toString(36).slice(2, 6).toUpperCase()
    );
    const item = await AffiliateFeedItemModel.create({
        username,
        amount: amt,
        currency: ex.counter.currency || 'USD',
        source: 'auto',
        hidden: false,
        notes: ''
    });

    const cap = (fc.maxRows | 0) || 50;
    const totalNonHidden = await AffiliateFeedItemModel.countDocuments({ hidden: false });
    if (totalNonHidden > cap) {
        const toTrim = totalNonHidden - cap;
        const olds = await AffiliateFeedItemModel.find({ hidden: false })
            .sort({ createdAt: 1 })
            .limit(toTrim)
            .select('_id')
            .lean();
        const ids = olds.map((o) => o._id);
        if (ids.length) await AffiliateFeedItemModel.deleteMany({ _id: { $in: ids } });
    }

    return { item };
}

export type ListFeedFilter = {
    source?: 'all' | 'auto' | 'real' | 'manual';
    visible?: 'all' | 'visible' | 'hidden';
    page?: number;
    limit?: number;
};

export async function listFeed(filter: ListFeedFilter) {
    const cond: Record<string, unknown> = {};
    if (filter.source && filter.source !== 'all') cond.source = filter.source;
    if (filter.visible === 'visible') cond.hidden = false;
    else if (filter.visible === 'hidden') cond.hidden = true;
    const page = Math.max(1, num(filter.page, 1));
    const limit = Math.min(200, Math.max(1, num(filter.limit, 50)));
    const [items, total] = await Promise.all([
        AffiliateFeedItemModel.find(cond)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        AffiliateFeedItemModel.countDocuments(cond)
    ]);
    return { items, total, page, limit };
}

export async function createManualFeed(data: { username: string; amount: number; currency?: string; notes?: string }) {
    return AffiliateFeedItemModel.create({
        username: String(data.username || '').trim() || 'unknown',
        amount: Number(data.amount || 0),
        currency: data.currency || 'USD',
        source: 'manual',
        hidden: false,
        notes: data.notes ?? ''
    });
}

export async function patchFeed(id: string, patch: { hidden?: boolean; amount?: number; username?: string; notes?: string }) {
    const set: Record<string, unknown> = {};
    if (patch.hidden !== undefined) set.hidden = !!patch.hidden;
    if (patch.amount !== undefined) set.amount = Number(patch.amount);
    if (patch.username !== undefined) set.username = String(patch.username);
    if (patch.notes !== undefined) set.notes = String(patch.notes);
    return AffiliateFeedItemModel.findByIdAndUpdate(id, { $set: set }, { new: true });
}

export async function deleteFeed(id: string) {
    return AffiliateFeedItemModel.findByIdAndDelete(id);
}

export async function deleteAllAuto() {
    const r = await AffiliateFeedItemModel.deleteMany({ source: 'auto' });
    return { ok: true, removed: r.deletedCount ?? 0 };
}

/** Counter: nếu manual → trả manualBaseAmount; auto → cộng dồn từ giao dịch payout. */
export async function getCounter() {
    const ex = await getExtras();
    if (ex.counter.mode === 'manual') {
        return {
            mode: 'manual' as const,
            value: ex.counter.manualBaseAmount,
            currency: ex.counter.currency,
            label: ex.counter.label
        };
    }
    // Auto: tổng amount của transactions provider=affiliate-payout (nếu có) + bonuses commission
    const agg = await TransactionModel.aggregate([
        {
            $match: {
                $or: [
                    { provider: 'auto-payout' },
                    { gameId: { $regex: /^affiliate/i } },
                    { typeDescription: { $regex: /aff|hoa h.ng/i } }
                ]
            }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return {
        mode: 'auto' as const,
        value: agg[0]?.total ?? 0,
        currency: ex.counter.currency,
        label: ex.counter.label
    };
}

/** Analytics: signups/ngày trong N ngày gần nhất. */
export async function signupsByDay(days = 14) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const agg = await UserModel.aggregate([
        { $match: { affiliateInit: true, createdAt: { $gte: since } } },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const map = new Map<string, number>(agg.map((a) => [String(a._id), Number(a.count)]));
    const out: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const k = d.toISOString().slice(0, 10);
        out.push({ date: k, count: map.get(k) ?? 0 });
    }
    return out;
}

/** Phân bổ commission: from USD reward vs commission accrual. */
export async function commissionSplit() {
    const [signupAgg, commissionAgg] = await Promise.all([
        TransactionModel.aggregate([
            { $match: { typeDescription: { $regex: /signup|đăng k.|reward/i } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        TransactionModel.aggregate([
            { $match: { typeDescription: { $regex: /commission|hoa h.ng|rebate/i } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
    ]);
    return {
        signupReward: signupAgg[0]?.total ?? 0,
        commission: commissionAgg[0]?.total ?? 0
    };
}

/** Danh sách user đã affiliateInit (filter q + paginate). */
export async function listAffiliateUsers(params: { q?: string; page?: number; limit?: number }) {
    const cond: Record<string, any> = { $or: [{ affiliateInit: true }, { invitorId: { $ne: null } }] };
    if (params.q) {
        const rx = new RegExp(params.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        cond.$and = [{ $or: [{ username: rx }, { email: rx }] }];
    }
    const page = Math.max(1, num(params.page, 1));
    const limit = Math.min(100, Math.max(1, num(params.limit, 30)));
    
    const [itemsRaw, total] = await Promise.all([
        UserModel.find(cond)
            .sort({ updatedAt: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('username email firstName lastName invitorId affiliateInit reagentEnrolled createdAt')
            .lean(),
        UserModel.countDocuments(cond)
    ]);

    const items = await Promise.all(itemsRaw.map(async (u) => {
        const stats = await AffiliateStatsModel.findOne({ userId: u._id }).lean();
        return {
            ...u,
            totalInvited: stats?.totalInvited ?? 0,
            validInvited: stats?.validInvited ?? 0,
            unclaimedBalance: stats?.unclaimedBalance ?? 0,
            todayExpected: stats?.todayExpected ?? 0,
            yesterdayFinal: stats?.yesterdayFinal ?? 0
        };
    }));

    return { items, total, page, limit };
}
