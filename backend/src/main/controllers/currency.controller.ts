import httpStatus from 'http-status';
import { Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// service
import currencyService from '@main/services/currency.service';
import settingService from '@main/services/setting.service';
import axios from 'axios';
import config from '@config/index';

export const getCurrencies = catchAsync(async (req: AuthRequest, res: Response) => {
    const currencies = await currencyService.getCurrencies();
    return res.send(currencies);
});

export const getEnableCurrencies = catchAsync(async (req: AuthRequest, res: Response) => {
    const currencies = await currencyService.getEnableCurrencies();
    return res.send(currencies);
});

export const getRates = catchAsync(async (req: AuthRequest, res: Response) => {
    const setting = await settingService.getSetting();
    return res.send(setting?.rates || { USD: 1 });
});

export const updateRates = catchAsync(async (req: AuthRequest, res: Response) => {
    const { rates } = req.body as { rates: Record<string, number> };
    const setting = await settingService.getSetting();
    const nextRates = { ...(setting?.rates || {}), ...rates };
    const updated = await settingService.updateSetting({ rates: nextRates });
    return res.send(updated.rates);
});

export const syncRates = catchAsync(async (req: AuthRequest, res: Response) => {
    const response = await axios.get(
        `https://api.exchangeratesapi.io/v1/latest?access_key=${config.exchangeRateKey}&base=USD`
    );
    if (!response.data || !response.data.success) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to fetch rates');
    }
    const updated = await settingService.updateSetting({ rates: response.data.rates });
    return res.send(updated.rates);
});

export const createCurrency = catchAsync(async (req: AuthRequest, res: Response) => {
    const currencyData = req.body;
    if (await currencyService.nameTaken(currencyData.name)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Currency Name already taken.');
    }

    const currency = await currencyService.createCurrency(currencyData);
    return res.status(httpStatus.CREATED).send(currency);
});

export const getCurrency = catchAsync(async (req: AuthRequest, res: Response) => {
    const { currencyId } = (req.params as any);

    const currency = await currencyService.getCurrencyById(currencyId);
    if (currency) {
        return res.send(currency);
    }

    throw new ApiError(httpStatus.NOT_FOUND, 'Currency not found');
});

export const updateCurrency = catchAsync(async (req: AuthRequest, res: Response) => {
    const { currencyId } = (req.params as any);
    const updateData = req.body;

    const currency = await currencyService.getCurrencyById(currencyId);
    if (!currency) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Currency not found');
    }

    if (updateData.name) {
        if (await currencyService.nameTaken(updateData.name, currencyId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Currency Name already taken');
        }
    }
    const updatedCurrnecy = await currencyService.patchUpdate({ _id: currencyId }, updateData);
    return res.send(updatedCurrnecy);
});

export const deleteCurrency = catchAsync(async (req: AuthRequest, res: Response) => {
    const { currencyId } = (req.params as any);

    const currency = await currencyService.getCurrencyById(currencyId);
    if (!currency) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Currency not found');
    }

    const updatedCurrnecy = await currencyService.deleteCurrency(currencyId);
    return res.status(httpStatus.NO_CONTENT).send(updatedCurrnecy);
});
