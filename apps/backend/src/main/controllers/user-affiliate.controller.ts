import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import config from '@config/index';
import affiliateStatsService from '@main/services/affiliate-stats.service';
import userService from '@main/services/user.service';

export const getAffiliateOverview = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = String(req.user!._id);
    
    // Đảm bảo stats tồn tại và được cập nhật
    await affiliateStatsService.updateInvitedCounts(userId);
    await affiliateStatsService.updateTodayExpected(); // Optional: có thể chạy theo cron ngắn hơn
    
    const stats = await affiliateStatsService.getStatsByUserId(userId);
    const user = await userService.getInviteCodeByUserId(userId);
    
    const baseUrl = config.frontendUrl;
    const inviteLink = `${baseUrl}/register?r=${user?.inviteCode || ''}`;

    return res.send({
        status: 'success',
        data: {
            inviteLink,
            inviteCode: user?.inviteCode,
            unclaimedBalance: stats.unclaimedBalance,
            details: [
                { label: "Thu nhập dự kiến hôm nay", value: stats.todayExpected, isMoney: true },
                { label: "Thu nhập thực tế hôm qua", value: stats.yesterdayFinal, isMoney: true },
                { label: "Số lượng người đã mời", value: stats.totalInvited, isMoney: false },
                { label: "Số lượng lời mời hợp lệ", value: stats.validInvited, isMoney: false }
            ]
        }
    });
});

export const claimCommission = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = String(req.user!._id);
    const amount = await affiliateStatsService.claimCommission(userId);
    
    return res.send({
        status: 'success',
        message: 'Commission claimed successfully',
        amount
    });
});
