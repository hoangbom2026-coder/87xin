import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';
import { THEME_OPTION } from '@config/static';

export interface IPreference extends Document {
    userId: Schema.Types.ObjectId | string;
    language: Schema.Types.ObjectId;
    theme: string;
    hideUsername: boolean;
    maxBetAlert: boolean;
    depositEmailNotify: boolean;
    withdrawEmailNotify: boolean;
    marketingEmailNotify: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ModelSchema = new mongoose.Schema<IPreference>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        language: {
            type: String,
            default: 'vi'
        },
        theme: {
            type: String,
            enum: {
                values: THEME_OPTION,
                message: '{VALUE} status is not supported.'
            },
            default: 'dark'
        },
        hideUsername: {
            type: Boolean,
            default: true
        },
        maxBetAlert: {
            type: Boolean,
            default: true
        },
        depositEmailNotify: {
            type: Boolean,
            default: true
        },
        withdrawEmailNotify: {
            type: Boolean,
            default: true
        },
        marketingEmailNotify: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({
    userId: 1
});

const PreferenceModel = mongoose.model<IPreference>('preferences', ModelSchema);

export default PreferenceModel;
