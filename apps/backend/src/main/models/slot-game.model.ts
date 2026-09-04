import mongoose, { Document, Schema } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface ISlotGame extends Document {
    provider: string;
    id: string;
    gameId: string;
    name: string;
    type: string;
    category: string;
    subcategory: string;
    mobile: boolean;
    new: boolean;
    id_hash: string;
    freerounds_supported: boolean;
    featurebuy_supported: boolean;
    has_jackpot: boolean;
    play_for_fun_supported: boolean;
    image: string;
    image_square: string;
    image_portrait: string;
    image_long: string;
    currency: string;
    status: string;
    order: number;
    ownImg: string;
    last_updated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SlotGameSchema = new mongoose.Schema<ISlotGame>(
    {
        provider: { type: String },
        id: { type: String },
        gameId: { type: String },
        name: { type: String },
        type: { type: String },
        category: { type: String },
        subcategory: { type: String },
        mobile: { type: Boolean, default: true },
        new: { type: Boolean, default: false },
        id_hash: { type: String },
        freerounds_supported: { type: Boolean, default: false },
        featurebuy_supported: { type: Boolean, default: false },
        has_jackpot: { type: Boolean, default: false },
        play_for_fun_supported: { type: Boolean, default: true },
        image: { type: String },
        image_square: { type: String },
        image_portrait: { type: String },
        image_long: { type: String },
        currency: { type: String },
        status: { type: String, default: 'active' },
        order: { type: Number, default: 0 },
        ownImg: { type: String, default: '' },
        last_updated: { type: Date }
    },
    { timestamps: true }
);

SlotGameSchema.plugin(toJSON);
SlotGameSchema.index({
    id: 1,
    name: 1,
    category: 1,
    type: 1,
    currency: 1
});

const SlotGameModel = mongoose.model<ISlotGame>('slot-games', SlotGameSchema);

export default SlotGameModel;
