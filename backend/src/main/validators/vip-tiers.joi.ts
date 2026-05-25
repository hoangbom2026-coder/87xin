import Joi from 'joi';

const vipTiersId = Joi.object({
    vipTiersId: Joi.string().required()
});

const updateVipTiers = Joi.object({
    tiersName: Joi.string().optional(),
    order: Joi.number().optional(),
    levelUpBonus: Joi.number().optional(),
    weeklyCashback: Joi.boolean().optional(),
    weeklyCashbackMin: Joi.number().optional(),
    weeklyCashbackPercent: Joi.number().optional(),
    monthlyCashback: Joi.boolean().optional(),
    monthlyCashbackMin: Joi.number().optional(),
    monthlyCashbackPercent: Joi.number().optional(),
    noFeeWithdrawal: Joi.boolean().optional()
});

const createVipTiers = Joi.object({
    tiersName: Joi.string().required(),
    order: Joi.number().required(),
    levelUpBonus: Joi.number().required(),
    weeklyCashback: Joi.boolean().required(),
    weeklyCashbackMin: Joi.number().required(),
    weeklyCashbackPercent: Joi.number().required(),
    monthlyCashback: Joi.boolean().required(),
    monthlyCashbackMin: Joi.number().required(),
    monthlyCashbackPercent: Joi.number().required(),
    noFeeWithdrawal: Joi.boolean().required()
});

export default {
    vipTiersId,
    createVipTiers,
    updateVipTiers
};
