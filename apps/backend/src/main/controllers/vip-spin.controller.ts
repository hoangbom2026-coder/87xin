import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import vipSpinPrizeService from '@main/services/vip-spin-prize.service';
import balanceService from '@main/services/balance.service';
import vipSpinRewardService from '@main/services/vip-spin-reward.service';
import currencyService from '@main/services/currency.service';
import transactionService from '@main/services/transaction.service';
import type { IVipSpinPrizeSlot } from '@main/models/vip-spin-prize.model';

function getClosestPrize(prizes, currentXp: number) {
    const filtered = prizes.filter((item) => item.xp <= currentXp);
    if (filtered.length === 0) return false;
    return filtered.reduce((prev, curr) => (curr.xp > prev.xp ? curr : prev));
}

/** Các ô thỏa điều kiện mới vào pool random; nếu không còn ô → fallback toàn bộ (tránh khóa cứng). */
function eligibleSpinSlots(
    prizes: IVipSpinPrizeSlot[],
    ctx: { turnover: number; vipXp: number; depositCount: number }
): IVipSpinPrizeSlot[] {
    const pred = (p: IVipSpinPrizeSlot) => {
        if (p.minTurnover != null && p.minTurnover > 0 && ctx.turnover < p.minTurnover) return false;
        if (p.minVipXp != null && p.minVipXp > 0 && ctx.vipXp < p.minVipXp) return false;
        if (p.minDepositCount != null && p.minDepositCount > 0 && ctx.depositCount < p.minDepositCount) {
            return false;
        }
        return true;
    };
    const eligible = prizes.filter(pred);
    return eligible.length ? eligible : prizes;
}

function weightedSpinPick(prizes: IVipSpinPrizeSlot[]): IVipSpinPrizeSlot {
    const sum = prizes.reduce((s, p) => s + Math.max(0, Number(p.probability) || 0), 0);
    if (sum <= 0) return prizes[prizes.length - 1];
    let r = Math.random() * sum;
    for (let i = 0; i < prizes.length; i++) {
        r -= Math.max(0, Number(prizes[i].probability) || 0);
        if (r <= 0) return prizes[i];
    }
    return prizes[prizes.length - 1];
}

export const getReadySpin = catchAsync(async (req: AuthRequest, res: Response) => {
    const balance = await balanceService.getBalanceByUserId(String(req.user._id));
    const vipSpinPrizes = await vipSpinPrizeService.getVipSpinPrizes();
    const availablePrize = getClosestPrize(vipSpinPrizes, balance.turnover);
    if (availablePrize) {
        const lastSpin = await vipSpinRewardService.getLastSpin(String(req.user._id));
        if (lastSpin) {
            const now = new Date();
            const createdAt = new Date(lastSpin.createdAt);
            const diffMs = now.getTime() - createdAt.getTime();

            const twentyFourHoursMs = 24 * 60 * 60 * 1000;

            if (diffMs < twentyFourHoursMs) {
                const remainingMs = twentyFourHoursMs - diffMs;

                const totalSeconds = Math.floor(remainingMs / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                return res.send({
                    ...availablePrize,
                    status: 'waiting',
                    timeLeft: {
                        hours,
                        minutes,
                        seconds
                    }
                });
            }
            return res.send({
                ...availablePrize,
                status: 'active'
            });
        }
        return res.send({
            ...availablePrize,
            status: 'active'
        });
    }
    return res.send({
        ...vipSpinPrizes[0],
        status: 'lowLevel'
    });
});

export const playSpin = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const balance = await balanceService.getBalanceByUserId(user._id);
    const currency = await currencyService.getCurrencyById(user.currencyId);
    const vipSpinPrizes = await vipSpinPrizeService.getVipSpinPrizes();
    const availablePrize = getClosestPrize(vipSpinPrizes, balance.turnover);
    if (availablePrize) {
        const vipXp = Number((user as { vipXp?: number }).vipXp ?? 0);
        const depositCount = Number(user.depositCount ?? 0);
        const turnover = Number(balance.turnover ?? 0);
        const pool = eligibleSpinSlots(availablePrize.prizes, { turnover, vipXp, depositCount });
        const prize = weightedSpinPick(pool);
        const reward = await vipSpinRewardService.createVipSpinReward({
            userId: user._id,
            amount: prize.amount,
            currency: currency.name
        });
        return res.send({
            prizeId: prize.id,
            rewardId: reward._id,
            prize: `${currency.name} ${prize.amount}`
        });
    }
    throw new ApiError(httpStatus.BAD_REQUEST, 'Your Spin is not allowed');
});

export const collect = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { rewardId } = req.body;
    const reward = await vipSpinRewardService.getVipSpinRewardById(rewardId);
    if (!reward || reward.claimed === true) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Prize not found');
    }
    await vipSpinRewardService.patchUpdate({ _id: rewardId }, { claimed: true });
    const currency = await currencyService.getCurrencyById(user.currencyId);
    const balance = await balanceService.getBalanceByUserId(user._id);
    const updatedBalance = await balanceService.depositBalance(user._id, reward.amount);
    await transactionService.createTransaction({
        userId: user._id,
        relatedId: String(reward._id),
        tnxId: new Date().valueOf().toString(),
        amount: Number(reward.amount.toFixed(2)),
        beforeAmount: Number(balance.amount.toFixed(2)),
        afterAmount: Number(updatedBalance.amount.toFixed(2)),
        currencyName: currency.name.toUpperCase(),
        type: 'bonus',
        typeDescription: 'Lucky Spin',
        gameName: 'Lucky Spin',
        gameId: 'lucky_spin',
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
        message: 'Successfully collected to your balance'
    });
});

export const getTotalBonus = catchAsync(async (req: AuthRequest, res: Response) => {
    const totalAmountData = await vipSpinRewardService.getTotalBonus();
    return res.send(totalAmountData);
});

export const getWinners = catchAsync(async (req: AuthRequest, res: Response) => {
    const winners = await vipSpinRewardService.getWinners();
    return res.send(winners);
});
