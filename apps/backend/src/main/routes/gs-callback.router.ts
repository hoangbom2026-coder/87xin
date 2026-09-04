import express from 'express';
// controller
import { deposit, getBalance, pushBetData, withdraw } from '@main/controllers/casino.controller';

const router = express.Router();

router.route('/seamless/balance').post(getBalance);
router.route('/seamless/withdraw').post(withdraw);
router.route('/seamless/deposit').post(deposit);
router.route('/seamless/pushbetdata').post(pushBetData);

export default router;
