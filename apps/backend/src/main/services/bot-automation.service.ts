import BotAutomationModel, {
    IBetBotConfig,
    IBotAutomation,
    IChatBotConfig
} from '@main/models/bot-automation.model';

const DEFAULT_NAME = 'default';

const getOrCreate = async (): Promise<IBotAutomation> => {
    let doc = await BotAutomationModel.findOne({ name: DEFAULT_NAME });
    if (!doc) {
        doc = await BotAutomationModel.create({ name: DEFAULT_NAME });
    }
    return doc;
};

const mergeBet = (current: IBetBotConfig, patch?: Partial<IBetBotConfig>): IBetBotConfig => ({
    ...current,
    ...(patch || {})
});

const mergeChat = (current: IChatBotConfig, patch?: Partial<IChatBotConfig>): IChatBotConfig => ({
    ...current,
    ...(patch || {})
});

function normalizeBet(b: IBetBotConfig): IBetBotConfig {
    let minG = b.minGamesPerBot;
    let maxG = b.maxGamesPerBot;
    if (minG > maxG) {
        const t = minG;
        minG = maxG;
        maxG = t;
    }
    let minD = b.minDelayBetweenGamesSec;
    let maxD = b.maxDelayBetweenGamesSec;
    if (minD > maxD) {
        const t = minD;
        minD = maxD;
        maxD = t;
    }
    return { ...b, minGamesPerBot: minG, maxGamesPerBot: maxG, minDelayBetweenGamesSec: minD, maxDelayBetweenGamesSec: maxD };
}

const updateBotAutomation = async (payload: {
    bet?: Partial<IBetBotConfig>;
    chat?: Partial<IChatBotConfig>;
}): Promise<IBotAutomation | null> => {
    const current = await getOrCreate();
    const bet = normalizeBet(mergeBet(current.bet as unknown as IBetBotConfig, payload.bet));
    const chat = mergeChat(current.chat as unknown as IChatBotConfig, payload.chat);

    return BotAutomationModel.findOneAndUpdate(
        { name: DEFAULT_NAME },
        { $set: { bet, chat } },
        { new: true, upsert: true }
    );
};

export default {
    getOrCreate,
    updateBotAutomation
};
