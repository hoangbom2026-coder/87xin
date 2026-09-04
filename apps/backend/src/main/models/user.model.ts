import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { toJSON } from '@utils/model-plugins';

export interface IUser extends Document {
    _id: Schema.Types.ObjectId;
    username: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    status: string;
    numberId: number;
    currencyId: Schema.Types.ObjectId;
    currency: string;
    invitorId: string;
    inviteCode: string;
    path: string[];
    country: {
        code: string;
        name: string;
    };
    avatar: string;
    isActive: boolean;
    depositCount: number;
    agencyBalance: number;
    unlockAt: Date;
    lockUntil: Date;
    createdAt: Date;
    updatedAt: Date;
    isPasswordMatch(password: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
    isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
    isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
    isPhoneTaken(phone: string, excludeUserId?: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>(
    {
        username: { type: String, required: true, unique: true, lowercase: true, trim: true },
        email: { type: String, lowercase: true, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        password: { type: String, required: true, private: true },
        role: { type: String, default: 'user' },
        status: { type: String, default: 'active' },
        numberId: { type: Number },
        currencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'currencies' },
        currency: { type: String, default: '' },
        invitorId: { type: String, default: '' },
        inviteCode: { type: String, default: '' },
        path: { type: [String], default: [] },
        country: {
            code: { type: String, default: '' },
            name: { type: String, default: '' }
        },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
UserSchema.plugin(toJSON);

UserSchema.index({ username: 1, email: 1, phone: 1, role: 1, status: 1, createdAt: 1 });

/** Hash password before save */
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

UserSchema.methods.isPasswordMatch = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

UserSchema.statics.isUsernameTaken = async function (username: string, excludeUserId?: string): Promise<boolean> {
    const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
    return !!user;
};

UserSchema.statics.isEmailTaken = async function (email: string, excludeUserId?: string): Promise<boolean> {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};

UserSchema.statics.isPhoneTaken = async function (phone: string, excludeUserId?: string): Promise<boolean> {
    const user = await this.findOne({ phone, _id: { $ne: excludeUserId } });
    return !!user;
};

const UserModel = mongoose.model<IUser, IUserModel>('users', UserSchema);

export default UserModel;
