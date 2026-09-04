import { Request, Response } from 'express';
import httpStatus from 'http-status';
import DailyChallenge from '@main/models/daily-challenge.model';
import catchAsync from '@utils/catchAsync';
import pick from '@utils/pick';

export const getPublicChallenges = catchAsync(async (req: Request, res: Response) => {
    const challenges = await DailyChallenge.find({ status: 'active' }).sort({ order: 1 });
    res.send({ success: true, data: challenges });
});

export const adminList = catchAsync(async (req: Request, res: Response) => {
    const filter = pick(req.query, ['title', 'status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const challenges = await DailyChallenge.find(filter).sort(options.sortBy || { order: 1 });
    res.send({ success: true, data: challenges });
});

export const createChallenge = catchAsync(async (req: Request, res: Response) => {
    const payload = { ...req.body };
    if (req.file) payload.image = '/public/uploads/' + req.file.filename;
    const challenge = await DailyChallenge.create(payload);
    res.status(httpStatus.CREATED).send({ success: true, data: challenge });
});

export const updateChallenge = catchAsync(async (req: Request, res: Response) => {
    const challenge = await DailyChallenge.findById((req.params as any).challengeId);
    if (!challenge) res.status(httpStatus.NOT_FOUND).send({ success: false, message: 'Not found' });
    
    const payload = { ...req.body };
    if (req.file) payload.image = '/public/uploads/' + req.file.filename;
    
    Object.assign(challenge, payload);
    await challenge.save();
    res.send({ success: true, data: challenge });
});

export const deleteChallenge = catchAsync(async (req: Request, res: Response) => {
    const challenge = await DailyChallenge.findById((req.params as any).challengeId);
    if (!challenge) res.status(httpStatus.NOT_FOUND).send({ success: false, message: 'Not found' });
    await challenge.deleteOne();
    res.status(httpStatus.NO_CONTENT).send();
});