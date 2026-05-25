import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/gs-pay.joi';
// controller
import { gsDeposit, gsDepositCallback, gsWithdrawCallback } from '@main/controllers/gs-pay.controller';

const router = express.Router();
const validator = createValidator();

router.route('/deposit').post(auth, validator.body(joiSchema.gsDeposit), gsDeposit);
router.route('/deposit-callback').post(gsDepositCallback);
router.route('/withdraw-callback').post(gsWithdrawCallback);

export default router;
