import httpStatus from 'http-status';
import { Request, Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import helpService from '@main/services/help.service';

export const getHelps = catchAsync(async (req: Request, res: Response) => {
    const helps = await helpService.getHelps(String(req.query.lang || 'en'));
    return res.send(helps);
});

export const getHelp = catchAsync(async (req: Request, res: Response) => {
    const help = await helpService.getHelp(String(req.query.slug), String(req.query.lang));
    return res.send(help);
});

export const getHelpList = catchAsync(async (req: Request, res: Response) => {
    const help = await helpService.getHelpList();
    return res.send(help);
});

export const createHelp = catchAsync(async (req: AuthRequest, res: Response) => {
    const help = await helpService.createHelp(req.body);
    return res.send(help);
});

export const updateHelp = catchAsync(async (req: AuthRequest, res: Response) => {
    const help = await helpService.updateHelp(String((req.params as any).helpId), req.body);
    return res.send(help);
});

export const deleteHelp = catchAsync(async (req: AuthRequest, res: Response) => {
    const help = await helpService.deleteHelp(String(req.query.slug));
    return res.send(help);
});
