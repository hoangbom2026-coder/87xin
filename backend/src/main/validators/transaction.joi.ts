import Joi from 'joi';

const getTransaction = Joi.object({
    type: Joi.string().required(),
    username: Joi.string().allow('').optional(),
    payoutProvider: Joi.string().valid('all', 'auto-payout', 'manual').optional(),
    currentPage: Joi.number().required(),
    rowsPerPage: Joi.number().required(),
    date: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
    }).optional()
});

export default {
    getTransaction
};
