import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import PlanModel from '../main/models/plan.model';
import InvestLogModel from '../main/models/invest-log.model';
import UserModel from '../main/models/user.model';
import agencyService from '../main/services/agency.service';
import balanceService from '../main/services/balance.service';

async function runTest() {
    console.log('--- STARTING MLM LOGIC TEST ---');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URL!);
    console.log('Connected to MongoDB');

    try {
        // 1. Create a dummy plan with 3 levels of referral
        const plan = await PlanModel.create({
            name: 'MLM Test Plan',
            interest: 10,
            interestStatus: 'percentage',
            times: 5, // Daily
            returnFor: 1,
            repeatTime: 10,
            capitalBack: 1,
            status: 'active',
            referral: {
                levels: ['L1', 'L2', 'L3'],
                commissions: [10, 5, 2] // 10% F1, 5% F2, 2% F3
            }
        });
        console.log('Created test plan:', plan._id);

        // 2. Create a chain of users: Root -> U1 (F2) -> U2 (F1) -> Investor
        const root = await UserModel.findOne({ role: 'admin' });
        if (!root) throw new Error('Admin user not found for root');

        const u1 = await UserModel.create({
            username: 'u1_f2_' + Date.now(),
            role: 'user',
            invitorId: root._id,
            path: [String(root._id)],
            currency: 'VND'
        });
        
        const u2 = await UserModel.create({
            username: 'u2_f1_' + Date.now(),
            role: 'user',
            invitorId: u1._id,
            path: [String(root._id), String(u1._id)],
            currency: 'VND'
        });

        const investor = await UserModel.create({
            username: 'investor_' + Date.now(),
            role: 'user',
            invitorId: u2._id,
            path: [String(root._id), String(u1._id), String(u2._id)],
            currency: 'VND'
        });
        console.log('Created user chain:', investor.username);

        // Ensure balances exist
        await balanceService.creditBalance(String(u1._id), 0);
        await balanceService.creditBalance(String(u2._id), 0);
        await balanceService.creditBalance(String(root._id), 0);

        // 3. Create an active investment log for the investor
        const log = await InvestLogModel.create({
            userId: investor._id,
            planId: plan._id,
            trxId: 'TEST_' + crypto.randomBytes(4).toString('hex').toUpperCase(),
            amount: 1000000,
            interestPerPeriod: 100000, // 10% of 1M
            periodMs: 86400000,
            status: 'active',
            nextPayoutDate: new Date(Date.now() - 1000), // Due now
            payCount: 0,
            maxPayCount: 10,
            capitalBack: 1
        });
        console.log('Created invest log:', log.trxId);

        // 4. Run the interest cron
        console.log('Running interest cron...');
        const result = await agencyService.runInterestCron();
        console.log('Cron result:', result);

        // 5. Verify balances
        const b_u2 = await balanceService.getBalanceByUserId(String(u2._id)); // F1: 10% of 100k = 10k
        const b_u1 = await balanceService.getBalanceByUserId(String(u1._id)); // F2: 5% of 100k = 5k
        const b_root = await balanceService.getBalanceByUserId(String(root._id)); // F3: 2% of 100k = 2k

        console.log('F1 (U2) balance:', b_u2.amount);
        console.log('F2 (U1) balance:', b_u1.amount);
        console.log('F3 (Root) balance:', b_root.amount);

        if (b_u2.amount === 10000 && b_u1.amount === 5000 && b_root.amount === 2000) {
            console.log('✅ MLM COMMISSION TEST PASSED!');
        } else {
            console.log('❌ MLM COMMISSION TEST FAILED!');
        }

        // Cleanup
        await InvestLogModel.deleteOne({ _id: log._id });
        await UserModel.deleteMany({ _id: { $in: [u1._id, u2._id, investor._id] } });
        await PlanModel.deleteOne({ _id: plan._id });
        console.log('Cleanup done');

    } catch (err) {
        console.error('Test error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
