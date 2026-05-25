import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as ctrl from '@main/controllers/admin-vip.controller';

const router = express.Router();

router.get('/vip/stats', auth, adminOnly, ctrl.getStats);
router.get('/vip/users', auth, adminOnly, ctrl.listVipUsers);
router.get('/vip/tiers', auth, adminOnly, ctrl.getVipTiersConfig);
router.post('/vip/tiers', auth, adminOnly, ctrl.updateVipTiersConfig);
router.post('/vip/users/:id/set-level', auth, adminOnly, ctrl.setUserVipLevel);

export default router;
