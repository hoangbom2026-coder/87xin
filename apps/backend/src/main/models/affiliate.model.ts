import bcrypt from 'bcryptjs';
import mongoose, { Document, Model, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';
import { AFFILIATE_ROLE, AFFILIATE_STATUS } from '@config/static';

export interface IAffiliate extends Document {
    username: string;
    firstName: string;
    lastName: string;
    status: string;
    email: string;
    role: string;
    referralCode: string;
    parentId: Schema.Types.ObjectId;
    path: string[];
    password: string;
    createdAt: Date;
    updatedAt: Date;
    isPasswordMatch: (password: string) => Promise<boolean>;
}

interface IAffiliateModel extends Model<IAffiliate> {
    isUsernameTaken: (username: string, affiliateId?: string) => Promise<boolean>;
    isEmailTaken: (email: string, affiliateId?: string) => Promise<boolean>;
}

const ModelSchema = new mongoose.Schema<IAffiliate>(
    {
        username: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            trim: true,
            required: true
        },
        referralCode: {
            type: String,
            trim: true,
            required: true
        },
        role: {
            type: String,
            enum: {
                values: AFFILIATE_ROLE,
                message: '{VALUE} status is not supported.'
            },
            required: true
        },
        status: {
            type: String,
            enum: {
                values: AFFILIATE_STATUS,
                message: '{VALUE} status is not supported.'
            },
            required: true
        },
        parentId: {
            type: Schema.Types.ObjectId
        },
        path: {
            type: [String],
            default: []
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 6,
            private: true
        }
    },
    { timestamps: true }
);
// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ username: 1, email: 1, parentId: 1, path: 1, referralCode: 1 });

ModelSchema.statics.isUsernameTaken = async function (username: string, affiliateId?: string) {
    const affiliate = await this.findOne({ username, _id: { $ne: affiliateId } });
    return !!affiliate;
};

ModelSchema.statics.isEmailTaken = async function (email: string, affiliateId?: string) {
    const affiliate = await this.findOne({ email, _id: { $ne: affiliateId } });
    return !!affiliate;
};

ModelSchema.methods.isPasswordMatch = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

ModelSchema.pre<IAffiliate>('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

const AffiliateModel = mongoose.model<IAffiliate, IAffiliateModel>('affiliates', ModelSchema);

export default AffiliateModel;
