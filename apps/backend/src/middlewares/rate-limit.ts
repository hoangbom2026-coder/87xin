import rateLimit from 'express-rate-limit';

/**
 * Rate limiter cho auth endpoints (login, register, forgot-password, v.v.)
 * 10 requests / 15 phút mỗi IP
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 429,
        message: 'Too many requests, please try again later.'
    }
});

/**
 * Rate limiter cho OTP / email verify endpoints
 * 5 requests / 15 phút mỗi IP
 */
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 429,
        message: 'Too many OTP requests, please try again later.'
    }
});
