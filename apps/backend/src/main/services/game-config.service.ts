import GameConfigModel, { IGameConfig } from '@main/models/game-config.model';
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import {
    GAME_CATEGORIES,
    GAME_CATEGORY_KEYS,
    GAME_KINDS,
    GAME_KIND_SET,
    GameCategoryKey,
    GameKind,
    SEED_ORIGINALS
} from '@main/constants/game-catalog';

const slugify = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

async function ensureUniqueKey(base: string, excludeId?: string): Promise<string> {
    const root = slugify(base) || `game_${Date.now()}`;
    let candidate = root;
    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const exist = await GameConfigModel.findOne({
            gameKey: candidate,
            ...(excludeId ? { _id: { $ne: excludeId } } : {})
        }).lean();
        if (!exist) return candidate;
        candidate = `${root}_${i++}`;
    }
}

export async function seedOriginalsIfMissing() {
    for (const def of SEED_ORIGINALS) {
        const exists = await GameConfigModel.findOne({ gameKey: def.gameKey });
        if (!exists) {
            await GameConfigModel.create({
                ...def,
                provider: 'internal'
            });
        }
    }
}

export type ListGamesFilter = {
    category?: GameCategoryKey | 'all';
    kind?: GameKind | 'all';
    q?: string;
    enabled?: 'enabled' | 'disabled' | 'all';
    page?: number;
    limit?: number;
};

export async function listGames(filter: ListGamesFilter) {
    const cond: Record<string, unknown> = {};
    if (filter.category && filter.category !== 'all') cond.category = filter.category;
    if (filter.kind && filter.kind !== 'all') cond.kind = filter.kind;
    if (filter.enabled === 'enabled') cond.enabled = true;
    else if (filter.enabled === 'disabled') cond.enabled = false;

    if (filter.q) {
        const rx = new RegExp(filter.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        cond.$or = [
            { name: rx },
            { gameKey: rx },
            { description: rx },
            { tags: rx },
            { externalCode: rx }
        ];
    }

    const page = Math.max(1, Number(filter.page || 1));
    const limit = Math.min(200, Math.max(1, Number(filter.limit || 60)));

    const [items, total] = await Promise.all([
        GameConfigModel.find(cond)
            .sort({ category: 1, kind: 1, order: 1, name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        GameConfigModel.countDocuments(cond)
    ]);

    return { items, total, page, limit };
}

export async function getCategoryCounts() {
    const agg = await GameConfigModel.aggregate([
        {
            $group: {
                _id: { category: '$category', kind: '$kind' },
                count: { $sum: 1 },
                visible: { $sum: { $cond: ['$visible', 1, 0] } },
                enabled: { $sum: { $cond: ['$enabled', 1, 0] } }
            }
        }
    ]);

    type Bucket = { count: number; enabled: number; visible: number };
    const byCat: Record<string, Bucket & { kinds: Record<string, Bucket> }> = {};
    for (const c of GAME_CATEGORIES) {
        byCat[c.key] = { count: 0, enabled: 0, visible: 0, kinds: {} };
    }
    for (const k of GAME_KINDS) {
        // không pre-init mảng kinds — chỉ thêm khi có dữ liệu
        void k;
    }

    for (const row of agg) {
        const cat = String(row._id?.category ?? '');
        const kind = String(row._id?.kind ?? '');
        if (!byCat[cat]) byCat[cat] = { count: 0, enabled: 0, visible: 0, kinds: {} };
        byCat[cat].count += row.count;
        byCat[cat].enabled += row.enabled;
        byCat[cat].visible += row.visible;
        byCat[cat].kinds[kind] = {
            count: row.count,
            enabled: row.enabled,
            visible: row.visible
        };
    }

    return {
        categories: GAME_CATEGORIES.map((c) => ({
            ...c,
            ...(byCat[c.key] ?? { count: 0, enabled: 0, visible: 0, kinds: {} })
        })),
        kinds: GAME_KINDS
    };
}

export type GamePayload = Partial<IGameConfig> & { gameKey?: string; name?: string };

const sanitizeKind = (k: unknown): GameKind => {
    const s = String(k || '').toLowerCase();
    return GAME_KIND_SET.has(s as GameKind) ? (s as GameKind) : 'other';
};
const sanitizeCategory = (c: unknown): GameCategoryKey => {
    const s = String(c || '').toLowerCase();
    return GAME_CATEGORY_KEYS.includes(s as GameCategoryKey) ? (s as GameCategoryKey) : 'originals';
};

export async function createGame(payload: GamePayload) {
    if (!payload.name) throw new ApiError(httpStatus.BAD_REQUEST, 'Name is required');
    const key =
        (typeof payload.gameKey === 'string' && payload.gameKey.trim()) ||
        (await ensureUniqueKey(payload.name));
    const finalKey = await ensureUniqueKey(key);
    return GameConfigModel.create({
        ...payload,
        gameKey: finalKey,
        category: sanitizeCategory(payload.category),
        kind: sanitizeKind(payload.kind),
        provider: payload.provider || 'internal',
        tags: Array.isArray(payload.tags) ? payload.tags : []
    });
}

export async function updateGame(id: string, payload: GamePayload) {
    const cur = await GameConfigModel.findById(id);
    if (!cur) throw new ApiError(httpStatus.NOT_FOUND, 'Game not found');

    if (payload.name !== undefined) cur.name = String(payload.name);
    if (payload.image !== undefined) cur.image = String(payload.image || '');
    if (payload.description !== undefined) cur.description = String(payload.description || '');
    if (payload.category !== undefined) cur.category = sanitizeCategory(payload.category);
    if (payload.kind !== undefined) cur.kind = sanitizeKind(payload.kind);
    if (payload.provider !== undefined) cur.provider = String(payload.provider);
    if (payload.externalCode !== undefined) cur.externalCode = String(payload.externalCode || '');
    if (Array.isArray(payload.tags)) cur.tags = payload.tags.map((t) => String(t));

    if (payload.enabled !== undefined) cur.enabled = !!payload.enabled;
    if (payload.visible !== undefined) cur.visible = !!payload.visible;
    if (payload.featured !== undefined) cur.featured = !!payload.featured;
    if (payload.favorite !== undefined) cur.favorite = !!payload.favorite;
    if (payload.searchable !== undefined) cur.searchable = !!payload.searchable;
    if (payload.maintenance !== undefined) cur.maintenance = !!payload.maintenance;
    if (payload.order !== undefined) cur.order = Number(payload.order || 0);
    if (payload.rngOverride && typeof payload.rngOverride === 'object') {
        cur.rngOverride = { ...cur.rngOverride, ...(payload.rngOverride as object) };
    }
    if (payload.meta && typeof payload.meta === 'object') cur.meta = payload.meta as never;

    await cur.save();
    return cur;
}

export async function patchManyFlags(ids: string[], flags: Partial<Pick<IGameConfig, 'enabled' | 'visible' | 'featured' | 'favorite' | 'searchable' | 'maintenance'>>) {
    const set: Record<string, unknown> = {};
    if (flags.enabled !== undefined) set.enabled = !!flags.enabled;
    if (flags.visible !== undefined) set.visible = !!flags.visible;
    if (flags.featured !== undefined) set.featured = !!flags.featured;
    if (flags.favorite !== undefined) set.favorite = !!flags.favorite;
    if (flags.searchable !== undefined) set.searchable = !!flags.searchable;
    if (flags.maintenance !== undefined) set.maintenance = !!flags.maintenance;
    if (!Object.keys(set).length) return { ok: true, modified: 0 };
    const r = await GameConfigModel.updateMany({ _id: { $in: ids } }, { $set: set });
    return { ok: true, modified: r.modifiedCount ?? 0 };
}

export async function deleteGame(id: string) {
    const r = await GameConfigModel.deleteOne({ _id: id });
    return { ok: true, removed: r.deletedCount ?? 0 };
}

export async function reorderGames(items: Array<{ id: string; order: number }>) {
    await Promise.all(
        items.map((it) =>
            GameConfigModel.updateOne({ _id: it.id }, { $set: { order: Number(it.order || 0) } })
        )
    );
    return { ok: true };
}
