import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/preference.joi';
// controller
import { getPreference, updatePreference } from '@main/controllers/preference.controller';

const router = express.Router();
const validator = createValidator();

router.route('/').get(auth, getPreference).patch(auth, validator.body(joiSchema.updatePreference), updatePreference);

export default router;
