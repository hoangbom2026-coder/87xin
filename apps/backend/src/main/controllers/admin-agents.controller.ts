/**
 * Admin: quản lý chương trình Đại lý (reagent).
 *
 * Tách rõ với "Affiliate": phần này chỉ làm việc với cờ User.reagentEnrolled,
 * cấu hình settings.reagentPage và transactions có gameId là reagent_*.
 */
import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import UserModel from '@main/models/user.model';
import TransactionModel from '@main/models/transaction.model';
import settingService from '@main/services/setting.service';
import { mergeReagentPage } from '@main/constants/reagent-page-defaults';
import * as reagentEnrollmentService from '@main/services/reagent-enrollment.service';
import { logAdminAction } from '@main/services/admin-audit.service';
import agencyService from '@main/services/agency.service';

const REAGENT_GAME_IDS = ['reagent_enrollment', 'reagent_referral_commission'];

const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

/** Tổng quan: số đại lý, số đơn chờ, doanh thu phí, tổng hoa hồng đã chi, dữ liệu dòng tiền Cashflow. */
export const getStats = catchAsync(async (_req: AuthRequest, res: Response) => {
    const [enrolled, legacyOnly, feeAgg, commissionAgg, interestAgg, transferAgg, recent] = await Promise.all([
        UserModel.countDocuments({ reagentEnrolled: true }),
        UserModel.countDocuments({ reagentEnrolled: { $ne: true } }),
        TransactionModel.aggregate([
            { $match: { gameId: 'reagent_enrollment' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        TransactionModel.aggregate([
            { $match: { gameId: 'reagent_referral_commission' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        TransactionModel.aggregate([
            { $match: { type: 'interest', provider: 'agency' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        TransactionModel.aggregate([
            { $match: { type: 'transfer_to_main', provider: 'agency' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        TransactionModel.find({ gameId: { $in: REAGENT_GAME_IDS } })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
    ]);

    return res.send({
        enrolledCount: enrolled,
        nonAgentCount: legacyOnly,
        feeRevenue: feeAgg[0]?.total ?? 0,
        feeCount: feeAgg[0]?.count ?? 0,
        commissionTotal: commissionAgg[0]?.total ?? 0,
        commissionCount: commissionAgg[0]?.count ?? 0,
        interestTotal: interestAgg[0]?.total ?? 0,
        interestCount: interestAgg[0]?.count ?? 0,
        transferTotal: transferAgg[0]?.total ?? 0,
        transferCount: transferAgg[0]?.count ?? 0,
        recent
    });
});

/** Danh sách đại lý — filter status: enrolled | non | all, search username/email. */
export const listAgents = catchAsync(async (req: AuthRequest, res: Response) => {
    const status = String(req.query.status ?? 'enrolled');
    const q = String(req.query.q ?? '').trim();
    const page = Math.max(1, num(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, num(req.query.limit, 20)));

    const cond: Record<string, unknown> = {};
    if (status === 'enrolled') cond.reagentEnrolled = true;
    else if (status === 'non') cond.reagentEnrolled = { $ne: true };

    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        cond.$or = [{ username: rx }, { email: rx }, { firstName: rx }, { lastName: rx }];
    }

    const [items, total] = await Promise.all([
        UserModel.find(cond)
            .sort({ updatedAt: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('username email firstName lastName reagentEnrolled invitorId createdAt updatedAt depositCount agencyBalance lockUntil unlockAt')
            .lean(),
        UserModel.countDocuments(cond)
    ]);

    return res.send({ items, total, page, limit });
});

/** Bật/tắt cờ đại lý cho user — phục vụ duyệt thủ công hoặc revoke. */
export const setAgentStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const { enrolled } = req.body as { enrolled: boolean };
    const user = await UserModel.findByIdAndUpdate(
        userId,
        { reagentEnrolled: !!enrolled },
        { new: true }
    ).select('username reagentEnrolled');
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    await logAdminAction({
        adminUserId: String(req.user?._id ?? ''),
        adminUsername: String(req.user?.username ?? ''),
        action: enrolled ? 'agent.approve' : 'agent.revoke',
        targetType: 'user',
        targetId: String(user._id),
        details: `username=${user.username}`
    });
    return res.send({ ok: true, user });
});

/** Lịch sử hoa hồng đại lý — từ TransactionModel. */
export const listCommissions = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, num(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, num(req.query.limit, 20)));
    const userId = String(req.query.userId ?? '');

    const cond: Record<string, unknown> = {
        gameId: { $in: REAGENT_GAME_IDS }
    };
    if (userId) cond.userId = userId;

    const [items, total] = await Promise.all([
        TransactionModel.find(cond)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        TransactionModel.countDocuments(cond)
    ]);

    return res.send({ items, total, page, limit });
});

/** Lấy cấu hình chương trình đại lý (settings.reagentPage). */
export const getProgram = catchAsync(async (_req: AuthRequest, res: Response) => {
    const doc = await settingService.getSetting();
    const merged = mergeReagentPage(doc?.reagentPage as never);
    return res.send(merged);
});

/** Lưu cấu hình chương trình đại lý. */
export const updateProgram = catchAsync(async (req: AuthRequest, res: Response) => {
    const next = (req.body || {}) as Record<string, unknown>;
    const doc = await settingService.getSetting();
    const current = (doc?.reagentPage ?? {}) as Record<string, unknown>;
    const merged = mergeReagentPage({ ...current, ...next } as never);
    await settingService.updateSetting({ reagentPage: merged as never });
    return res.send(merged);
});

/** Khởi tạo lại checklist enrollment cho 1 user (hữu ích khi cần debug). */
export const recheckEnrollment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const doc = await settingService.getSetting();
    const merged = mergeReagentPage(doc?.reagentPage as never).enrollment;
    const result = await reagentEnrollmentService.enrollmentChecklist(merged, userId);
    return res.send(result);
});

/** Xem cây đại lý của 1 user kèm lọc theo số tầng (View Level). */
export const getAgentTree = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const users = await UserModel.aggregate([
        { $match: { path: userId } },
        {
            $lookup: {
                from: 'balances',
                localField: '_id',
                foreignField: 'userId',
                as: 'balances'
            }
        },
        {
            $project: {
                username: 1,
                invitorId: 1,
                reagentEnrolled: 1,
                role: 1,
                createdAt: 1,
                depositCount: 1,
                path: 1,
                agencyBalance: { $ifNull: ["$agencyBalance", 0] },
                lockUntil: 1,
                balance: { $ifNull: [{ $arrayElemAt: ["$balances.amount", 0] }, 0] }
            }
        }
    ]);

    const maxLevel = req.query.level ? Number(req.query.level) : 20;
    const formatted = users
        .filter((u) => {
            if (!Array.isArray(u.path)) return true;
            const idx = u.path.map(String).indexOf(userId);
            if (idx === -1) return true;
            const depth = u.path.length - idx;
            return depth <= maxLevel;
        })
        .map((u) => ({
            id: String(u._id),
            username: u.username,
            parentId: u.invitorId ? String(u.invitorId) : null,
            role: u.role,
            enrolled: u.reagentEnrolled,
            balance: u.agencyBalance || u.balance, // Ưu tiên hiển thị vốn đầu tư Agency
            agencyBalance: u.agencyBalance || 0,
            lockUntil: u.lockUntil,
            joinedAt: u.createdAt,
            depositCount: u.depositCount || 0
        }));

    return res.send({ success: true, data: formatted });
});

/** Điều chỉnh thủ công từ Admin. */
export const postManualAdjustment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const { agencyBalance, lockUntil, unlockAt, reason } = req.body;
    const adminUser = req.user;

    const result = await agencyService.manualAdjustment(
        { _id: adminUser._id, username: adminUser.username },
        userId,
        { agencyBalance, lockUntil, unlockAt, reason }
    );

    await logAdminAction({
        adminUserId: String(adminUser._id),
        adminUsername: String(adminUser.username),
        action: 'agent.manual_adjustment',
        targetType: 'user',
        targetId: userId,
        details: `agencyBalance=${agencyBalance}, lockUntil=${lockUntil}, reason=${reason}`
    });

    res.json(result);
});

/** Chạy lại quy trình trả lãi đêm (Retry Cron). */
export const postRetryInterestCron = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await agencyService.runInterestCron();
    await logAdminAction({
        adminUserId: String(req.user?._id ?? ''),
        adminUsername: String(req.user?.username ?? ''),
        action: 'agent.retry_interest_cron',
        targetType: 'system',
        targetId: 'cron',
        details: `processed=${result.processed}, errors=${result.errors}`
    });
    res.json(result);
});
