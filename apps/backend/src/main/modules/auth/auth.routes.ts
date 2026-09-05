import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
import affiliateAuth from '@middlewares/affiliate-auth';
// rate limiting
import { authLimiter } from '@middlewares/rate-limit';
// joi
import VSchema from '@main/modules/auth/auth.validator';
// controller
import {
    adminLogin,
    logout,
    me,
    login,
    register,
    affiliateLogin,
    affiliateRegister,
    affiliateMe,
    affiliateLogout,
    forgotPassword,
    resetPassword,
    checkAvailability
} from '@main/modules/auth/auth.controller';

const router = express.Router();
const validator = createValidator();

router.post('/admin-login', authLimiter, validator.body(VSchema.login), adminLogin);
router.post('/logout', auth, logout);
router.get('/me', auth, me);

router.post('/login', authLimiter, validator.body(VSchema.login), login);
router.post('/register', authLimiter, validator.body(VSchema.register), register);
router.post('/forgot-password', authLimiter, validator.body(VSchema.forgotPassword), forgotPassword);
router.post('/reset-password', authLimiter, validator.body(VSchema.resetPassword), resetPassword);
router.get('/check-availability', validator.query(VSchema.checkAvailability), checkAvailability);

router.post('/affiliate/login', authLimiter, validator.body(VSchema.login), affiliateLogin);
router.post('/affiliate/register', authLimiter, validator.body(VSchema.affiliateRegister), affiliateRegister);
router.post('/affiliate/logout', affiliateAuth, affiliateLogout);
router.get('/affiliate/me', affiliateAuth, affiliateMe);

export default router;
