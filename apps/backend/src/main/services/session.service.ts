// model
import SessionModel, { ISession } from '@main/models/session.model';
// service
import authLogService from '@main/services/auth-log.service';

export interface ICreateSession {
    userId: string;
    token: string;
    expiredTime: Date;
}

const createSession = async (newSession: ICreateSession) => {
    return await SessionModel.create(newSession);
};

const getSession = async (token: string) => {
    return await SessionModel.findOne({ token });
};

const getSessionById = async (id: string) => {
    return await SessionModel.findOne({ _id: id });
};

const updateSession = async (id: string, updateData: Partial<ISession>) => {
    return await SessionModel.updateOne({ _id: id }, updateData);
};

const deleteSession = async (id: string) => {
    const data = await SessionModel.findOneAndDelete({ _id: id });
    if (data) {
        await authLogService.updateAuthLog(String(data.userId), 'Session expire');
    }
};

const deleteSessionByUserId = async (userId: string) => {
    return await SessionModel.findOneAndDelete({ userId });
};

export default {
    createSession,
    getSession,
    deleteSession,
    deleteSessionByUserId,
    updateSession,
    getSessionById
};
