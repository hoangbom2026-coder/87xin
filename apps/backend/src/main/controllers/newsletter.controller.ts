import httpStatus from 'http-status';
import { Request, Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import { getIpAddress } from '@utils/utils';
import NewsletterSubscriberModel from '@main/models/newsletter-subscriber.model';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /newsletter/subscribe (public) */
export const subscribe = catchAsync(async (req: Request, res: Response) => {
    const email = String((req.body?.email ?? '') as string)
        .toLowerCase()
        .trim();
    const source = String((req.body?.source ?? 'web') as string).slice(0, 64);
    if (!EMAIL_RE.test(email)) throw new ApiError(httpStatus.BAD_REQUEST, 'Email không hợp lệ');
    const ip = getIpAddress(req);
    const doc = await NewsletterSubscriberModel.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, source, ip }, $set: { status: 'active' } },
        { upsert: true, new: true }
    );
    return res.status(httpStatus.CREATED).send({ ok: true, id: doc._id });
});

/** POST /newsletter/unsubscribe (public) */
export const unsubscribe = catchAsync(async (req: Request, res: Response) => {
    const email = String((req.body?.email ?? '') as string)
        .toLowerCase()
        .trim();
    if (!EMAIL_RE.test(email)) throw new ApiError(httpStatus.BAD_REQUEST, 'Email không hợp lệ');
    await NewsletterSubscriberModel.updateOne({ email }, { status: 'unsubscribed' });
    return res.send({ ok: true });
});

/** GET /newsletter/admin/list?keyword=&status=&page=&limit= */
export const adminList = catchAsync(async (req: AuthRequest, res: Response) => {
    const keyword = String(req.query.keyword || '').trim();
    const status = String(req.query.status || '').trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
    const cond: Record<string, unknown> = {};
    if (status && ['active', 'unsubscribed'].includes(status)) cond.status = status;
    if (keyword) cond.email = { $regex: new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
    const [items, total, activeCount] = await Promise.all([
        NewsletterSubscriberModel.find(cond)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        NewsletterSubscriberModel.countDocuments(cond),
        NewsletterSubscriberModel.countDocuments({ status: 'active' })
    ]);
    return res.send({ items, total, page, limit, activeCount });
});

/** DELETE /newsletter/admin/:id */
export const adminDelete = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    await NewsletterSubscriberModel.findByIdAndDelete(id);
    return res.send({ ok: true });
});

/** PATCH /newsletter/admin/:id  body: { status?, tags? } */
export const adminUpdate = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    const { status, tags } = req.body as { status?: string; tags?: string[] };
    const update: Record<string, unknown> = {};
    if (status && ['active', 'unsubscribed'].includes(status)) update.status = status;
    if (Array.isArray(tags)) update.tags = tags.map((t) => String(t).slice(0, 32));
    const doc = await NewsletterSubscriberModel.findByIdAndUpdate(id, update, { new: true });
    return res.send(doc);
});

/** GET /newsletter/admin/export.csv */
export const adminExportCsv = catchAsync(async (req: AuthRequest, res: Response) => {
    const status = String(req.query.status || '').trim();
    const cond: Record<string, unknown> = {};
    if (status && ['active', 'unsubscribed'].includes(status)) cond.status = status;
    const rows = await NewsletterSubscriberModel.find(cond).sort({ createdAt: -1 }).lean();
    const lines = ['email,status,source,tags,createdAt'];
    for (const r of rows) {
        lines.push(
            [
                r.email,
                r.status,
                r.source ?? '',
                (r.tags ?? []).join('|'),
                new Date(r.createdAt).toISOString()
            ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(',')
        );
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
    return res.send(lines.join('\n'));
});
