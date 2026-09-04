import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
import { uploadFile } from '@middlewares/upload';
// joi
import joiSchema from '@main/validators/bonus.joi';
// controller
import {
    createBonus,
    deleteBonus,
    getBonus,
    getBonuses,
    getBonusList,
    updateBonuse
} from '@main/controllers/bonus.controller';

const router = express.Router();
const validator = createValidator();

router
    .route('/')
    .get(getBonuses)
    .post(auth, uploadFile.single('bonus'), validator.body(joiSchema.createBonus), createBonus);
router.route('/list').get(auth, getBonusList);

router
    .route('/:bonusId')
    .get(getBonus)
    .patch(
        auth,
        uploadFile.single('bonus'),
        validator.params(joiSchema.bonusId),
        validator.body(joiSchema.updateBonus),
        updateBonuse
    )
    .delete(auth, validator.params(joiSchema.bonusId), deleteBonus);

export default router;
