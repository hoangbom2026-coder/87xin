import Joi from 'joi';

const login = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

/**
 * Form đăng ký chuẩn cho casino/sport platform.
 * - username: 4–32 ký tự, chỉ chữ thường + số + . _
 * - password: tối thiểu 6 ký tự
 * - email: optional (auto-generate nếu trống)
 * - phone: optional (chỉ số, +, dấu cách)
 * - fullName / dateOfBirth: optional (KYC ready)
 * - terms: optional (FE enforce, BE ghi nhận)
 */
const register = Joi.object({
    username: Joi.string()
        .lowercase()
        .pattern(/^[a-z0-9._]{4,32}$/)
        .required()
        .messages({ 'string.pattern.base': 'username chỉ gồm a–z, 0–9, . và _, dài 4–32' }),
    password: Joi.string().min(6).max(64).required(),
    email: Joi.string().email().allow('', null).optional(),
    phoneNumber: Joi.string()
        .pattern(/^[0-9+\-()\s]{6,20}$/)
        .allow('', null)
        .optional()
        .messages({ 'string.pattern.base': 'Số điện thoại không hợp lệ' }),
    fullName: Joi.string().max(80).allow('', null).optional(),
    firstName: Joi.string().max(40).allow('', null).optional(),
    lastName: Joi.string().max(40).allow('', null).optional(),
    dateOfBirth: Joi.string().allow('', null).optional(),
    currencyId: Joi.string().allow('', null).optional(),
    inviteCode: Joi.string().allow('', null).optional(),
    referralCode: Joi.string().allow('', null).optional(),
    agreeTerms: Joi.boolean().optional(),
    agreePromo: Joi.boolean().optional()
});

const affiliateRegister = Joi.object({
    email: Joi.string().required(),
    username: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().required(),
    referralCode: Joi.string().required()
});

const forgotPassword = Joi.object({
    /** Có thể là email, username hoặc số điện thoại. */
    identifier: Joi.string().required()
});

const resetPassword = Joi.object({
    token: Joi.string().allow('', null).optional(),
    otp: Joi.string().allow('', null).optional(),
    identifier: Joi.string().allow('', null).optional(),
    newPassword: Joi.string().min(6).max(64).required()
}).or('token', 'otp');

const checkAvailability = Joi.object({
    username: Joi.string().lowercase().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional()
}).or('username', 'email', 'phone');

export default {
    login,
    register,
    affiliateRegister,
    forgotPassword,
    resetPassword,
    checkAvailability
};
