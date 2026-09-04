import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import {
    listStaff,
    createStaff,
    updateStaff,
    resetStaffPassword,
    removeStaff
} from '@main/controllers/admin-staff.controller';

const router = express.Router();

router.get('/staff', auth, adminOnly, listStaff);
router.post('/staff', auth, adminOnly, createStaff);
router.patch('/staff/:id', auth, adminOnly, updateStaff);
router.patch('/staff/:id/password', auth, adminOnly, resetStaffPassword);
router.delete('/staff/:id', auth, adminOnly, removeStaff);

export default router;
