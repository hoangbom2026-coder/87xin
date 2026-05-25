import PasswordLog from '@main/models/password-log.model';

export interface ICreatePasswordLog {
    userId: string;
    actorId: string;
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

const createPasswordLog = async (data: ICreatePasswordLog) => {
    return await PasswordLog.create(data);
};

export default {
    createPasswordLog
};
