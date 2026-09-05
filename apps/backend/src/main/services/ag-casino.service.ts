// models
import AgCategoryModel from '@main/models/ag-category.model';
import AgGameModel, { IAgGame } from '@main/models/ag-game.model';
import axios from 'axios';
import crypto from 'crypto';
import config from '@config/index';
import { AG_CURRENCY_OBJ } from '@config/static';
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';

// types
export interface ICreateGame {
    gameName: string;
    gameCode: string;
    gameType: string;
    status: number;
}

export interface ICreateCategory {
    categoryName: string;
    categoryCode: string;
}

export interface IPlayerBalanceParams {
    playerUniqueId: string;
}

export interface IBetParams {
    playerUniqueId: string;
    currencyCode: string;
    gameCode: string;
    betAmount: number;
}

export interface IWinParams {
    playerUniqueId: string;
    currencyCode: string;
    gameCode: string;
    winAmount: number;
    transactionId: string;
}

// HMAC SHA256 signing for AG Casino API
function hmacSHA256Sign(secretKey: string, data: string): string {
    return crypto.createHmac('sha256', secretKey).update(data, 'utf8').digest('hex');
}

function buildAgCasinoPayload(jsonBody: object): { sign: string; timestamp: string; nonce: string } {
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString();
    const contentProcessingType = 'HmacSHA256';
    const spliceResult = config.agCasino.merchantCode + timestamp + nonce + contentProcessingType;
    const dataToSign = spliceResult + JSON.stringify(jsonBody);
    const sign = hmacSHA256Sign(config.agCasino.secretKey, dataToSign);
    return { sign, timestamp, nonce };
}

/** CRUD - Games */
const createGame = async (data: ICreateGame) => {
    return await AgGameModel.create(data);
};

const createGames = async (data: ICreateGame[]) => {
    return await AgGameModel.insertMany(data);
};

/** CRUD - Categories */
const createCategory = async (data: ICreateCategory) => {
    return await AgCategoryModel.create(data);
};

const createCategories = async (data: ICreateCategory[]) => {
    return await AgCategoryModel.insertMany(data);
};

const getCategories = async () => {
    return await AgCategoryModel.find();
};

const getActiveCategories = async () => {
    return await AgCategoryModel.find({ status: 'active' }, { categoryCode: 1, categoryName: 1 });
};

const getGames = async (currentPage: number, perPage: number, categoryCodes: string[]) => {
    const query: any = { status: 1 };
    if (categoryCodes && categoryCodes.length) {
        query.categoryCode = { $in: categoryCodes };
    }
    const count = await AgGameModel.countDocuments(query);
    const data = await AgGameModel.find(query)
        .sort({ order: 1, gameName: 1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    return { data, count };
};

const getAllGameList = async (currentPage: number, perPage: number) => {
    const count = await AgGameModel.countDocuments();
    const data = await AgGameModel.find()
        .sort({ order: 1, gameName: 1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    return { data, count };
};

const getGameByCode = async (gameCode: string) => {
    return await AgGameModel.findOne({ gameCode });
};

/** External AG Casino API Calls */
const callAgCasinoApi = async (endpoint: string, jsonBody: object) => {
    const { sign, timestamp, nonce } = buildAgCasinoPayload(jsonBody);
    const headers = {
        'Content-Type': 'application/json',
        MERCHANT: config.agCasino.merchantCode,
        TIMESTAMP: timestamp,
        NONCE: nonce,
        SIGN: sign,
        CONTENTTYPE: 'HmacSHA256',
    };
    const response = await axios.post(`${config.agCasino.host}/game/v3/game${endpoint}`, jsonBody, { headers });
    return response.data;
};

/** 1. Get Category List from AG Casino */
export const getCategoryList = async () => {
    const jsonBody = { currencyCode: 'BR_BRL', lang: 'en' };
    const data = await callAgCasinoApi('/getCategory', jsonBody);
    if (!data || data.resultCode !== 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'AG Casino category sync failed');
    }
    return data.list;
};

/** 2. Get Game List from AG Casino */
export const getGameList = async () => {
    const jsonBody = { currencyCode: 'BR_BRL', lang: 'en' };
    const data = await callAgCasinoApi('/getGameList', jsonBody);
    if (!data || data.resultCode !== 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'AG Casino game list sync failed');
    }
    return data.list;
};

/** 3. Sync Categories from AG Casino to DB */
export const syncAgCategories = async () => {
    const categories = await getCategoryList();
    for (const cat of categories) {
        const existing = await AgCategoryModel.findOne({ categoryCode: cat.categoryCode });
        if (!existing) {
            await AgCategoryModel.create({
                categoryCode: cat.categoryCode,
                categoryName: cat.categoryName,
                status: 'active',
            });
        }
    }
    return { synced: categories.length };
};

/** 4. Sync Games from AG Casino to DB */
export const syncAgGames = async () => {
    const games = await getGameList();
    for (const game of games) {
        const existing = await AgGameModel.findOne({ gameCode: game.gameCode });
        if (!existing) {
            await AgGameModel.create({
                gameName: game.gameName,
                gameCode: game.gameCode,
                gameType: game.gameType,
                categoryCode: game.categoryCode,
                status: game.status,
                order: game.order || 0,
            });
        }
    }
    return { synced: games.length };
};

/** 5. Get Player Balance */
export const getPlayerBalance = async (params: IPlayerBalanceParams) => {
    // This will be called from controller which injects balanceService
    // We keep this as a placeholder - actual logic in controller calls balanceService
    return { balance: '0.00' };
};

/** 6. Process Bet */
export const processBet = async (params: IBetParams) => {
    // This will be called from controller which injects balanceService, agLogService, transactionService, playerBonusService
    // We keep this as a placeholder - actual logic in controller calls these services
    return { success: true };
};

/** 7. Process Win */
export const processWin = async (params: IWinParams) => {
    // This will be called from controller which injects balanceService, agLogService, transactionService
    return { success: true };
};

/** 8. Get Games (paginated) */
export const getAgGames = async (currentPage: number, perPage: number, categoryCodes: string[]) => {
    return await getGames(currentPage, perPage, categoryCodes);
};

/** 9. Get Categories */
export const getAgCategories = async () => {
    return await getCategories();
};

// Export all functions
export default {
    createGame,
    createGames,
    createCategory,
    createCategories,
    getCategories,
    getActiveCategories,
    getGames,
    getAllGameList,
    getGameByCode,
    getCategoryList,
    getGameList,
    syncAgCategories,
    syncAgGames,
    getPlayerBalance,
    processBet,
    processWin,
    getAgGames,
    getAgCategories,
};