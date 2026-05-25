import Joi from 'joi';

const updateHelp = Joi.object({
    lang: Joi.string().optional(),
    title: Joi.string().optional(),
    icon: Joi.string().optional(),
    content: Joi.string().optional(),
    status: Joi.boolean().optional()
});

const createHelp = Joi.object({
    lang: Joi.string().optional(),
    slug: Joi.string().optional(),
    icon: Joi.string().optional(),
    title: Joi.string().optional(),
    content: Joi.string().optional()
});

const helpId = Joi.object({
    helpId: Joi.string().required()
});

export default {
    helpId,
    createHelp,
    updateHelp
};
