/** GSC+ operator API — `code: 0` (doc) hoặc không có `code` (mảng trực tiếp). */
export function isGscSuccessCode(code: unknown): boolean {
    if (code === undefined || code === null || code === '') return true;
    const n = Number(code);
    return n === 0 || n === 200;
}

export function isGscApiErrorPayload(data: unknown): boolean {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const code = (data as { code?: unknown }).code;
    if (code === undefined || code === null || code === '') return false;
    return !isGscSuccessCode(code);
}

/** §3.6 — response có thể là mảng hoặc `{ code, data/products/... }`. */
export function extractAvailableProducts(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (!data || typeof data !== 'object') return [];
    const o = data as Record<string, unknown>;
    for (const key of ['data', 'products', 'available_products', 'items', 'list']) {
        const v = o[key];
        if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
    return [];
}

/** §3.4 — `provider_games` trong body hoặc `data.provider_games`. */
export function extractProviderGames(data: unknown): {
    rows: Record<string, unknown>[];
    pagination?: { size?: number | string; offset?: number | string; total?: number | string };
} {
    if (!data || typeof data !== 'object') return { rows: [] };
    const o = data as Record<string, unknown>;
    let rows: Record<string, unknown>[] = [];
    if (Array.isArray(o.provider_games)) rows = o.provider_games as Record<string, unknown>[];
    else if (o.data && typeof o.data === 'object') {
        const inner = o.data as Record<string, unknown>;
        if (Array.isArray(inner.provider_games)) rows = inner.provider_games as Record<string, unknown>[];
    }
    const pagination = (o.pagination || (o.data as Record<string, unknown> | undefined)?.pagination) as
        | { size?: number | string; offset?: number | string; total?: number | string }
        | undefined;
    return { rows, pagination };
}
