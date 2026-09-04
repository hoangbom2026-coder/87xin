import mongoose from 'mongoose';
import moment from 'moment';
import AffiliateStatsModel from '@main/models/affiliate-stats.model';
import TransactionModel from '@main/models/transaction.model';
import UserModel from '@main/models/user.model';
import settingService from './setting.service';
import balanceService from './balance.service';

const getStatsByUserId = async (userId: string) => {
    let stats = await AffiliateStatsModel.findOne({ userId });
    if (!stats) {
        stats = await AffiliateStatsModel.create({ userId });
    }
    return stats;
};

const updateStats = async (userId: string, data: any) => {
    return await AffiliateStatsModel.findOneAndUpdate({ userId }, { $set: data }, { new: true, upsert: true });
};

/**
 * Phân loại Game Type sang nhóm commission
 */
const getCommissionCategory = (gameType: string): 'slots_fishing' | 'others' | 'lottery' => {
    const gt = String(gameType).toUpperCase();
    if (gt === 'SLOT' || gt === 'FISHING') return 'slots_fishing';
    if (gt === 'LOTTERY') return 'lottery';
    return 'others';
};

/**
 * Chốt hoa hồng hàng ngày (chạy vào 00:05 sáng)
 */
const calculateDailyCommissions = async () => {
    const setting = await settingService.getSetting();
    const config = setting?.affiliateMechanism;
    if (!config) return;

    const yesterdayStart = moment().subtract(1, 'days').startOf('day').toDate();
    const yesterdayEnd = moment().subtract(1, 'days').endOf('day').toDate();

    // 1. Tổng hợp cược hợp lệ của từng user trong ngày hôm qua, theo category
    const betAgg = await TransactionModel.aggregate([
        {
            $match: {
                type: 'bet',
                createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
            }
        },
        {
            $group: {
                _id: { userId: '$userId', category: '$category' },
                totalBet: { $sum: '$amount' }
            }
        }
    ]);

    // 2. Map cược sang commission cho các cấp upline
    const commissionMap: Record<string, number> = {}; // userId -> commission amount

    for (const item of betAgg) {
        const userId = item._id.userId;
        const category = getCommissionCategory(item._id.category);
        const totalBet = item.totalBet;

        const baseRatio = config.commission_rates[category] / 100; // vd 0.3% = 0.003
        if (baseRatio <= 0) continue;

        const user = await UserModel.findById(userId).select('path');
        if (!user || !user.path || user.path.length === 0) continue;

        // Cấp tổ tiên từ gần nhất (cha) đến xa nhất
        const ancestors = [...user.path].reverse();
        const multiRatio = config.multi_level_ratio / 100; // vd 10% = 0.1

        // Duyệt tối đa 3 cấp F1, F2, F3
        for (let i = 0; i < Math.min(ancestors.length, 3); i++) {
            const uplineId = ancestors[i];
            const level = i + 1; // 1=F1, 2=F2, 3=F3
            
            // Công thức: Cược * base% * (multi%)^(level-1)
            const commission = totalBet * baseRatio * Math.pow(multiRatio, level - 1);
            
            commissionMap[uplineId] = (commissionMap[uplineId] || 0) + commission;
        }
    }

    // 3. Cập nhật vào AffiliateStats
    const isReplicaSet = mongoose.connection.readyState === 1 && (mongoose.connection as any).db.databaseName && await mongoose.connection.db.admin().command({ isMaster: 1 }).then(r => !!r.setName).catch(() => false);

    if (!isReplicaSet) {
        // Fallback for standalone MongoDB (no transactions)
        await AffiliateStatsModel.updateMany({}, { $set: { todayExpected: 0 } });
        for (const [userId, amount] of Object.entries(commissionMap)) {
            await AffiliateStatsModel.findOneAndUpdate(
                { userId },
                {
                    $set: { yesterdayFinal: amount, lastCalculated: new Date() },
                    $inc: { unclaimedBalance: amount }
                },
                { upsert: true }
            );
        }
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Reset todayExpected cho tất cả và lưu yesterdayFinal
        await AffiliateStatsModel.updateMany({}, { $set: { todayExpected: 0 } }, { session });

        for (const [userId, amount] of Object.entries(commissionMap)) {
            await AffiliateStatsModel.findOneAndUpdate(
                { userId },
                {
                    $set: { yesterdayFinal: amount, lastCalculated: new Date() },
                    $inc: { unclaimedBalance: amount }
                },
                { upsert: true, session }
            );
        }
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
    };

/**
 * Cập nhật thu nhập dự kiến hôm nay (Real-time hoặc định kỳ ngắn)
 * Có thể gọi khi có transaction 'bet' mới hoặc cron ngắn hạn.
 */
const updateTodayExpected = async () => {
    const setting = await settingService.getSetting();
    const config = setting?.affiliateMechanism;
    if (!config) return;

    const todayStart = moment().startOf('day').toDate();

    const betAgg = await TransactionModel.aggregate([
        {
            $match: {
                type: 'bet',
                createdAt: { $gte: todayStart }
            }
        },
        {
            $group: {
                _id: { userId: '$userId', category: '$category' },
                totalBet: { $sum: '$amount' }
            }
        }
    ]);

    const expectedMap: Record<string, number> = {};

    for (const item of betAgg) {
        const userId = item._id.userId;
        const category = getCommissionCategory(item._id.category);
        const totalBet = item.totalBet;
        const baseRatio = config.commission_rates[category] / 100;
        if (baseRatio <= 0) continue;

        const user = await UserModel.findById(userId).select('path');
        if (!user || !user.path || user.path.length === 0) continue;

        const ancestors = [...user.path].reverse();
        const multiRatio = config.multi_level_ratio / 100;

        for (let i = 0; i < Math.min(ancestors.length, 3); i++) {
            const uplineId = ancestors[i];
            const level = i + 1;
            const commission = totalBet * baseRatio * Math.pow(multiRatio, level - 1);
            expectedMap[uplineId] = (expectedMap[uplineId] || 0) + commission;
        }
    }

    for (const [userId, amount] of Object.entries(expectedMap)) {
        await AffiliateStatsModel.findOneAndUpdate(
            { userId },
            { $set: { todayExpected: amount } },
            { upsert: true }
        );
    }
};

/**
 * Cập nhật số lượng người mời
 */
const updateInvitedCounts = async (userId: string) => {
    const setting = await settingService.getSetting();
    const config = setting?.affiliateMechanism;
    if (!config) return;

    const totalInvited = await UserModel.countDocuments({ invitorId: userId });
    
    // Điều kiện hợp lệ: Nạp > min_deposit AND Cược > min_valid_bet
    const validInvitedUsers = await UserModel.find({ invitorId: userId }).select('_id');
    const validUserIds = validInvitedUsers.map(u => u._id);

    let validInvited = 0;
    for (const vid of validUserIds) {
        const totalDeposit = await TransactionModel.aggregate([
            { $match: { userId: vid, type: 'deposit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const totalBet = await TransactionModel.aggregate([
            { $match: { userId: vid, type: 'bet' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const depositSum = totalDeposit[0]?.total || 0;
        const betSum = totalBet[0]?.total || 0;

        if (depositSum >= config.referral_bonus.min_deposit && betSum >= config.referral_bonus.min_valid_bet) {
            validInvited++;
        }
    }

    await AffiliateStatsModel.findOneAndUpdate(
        { userId },
        { $set: { totalInvited, validInvited } },
        { upsert: true }
    );
};

/**
 * Nhận hoa hồng vào ví chính
 */
const claimCommission = async (userId: string) => {
    const stats = await AffiliateStatsModel.findOne({ userId });
    if (!stats || stats.unclaimedBalance <= 0) {
        throw new Error('No commission to claim');
    }

    const amount = stats.unclaimedBalance;
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    const isReplicaSet = mongoose.connection.readyState === 1 && (mongoose.connection as any).db.databaseName && await mongoose.connection.db.admin().command({ isMaster: 1 }).then(r => !!r.setName).catch(() => false);

    if (!isReplicaSet) {
        // Fallback for standalone MongoDB
        await balanceService.creditBalance(userId, amount);
        await TransactionModel.create([{
            userId,
            amount,
            beforeAmount: 0, 
            afterAmount: amount,
            currencyName: user.currency,
            type: 'commission',
            typeDescription: 'Thu nhập Affiliate',
            category: 'affiliate'
        }]);
        stats.unclaimedBalance = 0;
        await stats.save();
        return amount;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Cập nhật ví chính
        await balanceService.creditBalance(userId, amount);

        // 2. Tạo transaction
        await TransactionModel.create([{
            userId,
            amount,
            beforeAmount: 0, 
            afterAmount: amount,
            currencyName: user.currency,
            type: 'commission',
            typeDescription: 'Thu nhập Affiliate',
            category: 'affiliate'
        }], { session });

        // 3. Reset stats
        stats.unclaimedBalance = 0;
        await stats.save({ session });

        await session.commitTransaction();
        return amount;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export default {
    getStatsByUserId,
    updateStats,
    calculateDailyCommissions,
    updateTodayExpected,
    updateInvitedCounts,
    claimCommission
};
