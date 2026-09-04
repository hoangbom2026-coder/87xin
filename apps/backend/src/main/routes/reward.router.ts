import express from 'express';
import { createValidator } from 'express-joi-validation';
// middlewares
import auth from '@middlewares/auth';
// joi
import joiSchema from '@main/validators/referral-code.joi';
// controller
import {
    getRewardActivity,
    getRewardConvert,
    getRewardDashboard,
    getRewardLog,
    getRewardStatus,
    intervalCheck
} from '@main/controllers/reward.controller';

const router = express.Router();
const validator = createValidator();

router.route('/status').get(auth, getRewardStatus);
router.route('/get-log').post(auth, getRewardLog);
router.route('/activity').get(auth, getRewardActivity);
router.route('/dashboard').get(auth, getRewardDashboard);
router.route('/convert').post(auth, getRewardConvert);
router.route('/interval-check').post(intervalCheck);

export default router;
