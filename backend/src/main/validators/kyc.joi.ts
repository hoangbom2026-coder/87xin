import Joi from 'joi';

const kycId = Joi.object({
    kycId: Joi.string().required()
});

const getKycList = Joi.object({
    status: Joi.string().required(),
    email: Joi.string().allow('').optional(),
    currentPage: Joi.number().required(),
    rowsPerPage: Joi.number().required(),
    date: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
    }).optional()
});

const updateKyc = Joi.object({
    status: Joi.string().valid('pending', 'verified', 'rejected').required(),
    reason: Joi.string().allow('').optional()
});

export default {
    kycId,
    getKycList,
    updateKyc
};
