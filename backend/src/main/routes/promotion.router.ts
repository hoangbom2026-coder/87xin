import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import { uploadFile } from '@middlewares/upload';
import * as promotionController from '@main/controllers/promotion.controller';

const router = express.Router();

router.get('/', promotionController.getActivePromotions);
router.get('/categories', promotionController.getCategories);
router.get('/slug/:slug', promotionController.getPromotionBySlug);

router.get('/admin', auth, adminOnly, promotionController.adminList);
router.get('/all', auth, adminOnly, promotionController.getPromotionList);

router.post(
    '/',
    auth,
    adminOnly,
    uploadFile.single('image'),
    promotionController.createPromotion
);

router.patch(
    '/:promotionId',
    auth,
    adminOnly,
    uploadFile.single('image'),
    promotionController.updatePromotion
);

router.delete('/:promotionId', auth, adminOnly, promotionController.deletePromotion);

export default router;
