import { NextFunction, Request, Response } from 'express';
import HttpStatusCodes from 'http-status';
import config from '../config';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';
import { MongooseError } from 'mongoose';

// eslint-disable-next-line
const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode =
            error.statusCode || error instanceof MongooseError
                ? HttpStatusCodes.BAD_REQUEST
                : HttpStatusCodes.INTERNAL_SERVER_ERROR;
        const message = (error as any).message || HttpStatusCodes[statusCode];
        error = new ApiError(statusCode, message, false, err.stack);
    }
    next(error);
};

// eslint-disable-next-line
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let { statusCode, message } = err;
    if (config.env === 'production' && !err.isOperational) {
        statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
        message = HttpStatusCodes[HttpStatusCodes.INTERNAL_SERVER_ERROR];
    }

    res.locals.errorMessage = err.message;

    const response = {
        success: false,
        error: {
            code: statusCode,
            message
        },
        message,
        ...(config.env === 'development' && { stack: err.stack })
    };

    if (config.env === 'development') {
        logger.error(err);
    }
    // Chỉ log error ngắn gọn, bỏ qua các 4xx phổ biến để không spam log production
    const noisy4xx = statusCode >= 400 && statusCode < 500;
    if (!noisy4xx || config.env !== 'production') {
        const method = req.method;
        const url = req.originalUrl || req.url;
        console.log(`[api] ${method} ${url} → ${statusCode} ${message}`);
    }
    res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
