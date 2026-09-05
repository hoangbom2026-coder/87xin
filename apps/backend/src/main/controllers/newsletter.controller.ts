import httpStatus from 'http-status';
import { Request, Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import { getIpAddress } from '@utils/utils';
import newsletterService from '@main/services/newsletter.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /newsletter/subscribe (public) */
export const subscribe = catchAsync(async (req: Request, res: Response) => {
    const email = String((req.body?.email ?? '') as string)
        .toLowerCase()
        .trim();
    const source = String((req.body?.source ?? 'web') as string).slice(0, 64);
    if (!EMAIL_RE.test(email)) throw new ApiError(httpStatus.BAD_REQUEST, 'Email không hợp lệ');
    const ip = getIpAddress(req);
    const doc = await newsletterService.subscribe(email, source, ip);
    return res.status(httpStatus.CREATED).send({ ok: true, id: doc._id });
});

/** POST /newsletter/unsubscribe (public) */
export const unsubscribe = catchAsync(async (req: Request, res: Response) => {
    const email = String((req.body?.email ?? '') as string)
        .toLowerCase()
        .trim();
    if (!EMAIL_RE.test(email)) throw new ApiError(httpStatus.BAD_REQUEST, 'Email không hợp lệ');
    await newsletterService.unsubscribe(email);
    return res.send({ ok: true });
});

/** GET /newsletter/admin/list?keyword=&status=&page=&limit= */
export const adminList = catchAsync(async (req: AuthRequest, res: Response) => {
    const keyword = String(req.query.keyword || '').trim();
    const status = String(req.query.status || '').trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
    const { items, total, activeCount } = await newsletterService.adminList(keyword, status, page, limit);
    return res.send({ items, total, page, limit, activeCount });
});

/** DELETE /newsletter/admin/:id */
export const adminDelete = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    await newsletterService.adminDelete(id);
    return res.send({ ok: true });
});

/** PATCH /newsletter/admin/:id  body: { status?, tags? } */
export const adminUpdate = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = (req.params as any);
    const { status, tags } = req.body as { status?: string; tags?: string[] };
    const doc = await newsletterService.adminUpdate(id, status, tags);
    return res.send(doc);
});

/** GET /newsletter/admin/export.csv */
export const adminExportCsv = catchAsync(async (req: AuthRequest, res: Response) => {
    const status = String(req.query.status || '').trim();
    const rows = await newsletterService.adminExportCsv(status);
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