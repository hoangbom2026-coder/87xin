import Joi from 'joi';

const bannerId = Joi.object({
    bannerId: Joi.string().required()
});

/** multipart: order/status thường là string; image/link là URL hoặc đường dẫn file */
const updateBanner = Joi.object({
    order: Joi.any().optional(),
    status: Joi.any().optional(),
    image: Joi.string().allow('').max(2048).optional(),
    link: Joi.string().allow('').max(2048).optional()
});

const createBanner = Joi.object({
    order: Joi.any().optional(),
    status: Joi.any().optional(),
    image: Joi.string().allow('').max(2048).optional(),
    link: Joi.string().allow('').max(2048).optional()
});

export default {
    bannerId,
    createBanner,
    updateBanner
};
