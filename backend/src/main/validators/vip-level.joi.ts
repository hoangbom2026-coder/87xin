import Joi from 'joi';

const vipLevelId = Joi.object({
    vipLevelId: Joi.string().required()
});

const parentId = Joi.object({
    parentId: Joi.string().required()
});

const updateVipLevel = Joi.object({
    levelName: Joi.string().optional(),
    xp: Joi.number().optional()
});

const createVipLevel = Joi.object({
    parentId: Joi.string().required(),
    levelName: Joi.string().required(),
    xp: Joi.number().required()
});

export default {
    parentId,
    vipLevelId,
    createVipLevel,
    updateVipLevel
};
