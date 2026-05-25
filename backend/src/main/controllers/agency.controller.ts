import httpStatus from 'http-status';
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import ApiError from '@utils/ApiError';
import agencyService from '@main/services/agency.service';
import { planService } from '@main/services/plan.service';
import { investLogService } from '@main/services/invest-log.service';
import balanceService from '@main/services/balance.service';
import userService from '@main/services/user.service';
import transactionService from '@main/services/transaction.service';

export const getAgencyOverview = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = await agencyService.getDashboard(String(req.user._id));
    res.json(data);
});

export const getAgencyPlans = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const data = await agencyService.listActivePlans(page, limit);
    res.json(data);
});

export const getAgencyPlanPreview = catchAsync(async (req: AuthRequest, res: Response) => {
    const plan = await planService.getById((req.params as any).planId);
    if (!plan || plan.status !== 'active') {
        throw new ApiError(httpStatus.NOT_FOUND, 'Gói không tồn tại');
    }
    const amount = Number(req.query.amount);
    const preview = agencyService.preview(plan, amount);
    res.json(preview);
});

export const postAgencyInvest = catchAsync(async (req: AuthRequest, res: Response) => {
    const { planId, amount } = req.body as { planId: string; amount: number };
    const log = await agencyService.subscribe(String(req.user._id), planId, Number(amount));
    res.status(201).json(log);
});

export const getAgencyInvestments = catchAsync(async (req: AuthRequest, res: Response) => {
    const logs = await investLogService.getLogsByUserId(String(req.user._id));
    res.json({ items: logs });
});

export const postAgencyTransferToMain = catchAsync(async (req: AuthRequest, res: Response) => {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0 || Number.isNaN(amount)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Số tiền chuyển không hợp lệ');
    }

    const user = req.user;
    const currentTime = new Date();

    // Kiểm tra điều kiện rút/chuyển quỹ theo thời gian khóa
    if (user.unlockAt && currentTime < user.unlockAt) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Khoản hoa hồng này đang trong thời gian chờ (7 ngày)');
    }
    if (user.lockUntil && currentTime < user.lockUntil) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Vốn đầu tư chưa đến kỳ hạn rút (90 ngày)');
    }

    const agencyBalance = Number(user.agencyBalance ?? 0);
    if (agencyBalance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Số dư Agency không đủ');
    }

    // Trừ ví agencyBalance và cộng vào ví chính
    await userService.patchUpdate({ _id: user._id }, { $inc: { agencyBalance: -amount } });
    const updatedBalance = await balanceService.creditBalance(String(user._id), amount);

    // Ghi nhận giao dịch
    await transactionService.createTransaction({
        userId: String(user._id),
        relatedId: String(user._id),
        tnxId: `AG-TRANSFER-${Date.now()}`,
        amount,
        beforeAmount: Number(((updatedBalance?.amount ?? amount) - amount).toFixed(2)),
        afterAmount: Number(((updatedBalance?.amount ?? amount)).toFixed(2)),
        currencyName: user.currency || 'VND',
        type: 'transfer_to_main',
        typeDescription: 'Chuyển quỹ từ Ví Agency sang Ví chính',
        provider: 'agency',
        category: 'payment',
        path: Array.isArray(user.path) ? user.path.map(String) : []
    });

    const storedSocketId = await global.redis.get(String(user._id));
    if (storedSocketId && updatedBalance) {
        global.io.to(storedSocketId).emit('balance', {
            amount: updatedBalance.amount,
            agencyBalance: agencyBalance - amount
        });
    }

    res.json({ success: true, amount, agencyBalance: agencyBalance - amount });
});
