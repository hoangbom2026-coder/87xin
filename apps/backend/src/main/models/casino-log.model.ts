import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface ICasinoLog extends Document {
    member_account: Schema.Types.ObjectId;
    product_code: number;
    game_type: string;
    id: string;
    action: string;
    wager_code: string;
    wager_status: string;
    wager_type: string;
    round_id: string;
    channel_code: string;
    amount: number;
    bet_amount: number;
    valid_bet_amount: number;
    prize_amount: number;
    tip_amount: number;
    settled_at: number;
    created_at: number;
    game_code: string;
    currency: string;
    payload: object;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<ICasinoLog>(
    {
        member_account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        product_code: {
            type: Number,
            ref: 'providers',
            required: true
        },
        game_type: {
            type: String,
            required: true
        },
        id: {
            type: String,
            default: ''
        },
        action: {
            type: String,
            default: ''
        },
        wager_code: {
            type: String,
            default: ''
        },
        wager_status: {
            type: String,
            default: ''
        },
        wager_type: {
            type: String,
            default: ''
        },
        round_id: {
            type: String,
            default: ''
        },
        channel_code: {
            type: String,
            default: ''
        },
        game_code: {
            type: String,
            default: ''
        },
        amount: {
            type: Number,
            default: 0
        },
        settled_at: {
            type: Number,
            default: 0
        },
        created_at: {
            type: Number,
            default: 0
        },
        bet_amount: {
            type: Number,
            default: 0
        },
        valid_bet_amount: {
            type: Number,
            default: 0
        },
        prize_amount: {
            type: Number,
            default: 0
        },
        tip_amount: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: ''
        },
        payload: {
            type: Object,
            default: {}
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    member_account: 1,
    product_code: 1,
    game_type: 1,
    id: 1,
    action: 1,
    wager_code: 1,
    wager_status: 1,
    round_id: 1,
    game_code: 1,
    amount: 1,
    bet_amount: 1
});

const CasinoLogModel = mongoose.model<ICasinoLog>('casino-logs', ModelSchema);

export default CasinoLogModel;
