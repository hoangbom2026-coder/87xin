import { NextFunction, Response } from 'express';
import FileManage from '../utils/file';
import { AuthRequest } from './auth';

// eslint-disable-next-line
export default function uploadValdiation(joiSchema: any, path: string) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.body.folder) {
            delete req.body.folder;
        }

        const result = await joiSchema.validate(req.body);

        if (result.error && req.file) {
            if (req.file.filename) {
                FileManage.removeFile(path + req.file.filename);
            }
        }
        next();
    };
}
