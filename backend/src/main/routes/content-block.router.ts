import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as contentBlockController from '@main/controllers/content-block.controller';

const router = express.Router();

router.get('/', contentBlockController.getVisibleContentBlocks);

router.get('/all', auth, adminOnly, contentBlockController.getContentBlockList);

router.get('/:key', contentBlockController.getContentBlockByKey);

router.post('/', auth, adminOnly, contentBlockController.createContentBlock);

router.patch('/:blockId', auth, adminOnly, contentBlockController.updateContentBlock);

router.delete('/:blockId', auth, adminOnly, contentBlockController.deleteContentBlock);

export default router;
