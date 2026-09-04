export { startAffiliateFakeFeedCron, stopAffiliateFakeFeedCron } from '../../apps/backend/src/main/cron/affiliate-fake-feed.cron';
export { startAffiliateDailyCron } from '../../apps/backend/src/main/cron/affiliate-daily.cron';
export { startAgencyInvestmentInterestCron } from '../../apps/backend/src/main/cron/agency-investment-interest.cron';

import { startAffiliateFakeFeedCron } from '../../apps/backend/src/main/cron/affiliate-fake-feed.cron';
import { startAffiliateDailyCron } from '../../apps/backend/src/main/cron/affiliate-daily.cron';
import { startAgencyInvestmentInterestCron } from '../../apps/backend/src/main/cron/agency-investment-interest.cron';

export const startAllCrons = (): void => {
    startAffiliateFakeFeedCron();
    startAffiliateDailyCron();
    startAgencyInvestmentInterestCron();
};
