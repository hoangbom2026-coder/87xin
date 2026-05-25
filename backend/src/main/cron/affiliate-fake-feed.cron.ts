/**
 * Cron mềm: tick mỗi 10s, kiểm tra cấu hình fakeFeed.enabled & intervalSec
 * để sinh entry mới. Tránh dùng node-cron vì interval do admin đặt động.
 */
import * as svc from '@main/services/affiliate-extras.service';

const TICK_MS = 10_000;
let lastRunAt = 0;
let timer: NodeJS.Timeout | null = null;

async function tick() {
    try {
        const ex = await svc.getExtras();
        if (!ex.fakeFeed.enabled) return;
        const now = Date.now();
        const intervalMs = Math.max(10, Number(ex.fakeFeed.intervalSec || 0)) * 1000;
        if (now - lastRunAt < intervalMs) return;
        lastRunAt = now;
        await svc.generateFakeOne();
    } catch {
        /* swallow — không kill timer */
    }
}

export function startAffiliateFakeFeedCron() {
    if (timer) return;
    timer = setInterval(() => {
        void tick();
    }, TICK_MS);
}

export function stopAffiliateFakeFeedCron() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}
