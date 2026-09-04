import express from 'express';
import authRouter from '@main/routes/auth.router';
import gsPayRouter from '@main/routes/gs-pay.router';
import gsCallbackRouter from '@main/routes/gs-callback.router';
import transactionRouter from '@main/routes/transaction.router';
import walletRouter from '@main/routes/wallet.router';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/transactions', transactionRouter);
router.use('/wallet', walletRouter);
router.use('/gs-pay', gsPayRouter);
router.use('/gsc', gsCallbackRouter);

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
