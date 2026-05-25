import httpStatus from 'http-status';
import { Response } from 'express';
import catchAsync from '@utils/catchAsync';
import ApiError from '@utils/ApiError';
import { AuthRequest } from '@middlewares/auth';
import sitePluginService from '@main/services/site-plugin.service';

export const listSitePlugins = catchAsync(async (req: AuthRequest, res: Response) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const data = await sitePluginService.listPlugins(search);
    return res.send({ data, total: data.length });
});

export const getSitePlugin = catchAsync(async (req: AuthRequest, res: Response) => {
    const doc = await sitePluginService.getPluginById((req.params as any).pluginId);
    if (!doc) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');
    }
    return res.send(doc);
});

export const createSitePlugin = catchAsync(async (req: AuthRequest, res: Response) => {
    const body = { ...req.body, key: String(req.body.key).toLowerCase().trim() };
    const duplicate = await sitePluginService.findByKey(body.key);
    if (duplicate) {
        throw new ApiError(httpStatus.CONFLICT, 'Key already exists');
    }
    const created = await sitePluginService.createPlugin(body);
    return res.status(httpStatus.CREATED).send(created);
});

export const patchSitePlugin = catchAsync(async (req: AuthRequest, res: Response) => {
    const doc = await sitePluginService.patchPlugin((req.params as any).pluginId, req.body);
    if (!doc) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');
    }
    return res.send(doc);
});

export const installSitePlugin = catchAsync(async (req: AuthRequest, res: Response) => {
    const doc = await sitePluginService.setStatus((req.params as any).pluginId, 'installed');
    if (!doc) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');
    }
    return res.send(doc);
});

export const uninstallSitePlugin = catchAsync(async (req: AuthRequest, res: Response) => {
    const doc = await sitePluginService.setStatus((req.params as any).pluginId, 'available');
    if (!doc) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');
    }
    return res.send(doc);
});
