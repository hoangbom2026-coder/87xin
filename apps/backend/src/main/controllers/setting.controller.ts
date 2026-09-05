import { Request, Response } from 'express';
import catchAsync from '@utils/catchAsync';
import SettingModel from '@main/models/setting.model';
import { AuthRequest } from '@middlewares/auth';

/** GET /setting/site — dữ liệu mặc định public (không cần auth) */
export const getDefaultData = catchAsync(async (_req: Request, res: Response) => {
    const setting = await SettingModel.findOne({ name: 'setting' }).lean();
    return res.send({
        siteName: setting?.siteName || 'tc-gaming',
        logo: setting?.logo || '',
        telegram: setting?.telegram || '',
        email: setting?.email || '',
        phone: setting?.phone || '',
        address: setting?.address || '',
        currency: setting?.currency || 'BRL',
        timezone: setting?.timezone || 'UTC',
        maintenance: setting?.maintenance ?? false
    });
});

/** GET /setting/business — cấu hình business (admin) */
export const getBusinessSettings = catchAsync(async (_req: AuthRequest, res: Response) => {
    const setting = await SettingModel.findOne({ name: 'setting' }).lean();
    return res.send(setting || {});
});

/** PATCH /setting/business — cập nhật cấu hình business (admin) */
export const patchBusinessSettings = catchAsync(async (req: AuthRequest, res: Response) => {
    const update = req.body;
    const setting = await SettingModel.findOneAndUpdate(
        { name: 'setting' },
        { $set: update },
        { new: true, upsert: true }
    );
    return res.send(setting);
});

/** POST /setting/upload-banner — upload banner asset (admin) */
export const uploadBannerAsset = catchAsync(async (req: AuthRequest, res: Response) => {
    const file = (req as any).file;
    if (!file) return res.status(400).send({ message: 'No file uploaded' });
    return res.send({ url: file.path || file.filename });
});

/** GET /setting/telegram/templates — danh sách templates telegram (admin) */
export const getTelegramTemplates = catchAsync(async (_req: AuthRequest, res: Response) => {
    const setting = await SettingModel.findOne({ name: 'setting' }).lean();
    return res.send(setting?.telegramTemplates || []);
});

/** POST /setting/telegram/test — gửi tin nhắn test (admin) */
export const sendTelegramTest = catchAsync(async (req: AuthRequest, res: Response) => {
    const {} = req.body;
    return res.send({ success: true, message: 'Test message sent (stub)' });
});

/** GET /setting/email — cấu hình email (admin) */
export const getEmailSettings = catchAsync(async (_req: AuthRequest, res: Response) => {
    const setting = await SettingModel.findOne({ name: 'setting' }).lean();
    return res.send(setting?.emailSettings || {});
});

/** PATCH /setting/email — cập nhật cấu hình email (admin) */
export const patchEmailSettings = catchAsync(async (req: AuthRequest, res: Response) => {
    const update = req.body;
    const setting = await SettingModel.findOneAndUpdate(
        { name: 'setting' },
        { $set: { emailSettings: update } },
        { new: true, upsert: true }
    );
    return res.send(setting);
});

/** POST /setting/email/test — gửi email test (admin) */
export const sendEmailTest = catchAsync(async (_req: AuthRequest, res: Response) => {
    return res.send({ success: true, message: 'Test email sent (stub)' });
});