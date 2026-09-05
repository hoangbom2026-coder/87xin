import Joi from 'joi';

export const patchBusiness = Joi.object({
    siteName: Joi.string().optional(),
    logo: Joi.string().uri().optional(),
    telegram: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    currency: Joi.string().optional(),
    timezone: Joi.string().optional(),
    maintenance: Joi.boolean().optional(),
});

export default {
    patchBusiness,
};