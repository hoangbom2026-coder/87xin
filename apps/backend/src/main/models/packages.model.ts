import { Schema, model, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IPackage extends Document {
    title: string;
    slug: string;
    description?: string;
    categoryIds: string[];
    primaryCategoryId?: string;
    image?: string;
    goldCoins: number;
    freeCoins: number;
    price: number;
    soldCount: number;
    noindex: boolean;
    benefits: any; // Dynamic benefits like VIP XP, specific items, etc.
    status: 'active' | 'inactive';
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const packageSchema = new Schema<IPackage>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: String, default: '' },
        categoryIds: { type: [String], default: [] },
        primaryCategoryId: { type: String, default: '' },
        image: { type: String, default: '' },
        goldCoins: { type: Number, required: true },
        freeCoins: { type: Number, required: true },
        price: { type: Number, required: true },
        soldCount: { type: Number, default: 0 },
        noindex: { type: Boolean, default: false },
        benefits: { type: Schema.Types.Mixed, default: {} },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

packageSchema.plugin(toJSON);
packageSchema.plugin(paginate);

export const PackageModel = model<IPackage>('packages', packageSchema);
export default PackageModel;
