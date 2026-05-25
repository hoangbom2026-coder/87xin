import { packageService } from '@main/services/package.service';
import { Request, Response } from 'express';
import { AuthRequest } from '@middlewares/auth';
import PackageCategoryModel from '@main/models/package-category.model';

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
    async getPackages(_req: Request, res: Response) {
        try {
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
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch packages' });
        }
    },

    // Admin endpoints
    async createPackage(req: Request, res: Response) {
        try {
            const body = (req.body || {}) as Record<string, unknown>;
            const title = String(body.title ?? '').trim();
            const slug = toSlug(String(body.slug ?? title));
            if (!title || !slug) {
                res.status(400).json({ error: 'title/slug is required' });
                return;
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
            res.status(201).json(pkg);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: 'Failed to create package' });
        }
    },

    async updatePackage(req: Request, res: Response) {
        try {
            const body = (req.body || {}) as Record<string, unknown>;
            const title = String(body.title ?? '').trim();
            const slug = toSlug(String(body.slug ?? title));
            if (!title || !slug) {
                res.status(400).json({ error: 'title/slug is required' });
                return;
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
                res.status(404).json({ message: 'Package not found' });
                return;
            }
            res.json(updated);
        } catch (err) {
            res.status(500).json({ error: 'Failed to update package' });
        }
    },

    async deletePackage(req: Request, res: Response) {
        try {
            const deleted = await packageService.remove((req.params as any).id);
            if (!deleted) {
                res.status(404).json({ message: 'Package not found' });
                return;
            }
            res.json({ message: 'Package deleted' });
        } catch (err) {
            res.status(500).json({ error: 'Failed to delete package' });
        }
    },

    async getCategories(_req: Request, res: Response) {
        try {
            const rows = await PackageCategoryModel.find().sort({ order: 1, createdAt: -1 });
            res.json(rows);
        } catch {
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    },

    async createCategory(req: AuthRequest, res: Response) {
        try {
            const name = String(req.body?.name ?? '').trim();
            const slug = toSlug(String(req.body?.slug ?? name));
            if (!name || !slug) {
                res.status(400).json({ error: 'name/slug is required' });
                return;
            }
            const row = await PackageCategoryModel.create({
                name,
                slug,
                status: req.body?.status === 'inactive' ? 'inactive' : 'active',
                order: Number(req.body?.order ?? 0),
            });
            res.status(201).json(row);
        } catch {
            res.status(500).json({ error: 'Failed to create category' });
        }
    }
};
