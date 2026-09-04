import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/kyc.joi';
// controller
import { getKycList, getKycItem, updateKyc } from '@main/controllers/kyc-admin.controller';

const router = express.Router();
const validator = createValidator();

router.route('/list').post(auth, validator.body(joiSchema.getKycList), getKycList);

router
    .route('/:kycId')
    .get(auth, validator.params(joiSchema.kycId), getKycItem)
    .patch(auth, validator.params(joiSchema.kycId), validator.body(joiSchema.updateKyc), updateKyc);

export default router;
