import { Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import { articleService } from '@main/services/article.service';

export const listCategories = catchAsync(async (_req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(_req.query.page || 1));
  const limit = Math.min(200, Math.max(1, Number(_req.query.limit || 100)));
  const data = await articleService.listCategories(page, limit);
  return res.send(data);
});

export const createCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  const row = await articleService.createCategory((req.body || {}) as Record<string, unknown>);
  return res.status(httpStatus.CREATED).send(row);
});

export const patchCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  const row = await articleService.updateCategory((req.params as any).id, (req.body || {}) as Record<string, unknown>);
  return res.send(row);
});

export const deleteCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await articleService.deleteCategory((req.params as any).id);
  return res.send(result);
});

export const listPosts = catchAsync(async (req: AuthRequest, res: Response) => {
  const status = String(req.query.status ?? 'all');
  const category = String(req.query.category ?? '');
  const keyword = String(req.query.keyword ?? '').trim();
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);

  const data = await articleService.listPosts({ status, category, keyword, page, limit });
  return res.send(data);
});

export const getPostById = catchAsync(async (req: AuthRequest, res: Response) => {
  const row = await articleService.getPostById((req.params as any).id);
  return res.send(row);
});

export const createPost = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorName = String(req.user?.username ?? 'admin');
  const row = await articleService.createPost((req.body || {}) as Record<string, unknown>, authorName);
  return res.status(httpStatus.CREATED).send(row);
});

export const patchPost = catchAsync(async (req: AuthRequest, res: Response) => {
  const row = await articleService.updatePost((req.params as any).id, (req.body || {}) as Record<string, unknown>);
  return res.send(row);
});

export const deletePost = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await articleService.deletePost((req.params as any).id);
  return res.send(result);
});

export const listPostsPublic = catchAsync(async (req: AuthRequest, res: Response) => {
  const category = String(req.query.category ?? '');
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const items = await articleService.listPostsPublic(category, limit);
  return res.send(items);
});

export const listCategoriesPublic = catchAsync(async (_req: AuthRequest, res: Response) => {
  const rows = await articleService.listCategoriesPublic();
  return res.send(rows);
});
