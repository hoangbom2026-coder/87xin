import express from 'express';
// controller
import { agPayin, agpayinCallback, agpayoutCallback } from '@main/controllers/ag-pay.controller';
// auth
import auth from '@middlewares/auth';
const router = express.Router();

router.route('/deposit').post(auth, agPayin);
router.route('/payin-callback').post(agpayinCallback);
router.route('/payout-callback').post(agpayoutCallback);

export default router;
