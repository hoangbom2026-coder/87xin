import express from 'express';
import { createValidator } from 'express-joi-validation';
// middlewares
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
// joi
import joiSchema from '@main/validators/referral-code.joi';
// controller
import {
    getReferralCodes,
    createReferralCode,
    getReferralStatus,
    patchReferralCommission
} from '@main/controllers/referral-code.controller';

const router = express.Router();
const validator = createValidator();

router.route('/status').get(auth, getReferralStatus);

router
    .route('/')
    .get(auth, getReferralCodes)
    .post(auth, validator.body(joiSchema.createReferralCode), createReferralCode);

router.patch(
    '/admin/:code',
    auth,
    adminOnly,
    validator.body(joiSchema.patchCommission),
    patchReferralCommission
);

export default router;
