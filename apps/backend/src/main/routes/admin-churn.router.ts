import express from 'express';
import { createValidator } from 'express-joi-validation';

import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import joiSchema from '@main/validators/admin-churn.joi';
import { getChurnAtRisk, postChurnOffer } from '@main/controllers/admin-churn.controller';

const router = express.Router();
const validator = createValidator();

router.route('/churn-at-risk').get(auth, adminOnly, getChurnAtRisk);
router.route('/churn-offer').post(auth, adminOnly, validator.body(joiSchema.postChurnOffer), postChurnOffer);

export default router;
