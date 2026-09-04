import Joi from 'joi';

const emailVerify = Joi.object({
    email: Joi.string().email().required()
});

const emailCode = Joi.object({
    code: Joi.string().required()
});

const resetpassword = Joi.object({
    data: Joi.string().required()
});

export default {
    emailVerify,
    emailCode,
    resetpassword
};
