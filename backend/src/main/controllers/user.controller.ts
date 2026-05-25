import httpStatus from 'http-status';
import { Response } from 'express';
import * as UAParser from 'ua-parser-js';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { getGeoInfo } from '@utils/getCountry';
import { getIpAddress } from '@utils/utils';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import userService from '@main/services/user.service';
import sessionService from '@main/services/session.service';
import passwordLogService from '@main/services/password-log.service';
import config from '@config/index';

export const createUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const userData = req.body;
    if (await userService.getUserByUsername(userData.username)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Username already taken.');
    }

    const user = await userService.createUser(userData);
    return res.status(httpStatus.CREATED).send(user);
});

export const getUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);

    const user = await userService.getUserById(userId);
    if (user) {
        return res.send(user);
    }

    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
});

export const getUserCount = catchAsync(async (req: AuthRequest, res: Response) => {
    const count = await userService.getUserCount();
    return res.send(count);
});

export const getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
    const users = await userService.getUsers(req.body);

    return res.send(users);
});

export const updateUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const updateData = req.body;

    const user = await userService.getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
    }

    if (updateData.username) {
        if (await userService.usernameTaken(updateData.username, userId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
        }
    }
    const updatedUser = await userService.patchUpdate({ _id: userId }, updateData);
    return res.send(updatedUser);
});

export const blockUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId, status } = req.body;

    const updatedUser = await userService.patchUpdate({ _id: userId }, { status });
    return res.send(updatedUser);
});

export const updatePassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId } = (req.params as any);
    const user = await userService.getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const updated = await userService.updatePassword(userId, req.body.password);

    const userIp = getIpAddress(req);

    const userAgent = req.headers['user-agent'];
    const parser = new UAParser.UAParser(userAgent);
    const result = parser.getResult();

    const country = {
        code: 'Unknown',
        name: 'Unknown'
    };

    if (userIp) {
        const { data } = await getGeoInfo(userIp);
        country.code = data.countryCode;
        country.name = data.country;
    }
    await passwordLogService.createPasswordLog({
        userId: userId,
        actorId: String(req.user._id),
        ip: userIp,
        userAgent,
        device: result.device.type || 'desktop',
        os: result.os.name + ' ' + result.os.version,
        browser: result.browser.name + ' ' + result.browser.version,
        country
    });

    // Invalidate all sessions for this user after password change
    await sessionService.deleteSessionByUserId(userId);

    return res.send({ status: !!updated });
});

export const updateAdminPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const { oldPassword, newPassword, adminCode } = req.body;
    if (!(await req.user.isPasswordMatch(oldPassword))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
    }

    if (adminCode !== config.adminCode) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Admin code is wrong');
    }
    await userService.updatePassword(String(req.user._id), newPassword);

    const userIp = getIpAddress(req);

    const userAgent = req.headers['user-agent'];
    const parser = new UAParser.UAParser(userAgent);
    const result = parser.getResult();

    const country = {
        code: 'Unknown',
        name: 'Unknown'
    };

    if (userIp) {
        const { data } = await getGeoInfo(userIp);
        country.code = data.countryCode;
        country.name = data.country;
    }
    await passwordLogService.createPasswordLog({
        userId: String(req.user._id),
        actorId: String(req.user._id),
        ip: userIp,
        userAgent,
        device: result.device.type || 'desktop',
        os: result.os.name + ' ' + result.os.version,
        browser: result.browser.name + ' ' + result.browser.version,
        country
    });

    // Invalidate all sessions for this admin after password change
    await sessionService.deleteSessionByUserId(String(req.user._id));

    return res.status(httpStatus.NO_CONTENT).send();
});

export const updateUserStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId, status } = req.body;
    const user = await userService.getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const updated = await userService.patchUpdate({ _id: userId }, { status });
    return res.send(updated);
});
