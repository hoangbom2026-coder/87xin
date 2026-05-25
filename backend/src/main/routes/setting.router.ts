import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import { uploadFile } from '@middlewares/upload';
// joi
import joiSchema from '@main/validators/setting.joi';
// controller
import {
    getDefaultData,
    getBusinessSettings,
    patchBusinessSettings,
    uploadBannerAsset,
    getTelegramTemplates,
    sendTelegramTest,
    getEmailSettings,
    patchEmailSettings,
    sendEmailTest
} from '@main/controllers/setting.controller';

const router = express.Router();
const validator = createValidator();

router.route('/site').get(getDefaultData);

router
    .route('/upload-banner')
    .post(auth, adminOnly, uploadFile.single('banner'), uploadBannerAsset);

router
    .route('/business')
    .get(auth, adminOnly, getBusinessSettings)
    .patch(auth, adminOnly, validator.body(joiSchema.patchBusiness), patchBusinessSettings);

router.route('/telegram/templates').get(auth, adminOnly, getTelegramTemplates);
router.route('/telegram/test').post(auth, adminOnly, sendTelegramTest);

router.route('/email').get(auth, adminOnly, getEmailSettings).patch(auth, adminOnly, patchEmailSettings);
router.route('/email/test').post(auth, adminOnly, sendEmailTest);

export default router;
