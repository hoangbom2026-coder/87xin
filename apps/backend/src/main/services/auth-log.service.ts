import AuthLogModel from '@main/models/auth-log.model';

export interface ICreateAuthLog {
    userId: string;
    ip: string;
    userAgent: string;
    device: string;
    os: string;
    browser: string;
    country: {
        code: string;
        name: string;
    };
}

const createAuthLog = async (data: ICreateAuthLog) => {
    return await AuthLogModel.create(data);
};

const updateAuthLog = async (userId: string, endReason: string) => {
    return await AuthLogModel.findOneAndUpdate({ userId, isLive: true }, { endReason, isLive: false }, { new: true });
};

export default {
    createAuthLog,
    updateAuthLog
};
