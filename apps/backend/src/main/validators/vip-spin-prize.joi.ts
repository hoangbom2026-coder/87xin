import Joi from 'joi';

const vipSpinPrizeId = Joi.object({
    vipSpinPrizeId: Joi.string().required()
});

const prizeSlot = Joi.object({
    id: Joi.string().required(),
    amount: Joi.number().required(),
    probability: Joi.number().min(0).max(1e9).required(),
    label: Joi.string().allow('', null).max(80).optional(),
    minTurnover: Joi.number().min(0).optional(),
    minVipXp: Joi.number().min(0).optional(),
    minDepositCount: Joi.number().integer().min(0).max(999999).optional()
}).unknown(false);

const updateVipSpinPrize = Joi.object({
    prizes: Joi.array().items(prizeSlot).min(16).max(16).optional(),
    tiersId: Joi.string().optional()
});

const createVipSpinPrize = Joi.object({
    prizes: Joi.array().items(prizeSlot).min(16).max(16).required(),
    tiersId: Joi.string().required()
});

export default {
    vipSpinPrizeId,
    createVipSpinPrize,
    updateVipSpinPrize
};
