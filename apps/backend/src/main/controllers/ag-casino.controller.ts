import axios from 'axios';
import crypto from 'crypto';
import httpStatus from 'http-status';
import { Request, Response } from 'express';
// utils
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
// config
import config from '@config/index';
import { AG_CURRENCY_OBJ } from '@config/static';
// middlewares
import { AuthRequest } from '@middlewares/auth';
// services
import userService from '@main/services/user.service';
import agLogService from '@main/services/ag-log.service';
import balanceService from '@main/services/balance.service';
import agCasinoService from '@main/services/ag-casino.service';
import currencyService from '@main/services/currency.service';
import transactionService from '@main/services/transaction.service';
import playerBonusService from '@main/services/player-bonus.service';

function hmacSHA256Sign(secretKey: string, data: string) {
    return crypto.createHmac('sha256', secretKey).update(data, 'utf8').digest('hex');
}

export const getCategoryList = async () => {
    try {
        console.info('===get AG casino category start===');
        const timestamp = Date.now().toString();
        const nonce = Math.random().toString();
        const contentProcessingType = 'HmacSHA256';

        const jsonBody = {
            currencyCode: 'BR_BRL',
            lang: 'en'
        };

        const spliceResult = config.agCasino.merchantCode + timestamp + nonce + contentProcessingType;
        const dataToSign = spliceResult + JSON.stringify(jsonBody);

        const sign = hmacSHA256Sign(config.agCasino.secretKey, dataToSign);

        const response = await axios.post(`${config.agCasino.host}/game/v3/game/getCategory`, jsonBody, {
            headers: {
                'Content-Type': 'application/json',
                'X-MERCHANT-CODE': config.agCasino.merchantCode,
                'X-TIMESTAMP': timestamp,
                'X-NONCE': nonce,
                'X-SIGN': sign,
                'X-CONTENT-PROCESSING-TYPE': contentProcessingType
            }
        });

        if (response.data.code === 'C10000') {
            const data = response.data.data;
            await agCasinoService.createCategories(data.categoryDataList);
            console.info('===get AG casino category end===');
        } else {
            console.info('===get AG casino category error===');
            console.log(response.data);
        }
    } catch (error) {
        console.info('===get AG casino category error===');
        console.log(error);
    }
};

export const getGameList = async () => {
    try {
        console.info('===get AG casino game start===');

        const categories = await agCasinoService.getCategories();
        for (let i = 0; i < categories.length; i += 1) {
            const timestamp = Date.now().toString();
            const nonce = Math.random().toString();
            const contentProcessingType = 'HmacSHA256';

            const jsonBody = {
                currencyCode: 'BR_BRL',
                lang: 'en',
                categoryCode: categories[i].categoryCode
            };

            const spliceResult = config.agCasino.merchantCode + timestamp + nonce + contentProcessingType;
            const dataToSign = spliceResult + JSON.stringify(jsonBody);

            const sign = hmacSHA256Sign(config.agCasino.secretKey, dataToSign);

            const response = await axios.post(`${config.agCasino.host}/game/v3/game/getGameList`, jsonBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-MERCHANT-CODE': config.agCasino.merchantCode,
                    'X-TIMESTAMP': timestamp,
                    'X-NONCE': nonce,
                    'X-SIGN': sign,
                    'X-CONTENT-PROCESSING-TYPE': contentProcessingType
                }
            });
            if (response.data.code === 'C10000') {
                const data = response.data.data;
                const gameList = data.gameItemList.map((game) => ({
                    ...game,
                    categoryCode: categories[i].categoryCode
                }));
                await agCasinoService.createGames(gameList);
                console.info('===get AG casino game end===');
            } else {
                console.info('===get AG casino game error===');
                console.log(response.data);
            }
        }
    } catch (error) {
        console.info('===get AG casino game error===');
        console.log(error);
    }
};

export const agLaunchGame = catchAsync(async (req: AuthRequest, res: Response) => {
    try {
        const reqData = req.body;
        const currency = await currencyService.getCurrencyById(req.user.currencyId);
        if (!AG_CURRENCY_OBJ[currency.name]) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Your currency dose not supported');
        }
        const timestamp = Date.now().toString();
        const nonce = Math.random().toString();
        const contentProcessingType = 'HmacSHA256';

        const userAgent = req.headers['user-agent'];
        const isMobile = /mobile/i.test(userAgent);
        const balance = await balanceService.getBalanceByUserId(req.user._id);

        const data = {
            gameCode: reqData.gameCode,
            playerSession: req.user._id,
            playerUniqueId: req.user._id,
            currencyCode: AG_CURRENCY_OBJ[currency.name],
            language: 'en',
            balance: balance.amount,
            subMerchantCode: '',
            terminalType: isMobile ? 'PHONE' : 'PC',
            returnUrl: `${config.frontendUrl}/live-casino`
        };

        const spliceResult = config.agCasino.merchantCode + timestamp + nonce + contentProcessingType;
        const dataToSign = spliceResult + JSON.stringify(data);

        const sign = hmacSHA256Sign(config.agCasino.secretKey, dataToSign);

        const response = await axios.post(`${config.agCasino.host}/game/v3/game/launchUrl`, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-MERCHANT-CODE': config.agCasino.merchantCode,
                'X-TIMESTAMP': timestamp,
                'X-NONCE': nonce,
                'X-SIGN': sign,
                'X-CONTENT-PROCESSING-TYPE': contentProcessingType
            }
        });

        if (response.data.code === 'C10000') {
            return res.send({ status: true, url: response.data.data.url });
        }
        if (response.data.code === 'C10010') {
            return res.send({ status: false, message: 'This game does not support your currency' });
        }
        return res.send({ status: false, message: response.data.msg });
    } catch (error) {
        console.log((error as any).response.data);
        throw new ApiError(httpStatus.NOT_FOUND, (error as any).message);
    }
});

// ---callback---
export const verifySession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { playerSession, currencyCode } = req.body;
        const user = await userService.getUserById(playerSession);
        const currencyData = await currencyService.getCurrencyByName(currencyCode.split('_')[1]);
        if (!currencyData) {
            res.send({
                code: 'C10000',
                msg: 'Success',
                data: {
                    balance: '0.00',
                    nickName: user.username,
                    avatarUrl: `${config.frontendUrl}/${user.avatar || 'images/avatar-default.png'}`
                }
            });
            return;
        }

        const balance = await balanceService.getBalanceByUserId(String(user._id));

        if (balance) {
            res.send({
                code: 'C10000',
                msg: 'Success',
                data: {
                    balance: balance.amount.toFixed(2),
                    nickName: user.username,
                    avatarUrl: `${config.frontendUrl}/${user.avatar || 'images/avatar-default.png'}`
                }
            });
        } else {
            res.send({
                code: 'C10000',
                msg: 'Success',
                data: {
                    balance: '0.00',
                    nickName: user.username,
                    avatarUrl: `${config.frontendUrl}/${user.avatar || 'images/avatar-default.png'}`
                }
            });
        }
        return;
    } catch (error) {
        console.log('---AG verifySession error---');
        console.log(error);
        res.send({
            code: 'C10001',
            msg: 'Failed'
        });
    }
};

export const getBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { playerSession, currencyCode } = req.body;

        const currencyData = await currencyService.getCurrencyByName(currencyCode.split('_')[1]);
        if (!currencyData) {
            res.send({
                code: 'C10000',
                msg: 'Success',
                data: {
                    balance: '0.00'
                }
            });
            return;
        }

        const balance = await balanceService.getBalanceByUserId(playerSession);

        if (balance) {
            res.send({
                code: 'C10000',
                msg: 'Success',
                data: {
                    balance: balance.amount.toFixed(2)
                }
            });
        } else {
            res.send({
                code: 'C10000',
                msg: 'Success',
                data: {
                    balance: '0.00'
                }
            });
        }
        return;
    } catch (error) {
        console.log('---AG get balance error---');
        console.log(error);
        res.send({
            code: 'C10001',
            msg: 'Failed'
        });
    }
};

export const bet = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        console.log(data, '---bet---');
        const currencyData = await currencyService.getCurrencyByName(data.currencyCode.split('_')[1]);
        const game = await agCasinoService.getGameByCode(data.gameCode);

        const amount = Number(data.betAmount) * -1;

        const updatedBalance = await balanceService.debitBalance(data.playerUniqueId, amount);

        if (updatedBalance) {
            const beforeAmount = updatedBalance.amount + Number(data.betAmount);

            const tnx = await agLogService.createTransaction(data);

            const tranactionLog = await transactionService.createTransaction({
                userId: data.playerUniqueId,
                relatedId: String(tnx._id),
                tnxId: new Date().valueOf().toString(),
                amount: Number(amount.toFixed(2)),
                beforeAmount: Number(beforeAmount.toFixed(2)),
                afterAmount: Number(updatedBalance.amount.toFixed(2)),
                currencyName: currencyData.name.toUpperCase(),
                type: 'bet',
                typeDescription: 'Bet',
                gameName: game.gameName,
                gameId: data.gameCode,
                category: 'casino',
                provider: 'ag-casino'
            });

            playerBonusService.updateProcess(
                data.playerUniqueId,
                Number(data.betAmount),
                'slot',
                String(tranactionLog._id)
            );

            res.send({
                code: 'C10000',
                msg: 'Success',
                data: {
                    balance: updatedBalance.amount.toFixed(2),
                    merchantOrderNo: tnx._id
                }
            });
            return;
        }

        res.send({
            code: 'C10001',
            msg: 'Failed'
        });
        return;
    } catch (error) {
        console.log('---AG bet error---');
        console.log(error);
        res.send({
            code: 'C10001',
            msg: 'Failed'
        });
    }
};

export const win = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        console.log(data, '---win---');
        const currencyData = await currencyService.getCurrencyByName(data.currencyCode.split('_')[1]);
        const game = await agCasinoService.getGameByCode(data.gameCode);

        const updateAmount = Number(data.winAmount) - Number(data.betAmount);
        const updatedBalance = await balanceService.debitCreditBalance(
            data.playerUniqueId,
            Number(data.betAmount),
            updateAmount
        );

        const tnx = await agLogService.createTransaction(data);

        const beforeAmount =
            updateAmount > 0 ? updatedBalance.amount - updateAmount : updatedBalance.amount + updateAmount;

        await transactionService.createTransaction({
            userId: data.playerUniqueId,
            relatedId: String(tnx._id),
            tnxId: new Date().valueOf().toString(),
            amount: Number(updateAmount.toFixed(2)),
            beforeAmount: Number(beforeAmount.toFixed(2)),
            afterAmount: Number(updatedBalance.amount.toFixed(2)),
            currencyName: currencyData.name.toUpperCase(),
            type: updateAmount > 0 ? 'win' : 'bet',
            typeDescription: updateAmount > 0 ? 'Win' : 'Bet',
            gameName: game.gameName,
            gameId: data.gameCode,
            category: 'casino',
            provider: 'ag-casino'
        });
        res.send({
            code: 'C10000',
            msg: 'Success',
            data: {
                balance: updatedBalance.amount.toFixed(2),
                merchantOrderNo: tnx._id
            }
        });
        return;
    } catch (error) {
        console.log('---AG win error---');
        console.log(error);
        res.send({
            code: 'C10001',
            msg: 'Failed'
        });
    }
};

export const cancel = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        console.log(data, '---cancel---');
        const amount = data.cancelType === 'BET' ? Number(data.orderAmount) : Number(data.orderAmount) * -1;
        const updatedBalance = await balanceService.depositBalance(data.playerUniqueId, amount);

        const tnx = await agLogService.updateTransaction(data.merchantOrderNo, { status: 'cancel' });
        res.send({
            code: 'C10000',
            msg: 'Success',
            data: {
                balance: updatedBalance.amount.toFixed(2),
                merchantOrderNo: tnx._id
            }
        });
        return;
    } catch (error) {
        console.log('---AG cancel error---');
        console.log(error);
        res.send({
            code: 'C10001',
            msg: 'Failed'
        });
    }
};

export const getActiveCategories = catchAsync(async (req: AuthRequest, res: Response) => {
    const categories = await agCasinoService.getActiveCategories();
    return res.send(categories);
});

export const getAgGames = catchAsync(async (req: AuthRequest, res: Response) => {
    const { categoryCodes, currentPage, perPage } = req.body;
    const games = await agCasinoService.getGames(currentPage, perPage, categoryCodes);
    return res.send(games);
});

export const getAgGameDetail = catchAsync(async (req: AuthRequest, res: Response) => {
    const game = await agCasinoService.gameDetail((req.params as any).gameCode);
    if (!game) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Game not found');
    }
    return res.send(game);
});
