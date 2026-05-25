import Joi from 'joi';

const createWithdraw = Joi.object({
    amount: Joi.number().required(),
    currency: Joi.string().required(),
    payoutType: Joi.string().required(),
    data: Joi.object().required()
});

const approveWithdraw = Joi.object({
    id: Joi.string().required()
});

const declineWithdraw = Joi.object({
    id: Joi.string().required(),
    description: Joi.string().required()
});

const getWithdraws = Joi.object({
    status: Joi.string().allow('').optional(),
    username: Joi.string().allow('').optional(),
    currentPage: Joi.number().required(),
    rowsPerPage: Joi.number().required(),
    isAll: Joi.boolean().optional(),
    date: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
    }).optional()
});

const getWithdrawItem = Joi.object({
    userId: Joi.string().required(),
    orderId: Joi.string().required(),
    payoutType: Joi.string().required()
});

const adminWithdraw = Joi.object({
    userId: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    comment: Joi.string().allow('').required()
});

export default {
    createWithdraw,
    getWithdraws,
    approveWithdraw,
    declineWithdraw,
    getWithdrawItem,
    adminWithdraw
};
