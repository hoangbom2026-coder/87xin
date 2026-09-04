// models
import AgCategoryModel from '@main/models/ag-category.model';
import AgGameModel, { IAgGame } from '@main/models/ag-game.model';

export interface ICreateGame {
    gameName: string;
    gameCode: string;
    gameType: string;
    status: number;
}

const createGame = async (data: ICreateGame) => {
    return await AgGameModel.create(data);
};

const createGames = async (data: ICreateGame[]) => {
    return await AgGameModel.insertMany(data);
};

export interface ICreateCategory {
    categoryName: string;
    categoryCode: string;
}

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
    const query: any = {
        status: 1
    };

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

const getRecommendGames = async () => {
    return await AgGameModel.find({ recommend: true }).sort({ order: 1, gameName: 1 });
};

const getGameByCode = async (gameCode: string) => {
    return await AgGameModel.findOne({ gameCode });
};

const gameDetail = async (gameCode: string) => {
    const game = await AgGameModel.aggregate([
        {
            $match: { gameCode, status: 1 }
        },
        {
            $lookup: {
                from: 'ag-categories',
                as: 'category',
                localField: 'categoryCode',
                foreignField: 'categoryCode'
            }
        },
        {
            $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
        },
        {
            $project: {
                gameName: 1,
                gameCode: 1,
                categoryCode: 1,
                gameType: 1,
                provider: '$category.categoryName'
            }
        }
    ]);
    if (game.length) {
        return game[0];
    }
    return false;
};

const searchGames = async (name: string, currentPage: number, perPage: number) => {
    const query: any = {
        gameName: { $regex: name, $options: 'i' },
        status: 1,
        gameType: 'SLOT'
    };

    const count = await AgGameModel.countDocuments(query);
    const data = await AgGameModel.find(query)
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

    return { data, count };
};

const updateGame = async (id: string, updateData: Partial<IAgGame>) => {
    return await AgGameModel.findOneAndUpdate({ _id: id }, updateData, { new: true });
};

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
    gameDetail,
    searchGames,
    updateGame,
    getRecommendGames
};
