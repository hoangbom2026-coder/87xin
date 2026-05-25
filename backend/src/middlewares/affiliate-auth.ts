import moment from 'moment';
import HttpStatusCodes from 'http-status';
import { NextFunction, Request, Response } from 'express';
// config
import config from '../config';
// utils
import ApiError from '../utils/ApiError';
// service
import sessionService from '@main/services/session.service';
import affiliateService from '@main/services/affiliate.service';
export interface AffiliateAuthRequest extends Request {
    // eslint-disable-next-line
    affiliate?: any;
    // eslint-disable-next-line
    file?: any;
}

const verifyCallback = async (req: AffiliateAuthRequest, resolve, reject) => {
    function error() {
        return reject(new ApiError(HttpStatusCodes.UNAUTHORIZED, 'Please authenticate'));
    }

    const header = req.headers.authorization || '';
    const token = header.split(/\s+/).pop() || '';

    if (!token) {
        return error();
    }
    const session = await sessionService.getSession(token);

    if (!session) {
        return error();
    }
    if (new Date(session.expiredTime) > new Date()) {
        const expiredTime = moment().add(config.jwt.accessExpirationMinutes, 'minutes').toDate();

        await sessionService.updateSession(String(session._id), { expiredTime });

        const authAffiliate = await affiliateService.getAffiliateById(String(session.userId));
        if (authAffiliate) {
            req.affiliate = authAffiliate;
        } else {
            return error();
        }

        resolve();
    } else {
        await sessionService.deleteSession(String(session.userId));
        return error();
    }
};

const affiliateAuth = async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
        verifyCallback(req, resolve, reject);
    })
        .then(() => next())
        .catch((err) => next(err));
};

export default affiliateAuth;
