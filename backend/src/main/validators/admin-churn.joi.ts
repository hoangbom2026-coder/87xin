import Joi from 'joi';

const postChurnOffer = Joi.object({
    userId: Joi.string().required(),
    bonusId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    goalAmount: Joi.number().positive().required(),
    sendNotification: Joi.boolean().default(true),
    notificationTitle: Joi.string().allow('').optional(),
    notificationContent: Joi.string().allow('').optional(),
    link: Joi.string().allow('').optional()
});

export default {
    postChurnOffer
};
