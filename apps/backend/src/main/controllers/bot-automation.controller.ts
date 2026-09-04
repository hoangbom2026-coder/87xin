import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import botAutomationService from '@main/services/bot-automation.service';
import botRunnerService from '@main/services/bot-runner.service';

export const getBotAutomation = catchAsync(async (req: AuthRequest, res: Response) => {
    const doc = await botAutomationService.getOrCreate();
    return res.send(doc);
});

export const patchBotAutomation = catchAsync(async (req: AuthRequest, res: Response) => {
    const doc = await botAutomationService.updateBotAutomation(req.body);
    await botRunnerService.applyFromDatabase();
    return res.send(doc);
});
