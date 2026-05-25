import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/vip-level.joi';
// controller
import {
    getVipLevelList,
    createVipLevel,
    updateVipLevel,
    deleteVipLevel,
    getVipLevels
} from '@main/controllers/vip-level.controller';

const router = express.Router();
const validator = createValidator();

router.route('/').post(auth, validator.body(joiSchema.createVipLevel), createVipLevel);
router.route('/list').get(getVipLevels);
router.route('/:parentId/get').get(auth, validator.params(joiSchema.parentId), getVipLevelList);

router
    .route('/:vipLevelId')
    .patch(auth, validator.params(joiSchema.vipLevelId), validator.body(joiSchema.updateVipLevel), updateVipLevel)
    .delete(auth, validator.params(joiSchema.vipLevelId), deleteVipLevel);

export default router;
