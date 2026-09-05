import axios from 'axios';
// model
import NowpayDepositLogModel, { INowpayDepositLog } from '@main/models/nowpay-deposit-log.model';
import NowpayCurrencyModel, { INowpayCurrency } from '@main/models/nowpay-currency.model';
import { RootFilterQuery } from 'mongoose';

const createCurrencies = async (data: INowpayCurrency[]) => {
    await NowpayCurrencyModel.deleteMany();
    return await NowpayCurrencyModel.insertMany(data);
};

const createNowpayLog = async (data: INowpayDepositLog) => {
    return await NowpayDepositLogModel.create(data);
};

const getCurrencies = async () => {
    return await NowpayCurrencyModel.find({ status: true }).lean();
};

const getCurrenciesByCode = async (code: string) => {
    return await NowpayCurrencyModel.findOne({ code }).lean();
};

const getCurrenciesByCodes = async (codes: string[]) => {
    return await NowpayCurrencyModel.find({ code: { $in: codes } }).lean();
};

const getCurrencyByCode = async (code: string) => {
    return await NowpayCurrencyModel.findOne({ code: code.toUpperCase() }).lean();
};

const getCurrencyById = async (id: string) => {
    return await NowpayCurrencyModel.findOne({ _id: id }).lean();
};

interface IFilter {
    hasBalance: boolean;
    isAll: boolean;
    status: boolean;
    currentPage: number;
    rowsPerPage: number;
}

const getNowpayCurrency = async (filter: IFilter) => {
    const query: any = {};

    if (!filter.isAll) {
        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.hasBalance) {
            query.usd = { $ne: 0 };
        } else {
            query.usd = 0;
        }
    }
    const skip = (filter.currentPage - 1) * filter.rowsPerPage;
    const total = await NowpayCurrencyModel.countDocuments(query);

    const data = await NowpayCurrencyModel.aggregate([
        {
            $match: query
        },
        {
            $skip: skip
        },
        {
            $limit: filter.rowsPerPage
        }
    ]);
    return { data, total };
};

const updateCurrency = async (currencyId: string, data: { status: boolean }) => {
    return await NowpayCurrencyModel.findOneAndUpdate({ _id: currencyId }, data, { new: true });
};

const updateNowpayCurrency = async (filter: RootFilterQuery<INowpayCurrency>, updateBody: Partial<INowpayCurrency>) => {
    return await NowpayCurrencyModel.findOneAndUpdate(filter, updateBody, { new: true });
};

const getNowpayLog = async (filter: RootFilterQuery<INowpayDepositLog>) => {
    return await NowpayDepositLogModel.findOne(filter);
};

const updateNowpayLog = async (filter: RootFilterQuery<INowpayDepositLog>, log: Partial<INowpayDepositLog>) => {
    return await NowpayDepositLogModel.findOneAndUpdate(filter, log, { new: true });
};

const initRateCodeByCode = async () => {
    const cryptoCurrencies = await NowpayCurrencyModel.find();
    const codeObject: any = {};
    cryptoCurrencies.forEach((c) => {
        codeObject[c.code.toLocaleLowerCase()] = c._id;
    });

    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${Object.keys(codeObject).join(',')}&vs_currencies=usd`
        );
        const responseObject = response.data;
        for (const key in responseObject) {
            if (codeObject[key]) {
                await NowpayCurrencyModel.updateOne(
                    { _id: codeObject[key].toString() },
                    { rate_code: key, usd: responseObject[key].usd, with_code: true }
                );
            }
        }
    } catch (error) {
        console.log((error as any).message);
    }
};

const initRateCodeByName = async () => {
    const cryptoCurrencies = await NowpayCurrencyModel.find({ with_code: false });
    const codeObject: any = {};
    cryptoCurrencies.forEach((c) => {
        codeObject[c.name.toLocaleLowerCase()] = c._id;
    });

    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${Object.keys(codeObject).join(',')}&vs_currencies=usd`
        );
        const responseObject = response.data;
        for (const key in responseObject) {
            await NowpayCurrencyModel.updateOne(
                { _id: codeObject[key].toString() },
                { rate_code: key, usd: responseObject[key].usd, with_name: true }
            );
        }
    } catch (error) {
        console.log((error as any).message);
    }
};

const initRateCodeByNameSlug = async () => {
    const cryptoCurrencies = await NowpayCurrencyModel.find({ with_code: false, with_name: false });
    const codeObject: any = {};
    cryptoCurrencies.forEach((c) => {
        codeObject[c.name.toLocaleLowerCase().replaceAll(' ', '-')] = c._id;
    });

    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${Object.keys(codeObject).join(',')}&vs_currencies=usd`
        );
        const responseObject = response.data;
        for (const key in responseObject) {
            if (codeObject[key]) {
                await NowpayCurrencyModel.updateOne(
                    { _id: codeObject[key] },
                    { rate_code: key, usd: responseObject[key].usd, with_name: true }
                );
            }
        }
    } catch (error) {
        console.log((error as any).message);
    }
};

const initRateCodeByCgId = async () => {
    const cryptoCurrencies = await NowpayCurrencyModel.find({ rate_code: '' });
    const codeObject: any = {};
    cryptoCurrencies.forEach((c) => {
        codeObject[c.cg_id] = c._id;
    });

    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${Object.keys(codeObject).join(',')}&vs_currencies=usd`
        );
        const responseObject = response.data;
        for (const key in responseObject) {
            await NowpayCurrencyModel.updateOne(
                { _id: codeObject[key] },
                { rate_code: key, usd: responseObject[key].usd, with_cgId: true }
            );
        }
    } catch (error) {
        console.log((error as any).message);
    }
};

export default {
    createCurrencies,
    getCurrencies,
    getCurrencyByCode,
    getCurrencyById,
    getNowpayCurrency,
    updateCurrency,
    createNowpayLog,
    getNowpayLog,
    updateNowpayLog,
    updateNowpayCurrency,
    initRateCodeByCode,
    initRateCodeByName,
    initRateCodeByNameSlug,
    initRateCodeByCgId,
    getCurrenciesByCode,
    getCurrenciesByCodes
};
