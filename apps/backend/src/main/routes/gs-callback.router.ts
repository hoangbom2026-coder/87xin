import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import { GSC_CONFIG } from '@main/constants/gsc-integration';
import { getBalance } from '@main/controllers/ag-casino.controller';

const router = express.Router();

function md5(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex').toLowerCase();
}

function verifyGscSignature(action: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { operator_code, request_time, sign } = req.body || {};
        const secret = GSC_CONFIG.secretKey;
        const expectedSign = md5(`${operator_code || ''}${request_time || ''}${action}${secret}`);
        if (sign && String(sign).toLowerCase() === expectedSign) {
            next();
            return;
        }
        res.status(200).json({
            code: 1001,
            message: 'Invalid signature',
            status: 'FAIL'
        });
    };
}

const defaultHandler = (req: Request, res: Response) => {
    res.status(200).json({
        code: 0,
        message: 'success',
        status: 'SUCCESS',
        results: []
    });
};

router.route('/seamless/balance').post(verifyGscSignature('getbalance'), getBalance);
router.route('/seamless/withdraw').post(verifyGscSignature('withdraw'), defaultHandler);
router.route('/seamless/deposit').post(verifyGscSignature('deposit'), defaultHandler);
router.route('/seamless/pushbetdata').post(verifyGscSignature('pushbetdata'), defaultHandler);

export default router;
