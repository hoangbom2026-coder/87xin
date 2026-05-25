import SettingModel from '@main/models/setting.model';
import {
    DEFAULT_GAME_MENU,
    IGameMenuItem,
    normalizeGameMenu
} from '@main/constants/game-menu-defaults';
import { logAdminAction } from '@main/services/admin-audit.service';

const CACHE_TTL_MS = 60_000;
let cached: { value: IGameMenuItem[]; expireAt: number } | null = null;

const readFromDb = async (): Promise<IGameMenuItem[]> => {
    const doc = await SettingModel.findOne({ name: 'setting' }, { gameMenu: 1 }).lean();
    const raw = (doc?.gameMenu as Partial<IGameMenuItem>[]) || null;
    const normalized = normalizeGameMenu(raw);
    return normalized.length ? normalized : DEFAULT_GAME_MENU.map((m) => ({ ...m }));
};

export const getGameMenu = async (force = false): Promise<IGameMenuItem[]> => {
    const now = Date.now();
    if (!force && cached && cached.expireAt > now) return cached.value;
    const value = await readFromDb();
    cached = { value, expireAt: now + CACHE_TTL_MS };
    return value;
};

export const invalidateGameMenu = (): void => {
    cached = null;
};

const briefDiff = (before: IGameMenuItem[], after: IGameMenuItem[]): string => {
    const beforeMap = new Map(before.map((x) => [x.key, x]));
    const afterMap = new Map(after.map((x) => [x.key, x]));
    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];
    for (const key of afterMap.keys()) if (!beforeMap.has(key)) added.push(key);
    for (const key of beforeMap.keys()) if (!afterMap.has(key)) removed.push(key);
    for (const [key, a] of afterMap) {
        const b = beforeMap.get(key);
        if (!b) continue;
        if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(key);
    }
    const parts: string[] = [];
    if (added.length) parts.push(`added: ${added.join(', ')}`);
    if (removed.length) parts.push(`removed: ${removed.join(', ')}`);
    if (changed.length) parts.push(`changed: ${changed.join(', ')}`);
    return parts.join(' | ') || 'no-op';
};

export interface UpdateGameMenuParams {
    adminUserId: string;
    adminUsername: string;
    input: Partial<IGameMenuItem>[];
}

export const updateGameMenu = async ({
    adminUserId,
    adminUsername,
    input
}: UpdateGameMenuParams): Promise<IGameMenuItem[]> => {
    const before = await readFromDb();
    const merged = normalizeGameMenu(input);
    if (!merged.length) {
        // tránh xóa sạch menu → ép DEFAULT
        merged.push(...DEFAULT_GAME_MENU.map((m) => ({ ...m })));
    }

    await SettingModel.findOneAndUpdate(
        { name: 'setting' },
        { $set: { gameMenu: merged }, $setOnInsert: { name: 'setting' } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    invalidateGameMenu();

    await logAdminAction({
        adminUserId,
        adminUsername,
        action: 'game_menu.update',
        targetType: 'setting',
        targetId: 'game_menu',
        details: briefDiff(before, merged)
    });

    return merged;
};

export default {
    DEFAULT_GAME_MENU,
    getGameMenu,
    updateGameMenu,
    invalidateGameMenu
};
