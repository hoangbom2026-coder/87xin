import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import ArticleCategoryModel from '@main/models/article-category.model';
import ArticlePostModel from '@main/models/article-post.model';

const toSlug = (s: string) =>
    String(s || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const listCategories = catchAsync(async (_req: AuthRequest, res: Response) => {
    const page = Math.max(1, Number(_req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(_req.query.limit || 100)));
    const [items, total] = await Promise.all([
        ArticleCategoryModel.find().sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        ArticleCategoryModel.countDocuments({})
    ]);
    return res.send({ items, total, page, limit });
});

export const createCategory = catchAsync(async (req: AuthRequest, res: Response) => {
    const name = String(req.body?.name ?? '').trim();
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'name is required');
    const slug = toSlug(String(req.body?.slug ?? name));
    if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
    const exists = await ArticleCategoryModel.findOne({ slug });
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
    const row = await ArticleCategoryModel.create({
        name,
        slug,
        description: String(req.body?.description ?? ''),
        status: req.body?.status !== undefined ? Boolean(req.body.status) : true,
        order: Number(req.body?.order ?? 0)
    });
    return res.status(httpStatus.CREATED).send(row);
});

export const patchCategory = catchAsync(async (req: AuthRequest, res: Response) => {
    const row = await ArticleCategoryModel.findById((req.params as any).id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    if (req.body?.name !== undefined) row.name = String(req.body.name);
    if (req.body?.slug !== undefined) {
        const nextSlug = toSlug(String(req.body.slug));
        if (!nextSlug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
        const exists = await ArticleCategoryModel.findOne({ slug: nextSlug, _id: { $ne: row._id } });
        if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
        row.slug = nextSlug;
    }
    if (req.body?.description !== undefined) row.description = String(req.body.description);
    if (req.body?.status !== undefined) row.status = Boolean(req.body.status);
    if (req.body?.order !== undefined) row.order = Number(req.body.order);
    await row.save();
    return res.send(row);
});

export const deleteCategory = catchAsync(async (req: AuthRequest, res: Response) => {
    const row = await ArticleCategoryModel.findByIdAndDelete((req.params as any).id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    await ArticlePostModel.updateMany({ categoryId: row._id }, { $set: { categoryId: null, categorySlug: '' } });
    return res.send({ ok: true });
});

export const listPosts = catchAsync(async (req: AuthRequest, res: Response) => {
    const status = String(req.query.status ?? 'all');
    const category = String(req.query.category ?? '');
    const keyword = String(req.query.keyword ?? '').trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const q: Record<string, unknown> = {};
    if (status !== 'all') q.status = status;
    if (category) q.categorySlug = category;
    if (keyword) {
        const re = new RegExp(keyword, 'i');
        q.$or = [{ title: re }, { excerpt: re }, { slug: re }];
    }
    const [items, total] = await Promise.all([
        ArticlePostModel.find(q)
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        ArticlePostModel.countDocuments(q)
    ]);
    return res.send({ items, total, page, limit });
});

export const getPostById = catchAsync(async (req: AuthRequest, res: Response) => {
    const row = await ArticlePostModel.findById((req.params as any).id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'post not found');
    return res.send(row);
});

export const createPost = catchAsync(async (req: AuthRequest, res: Response) => {
    const title = String(req.body?.title ?? '').trim();
    if (!title) throw new ApiError(httpStatus.BAD_REQUEST, 'title is required');
    const slug = toSlug(String(req.body?.slug ?? title));
    if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
    const exists = await ArticlePostModel.findOne({ slug });
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
    let categoryId = null;
    let categorySlug = '';
    if (req.body?.categoryId) {
        const cat = await ArticleCategoryModel.findById(String(req.body.categoryId));
        if (cat) {
            categoryId = cat._id;
            categorySlug = cat.slug;
        }
    }
    const status = String(req.body?.status ?? 'draft') === 'published' ? 'published' : 'draft';
    const row = await ArticlePostModel.create({
        title,
        slug,
        excerpt: String(req.body?.excerpt ?? ''),
        contentHtml: String(req.body?.contentHtml ?? ''),
        thumbnail: String(req.body?.thumbnail ?? ''),
        categoryId,
        categorySlug,
        status,
        featured: Boolean(req.body?.featured),
        publishedAt: status === 'published' ? new Date() : null,
        authorName: String(req.user?.username ?? 'admin')
    });
    return res.status(httpStatus.CREATED).send(row);
});

export const patchPost = catchAsync(async (req: AuthRequest, res: Response) => {
    const row = await ArticlePostModel.findById((req.params as any).id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'post not found');
    if (req.body?.title !== undefined) row.title = String(req.body.title);
    if (req.body?.slug !== undefined) {
        const nextSlug = toSlug(String(req.body.slug));
        if (!nextSlug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
        const exists = await ArticlePostModel.findOne({ slug: nextSlug, _id: { $ne: row._id } });
        if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
        row.slug = nextSlug;
    }
    if (req.body?.excerpt !== undefined) row.excerpt = String(req.body.excerpt);
    if (req.body?.contentHtml !== undefined) row.contentHtml = String(req.body.contentHtml);
    if (req.body?.thumbnail !== undefined) row.thumbnail = String(req.body.thumbnail);
    if (req.body?.featured !== undefined) row.featured = Boolean(req.body.featured);
    if (req.body?.status !== undefined) {
        const status = String(req.body.status) === 'published' ? 'published' : 'draft';
        row.status = status;
        if (status === 'published' && !row.publishedAt) row.publishedAt = new Date();
    }
    if (req.body?.categoryId !== undefined) {
        const id = String(req.body.categoryId || '');
        if (!id) {
            row.categoryId = null;
            row.categorySlug = '';
        } else {
            const cat = await ArticleCategoryModel.findById(id);
            if (!cat) throw new ApiError(httpStatus.BAD_REQUEST, 'category not found');
            row.categoryId = cat._id as never;
            row.categorySlug = cat.slug;
        }
    }
    await row.save();
    return res.send(row);
});

export const deletePost = catchAsync(async (req: AuthRequest, res: Response) => {
    const row = await ArticlePostModel.findByIdAndDelete((req.params as any).id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'post not found');
    return res.send({ ok: true });
});

export const listPostsPublic = catchAsync(async (req: AuthRequest, res: Response) => {
    const category = String(req.query.category ?? '');
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const q: Record<string, unknown> = { status: 'published' };
    if (category) q.categorySlug = category;
    const items = await ArticlePostModel.find(q).sort({ publishedAt: -1, createdAt: -1 }).limit(limit);
    return res.send(items);
});

export const listCategoriesPublic = catchAsync(async (_req: AuthRequest, res: Response) => {
    const rows = await ArticleCategoryModel.find({ status: true }).sort({ order: 1, createdAt: -1 });
    return res.send(rows);
});
