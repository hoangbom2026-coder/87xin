import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
import { uploadFile } from '@middlewares/upload';
// joi
import joiSchema from '@main/validators/sport.joi';
// controller
import {
    createSport,
    deleteSport,
    getSportList,
    getSports,
    updateSport
} from '@main/controllers/sport.controller';

const router = express.Router();
const validator = createValidator();

const sportFileUpload = uploadFile.single('file');
/** Chỉ chạy multer khi Content-Type là multipart (upload ảnh); JSON PATCH bỏ qua để tránh lỗi boundary */
function sportUploadOptional(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const ct = String(req.headers['content-type'] || '');
    if (ct.includes('multipart/form-data')) {
        return sportFileUpload(req, res, next);
    }
    next();
}

router
    .route('/')
    .get(getSports)
    .post(auth, validator.body(joiSchema.createSport), createSport);

router.route('/list').get(auth, getSportList);

router
    .route('/:sportId')
    .patch(
        auth,
        sportUploadOptional,
        validator.params(joiSchema.sportId),
        validator.body(joiSchema.updateSport),
        updateSport
    )
    .delete(auth, validator.params(joiSchema.sportId), deleteSport);

export default router;
