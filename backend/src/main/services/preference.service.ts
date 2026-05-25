// model
import CurrencyModel from '@main/models/currency.model';
import PreferenceModel, { IPreference } from '@main/models/preference.model';

export interface ICreatePreference {
    userId: string;
    language?: string;
    theme?: string;
    hideUsername?: boolean;
    maxBetAlert?: boolean;
    depositEmailNotify?: boolean;
    withdrawEmailNotify?: boolean;
    marketingEmailNotify?: boolean;
}

const createPreference = async (newSession: ICreatePreference) => {
    return await PreferenceModel.create(newSession);
};

const getPreference = async (userId: string, currencyId: string) => {
    const preference = await PreferenceModel.findOne({ userId }).lean();
    const currency = await CurrencyModel.findOne({ _id: currencyId });
    return { ...preference, currency };
};

const updatePerference = async (userId: string, updateData: Partial<IPreference>) => {
    return await PreferenceModel.updateOne({ userId }, updateData, { upsert: true });
};

const deletePreference = async (userId: string) => {
    return await PreferenceModel.findOneAndDelete({ userId });
};

export default {
    createPreference,
    getPreference,
    deletePreference,
    updatePerference
};
