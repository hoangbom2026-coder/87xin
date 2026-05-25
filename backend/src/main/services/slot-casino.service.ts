import axios from 'axios';
import config from '@config/index';
import GameModel from '@main/models/game.model';
import CurrencyModel from '@main/models/currency.model';
import SlotGameModel from '@main/models/slot-game.model';

function getRandomAmount(min: number, max: number) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

/** Giống broadcast “recent-bet” nhưng có thể tweak cho bot feed. */
const randomRecentGame = async () => {
    try {
        const count = await GameModel.countDocuments({ status: 'ACTIVATED', game_type: { $ne: 'SPORT_BOOK' } });
        if (!count) return;
        const randomIndex = Math.floor(Math.random() * count);
        const randomGame = await GameModel.findOne(
            { status: 'ACTIVATED', game_type: { $ne: 'SPORT_BOOK' } },
            { game_code: 1, game_name: 1, image_url: 1 }
        ).skip(randomIndex);
        if (!randomGame) return;

        const currencyCount = await CurrencyModel.countDocuments();
        if (!currencyCount) return;
        const currencyRandom = Math.floor(Math.random() * currencyCount);
        const randomCurrency = await CurrencyModel.findOne().skip(currencyRandom);
        if (!randomCurrency) return;

        const betAmount = getRandomAmount(1, 100);
        const profitAmount = getRandomAmount(-betAmount, betAmount * 3);

        const data = {
            game: randomGame,
            currency: randomCurrency.name || 'USD',
            betAmount,
            currencyIcon: (randomCurrency as unknown as { icon?: string }).icon || '$',
            profitAmount,
            username: 'Hidden'
        } as any;

        global.io?.emit('recent-bet', data);
    } catch (e) {
        console.log('slotCasino.randomRecentGame:', (e as any).message || e);
    }
};

/** Bot runner gọi nhiều lần; giữ semantics gần recent-bet nhưng username khác một chút. */
const emitRecentBetForBot = async (opts?: { privateBetChance?: number; privateProfileChance?: number }) => {
    try {
        const count = await GameModel.countDocuments({ status: 'ACTIVATED', game_type: { $ne: 'SPORT_BOOK' } });
        if (!count) return;
        const randomIndex = Math.floor(Math.random() * count);
        const randomGame = await GameModel.findOne(
            { status: 'ACTIVATED', game_type: { $ne: 'SPORT_BOOK' } },
            { game_code: 1, game_name: 1, image_url: 1 }
        ).skip(randomIndex);
        if (!randomGame) return;

        const currencyCount = await CurrencyModel.countDocuments({ status: true });
        if (!currencyCount) return;
        const currencyRandom = Math.floor(Math.random() * currencyCount);
        const randomCurrency = await CurrencyModel.findOne({ status: true }).skip(currencyRandom);
        if (!randomCurrency) return;

        const betAmount = getRandomAmount(2, 200);
        const profitAmount = getRandomAmount(-betAmount, betAmount * 2);

        const isPrivate =
            typeof opts?.privateBetChance === 'number' && opts.privateBetChance > 0
                ? Math.random() < Math.min(1, Math.max(0, opts.privateBetChance))
                : false;

        const data = {
            game: randomGame,
            currency: randomCurrency.name || 'USD',
            betAmount,
            currencyIcon: (randomCurrency as unknown as { icon?: string }).icon || '$',
            profitAmount,
            username: isPrivate ? 'Private' : 'BotPlayer',
            isBot: true,
            privateProfileChance: opts?.privateProfileChance
        } as any;

        global.io?.emit('recent-bet', data);
    } catch (e) {
        console.log('slotCasino.emitRecentBetForBot:', (e as any).message || e);
    }
};

/**
 * Stub sync SlotGame catalogue:
 * 1) (best-effort) gọi provider nếu cấu hình host/key hợp lệ — lỗi thì fallback.
 * 2) Fallback: nhân bản các game SLOT nội bộ trong `games` sang `slot-games`.
 */
const syncGamesFromMongoFallback = async () => {
    const games = await GameModel.find({
        status: 'ACTIVATED',
        game_type: 'SLOT'
    }).limit(5000);

    if (!games.length) {
        return;
    }

    const ops = games.map((g) => ({
        updateOne: {
            filter: { gameId: g.game_code },
            update: {
                $set: {
                    provider: 'internal',
                    id: g.game_code,
                    gameId: g.game_code,
                    name: g.game_name,
                    type: 'SLOT',
                    category: 'casino',
                    subcategory: '',
                    image: g.image_url,
                    image_square: g.image_url,
                    image_portrait: g.image_url,
                    image_long: g.image_url,
                    currency: g.support_currency,
                    status: 'active',
                    last_updated: new Date()
                }
            },
            upsert: true
        }
    }));

    await SlotGameModel.bulkWrite(ops);
};

const tryRemoteCatalogSync = async () => {
    const host = String(config.slot.host || '').replace(/\/+$/, '');
    const key = String(config.slot.apiKey || '');
    if (!host || !key) return false;
    try {
        // Endpoint thực tế có thể khác — best-effort, lỗi sẽ fallback local.
        await axios.post(
            `${host}/game/catalog`,
            { api_key: key },
            { timeout: 15000 }
        );
        return true;
    } catch {
        return false;
    }
};

/** Đặt vào cron + init server: không throw. */
const refreshCatalog = async () => {
    try {
        await tryRemoteCatalogSync();
    } finally {
        await syncGamesFromMongoFallback();
    }
};

const listPaged = async (currentPage: number, perPage: number, categoryCodes?: unknown) => {
    const filter: Record<string, unknown> = {};
    if (typeof categoryCodes === 'string' && categoryCodes.trim()) {
        filter.category = categoryCodes.trim();
    } else if (Array.isArray(categoryCodes) && categoryCodes.length) {
        filter.category = { $in: categoryCodes };
    }

    const skip = (currentPage - 1) * perPage;
    const [data, total] = await Promise.all([
        SlotGameModel.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(perPage),
        SlotGameModel.countDocuments(filter)
    ]);
    return { data, count: total, currentPage, perPage };
};

const gameDetailByCode = async (gameCode: string) => {
    const g = await SlotGameModel.findOne({ gameId: gameCode }).lean();
    return g || null;
};

export default {
    randomRecentGame,
    emitRecentBetForBot,
    refreshCatalog,
    listPaged,
    gameDetailByCode
};
