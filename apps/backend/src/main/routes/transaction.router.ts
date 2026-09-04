/**
 * Transaction routes.
 * Endpoints for querying user and system transaction logs and bet history.
 */
import express from 'express';
import auth from '@middlewares/auth';
import {
    getTransactionList,
    getBetTransaction
} from '@main/controllers/transaction.controller';

const router = express.Router();

router.post('/list', auth, getTransactionList);
router.post('/bets', auth, getBetTransaction);
router.get('/', auth, getTransactionList);

export default router;
