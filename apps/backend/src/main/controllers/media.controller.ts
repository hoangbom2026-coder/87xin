import httpStatus from 'http-status';
import { Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import {
    MEDIA_URL_PREFIX,
    createAsset,
    createFolder,
    deleteAsset,
    deleteAssets,
    deleteFolder,
    detectType,
    getAssetById,
    getImageDimensions,
    listAssets,
    listFolders,
    moveAsset,
    patchAsset,
    slugifyFolder
} from '@main/services/media.service';

/** GET /media/folders */
export const getFolders = catchAsync(async (_req: AuthRequest, res: Response) => {
    const r = await listFolders();
    return res.send(r);
});

/** POST /media/folders  body: { name, description } */
export const postFolder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { name, description = '' } = req.body as { name: string; description?: string };
    if (!name?.trim()) throw new ApiError(httpStatus.BAD_REQUEST, 'name required');
    const f = await createFolder(name.trim(), description, String(req.user!._id));
    return res.status(httpStatus.CREATED).send(f);
});

/** DELETE /media/folders/:id */
export const removeFolder = catchAsync(async (req: AuthRequest, res: Response) => {
    await deleteFolder((req.params as any).id);
    return res.send({ ok: true });
});

/** GET /media?folder=&keyword=&type=&page=&limit= */
export const getAssets = catchAsync(async (req: AuthRequest, res: Response) => {
    const r = await listAssets({
        folder: typeof req.query.folder === 'string' ? req.query.folder : undefined,
        keyword: String(req.query.keyword || ''),
        type: String(req.query.type || ''),
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 60
    });
    return res.send(r);
});

/** POST /media (multipart, field 'files', body.folder) */
export const uploadAssets = catchAsync(async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) throw new ApiError(httpStatus.BAD_REQUEST, 'No files uploaded');
    const folder = slugifyFolder(String(req.body?.folder || ''));
    const created = [];
    for (const f of files) {
        const type = detectType(f.mimetype, f.originalname);
        const url = `${MEDIA_URL_PREFIX}/${folder ? `${folder}/` : ''}${f.filename}`;
        let width: number | undefined;
        let height: number | undefined;
        if (type === 'image') {
            const d = await getImageDimensions(f.path);
            width = d.width;
            height = d.height;
        }
        const doc = await createAsset({
            originalName: f.originalname,
            filename: f.filename,
            folder,
            url,
            mime: f.mimetype || 'application/octet-stream',
            size: f.size,
            width,
            height,
            type,
            uploadedBy: req.user!._id as never,
            uploadedByName: String(req.user!.username ?? '')
        });
        created.push(doc);
    }
    return res.status(httpStatus.CREATED).send({ items: created });
});

/** PATCH /media/:id  body: { title, alt, tags } */
export const patchAssetMeta = catchAsync(async (req: AuthRequest, res: Response) => {
    const tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : undefined;
    const updated = await patchAsset((req.params as any).id, {
        title: req.body.title,
        alt: req.body.alt,
        tags
    });
    if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    return res.send(updated);
});

/** PATCH /media/:id/move  body: { folder } */
export const moveAssetCtrl = catchAsync(async (req: AuthRequest, res: Response) => {
    const a = await moveAsset((req.params as any).id, String(req.body?.folder || ''));
    return res.send(a);
});

/** DELETE /media/:id */
export const removeAsset = catchAsync(async (req: AuthRequest, res: Response) => {
    await deleteAsset((req.params as any).id);
    return res.send({ ok: true });
});

/** POST /media/bulk-delete  body: { ids: string[] } */
export const removeAssetsCtrl = catchAsync(async (req: AuthRequest, res: Response) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (!ids.length) throw new ApiError(httpStatus.BAD_REQUEST, 'ids required');
    const r = await deleteAssets(ids);
    return res.send(r);
});

/** GET /media/:id */
export const getAsset = catchAsync(async (req: AuthRequest, res: Response) => {
    const a = await getAssetById((req.params as any).id);
    if (!a) throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    return res.send(a);
});
