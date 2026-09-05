/**
 * Auth Service — token generation + session lifecycle.
 * Extracted from auth.controller so controller has zero business logic.
 */
import jwt from 'jsonwebtoken';
import moment from 'moment';

import config from '../../../config';
import sessionService from '@main/services/session.service';
import authLogService from '@main/services/auth-log.service';
import { AuthRequest } from '@middlewares/auth';

export const generateToken = (userId: string, role: string = 'user'): { token: string; expires: Date } => {
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes').toDate();
    const token = jwt.sign(
        { sub: userId, role, exp: Math.floor(expires.getTime() / 1000) },
        config.jwt.secret
    );
    return { token, expires };
};

export const createSessionAndLog = async (
    userId: string,
    token: string,
    expires: Date,
    req: AuthRequest
): Promise<void> => {
    await sessionService.createSession({ userId, token, expiredTime: expires });
    try {
        await authLogService.createAuthLog({
            userId,
            ip: req.ip || '',
            userAgent: req.headers['user-agent'] || '',
            device: 'desktop',
            os: 'unknown',
            browser: 'unknown',
            country: { code: 'VN', name: 'Vietnam' }
        });
    } catch (_) {}
};

export const revokeToken = async (authHeader: string): Promise<void> => {
    const token = authHeader.split(/\s+/).pop() || '';
    if (token) {
        const session = await sessionService.getSession(token);
        if (session) {
            await sessionService.deleteSession(String(session._id));
        }
    }
};
