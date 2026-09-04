import Joi from 'joi';

const sportId = Joi.object({
    sportId: Joi.string().required()
});

const updateSport = Joi.object({
    order: Joi.number().optional(),
    state: Joi.alternatives()
        .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0'))
        .optional(),
    product_title: Joi.string().optional(),
    status: Joi.string().optional(),
    currency: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional()
});

const createSport = Joi.object({
    order: Joi.number().default(0),
    provider: Joi.string().required(),
    currency: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).required(),
    status: Joi.string().default('ACTIVATED'),
    state: Joi.boolean().default(true),
    provider_id: Joi.number().required(),
    product_id: Joi.number().required(),
    product_code: Joi.number().required(),
    game_type: Joi.string().default('SPORT_BOOK'),
    product_title: Joi.string().required()
});

export default {
    sportId,
    updateSport,
    createSport
};
