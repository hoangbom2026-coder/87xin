import { packageController } from '@main/controllers/package.controller';
import auth from '@middlewares/auth';
import express from 'express';

const router = express.Router();

router.get('/', packageController.getPackages);
router.get('/categories', packageController.getCategories);
router.post('/categories', auth, packageController.createCategory);
router.post('/', auth, packageController.createPackage);
router.put('/:id', auth, packageController.updatePackage);
router.delete('/:id', auth, packageController.deletePackage);

export default router;
