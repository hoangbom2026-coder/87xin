import Joi from 'joi';

const currencyId = Joi.object({
    currencyId: Joi.string().required()
});

const updateCurrency = Joi.object({
    name: Joi.string().optional(),
    status: Joi.boolean().optional(),
    icon: Joi.string().optional()
});

const createCurrency = Joi.object({
    name: Joi.string().required(),
    status: Joi.boolean().optional(),
    icon: Joi.string().required()
});

const updateRates = Joi.object({
    rates: Joi.object().pattern(Joi.string(), Joi.number()).required()
});

export default {
    currencyId,
    createCurrency,
    updateCurrency,
    updateRates
};
