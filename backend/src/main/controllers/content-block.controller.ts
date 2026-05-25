import httpStatus from 'http-status';
import { Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import ContentBlockService from '@main/services/content-block.service';

function parseBool(v: unknown): boolean {
    return v === true || v === 'true' || v === 1 || v === '1';
}

export const getContentBlockList = catchAsync(async (req: AuthRequest, res: Response) => {
    const blocks = await ContentBlockService.getContentBlockList();
    return res.send(blocks);
});

export const getVisibleContentBlocks = catchAsync(async (req: AuthRequest, res: Response) => {
    const blocks = await ContentBlockService.getVisibleContentBlocks();
    return res.send(blocks);
});

export const getContentBlockByKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const { key } = (req.params as any);
    const block = await ContentBlockService.getContentBlockByKey(key);
    if (!block) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Content block not found');
    }
    return res.send(block);
});

export const createContentBlock = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = {
        ...req.body,
        isVisible: typeof req.body.isVisible !== 'undefined' ? parseBool(req.body.isVisible) : true,
        isMaintenance: typeof req.body.isMaintenance !== 'undefined' ? parseBool(req.body.isMaintenance) : false,
        order: Number(req.body.order ?? 0)
    };
    const block = await ContentBlockService.createContentBlock(data);
    return res.status(httpStatus.CREATED).send(block);
});

export const updateContentBlock = catchAsync(async (req: AuthRequest, res: Response) => {
    const { blockId } = (req.params as any);
    const data = { ...req.body };
    
    if (typeof req.body.isVisible !== 'undefined') data.isVisible = parseBool(req.body.isVisible);
    if (typeof req.body.isMaintenance !== 'undefined') data.isMaintenance = parseBool(req.body.isMaintenance);
    if (typeof req.body.order !== 'undefined') data.order = Number(req.body.order);
    
    const block = await ContentBlockService.patchUpdate({ _id: blockId }, data);
    if (!block) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Content block not found');
    }
    return res.send(block);
});

export const deleteContentBlock = catchAsync(async (req: AuthRequest, res: Response) => {
    const { blockId } = (req.params as any);
    await ContentBlockService.deleteContentBlockById(blockId);
    return res.status(httpStatus.NO_CONTENT).send();
});
