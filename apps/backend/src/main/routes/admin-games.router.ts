import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as ctrl from '@main/controllers/admin-games.controller';

const router = express.Router();

router.get('/games/catalog', auth, adminOnly, ctrl.getCatalog);
router.get('/games/counts', auth, adminOnly, ctrl.getCounts);
router.get('/games', auth, adminOnly, ctrl.listGames);
router.post('/games', auth, adminOnly, ctrl.createGame);
router.post('/games/bulk-flags', auth, adminOnly, ctrl.bulkPatchFlags);
router.post('/games/reorder', auth, adminOnly, ctrl.reorderGames);
router.patch('/games/:id', auth, adminOnly, ctrl.updateGame);
router.delete('/games/:id', auth, adminOnly, ctrl.deleteGame);

export default router;
