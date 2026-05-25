import express from 'express';
import { createValidator } from 'express-joi-validation';
import auth from '@middlewares/auth';
import joiSchema from '@main/validators/agency.joi';
import {
    getAgencyOverview,
    getAgencyPlans,
    getAgencyPlanPreview,
    postAgencyInvest,
    getAgencyInvestments,
    postAgencyTransferToMain
} from '@main/controllers/agency.controller';

const router = express.Router();
const validator = createValidator();

router.get('/overview', auth, getAgencyOverview);
router.get('/plans', auth, getAgencyPlans);
router.get('/plans/:planId/preview', auth, validator.query(joiSchema.preview), getAgencyPlanPreview);
router.post('/invest', auth, validator.body(joiSchema.invest), postAgencyInvest);
router.get('/investments', auth, getAgencyInvestments);
router.post('/transfer-to-main', auth, postAgencyTransferToMain);

export default router;
