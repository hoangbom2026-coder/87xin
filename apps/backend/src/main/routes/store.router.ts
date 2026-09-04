import express from 'express';
import auth from '@middlewares/auth';
import * as storeController from '@main/controllers/store.controller';

const router = express.Router();

router.get('/packages', storeController.getPackages);
router.post('/purchase', auth, storeController.purchasePackage);

export default router;
