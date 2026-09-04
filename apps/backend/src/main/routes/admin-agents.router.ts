import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as ctrl from '@main/controllers/admin-agents.controller';
// import * as transferCtrl from '@main/controllers/transfer.controller';

const router = express.Router();

router.get('/agents/stats', auth, adminOnly, ctrl.getStats);
router.get('/agents/program', auth, adminOnly, ctrl.getProgram);
router.patch('/agents/program', auth, adminOnly, ctrl.updateProgram);
router.get('/agents/commissions', auth, adminOnly, ctrl.listCommissions);
// router.get('/agents/transfers', auth, adminOnly, transferCtrl.listAllTransfers);
router.get('/agents', auth, adminOnly, ctrl.listAgents);
router.patch('/agents/:userId/status', auth, adminOnly, ctrl.setAgentStatus);
router.get('/agents/:userId/checklist', auth, adminOnly, ctrl.recheckEnrollment);
router.get('/agents/:userId/tree', auth, adminOnly, ctrl.getAgentTree);
router.post('/agents/:userId/manual-adjustment', auth, adminOnly, ctrl.postManualAdjustment);
router.post('/agents/retry-interest-cron', auth, adminOnly, ctrl.postRetryInterestCron);

export default router;
