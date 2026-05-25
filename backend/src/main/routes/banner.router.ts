import express from 'express';
import { createValidator } from 'express-joi-validation';
// middlewares
import auth from '@middlewares/auth';
import { uploadFile } from '@middlewares/upload';
// joi
import joiSchema from '@main/validators/banner.joi';
// controller
import {
    getBannerList,
    createBanner,
    updateBanner,
    deleteBanner,
    getBanners
} from '@main/controllers/banner.controller';

const router = express.Router();
const validator = createValidator();

router
    .route('/')
    .get(getBanners)
    .post(auth, uploadFile.single('banner'), validator.body(joiSchema.createBanner), createBanner);

router.route('/list').get(auth, getBannerList);

router
    .route('/:bannerId')
    .patch(
        auth,
        uploadFile.single('banner'),
        validator.params(joiSchema.bannerId),
        validator.body(joiSchema.updateBanner),
        updateBanner
    )
    .delete(auth, validator.params(joiSchema.bannerId), deleteBanner);

export default router;
