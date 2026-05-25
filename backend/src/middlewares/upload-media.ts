import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import { v4 as createUUID } from 'uuid';
import { MEDIA_ROOT, slugifyFolder } from '@main/services/media.service';
import fs from 'fs';

const MAX_SIZE = 200 * 1024 * 1024; // 200MB / file

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

export const uploadMedia = multer({
    storage,
    limits: { fileSize: MAX_SIZE }
});
