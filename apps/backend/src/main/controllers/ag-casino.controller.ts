import httpStatus from 'http-status';
import { Request, Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import agCasinoService from '@main/services/ag-casino.service';
import balanceService from '@main/services/balance.service';
import agLogService from '@main/services/ag-log.service';
import transactionService from '@main/services/transaction.service';
import currencyService from '@main/services/currency.service';
import playerBonusService from '@main/services/player-bonus.service';

/** GET /ag-casino/categories — lấy danh mục từ AG Casino */
export const getCategoryList = catchAsync(async (_req: Request, res: Response) => {
    const categories = await agCasinoService.getCategoryList();
    return res.send(categories);
});

/** GET /ag-casino/games — lấy danh sách game từ AG Casino */
export const getGameList = catchAsync(async (_req: Request, res: Response) => {
    const games = await agCasinoService.getGameList();
    return res.send(games);
});

/** POST /ag-casino/sync-categories — đồng bộ category từ AG Casino */
export const syncAgCategories = catchAsync(async (_req: Request, res: Response) => {
    const result = await agCasinoService.syncAgCategories();
    return res.send(result);
});

/** POST /ag-casino/sync-games — đồng bộ game từ AG Casino */
export const syncAgGames = catchAsync(async (_req: Request, res: Response) => {
    const result = await agCasinoService.syncAgGames();
    return res.send(result);
});

/** GET /ag-casino/balance/:playerUniqueId — lấy số dư player */
export const getBalance = catchAsync(async (req: Request, res: Response) => {
    const { playerUniqueId } = req.params;
    const playerSession = String(playerUniqueId);

    const balance = await balanceService.getBalanceByUserId(playerSession);
    return res.send({
        code: 'C10000',
        msg: 'Success',
        data: {
            balance: balance ? balance.amount.toFixed(2) : '0.00'
        }
    });
});

/** POST /ag-casino/bet — xử lý cược */
export const bet = catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    const currencyData = await currencyService.getCurrencyByName(data.currencyCode.split('_')[1]);
    const game = await agCasinoService.getGameByCode(data.gameCode);

    const amount = Number(data.betAmount) * -1;
    const updatedBalance = await balanceService.debitBalance(data.playerUniqueId, amount);

    if (!updatedBalance) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to debit balance');
    }

    const beforeAmount = updatedBalance.amount + Number(data.betAmount);

    const tnx = await agLogService.createTransaction(data);

    await transactionService.createTransaction({
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
        String(tnx._id)
    );

    return res.send({
        code: 'C10000',
        msg: 'Success',
        data: {
            balance: updatedBalance.amount.toFixed(2),
            merchantOrderNo: tnx._id
        }
    });
});

/** POST /ag-casino/win — xử lý thắng */
export const win = catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    const currencyData = await currencyService.getCurrencyByName(data.currencyCode.split('_')[1]);
    const game = await agCasinoService.getGameByCode(data.gameCode);

    const amount = Number(data.winAmount);
    const updatedBalance = await balanceService.creditBalance(data.playerUniqueId, amount);

    if (!updatedBalance) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to credit balance');
    }

    const beforeAmount = updatedBalance.amount - Number(data.winAmount);

    const tnx = await agLogService.createTransaction(data);

    await transactionService.createTransaction({
        userId: data.playerUniqueId,
        relatedId: String(tnx._id),
        tnxId: new Date().valueOf().toString(),
        amount: Number(amount.toFixed(2)),
        beforeAmount: Number(beforeAmount.toFixed(2)),
        afterAmount: Number(updatedBalance.amount.toFixed(2)),
        currencyName: currencyData.name.toUpperCase(),
        type: 'win',
        typeDescription: 'Win',
        gameName: game.gameName,
        gameId: data.gameCode,
        category: 'casino',
        provider: 'ag-casino'
    });

    return res.send({
        code: 'C10000',
        msg: 'Success',
        data: {
            balance: updatedBalance.amount.toFixed(2),
            merchantOrderNo: tnx._id
        }
    });
});

/** POST /ag-casino/games — lấy game có phân trang */
export const getAgGames = catchAsync(async (req: AuthRequest, res: Response) => {
    const { categoryCodes, currentPage, perPage } = req.body;
    const result = await agCasinoService.getAgGames(currentPage, perPage, categoryCodes);
    return res.send(result);
});

/** GET /ag-casino/categories — lấy category */
export const getAgCategories = catchAsync(async (_req: AuthRequest, res: Response) => {
    const categories = await agCasinoService.getAgCategories();
    return res.send(categories);
});

/** POST /ag-casino/verifySession — xác thực phiên chơi */
export const verifySession = catchAsync(async (req: Request, res: Response) => {
    const { playerUniqueId } = req.body;
    if (!playerUniqueId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'playerUniqueId required');
    }
    const balance = await balanceService.getBalanceByUserId(playerUniqueId);
    return res.send({
        code: 'C10000',
        msg: 'Success',
        data: { balance: balance ? balance.amount.toFixed(2) : '0.00' }
    });
});