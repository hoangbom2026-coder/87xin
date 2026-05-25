import Joi from 'joi';

const bonusId = Joi.object({
    bonusId: Joi.string().required()
});

const updateBonus = Joi.object({
    name: Joi.string().optional(),
    percent: Joi.number().optional(),
    multiply: Joi.number().optional(),
    option: Joi.string().optional(),
    bonusCap: Joi.number().optional(),
    minBet: Joi.number().optional(),
    maxBet: Joi.number().optional(),
    slot: Joi.boolean().optional(),
    casino: Joi.boolean().optional(),
    status: Joi.boolean().optional(),
    autoCalc: Joi.boolean().optional(),
    expireDate: Joi.date().optional(),
    description: Joi.string().optional(),
    particularData: Joi.object().optional()
});

const createBonus = Joi.object({
    name: Joi.string().required(),
    percent: Joi.number().required(),
    multiply: Joi.number().required(),
    option: Joi.string().required(),
    bonusCap: Joi.number().required(),
    minBet: Joi.number().required(),
    maxBet: Joi.number().required(),
    slot: Joi.boolean().required(),
    casino: Joi.boolean().required(),
    status: Joi.boolean().required(),
    autoCalc: Joi.boolean().required(),
    expireDate: Joi.date().required(),
    description: Joi.string().required(),
    particularData: Joi.object().optional()
});

export default {
    bonusId,
    createBonus,
    updateBonus
};
