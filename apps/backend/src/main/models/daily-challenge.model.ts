import mongoose, { Document, Schema } from 'mongoose';
import { toJSON } from '@utils/model-plugins';

export interface IDailyChallengeRanking {
    name: string;
    multiplier: string;
    reward: string;
    points: string;
    placeImg: string;
}

export interface IDailyChallenge extends Document {
    title: string;
    image: string;
    prize: string;
    endTime: Date;
    rankings: IDailyChallengeRanking[];
    status: 'active' | 'inactive';
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const RankingSchema = new Schema<IDailyChallengeRanking>(
    {
        name: { type: String, required: true },
        multiplier: { type: String, required: true },
        reward: { type: String, required: true },
        points: { type: String, required: true },
        placeImg: { type: String, required: true }
    },
    { _id: false }
);

const ModelSchema = new mongoose.Schema<IDailyChallenge>(
    {
        title: { type: String, required: true },
        image: { type: String, required: true },
        prize: { type: String, required: true },
        endTime: { type: Date, required: true },
        rankings: { type: [RankingSchema], default: [] },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

ModelSchema.plugin(toJSON);

export default mongoose.model<IDailyChallenge>('DailyChallenge', ModelSchema);