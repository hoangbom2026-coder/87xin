import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/vip-spin.joi';
import { claimLevelUpBonus } from '@main/controllers/vip-bonus.controller';
// controller

const router = express.Router();
const validator = createValidator();

router.route('/claim-level-up-bonus').get(auth, claimLevelUpBonus);

export default router;
