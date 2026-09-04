import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/vip-spin.joi';
// controller
import { collect, getReadySpin, getTotalBonus, getWinners, playSpin } from '@main/controllers/vip-spin.controller';

const router = express.Router();
const validator = createValidator();

router.route('/ready').get(auth, getReadySpin);
router.route('/play').get(auth, playSpin);
router.route('/collect').post(auth, validator.body(joiSchema.collect), collect);
router.route('/statistic').get(auth, getTotalBonus);
router.route('/winners').get(auth, getWinners);

export default router;
