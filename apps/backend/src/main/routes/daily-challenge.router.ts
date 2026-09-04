import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import { uploadFile } from '@middlewares/upload';
import * as dailyChallengeController from '@main/controllers/daily-challenge.controller';

const router = express.Router();

router.get('/', dailyChallengeController.getPublicChallenges);

router.get('/admin', auth, adminOnly, dailyChallengeController.adminList);

router.post(
    '/',
    auth,
    adminOnly,
    uploadFile.single('image'),
    dailyChallengeController.createChallenge
);

router.patch(
    '/:challengeId',
    auth,
    adminOnly,
    uploadFile.single('image'),
    dailyChallengeController.updateChallenge
);

router.delete('/:challengeId', auth, adminOnly, dailyChallengeController.deleteChallenge);

export default router;