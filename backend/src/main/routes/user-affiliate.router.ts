import express from 'express';
import auth from '@middlewares/auth';
import * as userAffiliateController from '@main/controllers/user-affiliate.controller';

const router = express.Router();

router.get('/overview', auth, userAffiliateController.getAffiliateOverview);
router.post('/claim', auth, userAffiliateController.claimCommission);

export default router;
