"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAllCrons = exports.startAgencyInvestmentInterestCron = exports.startAffiliateDailyCron = exports.stopAffiliateFakeFeedCron = exports.startAffiliateFakeFeedCron = void 0;
var affiliate_fake_feed_cron_1 = require("../../apps/backend/src/main/cron/affiliate-fake-feed.cron");
Object.defineProperty(exports, "startAffiliateFakeFeedCron", { enumerable: true, get: function () { return affiliate_fake_feed_cron_1.startAffiliateFakeFeedCron; } });
Object.defineProperty(exports, "stopAffiliateFakeFeedCron", { enumerable: true, get: function () { return affiliate_fake_feed_cron_1.stopAffiliateFakeFeedCron; } });
var affiliate_daily_cron_1 = require("../../apps/backend/src/main/cron/affiliate-daily.cron");
Object.defineProperty(exports, "startAffiliateDailyCron", { enumerable: true, get: function () { return affiliate_daily_cron_1.startAffiliateDailyCron; } });
var agency_investment_interest_cron_1 = require("../../apps/backend/src/main/cron/agency-investment-interest.cron");
Object.defineProperty(exports, "startAgencyInvestmentInterestCron", { enumerable: true, get: function () { return agency_investment_interest_cron_1.startAgencyInvestmentInterestCron; } });
const affiliate_fake_feed_cron_2 = require("../../apps/backend/src/main/cron/affiliate-fake-feed.cron");
const affiliate_daily_cron_2 = require("../../apps/backend/src/main/cron/affiliate-daily.cron");
const agency_investment_interest_cron_2 = require("../../apps/backend/src/main/cron/agency-investment-interest.cron");
const startAllCrons = () => {
    (0, affiliate_fake_feed_cron_2.startAffiliateFakeFeedCron)();
    (0, affiliate_daily_cron_2.startAffiliateDailyCron)();
    (0, agency_investment_interest_cron_2.startAgencyInvestmentInterestCron)();
};
exports.startAllCrons = startAllCrons;
