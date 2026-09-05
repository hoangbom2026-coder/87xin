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

const deactivateStaleGames = async (envOperatorCode: string, activeGameCodes: string[]) => {
    return await GameModel.updateMany(
        {
            gscOperatorCode: envOperatorCode,
            gameCode: { $nin: activeGameCodes }
        },
        { $set: { status: 0 } }
    );
};

const deactivateAllGamesForPair = async (pair: { product_code: number; game_type: string }, envOperatorCode: string) => {
    return await GameModel.updateMany(
        {
            gscOperatorCode: envOperatorCode,
            product_code: pair.product_code,
            game_type: pair.game_type
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