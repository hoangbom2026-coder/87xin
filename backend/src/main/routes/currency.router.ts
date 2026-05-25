import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/currency.joi';
// controller
import {
    createCurrency,
    deleteCurrency,
    getCurrencies,
    getCurrency,
    getEnableCurrencies,
    updateCurrency,
    getRates,
    syncRates,
    updateRates
} from '@main/controllers/currency.controller';

const router = express.Router();
const validator = createValidator();

router.route('/').get(auth, getCurrencies).post(auth, validator.body(joiSchema.createCurrency), createCurrency);
router.route('/list').get(getEnableCurrencies);
router.route('/rates').get(auth, getRates).put(auth, validator.body(joiSchema.updateRates), updateRates);
router.route('/rates/sync').post(auth, syncRates);

router
    .route('/:currencyId')
    .get(auth, validator.params(joiSchema.currencyId), getCurrency)
    .patch(auth, validator.params(joiSchema.currencyId), validator.body(joiSchema.updateCurrency), updateCurrency)
    .delete(auth, validator.params(joiSchema.currencyId), deleteCurrency);

export default router;
