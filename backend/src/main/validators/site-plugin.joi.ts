import Joi from 'joi';

const statusValues = ['installed', 'available', 'disabled'];

export const createSitePlugin = Joi.object({
    key: Joi.string().trim().min(1).max(80).required(),
    title: Joi.string().trim().min(1).max(200).required(),
    version: Joi.string().trim().max(40).default('1.0.0'),
    description: Joi.string().allow('').max(5000),
    author: Joi.string().allow('').max(200),
    iconUrl: Joi.string().allow('').max(2000),
    status: Joi.string().valid(...statusValues).optional(),
    configPath: Joi.string().allow('').max(500),
    configJson: Joi.object().unknown(true).optional(),
    order: Joi.number().integer().min(0).optional()
});

export const patchSitePlugin = Joi.object({
    title: Joi.string().trim().min(1).max(200),
    version: Joi.string().trim().max(40),
    description: Joi.string().allow('').max(5000),
    author: Joi.string().allow('').max(200),
    iconUrl: Joi.string().allow('').max(2000),
    status: Joi.string().valid(...statusValues),
    configPath: Joi.string().allow('').max(500),
    configJson: Joi.object().unknown(true),
    order: Joi.number().integer().min(0)
})
    .min(1)
    .messages({ 'object.min': 'Cần ít nhất một trường' });

export const pluginIdParam = Joi.object({
    pluginId: Joi.string().hex().length(24).required()
});

export default {
    createSitePlugin,
    patchSitePlugin,
    pluginIdParam
};
