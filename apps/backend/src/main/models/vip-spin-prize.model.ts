import mongoose, { Document, Schema } from 'mongoose';

import { toJSON } from '@utils/model-plugins';

/** Một ô (cánh) trên vòng quay — có thể gắn điều kiện để được đưa vào pool random. */
export interface IVipSpinPrizeSlot {
    id: string;
    amount: number;
    /** Trọng số (không nhất thiết tổng = 1 — server chuẩn hoá theo tập ô đủ điều kiện). */
    probability: number;
    /** Nhãn hiển thị trên wheel (không bắt buộc). */
    label?: string;
    /** Tối thiểu turnover (wallet) của user để ô này tham gia pool. */
    minTurnover?: number;
    /** Tối thiểu VIP XP (user.vipXp, nếu có). */
    minVipXp?: number;
    /** Tối thiểu số lần nạp (user.depositCount). */
    minDepositCount?: number;
}

export interface IVipSpinPrize extends Document {
    prizes: IVipSpinPrizeSlot[];
    tiersId: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PrizeSlotSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        amount: { type: Number, required: true },
        probability: { type: Number, required: true },
        label: { type: String, default: '' },
        minTurnover: { type: Number },
        minVipXp: { type: Number },
        minDepositCount: { type: Number }
    },
    { _id: false, strict: true }
);

const ModelSchema = new mongoose.Schema<IVipSpinPrize>(
    {
        prizes: {
            type: [PrizeSlotSchema],
            required: true,
            validate: {
                validator: function (value: any[]) {
                    return value.length >= 16 && value.length <= 16;
                },
                message: 'prizes array must contain 16 items'
            }
        },
        tiersId: {
            type: Schema.Types.ObjectId,
            required: true
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ModelSchema.plugin(toJSON);
ModelSchema.index({ tiersId: 1, createdAt: 1, updatedAt: 1 });

const VipSpinPrizeModel = mongoose.model<IVipSpinPrize>('vip-spin-prize', ModelSchema);

export default VipSpinPrizeModel;
