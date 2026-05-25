import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import {
    subscribe,
    unsubscribe,
    adminList,
    adminDelete,
    adminUpdate,
    adminExportCsv
} from '@main/controllers/newsletter.controller';

const router = express.Router();

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

router.get('/admin/list', auth, adminOnly, adminList);
router.get('/admin/export.csv', auth, adminOnly, adminExportCsv);
router.delete('/admin/:id', auth, adminOnly, adminDelete);
router.patch('/admin/:id', auth, adminOnly, adminUpdate);

export default router;
