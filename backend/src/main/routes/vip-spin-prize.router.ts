import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/vip-spin-prize.joi';
// controller
import {
    createVipSpinPrize,
    deleteVipSpinPrize,
    getVipSpinPrizeList,
    getVipSpinPrizes,
    updateVipSpinPrize
} from '@main/controllers/vip-spin-prize.controller';

const router = express.Router();
const validator = createValidator();

router
    .route('/')
    .get(auth, getVipSpinPrizeList)
    .post(auth, validator.body(joiSchema.createVipSpinPrize), createVipSpinPrize);

router.route('/get-prize').get(auth, getVipSpinPrizes);

router
    .route('/:vipSpinPrizeId')
    .patch(
        auth,
        validator.params(joiSchema.vipSpinPrizeId),
        validator.body(joiSchema.updateVipSpinPrize),
        updateVipSpinPrize
    )
    .delete(auth, validator.params(joiSchema.vipSpinPrizeId), deleteVipSpinPrize);

export default router;
