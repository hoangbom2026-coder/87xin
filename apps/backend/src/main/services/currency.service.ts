import CurrencyModel from '@main/models/currency.model';
import SettingModel from '@main/models/setting.model';
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';

const getEnableCurrencies = async () => {
    return await CurrencyModel.find({ status: 'active' });
};

const getCurrencies = async () => {
    return await CurrencyModel.find({ status: 'active' });
};

const getCurrencyById = async (id: string) => {
    return await CurrencyModel.findById(id);
};

const getCurrencyByName = async (name: string) => {
    return await CurrencyModel.findOne({ name });
};

const getDefaultCurrency = async () => {
    return await CurrencyModel.findOne({ isDefault: true });
};

/** Get exchange rates from setting */
const getExchangeRates = async () => {
    const setting = await SettingModel.findOne();
    return setting?.rates || {};
};

const nameTaken = async (name: string, excludeId?: string) => {
    const query: any = { name };
    if (excludeId) query._id = { $ne: excludeId };
    return await CurrencyModel.exists(query);
};

const createCurrency = async (data: any) => {
    return await CurrencyModel.create(data);
};

const patchUpdate = async (filter: any, update: any) => {
    return await CurrencyModel.findOneAndUpdate(filter, update, { new: true });
};

const deleteCurrency = async (id: string) => {
    return await CurrencyModel.findByIdAndDelete(id);
};

export default {
    getCurrencies,
    getEnableCurrencies,
    getCurrencyById,
    getCurrencyByName,
    getDefaultCurrency,
    getExchangeRates,
    nameTaken,
    createCurrency,
    patchUpdate,
    deleteCurrency,
};