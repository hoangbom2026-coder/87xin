import { CronJob } from 'cron';
import agencyService from '@main/services/agency.service';

let agencyInterestJob: CronJob | null = null;

/**
 * Cron tuỳ chọn: biểu thức `AGENCY_INTEREST_CRON` (vd. `15 * * * *`).
 * Handler hiện chỉ log số hợp đồng đến hạn — logic trả lãi xem `agencyService.runInterestCronStub`.
 */
export function startAgencyInvestmentInterestCron(): void {
    const inst = process.env.NODE_APP_INSTANCE;
    if (inst !== undefined && inst !== '0') return;
    const expr = (process.env.AGENCY_INTEREST_CRON || '').trim();
    if (!expr) return;

    if (agencyInterestJob) {
        agencyInterestJob.stop();
        agencyInterestJob = null;
    }

    try {
        agencyInterestJob = new CronJob(expr, async () => {
            try {
                const r = await agencyService.runInterestCron();
                if (r.processed > 0) {
                    // eslint-disable-next-line no-console
                    console.log('[agency-investment-interest]', r);
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('[agency-investment-interest]', e);
            }
        });
        agencyInterestJob.start();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Invalid AGENCY_INTEREST_CRON:', expr, e);
    }
}
