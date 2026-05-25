import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as ctrl from '@main/controllers/admin-store.controller';

const router = express.Router();

router.get('/store/stats', auth, adminOnly, ctrl.getStats);
router.get('/store/packages', auth, adminOnly, ctrl.listPackages);
router.post('/store/packages', auth, adminOnly, ctrl.createPackage);
router.patch('/store/packages/:id', auth, adminOnly, ctrl.updatePackage);
router.delete('/store/packages/:id', auth, adminOnly, ctrl.deletePackage);
router.get('/store/orders', auth, adminOnly, ctrl.listOrders);

export default router;
