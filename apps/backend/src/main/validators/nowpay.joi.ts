import Joi from 'joi';

const getNowpayCurrency = Joi.object({
    status: Joi.boolean().optional(),
    hasBalance: Joi.boolean().optional(),
    isAll: Joi.boolean().required(),
    currentPage: Joi.number().required(),
    rowsPerPage: Joi.number().required()
});

const updateCurrencyStatus = Joi.object({
    status: Joi.boolean().optional(),
    rate_code: Joi.boolean().optional()
});

const getWithdrawCurrency = Joi.object({
    withdrawAmount: Joi.number().required(),
    currencyCode: Joi.string().required()
});

const nowpayId = Joi.object({
    nowpayId: Joi.string().required()
});

const currencyId = Joi.object({
    currencyId: Joi.string().required()
});

const updateCurrencyCommon = Joi.object({
    status: Joi.boolean().optional(),
    common: Joi.boolean().optional()
});

const createPayment = Joi.object({
    amount: Joi.number().min(0).required(),
    currency: Joi.string().required()
});

export default {
    nowpayId,
    currencyId,
    getNowpayCurrency,
    updateCurrencyStatus,
    updateCurrencyCommon,
    getWithdrawCurrency,
    createPayment
};