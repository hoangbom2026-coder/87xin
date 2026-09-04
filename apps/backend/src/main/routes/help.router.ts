import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/help.joi';
// controller
import { createHelp, deleteHelp, getHelpList, getHelps, updateHelp } from '@main/controllers/help.controller';

const router = express.Router();
const validator = createValidator();

router.route('/').get(getHelps).post(auth, validator.body(joiSchema.createHelp), createHelp).delete(auth, deleteHelp);

router.route('/list').get(getHelpList);

router
    .route('/:helpId')
    .patch(auth, validator.params(joiSchema.helpId), validator.body(joiSchema.updateHelp), updateHelp);

export default router;
