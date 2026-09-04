import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import { PackageModel } from '@main/models/packages.model';
import balanceService from './balance.service';
import transactionService from './transaction.service';
import UserModel from '@main/models/user.model';
import { TRANSACTION_TYPE } from '@config/static';

export const purchaseService = {
    async purchasePackage(userId: string, packageId: string) {
        const pkg = await PackageModel.findById(packageId);
        if (!pkg || pkg.status !== 'active') {
            throw new ApiError(httpStatus.NOT_FOUND, 'Gói hàng không tồn tại hoặc đã ngừng cung cấp');
        }

        const userBalance = await balanceService.getBalanceByUserId(userId);
        if (!userBalance || userBalance.amount < pkg.price) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Số dư không đủ để thực hiện giao dịch');
        }

        // 1. Debit price from balance
        const beforeAmount = userBalance.amount;
        const debitedBalance = await balanceService.debitBalance(userId, pkg.price);
        if (!debitedBalance) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Lỗi khi trừ tiền tài khoản');
        }

        // 2. Add rewards
        // Add gold coins (real balance)
        const creditedBalance = await balanceService.creditBalance(userId, pkg.goldCoins);
        
        // Add free coins (bonus balance)
        if (pkg.freeCoins > 0) {
            await balanceService.depositBonus(userId, pkg.freeCoins);
        }

        // 3. Apply benefits (e.g., VIP XP)
        if (pkg.benefits && pkg.benefits.vipXp) {
            await UserModel.findByIdAndUpdate(userId, { $inc: { vipXp: pkg.benefits.vipXp } });
        }

        const userDoc = await UserModel.findById(userId).select('currency').lean();
        const currencyName =
            typeof (userDoc as { currency?: string } | null)?.currency === 'string'
                ? (userDoc as { currency: string }).currency
                : 'VND';
        await transactionService.createTransaction({
            userId,
            relatedId: String(pkg._id),
            tnxId: `store-${Date.now()}-${pkg._id}`,
            amount: pkg.price,
            beforeAmount,
            afterAmount: creditedBalance.amount,
            type: 'purchase',
            typeDescription: `Mua gói hàng: ${pkg.title}`,
            currencyName,
            provider: 'store',
            category: 'store'
        });

        return {
            success: true,
            package: pkg,
            newBalance: creditedBalance.amount,
            newBonus: creditedBalance.bonus
        };
    }
};
