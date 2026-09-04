import express from 'express';
import { getMarketingMaterials } from '@main/controllers/public-affiliate.controller';

const router = express.Router();

router.get('/materials', getMarketingMaterials);

export default router;
