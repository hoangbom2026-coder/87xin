import mongoose from 'mongoose';
import config from '../config';
import affiliateStatsService from '../main/services/affiliate-stats.service';
import { logger } from '../config/logger';

async function runManualSync() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(config.mongodbURL as string);
        console.log('Connected.');

        console.log('Starting manual affiliate commission calculation...');
        await affiliateStatsService.calculateDailyCommissions();
        console.log('Daily commission calculation completed.');

        console.log('Updating today\'s expected income...');
        await affiliateStatsService.updateTodayExpected();
        console.log('Today\'s expected income updated.');

        process.exit(0);
    } catch (error) {
        console.error('Manual sync failed:', error);
        process.exit(1);
    }
}

runManualSync();
