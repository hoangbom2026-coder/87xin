import express from 'express';
import { createValidator } from 'express-joi-validation';
// auth
import auth from '@middlewares/auth';
// rate limiting
import { otpLimiter } from '@middlewares/rate-limit';
// joi
import joiSchema from '@main/validators/verify.joi';
// controller
import { emailCodeVerify, resendEmailCode, resetPassword, sendEmailCode } from '@main/controllers/verify.controller';

const router = express.Router();
const validator = createValidator();

router.route('/email-verify').post(otpLimiter, auth, validator.body(joiSchema.emailVerify), sendEmailCode);
router.route('/email-resend').post(otpLimiter, auth, validator.body(joiSchema.emailVerify), resendEmailCode);
router.route('/email-code').post(otpLimiter, auth, validator.body(joiSchema.emailCode), emailCodeVerify);

router.route('/resetpassword').post(otpLimiter, validator.body(joiSchema.resetpassword), resetPassword);

export default router;
