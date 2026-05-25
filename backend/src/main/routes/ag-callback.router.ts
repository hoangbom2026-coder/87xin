import express from 'express';
// controller
import { verifySession, getBalance, bet, win } from '@main/controllers/ag-casino.controller';

const router = express.Router();

router.route('/verifySession').post(verifySession);
router.route('/getBalance').post(getBalance);
router.route('/bet').post(bet);
router.route('/win').post(win);

export default router;
