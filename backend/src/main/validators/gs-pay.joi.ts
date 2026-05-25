import Joi from 'joi';

const gsDeposit = Joi.object({
    amount: Joi.number().min(1).required()
});

export default {
    gsDeposit
};
