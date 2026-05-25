import mongoose, { Document, Model, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

export interface ICurrency extends Document {
    name: string;
    icon: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface ICurrencyModel extends Model<ICurrency> {
    isNameTaken: (name: string, excludeCurrencyId?: string) => Promise<boolean>;
}

const ModelSchema = new mongoose.Schema<ICurrency>(
    {
        name: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            ref: 'currencies',
            required: true
        },
        status: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

ModelSchema.statics.isNameTaken = async function (name: string, excludeCurrencyId?: string) {
    const currency = await this.findOne({ name, _id: { $ne: excludeCurrencyId } });
    return !!currency;
};

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ name: 1, icon: 1, status: 1 });

const CurrencyModel = mongoose.model<ICurrency, ICurrencyModel>('currencies', ModelSchema);

export default CurrencyModel;
