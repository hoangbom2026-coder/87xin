import mongoose, { Schema, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface IPlan extends Document {
    name: string;
    description: string;
    /** 0 = range, 1 = fixed */
    amountType: 0 | 1;
    minimum: number;
    maximum: number;
    amount: number;
    interest: number;
    interestStatus: 'percentage' | 'fixed';
    /** 1=6month,2=3month,3=month,4=week,5=day,6=hours,7=year */
    times: number;
    /** 0=lifetime,1=period */
    returnFor: 0 | 1;
    repeatTime: number;
    capitalBack: 0 | 1;
    userInvestLimit: number;
    status: 'active' | 'inactive';
    features: string[];
    referral?: {
        levels: string[];
        commissions: number[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const PlanSchema = new mongoose.Schema<IPlan>(
    {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        amountType: { type: Number, enum: [0, 1], default: 0 },
        minimum: { type: Number, default: 0 },
        maximum: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        interest: { type: Number, default: 0 },
        interestStatus: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        times: { type: Number, default: 5 },
        returnFor: { type: Number, enum: [0, 1], default: 1 },
        repeatTime: { type: Number, default: 1 },
        capitalBack: { type: Number, enum: [0, 1], default: 0 },
        userInvestLimit: { type: Number, default: 1 },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        features: [{ type: String }],
        referral: {
            levels: [{ type: String }],
            commissions: [{ type: Number }]
        }
    },
    { timestamps: true }
);

PlanSchema.plugin(toJSON);
PlanSchema.plugin(paginate);

const PlanModel = mongoose.model<IPlan>('plans', PlanSchema);
export default PlanModel;
