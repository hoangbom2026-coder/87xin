import { planController } from '@main/controllers/plan.controller';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import express from 'express';

const router = express.Router();

router.get('/', planController.getPlans);
router.get('/:id', planController.getPlanById);
router.post('/', auth, adminOnly, planController.createPlan);
router.put('/:id', auth, adminOnly, planController.updatePlan);
router.patch('/:id/status', auth, adminOnly, planController.changeStatus);
router.post('/:id/duplicate', auth, adminOnly, planController.duplicatePlan);
router.delete('/:id', auth, adminOnly, planController.deletePlan);

export default router;
