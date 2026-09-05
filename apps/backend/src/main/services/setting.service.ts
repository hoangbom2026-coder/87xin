import SettingModel from '@main/models/setting.model';
import mongoose from 'mongoose';

const getSetting = async () => {
    return await SettingModel.findOne();
};

const getSettingByName = async (name = 'setting') => {
    return await SettingModel.findOne({ name }).lean();
};

const upsertSettingByName = async (name: string, update: Record<string, unknown>) => {
    return await SettingModel.findOneAndUpdate(
        { name },
        { $set: update },
        { new: true, upsert: true }
    );
};

const updateSetting = async (data: Record<string, unknown>) => {
    let setting = await SettingModel.findOne();
    if (!setting) {
        setting = await SettingModel.create(data);
    } else {
        Object.assign(setting, data);
        await setting.save();
    }
    return setting;
};

/** Upsert theo key (nếu có nhiều setting records) */
const upsertSetting = async (key: string, value: unknown) => {
    return await SettingModel.findOneAndUpdate(
        { key },
        { $set: { value } },
        { new: true, upsert: true }
    );
};

/** Merge affiliate program config với defaults */
export const mergeAffiliateProgram = (program: any): any => {
    const defaults = {
        marketingMaterials: [],
        commissionRates: { level1: 0.1, level2: 0.05, level3: 0.02 },
        minWithdrawal: 50,
        enabled: true
    };
    if (!program) return defaults;
    return { ...defaults, ...program };
};

export default {
    getSetting,
    getSettingByName,
    upsertSettingByName,
    updateSetting,
    upsertSetting,
    mergeAffiliateProgram,
};