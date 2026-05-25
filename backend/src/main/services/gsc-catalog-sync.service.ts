import axios from 'axios';
import { groupBy } from 'lodash';
import ProviderModel from '@main/models/provider.model';
import casinoService from '@main/services/casino.service';
import sportService from '@main/services/sport.service';
import {
    buildOutboundMd5,
    getEnabledGscEnvironments,
    getGscEnvironmentById
} from '@main/services/gsc-environment.service';
import type { IGscEnvironment } from '@main/constants/gsc-environments-defaults';
import { normalizeGscGameType } from '@main/constants/gsc-game-types';
import { fetchAllGscProviderGames } from '@main/services/gsc-provider-games.client';
import {
    extractAvailableProducts,
    isGscApiErrorPayload,
    isGscSuccessCode
} from '@main/utils/gsc-api-parse';

const PROVIDER_PAGE_SIZE = 500;

type ProviderRow = {
    provider: string;
    currency: string | string[];
    status: string;
    provider_id: number;
    product_id: number;
    product_code: number;
    game_type: string;
    product_name?: string;
    product_title?: string;
    entry_type?: number;
    gscOperatorCode?: string;
};

/** §3.6 Product List — paginate; gộp currency theo `product_code|game_type`. */
async function syncProvidersFromEnv(env: IGscEnvironment, offset = 0, size = PROVIDER_PAGE_SIZE): Promise<number> {
    console.info(`=== GSC §3.6 providers [${env.label}/${env.operatorCode}] offset=${offset} ===`);
    const requestTime = Math.floor(Date.now() / 1000);
    const sign = buildOutboundMd5(requestTime, 'productlist', env);
    const response = await axios.get(`${env.host}/api/operators/available-products`, {
        params: {
            operator_code: env.operatorCode,
            sign,
            request_time: requestTime,
            offset,
            size
        }
    });

    const body = response.data;
    if (isGscApiErrorPayload(body)) {
        console.error(`GSC §3.6 error [${env.operatorCode}]:`, body);
        return 0;
    }
    if (body && typeof body === 'object' && !Array.isArray(body) && !isGscSuccessCode((body as { code?: unknown }).code)) {
        console.error(`GSC §3.6 bad code [${env.operatorCode}]:`, body);
        return 0;
    }

    const rawRows = extractAvailableProducts(body);
    if (!rawRows.length) return 0;

    const data: ProviderRow[] = [];
    const groupData = groupBy(rawRows, (item) => `${item.product_code}|${item.game_type}`);
    for (const key of Object.keys(groupData)) {
        const first = groupData[key][0] as ProviderRow;
        const currency = groupData[key].map((g) => (g as ProviderRow).currency).filter(Boolean);
        const entryType = Number((first as { entry_type?: number }).entry_type ?? 1);
        data.push({
            ...first,
            game_type: normalizeGscGameType(String(first.game_type || '')),
            product_title: first.product_name || first.product_title || first.provider,
            currency,
            entry_type: entryType === 2 ? 2 : 1,
            gscOperatorCode: env.operatorCode
        });
    }

    await casinoService.createProviders(data as never);

    const sportRows = data.filter((f) => f.game_type === 'SPORT_BOOK');
    if (sportRows.length) await sportService.createSports(sportRows as never);

    const total = Number((body as { pagination?: { total?: number | string } })?.pagination?.total ?? 0);
    const nextOffset = offset + rawRows.length;
    const hasMore = total > 0 ? nextOffset < total : rawRows.length >= size;
    if (hasMore) {
        return rawRows.length + (await syncProvidersFromEnv(env, nextOffset, size));
    }
    return rawRows.length;
}

/**
 * §3.4 — sync từng cặp (`product_code`, `game_type`) từ §3.6 ACTIVATED.
 * `entry_type=2`: vẫn gọi §3.4; nếu rỗng thì không có game (launch lobby).
 */
async function syncGamesFromEnv(env: IGscEnvironment): Promise<void> {
    console.info(`=== GSC §3.4 games [${env.label}/${env.operatorCode}] ===`);
    const providers = await ProviderModel.find({
        status: { $regex: /^ACTIVATED$/i },
        $or: [
            { gscOperatorCode: env.operatorCode },
            { gscOperatorCode: { $exists: false } },
            { gscOperatorCode: null },
            { gscOperatorCode: '' }
        ]
    })
        .select('product_code game_type provider entry_type')
        .lean();

    const pairs = new Map<string, { product_code: number; game_type: string; entry_type: number }>();
    for (const p of providers) {
        const pc = Number(p.product_code);
        const gt = normalizeGscGameType(String(p.game_type || ''));
        if (!Number.isFinite(pc) || pc <= 0 || !gt) continue;
        pairs.set(`${pc}|${gt}`, {
            product_code: pc,
            game_type: gt,
            entry_type: Number(p.entry_type ?? 1)
        });
    }

    if (!pairs.size) {
        console.warn(`GSC games [${env.operatorCode}]: no ACTIVATED product×game_type`);
        return;
    }

    let totalGames = 0;
    let pairOk = 0;
    let pairFail = 0;

    for (const { product_code, game_type, entry_type } of pairs.values()) {
        try {
            const games = await fetchAllGscProviderGames(env, product_code, game_type);
            const codes = games.map((g) => String(g.game_code || '').trim()).filter(Boolean);

            if (games.length) {
                await casinoService.createGames(games as never);
                totalGames += games.length;
            }

            if (codes.length) {
                const off = await casinoService.deactivateStaleGames(
                    product_code,
                    game_type,
                    codes,
                    env.operatorCode
                );
                console.info(
                    `  [${env.operatorCode}] ${product_code}/${game_type} entry=${entry_type} → ${games.length} game(s), stale off=${off}`
                );
            } else {
                const off = await casinoService.deactivateAllGamesForPair(
                    product_code,
                    game_type,
                    env.operatorCode
                );
                console.info(
                    `  [${env.operatorCode}] ${product_code}/${game_type} → 0 game §3.4, deactivated=${off}`
                );
            }
            pairOk++;
        } catch (e) {
            pairFail++;
            console.warn(
                `  [${env.operatorCode}] ${product_code}/${game_type} failed:`,
                (e as Error).message || e
            );
        }
    }

    console.info(
        `GSC games [${env.operatorCode}]: ${totalGames} game row(s), pairs ok=${pairOk} fail=${pairFail}/${pairs.size}`
    );
}

export async function syncGscEnvironmentCatalog(env: IGscEnvironment): Promise<void> {
    await syncProvidersFromEnv(env, 0, PROVIDER_PAGE_SIZE);
    await syncGamesFromEnv(env);
}

export async function syncAllGscCatalogFromRemote(): Promise<{ synced: string[] }> {
    const envs = await getEnabledGscEnvironments();
    const synced: string[] = [];
    for (const env of envs) {
        try {
            await syncGscEnvironmentCatalog(env);
            synced.push(env.id);
        } catch (e) {
            console.error(`GSC sync failed [${env.operatorCode}]:`, (e as Error).message || e);
        }
    }
    await casinoService.markRecommendTopGames();
    return { synced };
}

export async function syncGscCatalogByEnvId(envId: string): Promise<{ synced: string[] }> {
    const env = await getGscEnvironmentById(envId);
    if (!env?.enabled) throw new Error('GSC_ENV_NOT_FOUND');
    await syncGscEnvironmentCatalog(env);
    return { synced: [env.id] };
}

/** Cron nhẹ — chỉ §3.6. */
export async function refreshGscProvidersAll(): Promise<void> {
    const envs = await getEnabledGscEnvironments();
    for (const env of envs) {
        try {
            await syncProvidersFromEnv(env, 0, PROVIDER_PAGE_SIZE);
        } catch (e) {
            console.error(`GSC provider refresh [${env.operatorCode}]:`, (e as Error).message || e);
        }
    }
}

/** Cron đầy đủ — §3.6 + §3.4 (chuẩn doc). */
export async function refreshGscFullCatalogAll(): Promise<{ synced: string[] }> {
    return syncAllGscCatalogFromRemote();
}

export default {
    syncGscEnvironmentCatalog,
    syncAllGscCatalogFromRemote,
    syncGscCatalogByEnvId,
    refreshGscProvidersAll,
    refreshGscFullCatalogAll
};
