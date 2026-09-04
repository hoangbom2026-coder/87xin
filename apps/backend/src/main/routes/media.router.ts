import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import { uploadMedia } from '@middlewares/upload-media';
import {
    getAssets,
    getAsset,
    uploadAssets,
    patchAssetMeta,
    moveAssetCtrl,
    removeAsset,
    removeAssetsCtrl,
    getFolders,
    postFolder,
    removeFolder
} from '@main/controllers/media.controller';

const router = express.Router();

router.get('/folders', auth, adminOnly, getFolders);
router.post('/folders', auth, adminOnly, postFolder);
router.delete('/folders/:id', auth, adminOnly, removeFolder);

router.get('/', auth, adminOnly, getAssets);
router.post('/', auth, adminOnly, uploadMedia.array('files', 50), uploadAssets);
router.post('/bulk-delete', auth, adminOnly, removeAssetsCtrl);
router.get('/:id', auth, adminOnly, getAsset);
router.patch('/:id', auth, adminOnly, patchAssetMeta);
router.patch('/:id/move', auth, adminOnly, moveAssetCtrl);
router.delete('/:id', auth, adminOnly, removeAsset);

export default router;
