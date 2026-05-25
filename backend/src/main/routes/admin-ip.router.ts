import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import {
    listIPAccess,
    createIPAccess,
    updateIPAccess,
    deleteIPAccess,
    getRealtimeStream
} from '@main/controllers/admin-ip.controller';

const router = express.Router();

router.get('/ip-access', auth, adminOnly, listIPAccess);
router.post('/ip-access', auth, adminOnly, createIPAccess);
router.patch('/ip-access/:id', auth, adminOnly, updateIPAccess);
router.delete('/ip-access/:id', auth, adminOnly, deleteIPAccess);

router.get('/realtime-events', auth, adminOnly, getRealtimeStream);

export default router;
