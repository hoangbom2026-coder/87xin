import { NextFunction, Response } from 'express';
import FileManage from '../utils/file';
import { AuthRequest } from './auth';

// eslint-disable-next-line
export const attachmentValdiation = (validationSchema: any, path: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.body.amount && typeof req.body.amount === 'string') {
            req.body.amount = Number(req.body.amount);
        }

        if (req.body.attachments_object && typeof req.body.attachments_object === 'string') {
            req.body.attachments_object = JSON.parse(req.body.attachments_object);
        }

        if (req.body.photos_object && typeof req.body.photos_object === 'string') {
            req.body.photos_object = JSON.parse(req.body.photos_object);
        }

        if (req.body.discounts && typeof req.body.discounts === 'string') {
            req.body.discounts = JSON.parse(req.body.discounts);
        }

        if (req.body.items && typeof req.body.items === 'string') {
            req.body.items = JSON.parse(req.body.items);
        }

        if (req.body.contract && typeof req.body.contract === 'string') {
            req.body.contract = JSON.parse(req.body.contract);
        }

        if (req.body.taxs && typeof req.body.taxs === 'string') {
            req.body.taxs = JSON.parse(req.body.taxs);
        }

        if (req.body.discounts && typeof req.body.discounts === 'string') {
            req.body.discounts = JSON.parse(req.body.discounts);
        }

        if (req.body.isSignByUser && typeof req.body.isSignByUser === 'string') {
            req.body.isSignByUser = req.body.isSignByUser === 'true';
        }

        if (req.body.isSignByCustomer && typeof req.body.isSignByCustomer === 'string') {
            req.body.isSignByCustomer = req.body.isSignByCustomer === 'true';
        }

        if (req.body.folder) {
            delete req.body.folder;
        }

        const result = await validationSchema.validate(req.body);
        if (result.error && req.files && req.files.length) {
            const fileCount = Number(req.files.length);
            for (let i = 0; i < fileCount; i++) {
                FileManage.removeFile(path + req.files[i].filename);
            }
        }
        next();
    };
};
