import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface IAgGame extends Document {
    gameName: string;
    gameCode: string;
    gameType: string;
    categoryCode: string;
    status: number;
    order: number;
    ownImg: string;
    recommend: boolean;
    state: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IAgGame>(
    {
        gameName: {
            type: String,
            required: true
        },
        gameCode: {
            type: String,
            required: true
        },
        categoryCode: {
            type: String,
            required: true
        },
        gameType: {
            type: String,
            default: ''
        },
        status: {
            type: Number,
            required: true
        },
        state: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        },
        recommend: {
            type: Boolean,
            default: false
        },
        ownImg: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    gameName: 1,
    gameCode: 1,
    gameType: 1,
    status: 1
});

const AgGameModel = mongoose.model<IAgGame>('ag-games', ModelSchema);

export default AgGameModel;
