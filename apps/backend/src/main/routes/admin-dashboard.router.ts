import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import { getAdminDashboard } from '@main/controllers/admin-dashboard.controller';

const router = express.Router();

router.get('/dashboard', auth, adminOnly, getAdminDashboard);

export default router;
