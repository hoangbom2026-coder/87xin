/**
 * Admin: quản lý chương trình Đại lý (reagent) — HTTP layer.
 *
 * Tách rõ với "Affiliate": phần này chỉ làm việc với cờ User.reagentEnrolled,
 * cấu hình settings.reagentPage và transactions có gameId là reagent_*.
 * Toàn bộ query logic nằm ở admin-agents.service.
 */
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import adminAgentsService from '@main/services/admin-agents.service';

/** Tổng quan: số đại lý, số đơn chờ, doanh thu phí, tổng hoa hồng đã chi, dữ liệu dòng tiền Cashflow. */
export const getStats = catchAsync(async (_req: AuthRequest, res: Response) => {
    const data = await adminAgentsService.getStats();
    return res.send(data);
});

/** Danh sách đại lý — filter status: enrolled | non | all, search username/email. */
export const listAgents = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = await adminAgentsService.listAgents({
        status: req.query.status,
        q: req.query.q,
        page: req.query.page,
        limit: req.query.limit
    });
    return res.send(data);
});

/** Bật/tắt cờ đại lý cho user — phục vụ duyệt thủ công hoặc revoke. */
export const setAgentStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const { enrolled } = req.body as { enrolled: boolean };
    const user = await adminAgentsService.setAgentStatus(userId, enrolled, {
        _id: req.user?._id,
        username: req.user?.username
    });
    return res.send({ ok: true, user });
});

/** Lịch sử hoa hồng đại lý — từ TransactionModel. */
export const listCommissions = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = await adminAgentsService.listCommissions({
        page: req.query.page,
        limit: req.query.limit,
        userId: req.query.userId
    });
    return res.send(data);
});

/** Lấy cấu hình chương trình đại lý (settings.reagentPage). */
export const getProgram = catchAsync(async (_req: AuthRequest, res: Response) => {
    const merged = await adminAgentsService.getProgram();
    return res.send(merged);
});

/** Lưu cấu hình chương trình đại lý. */
export const updateProgram = catchAsync(async (req: AuthRequest, res: Response) => {
    const merged = await adminAgentsService.updateProgram((req.body || {}) as Record<string, unknown>);
    return res.send(merged);
});

/** Khởi tạo lại checklist enrollment cho 1 user (hữu ích khi cần debug). */
export const recheckEnrollment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const result = await adminAgentsService.recheckEnrollment(userId);
    return res.send(result);
});

/** Xem cây đại lý của 1 user kèm lọc theo số tầng (View Level). */
export const getAgentTree = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const data = await adminAgentsService.getAgentTree(userId, req.query.level);
    return res.send(data);
});

/** Điều chỉnh thủ công từ Admin. */
export const postManualAdjustment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const adminUser = req.user;
    const result = await adminAgentsService.postManualAdjustment(
        { _id: adminUser._id, username: adminUser.username },
        userId,
        req.body
    );
    res.json(result);
});

/** Chạy lại quy trình trả lãi đêm (Retry Cron). */
export const postRetryInterestCron = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await adminAgentsService.postRetryInterestCron({
        _id: req.user?._id,
        username: req.user?.username
    });
    res.json(result);
});