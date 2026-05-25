import Joi from 'joi';

const referralCode = Joi.object({
    referralCode: Joi.string().required()
});

const createReferralCode = Joi.object({
    name: Joi.string().allow('').required()
});

const patchCommission = Joi.object({
    commissionRate: Joi.number().min(0).max(1).required()
});

export default {
    referralCode,
    createReferralCode,
    patchCommission
};
