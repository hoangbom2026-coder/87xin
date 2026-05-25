import { CronJob } from 'cron';
import affiliateStatsService from '@main/services/affiliate-stats.service';
import logger from '@config/logger';

// Chạy lúc 00:05 mỗi ngày để chốt hoa hồng hôm qua
export const startAffiliateDailyCron = () => {
    new CronJob('5 0 * * *', async () => {
        logger.info('Running Daily Affiliate Commission Calculation...');
        try {
            await affiliateStatsService.calculateDailyCommissions();
            logger.info('Daily Affiliate Commission Calculation Completed.');
        } catch (error) {
            logger.error('Daily Affiliate Commission Calculation Failed:', error);
        }
    }).start();

    // Chạy mỗi 30 phút để cập nhật thu nhập dự kiến hôm nay
    new CronJob('*/30 * * * *', async () => {
        logger.info('Updating Today Expected Affiliate Income...');
        try {
            await affiliateStatsService.updateTodayExpected();
            logger.info('Today Expected Affiliate Income Updated.');
        } catch (error) {
            logger.error('Updating Today Expected Affiliate Income Failed:', error);
        }
    }).start();
};

