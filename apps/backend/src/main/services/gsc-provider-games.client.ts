import axios from 'axios';
import { groupBy } from 'lodash';
import type { IGscEnvironment } from '@main/constants/gsc-environments-defaults';
import { buildOutboundMd5 } from '@main/services/gsc-environment.service';
import { normalizeGscGameStatus, normalizeGscGameType } from '@main/constants/gsc-game-types';
import { extractProviderGames, isGscApiErrorPayload, isGscSuccessCode } from '@main/utils/gsc-api-parse';

const PAGE_SIZE = 500;

export type GscProviderGameRow = {
    game_code: string;
    game_name: string;
    game_type: string;
    image_url: string;
    product_id: number;
    product_code: number;
    support_currency: string;
    status: string;
    gscOperatorCode?: string;
};

type RawProviderGame = {
    game_code?: string;
    game_name?: string;
    game_type?: string;
    image_url?: string;
    product_id?: number;
    product_code?: number;
    support_currency?: string;
    status?: string;
    lang_icon?: Record<string, string>;
};

/** §3.4 — ảnh: `image_url` → `lang_icon[7]` (vi) → `lang_icon[0]` → URL http đầu tiên. */
function pickGscImageUrl(row: RawProviderGame): string {
    const direct = String(row.image_url || '').trim();
    if (direct) return direct;
    const icons = row.lang_icon;
    if (icons?.['7']) return String(icons['7']);
    if (icons?.['0']) return String(icons['0']);
    const first = icons && Object.values(icons).find((u) => typeof u === 'string' && u.startsWith('http'));
    return first ? String(first) : '';
}

function rowPriority(row: RawProviderGame): number {
    const st = normalizeGscGameStatus(String(row.status || ''));
    let n = 0;
    if (st === 'ACTIVATED') n += 20;
    if (pickGscImageUrl(row)) n += 10;
    if (String(row.support_currency || '').includes('VND')) n += 2;
    return n;
}

/**
 * GSC trả nhiều dòng cùng `game_code` (mỗi `support_currency` một dòng).
 * Gộp thành 1 game: currency gộp, status ưu tiên ACTIVATED, ảnh từ dòng tốt nhất.
 */
export function mergeProviderGamesRows(rows: RawProviderGame[], env: IGscEnvironment): GscProviderGameRow[] {
    const grouped = groupBy(rows, (r) => String(r.game_code || '').trim());
    const out: GscProviderGameRow[] = [];

    for (const key of Object.keys(grouped)) {
        if (!key) continue;
        const variants = [...grouped[key]].sort((a, b) => rowPriority(b) - rowPriority(a));
        const currencies: string[] = [];
        const statuses: string[] = [];
        for (const v of variants) {
            if (v.support_currency) currencies.push(String(v.support_currency).trim());
            statuses.push(normalizeGscGameStatus(String(v.status || 'ACTIVATED')));
        }
        const row = variants[0];
        const gameType = normalizeGscGameType(String(row.game_type || ''));
        const mergedStatus = statuses.includes('ACTIVATED')
            ? 'ACTIVATED'
            : statuses.includes('MAINTAINED')
              ? 'MAINTAINED'
              : statuses[0] || 'DEACTIVATED';

        out.push({
            game_code: key,
            game_name: String(row.game_name || key),
            game_type: gameType,
            image_url: pickGscImageUrl(row),
            product_id: Number(row.product_id ?? row.product_code ?? 0),
            product_code: Number(row.product_code ?? 0),
            support_currency: [...new Set(currencies.filter(Boolean))].join(','),
            status: mergedStatus,
            gscOperatorCode: env.operatorCode
        });
    }

    return out.filter((g) => g.game_code && g.product_code > 0 && g.game_type);
}

/**
 * GSC+ §3.4 Game List — `product_code` + `game_type` (bắt buộc theo hợp đồng §3.6).
 */
export async function fetchGscProviderGames(
    env: IGscEnvironment,
    productCode: number,
    gameType: string,
    offset = 0,
    size = PAGE_SIZE
): Promise<{ games: GscProviderGameRow[]; total: number; hasMore: boolean; rawCount: number }> {
    const requestTime = Math.floor(Date.now() / 1000);
    const sign = buildOutboundMd5(requestTime, 'gamelist', env);
    const response = await axios.get(`${env.host}/api/operators/provider-games`, {
        params: {
            product_code: productCode,
            operator_code: env.operatorCode,
            game_type: normalizeGscGameType(gameType),
            sign,
            request_time: requestTime,
            offset,
            size
        }
    });

    const body = response.data;
    if (isGscApiErrorPayload(body)) {
        return { games: [], total: 0, hasMore: false, rawCount: 0 };
    }
    if (body && typeof body === 'object' && !Array.isArray(body) && !isGscSuccessCode((body as { code?: unknown }).code)) {
        return { games: [], total: 0, hasMore: false, rawCount: 0 };
    }

    const { rows: raw, pagination } = extractProviderGames(body);
    if (!raw.length) {
        return { games: [], total: 0, hasMore: false, rawCount: 0 };
    }

    const games = mergeProviderGamesRows(raw as RawProviderGame[], env);
    const total = Number(pagination?.total ?? raw.length) || raw.length;
    const pageSize = Number(pagination?.size ?? raw.length) || raw.length;
    const nextOffset = offset + (raw.length || pageSize);
    const hasMore = nextOffset < total && raw.length > 0;

    return { games, total, hasMore, rawCount: raw.length };
}

/** Lấy toàn bộ game một NCC + một `game_type` (phân trang §3.4, total có thể ~2000). */
export async function fetchAllGscProviderGames(
    env: IGscEnvironment,
    productCode: number,
    gameType: string
): Promise<GscProviderGameRow[]> {
    const all: GscProviderGameRow[] = [];
    const seen = new Set<string>();
    let offset = 0;

    for (let page = 0; page < 200; page++) {
        const { games, hasMore, rawCount } = await fetchGscProviderGames(env, productCode, gameType, offset, PAGE_SIZE);
        for (const g of games) {
            const k = `${g.game_code}|${g.product_code}|${g.game_type}`;
            if (seen.has(k)) continue;
            seen.add(k);
            all.push(g);
        }
        if (!hasMore || !rawCount) break;
        offset += rawCount;
    }

    return all;
}
