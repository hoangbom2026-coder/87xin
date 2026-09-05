import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import balanceService from '@main/services/balance.service';
import currencyService from '@main/services/currency.service';
import transactionService from '@main/services/transaction.service';
import vipLevelUpBonusService from '@main/services/vip-level-up-bonus.service';

export const claimLevelUpBonus = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const reward = await vipLevelUpBonusService.getAvailableBonus(String(user._id));
    if (!reward || reward.claimed === true) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You do not have available bonus');
    }
    await vipLevelUpBonusService.patchUpdate({ _id: reward._id }, { claimed: true });
    const currency = await currencyService.getCurrencyById(String(user.currencyId));
    const balance = await balanceService.getBalanceByUserId(String(user._id));
    const updatedBalance = await balanceService.depositBalance(String(user._id), reward.amount);
    await transactionService.createTransaction({
        userId: String(user._id),
        relatedId: String(reward._id),
        tnxId: new Date().valueOf().toString(),
        amount: Number(reward.amount.toFixed(2)),
        beforeAmount: Number(balance.amount.toFixed(2)),
        afterAmount: Number(updatedBalance.amount.toFixed(2)),
        currencyName: currency.name.toUpperCase(),
        type: 'bonus',
        typeDescription: `Level Up ${reward.levelName} (${reward.levelXp})`,
        gameName: 'Leve Up Bonus',
        gameId: 'level_up_bonus',
        provider: 'bonus'
    });

    const storedSocketId = await global.redis.get(String(user._id));
    if (storedSocketId) {
        global.io.to(storedSocketId).emit('balance', {
            amount: updatedBalance.amount,
            bonus: updatedBalance.bonus,
            pending: updatedBalance.pending
        });
    }

    return res.send({
        message: 'Successfully claimed to your balance'
    });
});
