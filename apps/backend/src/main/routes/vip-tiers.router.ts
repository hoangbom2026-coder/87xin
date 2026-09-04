import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
import { uploadFile } from '@middlewares/upload';
// joi
import joiSchema from '@main/validators/vip-tiers.joi';
// controller
import {
    getVipTiersList,
    createVipTiers,
    updateVipTiers,
    deleteVipTiers
} from '@main/controllers/vip-tiers.controller';

const router = express.Router();
const validator = createValidator();

router
    .route('/')
    .get(auth, getVipTiersList)
    .post(auth, uploadFile.single('vipTiers'), validator.body(joiSchema.createVipTiers), createVipTiers);

router
    .route('/:vipTiersId')
    .patch(
        auth,
        uploadFile.single('vipTiers'),
        validator.params(joiSchema.vipTiersId),
        validator.body(joiSchema.updateVipTiers),
        updateVipTiers
    )
    .delete(auth, validator.params(joiSchema.vipTiersId), deleteVipTiers);

export default router;
