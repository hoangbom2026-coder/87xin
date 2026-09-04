import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import affiliateAuth from '@middlewares/affiliate-auth';
// joi
import joiSchema from '@main/validators/affiliate.joi';
// controller
import {
    updatePassword,
    updateAffiliate,
    referralCount,
    getDashboard,
    getDashboardAnalysis,
    getDashboardChildren,
    getChildrenAffiliate,
    getAffiliateUsers,
    getTreeAffiliate,
    getCommission,
    updateCommission
} from '@main/controllers/affiliate.controller';

const router = express.Router();
const validator = createValidator();

router.route('/').put(affiliateAuth, validator.body(joiSchema.updateAffiliate), updateAffiliate);
router.route('/referral-count').get(affiliateAuth, referralCount);
router.route('/dashboard').get(affiliateAuth, getDashboard);
router.route('/dashboard/analysis').post(affiliateAuth, getDashboardAnalysis);
router.route('/dashboard/children').post(affiliateAuth, getDashboardChildren);
router.route('/children').post(affiliateAuth, getChildrenAffiliate);
router.route('/users').post(affiliateAuth, getAffiliateUsers);
router.route('/commission').get(affiliateAuth, getCommission).put(affiliateAuth, updateCommission);
router.route('/tree-affiliates').get(affiliateAuth, getTreeAffiliate);
router.route('/password').patch(affiliateAuth, validator.body(joiSchema.updatePassword), updatePassword);

export default router;
