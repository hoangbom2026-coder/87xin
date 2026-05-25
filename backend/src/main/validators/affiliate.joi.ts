import Joi from 'joi';

const username = Joi.object({
    username: Joi.string().required()
});

const affiliateId = Joi.object({
    affiliateId: Joi.string().required()
});

const updatePassword = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required()
});

const updateAffiliate = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required()
});

export default {
    username,
    affiliateId,
    updateAffiliate,
    updatePassword
};
