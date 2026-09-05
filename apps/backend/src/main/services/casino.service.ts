import ProviderModel from '@main/models/provider.model';
import GameModel from '@main/models/game.model';

const createProviders = async (data: any[]) => {
    if (!data.length) return [];
    return await ProviderModel.insertMany(data, { ordered: false }).catch((e) => e);
};

const createGames = async (data: any[]) => {
    if (!data.length) return [];
    return await GameModel.insertMany(data, { ordered: false }).catch((e) => e);
};

const deactivateStaleGames = async (productCode: number, gameType: string, activeGameCodes: string[], envOperatorCode: string) => {
    return await GameModel.updateMany(
        {
            gscOperatorCode: envOperatorCode,
            product_code: productCode,
            game_type: gameType,
            gameCode: { $nin: activeGameCodes }
        },
        { $set: { status: 0 } }
    );
};

const deactivateAllGamesForPair = async (productCode: number, gameType: string, envOperatorCode: string) => {
    return await GameModel.updateMany(
        {
            gscOperatorCode: envOperatorCode,
            product_code: productCode,
            game_type: gameType
        },
        { $set: { status: 0 } }
    );
};

const markRecommendTopGames = async () => {
    // Placeholder: đánh dấu recommended trong DB (logic tùy nghiệp vụ)
    return { ok: true };
};

export default {
    createProviders,
    createGames,
    deactivateStaleGames,
    deactivateAllGamesForPair,
    markRecommendTopGames,
};