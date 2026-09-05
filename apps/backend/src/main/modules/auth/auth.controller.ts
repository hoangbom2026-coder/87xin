/**
 * Auth Controller — chỉ nhận Request/Response/Next và gọi Service.
 * Không chứa logic business, không gọi Model trực tiếp.
 */
import { Response } from 'express';
import httpStatus from 'http-status';

import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import { AffiliateAuthRequest } from '@middlewares/affiliate-auth';
import userService from '@main/services/user.service';
import affiliateService from '@main/services/affiliate.service';
import { generateToken, createSessionAndLog, revokeToken } from '@main/modules/auth/auth.service';

// ─── User ────────────────────────────────────────────────────────────────────

export const adminLogin = catchAsync(async (req: AuthRequest, res: Response) => {
    const { username, password } = req.body;
    const user = await userService.getUserByUsername(username);
    if (!user || !(await user.isPasswordMatch(password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }
    const adminRoles = ['admin', 'superadmin', 'manager', 'staff'];
    if (!adminRoles.includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Bạn không có quyền truy cập quản trị');
    }
    const { token, expires } = generateToken(String(user._id), user.role);
    await createSessionAndLog(String(user._id), token, expires, req);
    res.send({ user, token, tokens: { access: { token, expires } } });
});

export const login = catchAsync(async (req: AuthRequest, res: Response) => {
    const { username, password } = req.body;
    const user = await userService.getUserByUsername(username);
    if (!user || !(await user.isPasswordMatch(password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }
    if (user.status === 'blocked' || user.status === 'suspended') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Tài khoản đã bị khóa');
    }
    const { token, expires } = generateToken(String(user._id), user.role);
    await createSessionAndLog(String(user._id), token, expires, req);
    res.send({ user, token, tokens: { access: { token, expires } } });
});

export const register = catchAsync(async (req: AuthRequest, res: Response) => {
    const { username, email, phone } = req.body;
    if (await userService.usernameTaken(username)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Tên người dùng đã tồn tại');
    }
    if (email && (await userService.emailTaken(email))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email đã được sử dụng');
    }
    if (phone && (await userService.phoneTaken(phone))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Số điện thoại đã được sử dụng');
    }
    const user = await userService.createUser(req.body);
    const { token, expires } = generateToken(String(user._id), user.role);
    await createSessionAndLog(String(user._id), token, expires, req);
    res.status(httpStatus.CREATED).send({ user, token, tokens: { access: { token, expires } } });
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
    await revokeToken(req.headers.authorization || '');
    res.status(httpStatus.NO_CONTENT).send();
});

export const me = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Chưa đăng nhập');
    res.send({ user: req.user });
});

export const forgotPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { email, username } = req.body;
    const user = email
        ? await userService.getUserByEmail(email)
        : await userService.getUserByUsername(username);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy tài khoản');
    res.send({ message: 'Yêu cầu đặt lại mật khẩu đã được tiếp nhận' });
});

export const resetPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { newPassword, username } = req.body;
    const user = await userService.getUserByUsername(username);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy tài khoản');
    await userService.updatePassword(String(user._id), newPassword);
    res.send({ message: 'Đặt lại mật khẩu thành công' });
});

export const checkAvailability = catchAsync(async (req: AuthRequest, res: Response) => {
    const { username, email, phone } = req.query as { [key: string]: string };
    let available = true;
    if (username && (await userService.usernameTaken(username))) available = false;
    if (email && (await userService.emailTaken(email))) available = false;
    if (phone && (await userService.phoneTaken(phone))) available = false;
    res.send({ available });
});

// ─── Affiliate ───────────────────────────────────────────────────────────────

export const affiliateLogin = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const { username, password } = req.body;
    const affiliate = await affiliateService.getAffiliateByUsername(username);
    if (!affiliate || !(await affiliate.isPasswordMatch(password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Tên đăng nhập hoặc mật khẩu đại lý không đúng');
    }
    const { token, expires } = generateToken(String(affiliate._id), 'affiliate');
    await createSessionAndLog(String(affiliate._id), token, expires, req as unknown as AuthRequest);
    res.send({ affiliate, token, tokens: { access: { token, expires } } });
});

export const affiliateRegister = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    const { username, email } = req.body;
    if (await affiliateService.getAffiliateByUsername(username)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Tên đại lý đã tồn tại');
    }
    if (email) {
        const emailExist = await affiliateService.getAffiliateByEmail(email);
        if (emailExist) throw new ApiError(httpStatus.BAD_REQUEST, 'Email đại lý đã được sử dụng');
    }
    const affiliate = await affiliateService.createAffiliate(req.body);
    const { token, expires } = generateToken(String(affiliate._id), 'affiliate');
    await createSessionAndLog(String(affiliate._id), token, expires, req as unknown as AuthRequest);
    res.status(httpStatus.CREATED).send({ affiliate, token, tokens: { access: { token, expires } } });
});

export const affiliateLogout = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    await revokeToken(req.headers.authorization || '');
    res.status(httpStatus.NO_CONTENT).send();
});

export const affiliateMe = catchAsync(async (req: AffiliateAuthRequest, res: Response) => {
    if (!req.affiliate) throw new ApiError(httpStatus.UNAUTHORIZED, 'Chưa đăng nhập đại lý');
    res.send({ affiliate: req.affiliate });
});
