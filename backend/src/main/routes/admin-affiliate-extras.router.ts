import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as ctrl from '@main/controllers/admin-affiliate-extras.controller';

const router = express.Router();

// Tất cả endpoint dưới prefix /admin/affiliate-extras
router.get('/affiliate-extras/config', auth, adminOnly, ctrl.getConfig);
router.patch('/affiliate-extras/config', auth, adminOnly, ctrl.patchConfig);

router.get('/affiliate-extras/counter', auth, adminOnly, ctrl.getCounter);
router.get('/affiliate-extras/analytics/signups', auth, adminOnly, ctrl.getSignupsByDay);
router.get('/affiliate-extras/analytics/split', auth, adminOnly, ctrl.getCommissionSplit);
router.get('/affiliate-extras/users', auth, adminOnly, ctrl.listAffiliateUsers);

router.get('/affiliate-extras/feed', auth, adminOnly, ctrl.listFeed);
router.post('/affiliate-extras/feed', auth, adminOnly, ctrl.createFeed);
router.post('/affiliate-extras/feed/generate', auth, adminOnly, ctrl.generateNow);
router.delete('/affiliate-extras/feed/auto', auth, adminOnly, ctrl.purgeAuto);
router.patch('/affiliate-extras/feed/:id', auth, adminOnly, ctrl.updateFeed);
router.delete('/affiliate-extras/feed/:id', auth, adminOnly, ctrl.removeFeed);

export default router;
