import { packageService } from '@main/services/package.service';
import { Request, Response } from 'express';
import { AuthRequest } from '@middlewares/auth';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import httpStatus from 'http-status';

const toSlug = (s: string) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const packageController = {
  // Public endpoint
  getPackages: catchAsync(async (_req: Request, res: Response) => {
    const page = Math.max(1, Number(_req.query.page || 1));
    const limit = Math.max(1, Math.min(200, Number(_req.query.limit || 100)));
    const format = String(_req.query.format || '').toLowerCase();
    const result = await packageService.getAll({ page, limit });
    if (format === 'list') {
      res.json(result);
      return;
    }
    // Backward compatibility for old/public clients.
    res.json(result.items);
  }),

  // Admin endpoints
  createPackage: catchAsync(async (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const title = String(body.title ?? '').trim();
    const slug = toSlug(String(body.slug ?? title));
    if (!title || !slug) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'title/slug is required');
    }
    const pkg = await packageService.create({
      ...body,
      title,
      slug,
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : [],
      primaryCategoryId: body.primaryCategoryId ? String(body.primaryCategoryId) : '',
      image: body.image ? String(body.image) : '',
      soldCount: Number(body.soldCount || 0),
      noindex: Boolean(body.noindex),
      status: body.status === 'inactive' ? 'inactive' : 'active',
    });
    res.status(httpStatus.CREATED).json(pkg);
  }),

  updatePackage: catchAsync(async (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const title = String(body.title ?? '').trim();
    const slug = toSlug(String(body.slug ?? title));
    if (!title || !slug) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'title/slug is required');
    }
    const updated = await packageService.update((req.params as any).id, {
      ...body,
      title,
      slug,
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : [],
      primaryCategoryId: body.primaryCategoryId ? String(body.primaryCategoryId) : '',
      image: body.image ? String(body.image) : '',
      soldCount: Number(body.soldCount || 0),
      noindex: Boolean(body.noindex),
      status: body.status === 'inactive' ? 'inactive' : 'active',
    });
    if (!updated) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Package not found');
    }
    res.json(updated);
  }),

  deletePackage: catchAsync(async (req: Request, res: Response) => {
    const deleted = await packageService.remove((req.params as any).id);
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Package not found');
    }
    res.json({ message: 'Package deleted' });
  }),

  getCategories: catchAsync(async (_req: Request, res: Response) => {
    const rows = await packageService.listCategories();
    res.json(rows);
  }),

  createCategory: catchAsync(async (req: AuthRequest, res: Response) => {
    const name = String(req.body?.name ?? '').trim();
    const slug = toSlug(String(req.body?.slug ?? name));
    if (!name || !slug) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'name/slug is required');
    }
    const row = await packageService.createCategory({
      name,
      slug,
      status: req.body?.status === 'inactive' ? 'inactive' : 'active',
      order: Number(req.body?.order ?? 0),
    });
    res.status(httpStatus.CREATED).json(row);
  }),
};
