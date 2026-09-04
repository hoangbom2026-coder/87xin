import express from 'express';

import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import { listAuditLogs } from '@main/controllers/admin-audit.controller';

const router = express.Router();

router.route('/audit-logs').get(auth, adminOnly, listAuditLogs);

export default router;
