import Joi from 'joi';

const collect = Joi.object({
    rewardId: Joi.string().required()
});

export default {
    collect
};
