import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { imageSize } from 'image-size';
import MediaAssetModel, { IMediaAsset } from '@main/models/media-asset.model';
import MediaFolderModel from '@main/models/media-folder.model';

export const MEDIA_ROOT = path.join(__dirname, '..', '..', '..', 'public', 'media');

/** Public URL prefix khớp với express.static folder 'media' đã đăng ký trong app.ts. */
export const MEDIA_URL_PREFIX = '/media';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac']);
const DOC_EXT = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.json', '.zip']);

export function detectType(mime: string, filename: string): IMediaAsset['type'] {
    if (mime?.startsWith('image/')) return 'image';
    if (mime?.startsWith('video/')) return 'video';
    if (mime?.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'document';
    const ext = path.extname(filename).toLowerCase();
    if (IMAGE_EXT.has(ext)) return 'image';
    if (VIDEO_EXT.has(ext)) return 'video';
    if (AUDIO_EXT.has(ext)) return 'audio';
    if (DOC_EXT.has(ext)) return 'document';
    return 'other';
}

const SLUG_RE = /[^a-z0-9-]+/g;
export function slugifyFolder(name: string): string {
    return (name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(SLUG_RE, '-')
        .replace(/^-+|-+$/g, '');
}

export async function ensureFolderDir(folder: string) {
    const safe = slugifyFolder(folder);
    const dir = safe ? path.join(MEDIA_ROOT, safe) : MEDIA_ROOT;
    await fs.mkdir(dir, { recursive: true });
    return { safe, dir };
}

export async function getImageDimensions(filePath: string): Promise<{ width?: number; height?: number }> {
    try {
        const buf = await fs.readFile(filePath);
        const dim = imageSize(buf);
        return { width: dim.width, height: dim.height };
    } catch {
        return {};
    }
}

interface IListFilter {
    folder?: string;
    keyword?: string;
    type?: string;
    page?: number;
    limit?: number;
}
export async function listAssets(filter: IListFilter) {
    const cond: Record<string, unknown> = {};
    if (filter.folder !== undefined) cond.folder = slugifyFolder(filter.folder);
    if (filter.type && filter.type !== 'all') cond.type = filter.type;
    if (filter.keyword) {
        const re = new RegExp(filter.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        cond.$or = [{ originalName: re }, { title: re }, { tags: re }, { filename: re }];
    }
    const page = Math.max(filter.page || 1, 1);
    const limit = Math.min(Math.max(filter.limit || 60, 1), 200);
    const [items, total] = await Promise.all([
        MediaAssetModel.find(cond)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        MediaAssetModel.countDocuments(cond)
    ]);
    return { items, total, page, limit };
}

export async function listFolders() {
    const folders = await MediaFolderModel.find().sort({ name: 1 }).lean();
    const counts = await MediaAssetModel.aggregate<{ _id: string; count: number; size: number }>([
        { $group: { _id: '$folder', count: { $sum: 1 }, size: { $sum: '$size' } } }
    ]);
    const map: Record<string, { count: number; size: number }> = {};
    counts.forEach((c) => (map[c._id] = { count: c.count, size: c.size }));
    return {
        folders: [
            {
                _id: 'root',
                name: 'Tất cả',
                slug: '',
                description: 'Tệp ngoài thư mục',
                count: map['']?.count || 0,
                size: map['']?.size || 0
            },
            ...folders.map((f) => ({
                ...f,
                count: map[f.slug]?.count || 0,
                size: map[f.slug]?.size || 0
            }))
        ],
        totalCount: Object.values(map).reduce((a, b) => a + b.count, 0),
        totalSize: Object.values(map).reduce((a, b) => a + b.size, 0)
    };
}

export async function createFolder(name: string, description: string, createdBy?: string) {
    const slug = slugifyFolder(name);
    if (!slug) throw new Error('Folder name không hợp lệ');
    const exist = await MediaFolderModel.findOne({ slug });
    if (exist) throw new Error('Folder đã tồn tại');
    await fs.mkdir(path.join(MEDIA_ROOT, slug), { recursive: true });
    return await MediaFolderModel.create({ name, slug, description, createdBy: createdBy as never });
}

export async function deleteFolder(id: string) {
    const f = await MediaFolderModel.findById(id);
    if (!f) throw new Error('Folder not found');
    const inUse = await MediaAssetModel.countDocuments({ folder: f.slug });
    if (inUse > 0) throw new Error(`Folder còn ${inUse} tệp, không thể xóa`);
    await MediaFolderModel.deleteOne({ _id: id });
    try {
        await fs.rmdir(path.join(MEDIA_ROOT, f.slug));
    } catch {
        // best effort
    }
    return { ok: true };
}

export async function moveAsset(assetId: string, targetFolderSlug: string) {
    const asset = await MediaAssetModel.findById(assetId);
    if (!asset) throw new Error('Asset not found');
    const targetSlug = slugifyFolder(targetFolderSlug);
    if (asset.folder === targetSlug) return asset;
    if (targetSlug) {
        const exist = await MediaFolderModel.findOne({ slug: targetSlug });
        if (!exist) throw new Error('Target folder not found');
    }
    const oldRel = asset.url.replace(MEDIA_URL_PREFIX, '').replace(/^\/+/, '');
    const oldPath = path.join(MEDIA_ROOT, oldRel);
    const newDir = targetSlug ? path.join(MEDIA_ROOT, targetSlug) : MEDIA_ROOT;
    await fs.mkdir(newDir, { recursive: true });
    const newPath = path.join(newDir, asset.filename);
    if (existsSync(oldPath)) await fs.rename(oldPath, newPath);
    asset.folder = targetSlug;
    asset.url = `${MEDIA_URL_PREFIX}/${targetSlug ? `${targetSlug}/` : ''}${asset.filename}`;
    await asset.save();
    return asset;
}

export async function patchAsset(
    assetId: string,
    patch: { title?: string; alt?: string; tags?: string[] }
) {
    return await MediaAssetModel.findByIdAndUpdate(assetId, patch, { new: true });
}

export async function deleteAsset(assetId: string) {
    const asset = await MediaAssetModel.findById(assetId);
    if (!asset) return { ok: true };
    const rel = asset.url.replace(MEDIA_URL_PREFIX, '').replace(/^\/+/, '');
    const filePath = path.join(MEDIA_ROOT, rel);
    try {
        if (existsSync(filePath)) await fs.unlink(filePath);
    } catch {
        // ignore
    }
    await MediaAssetModel.deleteOne({ _id: assetId });
    return { ok: true };
}

export async function deleteAssets(ids: string[]) {
    let n = 0;
    for (const id of ids) {
        try {
            await deleteAsset(id);
            n++;
        } catch {
            // ignore
        }
    }
    return { ok: true, removed: n };
}
