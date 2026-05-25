import express, { Request, Response } from 'express';
import catchAsync from '@utils/catchAsync';
import gameMenuService from '@main/services/game-menu.service';

const router = express.Router();

/** GET /api/game-menu — public, frontend1 fetch để render dải icon game. */
router.get(
    '/',
    catchAsync(async (_req: Request, res: Response) => {
        const items = await gameMenuService.getGameMenu();
        return res.send({ items });
    })
);

export default router;
