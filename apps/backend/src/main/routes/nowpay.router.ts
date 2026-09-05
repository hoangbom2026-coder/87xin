import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/nowpay.joi';
// controller
import {
    createPayment,
    loadCurrency,
    getCurrency,
    depositCallback,
    getNowpayCurrency,
    updateNowpayCurrency,
    getWithdrawableCurrency,
    withdrawCallback,
    updateCurrency
} from '@main/controllers/nowpay.controller';

const router = express.Router();
const validator = createValidator();

router
    .route('/get-currency')
    .get(loadCurrency)
    .post(auth, validator.body(joiSchema.getNowpayCurrency), getNowpayCurrency);
router.route('/currency').get(getCurrency);
router.route('/deposit').post(auth, validator.body(joiSchema.createPayment), createPayment);
router.route('/deposit-callback').post(depositCallback);
router.route('/withdraw-callback').post(withdrawCallback);
router
    .route('/get-withdraw-currency')
    .post(auth, validator.body(joiSchema.getWithdrawCurrency), getWithdrawableCurrency);

router
    .route('/status/:currencyId')
    .patch(auth, validator.params(joiSchema.currencyId), validator.body(joiSchema.updateCurrency), updateCurrency);

router
    .route('/:nowpayId')
    .patch(auth, validator.params(joiSchema.nowpayId), validator.body(joiSchema.updateCurrency), updateNowpayCurrency);

export default router;
