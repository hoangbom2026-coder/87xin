import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import { uploadFile } from '@middlewares/upload';
import * as ctrl from '@main/controllers/admin-game-menu.controller';

const router = express.Router();

router.get('/game-menu', auth, adminOnly, ctrl.getGameMenuConfig);
router.post('/game-menu', auth, adminOnly, ctrl.updateGameMenuConfig);
router.post(
    '/game-menu/upload',
    auth,
    adminOnly,
    uploadFile.single('gameIcon'),
    ctrl.uploadGameIconAsset
);

export default router;
