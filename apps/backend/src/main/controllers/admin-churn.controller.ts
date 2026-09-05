import httpStatus from 'http-status';
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import ApiError from '@utils/ApiError';
import adminChurnService from '@main/services/admin-churn.service';
import userService from '@main/services/user.service';
import bonusService from '@main/services/bonus.service';
import playerBonusService from '@main/services/player-bonus.service';
import balanceService from '@main/services/balance.service';
import notificationService from '@main/services/notification.service';
import adminAuditService from '@main/services/admin-audit.service';

export const getChurnAtRisk = catchAsync(async (req: AuthRequest, res: Response) => {
    const inactiveDays = req.query.inactiveDays != null ? Number(req.query.inactiveDays) : 5;
    const limit = req.query.limit != null ? Number(req.query.limit) : 30;
    const data = await adminChurnService.getChurnAtRisk(inactiveDays, limit);
    return res.send(data);
});

/** Gán player bonus + (tuỳ chọn) in-app notification chỉ user đích. */
export const postChurnOffer = catchAsync(async (req: AuthRequest, res: Response) => {
    const {
        userId,
        bonusId,
        amount,
        goalAmount,
        sendNotification,
        notificationTitle,
        notificationContent,
        link
    } = req.body as {
        userId: string;
        bonusId: string;
        amount: number;
        goalAmount: number;
        sendNotification: boolean;
        notificationTitle?: string;
        notificationContent?: string;
        link?: string;
    };

    const user = await userService.getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
    }
    const bonus = await bonusService.getBonusById(bonusId);
    if (!bonus) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bonus not found');
    }
    if (!bonus.status || bonus.isExpired) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bonus is not available');
    }

    const amountN = Number(amount.toFixed(2));
    const goalN = Number(goalAmount.toFixed(2));

    const playerBonus = await playerBonusService.createPlayerBonus({
        userId: String(user._id),
        bonusId: String(bonus._id),
        amount: amountN,
        goalAmount: goalN
    });
    const balance = await balanceService.depositBonus(String(user._id), amountN);

    let notification: Awaited<ReturnType<typeof notificationService.createNotification>> | null = null;
    if (sendNotification) {
        const title =
            (notificationTitle && String(notificationTitle).trim()) ||
            'Ưu đãi giữ chân';
        const content =
            (notificationContent && String(notificationContent).trim()) ||
            `Bạn có thưởng khuyến mãi mới. Mở mục Khuyến mãi để xem chi tiết.`;
        notification = await notificationService.createNotification({
            title,
            content,
            link: link != null ? String(link) : '',
            category: 'promotions',
            recipientOnlyUserId: String(user._id)
        });
    }

    const storedSocketId = await global.redis.get(String(user._id));
    if (storedSocketId) {
        global.io.to(storedSocketId).emit('balance', {
            amount: balance?.amount,
            bonus: balance?.bonus,
            pending: balance?.pending,
            turnover: balance?.turnover
        });
    }

    await adminAuditService.logAdminAction({
        adminUserId: String(req.user!._id),
        adminUsername: String((req.user as { username?: string }).username ?? ''),
        action: 'CHURN_OFFER',
        targetType: 'user',
        targetId: String(user._id),
        details: JSON.stringify({ bonusId, amount: amountN, goalAmount: goalN, sendNotification })
    });

    return res.send({ playerBonus, balance, notification });
});
