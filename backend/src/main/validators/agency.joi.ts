import Joi from 'joi';

const objectId = Joi.string().hex().length(24).required();

export default {
    invest: Joi.object({
        planId: objectId,
        amount: Joi.number().positive().required()
    }),
    preview: Joi.object({
        amount: Joi.number().positive().required()
    })
};
