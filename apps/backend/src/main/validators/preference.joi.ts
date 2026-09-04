import Joi from 'joi';

const updatePreference = Joi.object({
    language: Joi.string().optional(),
    theme: Joi.string().optional(),
    hideUsername: Joi.boolean().optional(),
    maxBetAlert: Joi.boolean().optional(),
    depositEmailNotify: Joi.boolean().optional(),
    withdrawEmailNotify: Joi.boolean().optional(),
    marketingEmailNotify: Joi.boolean().optional()
});

export default {
    updatePreference
};
