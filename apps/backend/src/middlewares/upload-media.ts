import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import { v4 as createUUID } from 'uuid';
import { MEDIA_ROOT, slugifyFolder } from '@main/services/media.service';
import fs from 'fs';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB / file (giảm từ 200MB)

// MIME types được phép upload
const ALLOWED_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'text/html',      // cho game history content (agency integration)
    'application/json',
]);

// Extensions được phép
const ALLOWED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff',
    '.mp4', '.webm', '.mov',
    '.pdf',
    '.html', '.htm',
    '.json',
]);

function targetFolder(req: Request): string {
    const raw = (req.body?.folder ?? req.query?.folder ?? '') as string;
    return slugifyFolder(String(raw || ''));
}

const storage = multer.diskStorage({
    // eslint-disable-next-line
    destination: (req: Request, _file: Express.Multer.File, cb: any) => {
        const folder = targetFolder(req);
        const dir = folder ? path.join(MEDIA_ROOT, folder) : MEDIA_ROOT;
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    // eslint-disable-next-line
    filename: (_req: Request, file: Express.Multer.File, cb: any) => {
        const ext = path.extname(file.originalname).toLowerCase() || '';
        const safeBase = path
            .basename(file.originalname, ext)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40) || 'file';
        cb(null, `${safeBase}-${Date.now()}-${createUUID().slice(0, 6)}${ext}`);
    }
});

// File filter kiểm tra MIME type và extension
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIMES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
};

export const uploadMedia = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter,
});
