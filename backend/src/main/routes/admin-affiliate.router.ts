import express from 'express';
import { createValidator } from 'express-joi-validation';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import Joi from 'joi';
import {
  createRootAffiliate,
  runAffiliateAutoPayout,
  listAdminAffiliateRewardLogs,
  getAffiliateMechanismConfig,
  updateAffiliateMechanismConfig
} from '@main/controllers/admin-affiliate.controller';

const router = express.Router();
const validator = createValidator();

const schema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).required(),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  password: Joi.string().min(6).required(),
});

const mechanismSchema = Joi.object({
  value: Joi.object({
    commission_rates: Joi.object({
      slots_fishing: Joi.number().min(0).max(100),
      others: Joi.number().min(0).max(100),
      lottery: Joi.number().min(0).max(100)
    }),
    referral_bonus: Joi.object({
      inviter_reward: Joi.number().min(0),
      invitee_reward: Joi.number().min(0),
      min_deposit: Joi.number().min(0),
      min_valid_bet: Joi.number().min(0)
    }),
    multi_level_ratio: Joi.number().min(0).max(100),
    withdrawal_condition: Joi.object({
      turnover_x: Joi.number().integer().min(1),
      expiry_days: Joi.number().integer().min(1)
    })
  }).required()
});

router.post('/root', auth, adminOnly, validator.body(schema), createRootAffiliate);
router.post('/run-payout', auth, adminOnly, runAffiliateAutoPayout);
router.get('/reward-logs', auth, adminOnly, listAdminAffiliateRewardLogs);
router.get('/mechanism', auth, adminOnly, getAffiliateMechanismConfig);
router.post('/mechanism', auth, adminOnly, validator.body(mechanismSchema), updateAffiliateMechanismConfig);

export default router;
