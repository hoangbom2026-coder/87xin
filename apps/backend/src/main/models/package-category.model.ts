import { Schema, model, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IPackageCategory extends Document {
    name: string;
    slug: string;
    status: 'active' | 'inactive';
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const schema = new Schema<IPackageCategory>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

schema.plugin(toJSON);
schema.plugin(paginate);

export const PackageCategoryModel = model<IPackageCategory>('package_categories', schema);
export default PackageCategoryModel;
