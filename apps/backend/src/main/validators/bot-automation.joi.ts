import Joi from 'joi';

const betSchema = Joi.object({
    enabled: Joi.boolean(),
    spawnIntervalSec: Joi.number().integer().min(1).max(86400),
    privateBetChance: Joi.number().min(0).max(100),
    privateProfileChance: Joi.number().min(0).max(100),
    minGamesPerBot: Joi.number().integer().min(1).max(10000),
    maxGamesPerBot: Joi.number().integer().min(1).max(10000),
    minDelayBetweenGamesSec: Joi.number().integer().min(0).max(86400),
    maxDelayBetweenGamesSec: Joi.number().integer().min(0).max(86400)
}).unknown(false);

const chatSchema = Joi.object({
    enabled: Joi.boolean(),
    messageIntervalSec: Joi.number().integer().min(1).max(86400),
    randomDelaySec: Joi.number().integer().min(0).max(86400),
    channels: Joi.string().allow('').max(2000),
    messages: Joi.string().allow('').max(50000)
}).unknown(false);

export default {
    patch: Joi.object({
        bet: betSchema.optional(),
        chat: chatSchema.optional()
    })
        .or('bet', 'chat')
        .messages({
            'object.missing': 'Cần ít nhất một trong bet hoặc chat'
        })
};
