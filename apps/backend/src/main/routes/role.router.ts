import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as roleController from '@main/controllers/role.controller';

const router = express.Router();

router.get('/permissions', auth, adminOnly, roleController.getPermissionCatalog);
router.get('/', auth, adminOnly, roleController.getRoles);
router.post('/', auth, adminOnly, roleController.createRole);
router.get('/:roleId', auth, adminOnly, roleController.getRole);
router.patch('/:roleId', auth, adminOnly, roleController.updateRole);
router.delete('/:roleId', auth, adminOnly, roleController.deleteRole);

export default router;
