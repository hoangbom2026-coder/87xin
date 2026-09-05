import ArticleCategoryModel from '@main/models/article-category.model';
import ArticlePostModel from '@main/models/article-post.model';
import ApiError from '@utils/ApiError';
import httpStatus from 'http-status';

const toSlug = (s: string) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const articleService = {
  async listCategories(page: number = 1, limit: number = 100) {
    const p = Math.max(1, page);
    const l = Math.min(200, Math.max(1, limit));
    const [items, total] = await Promise.all([
      ArticleCategoryModel.find().sort({ order: 1, createdAt: -1 }).skip((p - 1) * l).limit(l),
      ArticleCategoryModel.countDocuments({})
    ]);
    return { items, total, page: p, limit: l };
  },

  async createCategory(body: Record<string, unknown>) {
    const name = String(body.name ?? '').trim();
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'name is required');
    const slug = toSlug(String(body.slug ?? name));
    if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
    const exists = await ArticleCategoryModel.findOne({ slug });
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
    return await ArticleCategoryModel.create({
      name,
      slug,
      description: String(body.description ?? ''),
      status: body.status !== undefined ? Boolean(body.status) : true,
      order: Number(body.order ?? 0)
    });
  },

  async updateCategory(id: string, body: Record<string, unknown>) {
    const row = await ArticleCategoryModel.findById(id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    if (body.name !== undefined) row.name = String(body.name);
    if (body.slug !== undefined) {
      const nextSlug = toSlug(String(body.slug));
      if (!nextSlug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
      const exists = await ArticleCategoryModel.findOne({ slug: nextSlug, _id: { $ne: row._id } });
      if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
      row.slug = nextSlug;
    }
    if (body.description !== undefined) row.description = String(body.description);
    if (body.status !== undefined) row.status = Boolean(body.status);
    if (body.order !== undefined) row.order = Number(body.order);
    await row.save();
    return row;
  },

  async deleteCategory(id: string) {
    const row = await ArticleCategoryModel.findByIdAndDelete(id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    await ArticlePostModel.updateMany({ categoryId: row._id }, { $set: { categoryId: null, categorySlug: '' } });
    return { ok: true };
  },

  async listPosts(params: { status?: string; category?: string; keyword?: string; page?: number; limit?: number }) {
    const status = String(params.status ?? 'all');
    const category = String(params.category ?? '');
    const keyword = String(params.keyword ?? '').trim();
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 200);

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
    return { items, total, page, limit };
  },

  async getPostById(id: string) {
    const row = await ArticlePostModel.findById(id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'post not found');
    return row;
  },

  async createPost(body: Record<string, unknown>, authorName: string = 'admin') {
    const title = String(body.title ?? '').trim();
    if (!title) throw new ApiError(httpStatus.BAD_REQUEST, 'title is required');
    const slug = toSlug(String(body.slug ?? title));
    if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
    const exists = await ArticlePostModel.findOne({ slug });
    if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
    let categoryId = null;
    let categorySlug = '';
    if (body.categoryId) {
      const cat = await ArticleCategoryModel.findById(String(body.categoryId));
      if (cat) {
        categoryId = cat._id;
        categorySlug = cat.slug;
      }
    }
    const status = String(body.status ?? 'draft') === 'published' ? 'published' : 'draft';
    return await ArticlePostModel.create({
      title,
      slug,
      excerpt: String(body.excerpt ?? ''),
      contentHtml: String(body.contentHtml ?? ''),
      thumbnail: String(body.thumbnail ?? ''),
      categoryId,
      categorySlug,
      status,
      featured: Boolean(body.featured),
      publishedAt: status === 'published' ? new Date() : null,
      authorName
    });
  },

  async updatePost(id: string, body: Record<string, unknown>) {
    const row = await ArticlePostModel.findById(id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'post not found');
    if (body.title !== undefined) row.title = String(body.title);
    if (body.slug !== undefined) {
      const nextSlug = toSlug(String(body.slug));
      if (!nextSlug) throw new ApiError(httpStatus.BAD_REQUEST, 'slug is invalid');
      const exists = await ArticlePostModel.findOne({ slug: nextSlug, _id: { $ne: row._id } });
      if (exists) throw new ApiError(httpStatus.BAD_REQUEST, 'slug already exists');
      row.slug = nextSlug;
    }
    if (body.excerpt !== undefined) row.excerpt = String(body.excerpt);
    if (body.contentHtml !== undefined) row.contentHtml = String(body.contentHtml);
    if (body.thumbnail !== undefined) row.thumbnail = String(body.thumbnail);
    if (body.featured !== undefined) row.featured = Boolean(body.featured);
    if (body.status !== undefined) {
      const status = String(body.status) === 'published' ? 'published' : 'draft';
      row.status = status;
      if (status === 'published' && !row.publishedAt) row.publishedAt = new Date();
    }
    if (body.categoryId !== undefined) {
      const catId = String(body.categoryId || '');
      if (!catId) {
        row.categoryId = null;
        row.categorySlug = '';
      } else {
        const cat = await ArticleCategoryModel.findById(catId);
        if (!cat) throw new ApiError(httpStatus.BAD_REQUEST, 'category not found');
        row.categoryId = cat._id as never;
        row.categorySlug = cat.slug;
      }
    }
    await row.save();
    return row;
  },

  async deletePost(id: string) {
    const row = await ArticlePostModel.findByIdAndDelete(id);
    if (!row) throw new ApiError(httpStatus.NOT_FOUND, 'post not found');
    return { ok: true };
  },

  async listPostsPublic(category?: string, limit: number = 20) {
    const l = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const q: Record<string, unknown> = { status: 'published' };
    if (category) q.categorySlug = category;
    return await ArticlePostModel.find(q).sort({ publishedAt: -1, createdAt: -1 }).limit(l);
  },

  async listCategoriesPublic() {
    return await ArticleCategoryModel.find({ status: true }).sort({ order: 1, createdAt: -1 });
  }
};
