import express from 'express';
import { createValidator } from 'express-joi-validation';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import joiSchema from '@main/validators/bot-automation.joi';
import { getBotAutomation, patchBotAutomation } from '@main/controllers/bot-automation.controller';

const router = express.Router();
const validator = createValidator();

router.route('/').get(auth, adminOnly, getBotAutomation).patch(auth, adminOnly, validator.body(joiSchema.patch), patchBotAutomation);

export default router;
