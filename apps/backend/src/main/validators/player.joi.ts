import Joi from 'joi';

const username = Joi.object({
    username: Joi.string().required()
});

const currencyId = Joi.object({
    currencyId: Joi.string().required()
});

const bonusId = Joi.object({
    bonusId: Joi.string().required()
});

const updatePassword = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required()
});

const createKyc = Joi.object({
    type: Joi.string().required(),
    countryCode: Joi.string().required(),
    country: Joi.string().required()
});

const getPayments = Joi.object({
    status: Joi.string().required(),
    currentPage: Joi.number().required(),
    rowsPerPage: Joi.number().required(),
    date: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
    }).optional()
});

const getBonus = Joi.object({
    status: Joi.string().required(),
    currentPage: Joi.number().required(),
    rowsPerPage: Joi.number().required(),
    date: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
    }).optional()
});

const getTransaction = Joi.object({
    type: Joi.string().required(),
    currentPage: Joi.number().required(),
    rowsPerPage: Joi.number().required(),
    date: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
    }).optional()
});

export default {
    username,
    currencyId,
    bonusId,
    updatePassword,
    createKyc,
    getBonus,
    getPayments,
    getTransaction
};
