import moment from 'moment';
import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { detectContactType, generateOtpCode } from '@utils/utils';
// middlewares
import { AuthRequest } from '@middlewares/auth';
//
import { EmailCodeHTML } from '@utils/html';
import sendgridEmail from '@utils/sendgrid';
// service
import otpService from '@main/services/otp.service';
import config from '@config/index';
import { title } from 'process';
import userService from '@main/services/user.service';

export const sendEmailCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = req.body;

    let code = generateOtpCode();
    let otpCheck = await otpService.getOtpByCode(code);

    while (otpCheck) {
        code = generateOtpCode();
        otpCheck = await otpService.getOtpByCode(code);
    }
    await otpService.createOtp({
        userId: String(req.user._id),
        code,
        type: 'email',
        data: data.email,
        expireTime: moment().add(10, 'minutes').toDate()
    });
    const msg = {
        to: data.email,
        from: {
            email: config.fromEmail,
            name: 'Shivaspins.com'
        },
        subject: '[Shivaspins.com] Verify your email address',
        html: EmailCodeHTML({ code })
    };
    await sendgridEmail.send(msg);

    return res.send({ status: true });
});

export const resendEmailCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const otp = await otpService.getOtpByData(data.email);
    if (!otp) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Not found OTP');
    }
    await otpService.deleteOtpById(String(otp._id));

    let code = generateOtpCode();
    let otpCheck = await otpService.getOtpByCode(code);

    while (otpCheck) {
        code = generateOtpCode();
        otpCheck = await otpService.getOtpByCode(code);
    }
    await otpService.createOtp({
        userId: String(req.user._id),
        code,
        type: 'email',
        data: data.email,
        expireTime: moment().add(10, 'minutes').toDate()
    });
    const msg = {
        to: data.email,
        from: {
            email: config.fromEmail,
            name: 'Shivaspins.com'
        },
        title: 'Shivaspins.com',
        subject: '[Shivaspins.com] Verify your email address',
        html: EmailCodeHTML({ code })
    };
    await sendgridEmail.send(msg);

    return res.send({ status: true });
});

export const emailCodeVerify = catchAsync(async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const data = await otpService.getOtpByCode(code);
    if (!data) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invalid Code');
    }
    const now = new Date();
    const expiration = data.expireTime;
    if (now > expiration) {
        await otpService.patchUpdate({ _id: data._id }, { isExpired: true });
        throw new ApiError(httpStatus.NOT_FOUND, 'Invalid Code');
    }
    await otpService.deleteOtpById(String(data._id));
    await userService.patchUpdate({ _id: data.userId }, { email: data.data, emailVerified: true });
    return res.send({ status: true, userData: { email: data.data, emailVerified: true } });
});

export const resetPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { contact } = req.body;

    let code = generateOtpCode();
    let otpCheck = await otpService.getOtpByCode(code);

    while (otpCheck) {
        code = generateOtpCode();
        otpCheck = await otpService.getOtpByCode(code);
    }
    await otpService.createOtp({
        userId: String(req.user._id),
        code,
        type: 'email',
        data: contact,
        expireTime: moment().add(10, 'minutes').toDate()
    });
    const msg = {
        to: contact,
        from: {
            email: config.fromEmail,
            name: 'Shivaspins.com'
        },
        subject: '[Shivaspins.com] Verify your email address',
        html: EmailCodeHTML({ code })
    };
    await sendgridEmail.send(msg);

    return res.send({ status: true });
});
