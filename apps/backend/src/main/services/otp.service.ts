// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import OtpModel, { IOtp } from '@main/models/otp.model';

export interface ICreateOtp {
    userId: string;
    code: string;
    type: string;
    data: string;
    expireTime: Date;
}

const createOtp = async (log: ICreateOtp) => {
    return await OtpModel.create(log);
};

const patchUpdate = async (condition: RootFilterQuery<IOtp>, data: UpdateQuery<IOtp>) => {
    return await OtpModel.findOneAndUpdate(condition, data, { new: true });
};

const getOtpById = async (id: string) => {
    return await OtpModel.findOne({ _id: id }).lean();
};

const getOtpByCode = async (code: string) => {
    return await OtpModel.findOne({ code }).lean();
};

const getOtpByData = async (data: string) => {
    return await OtpModel.findOne({ data }).lean();
};

const deleteOtpById = async (id: string) => {
    return await OtpModel.deleteOne({ _id: id });
};

export default {
    createOtp,
    getOtpById,
    getOtpByCode,
    getOtpByData,
    patchUpdate,
    deleteOtpById
};
