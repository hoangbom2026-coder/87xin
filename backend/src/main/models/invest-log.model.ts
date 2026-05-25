import mongoose, { Schema, Document, Types } from "mongoose";
import { toJSON } from "@utils/model-plugins";

export interface IInvestLog extends Document {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    trxId: string;
    gateway: string;
    amount: number;
    currency: string;
    remuneration: number;
    payoutDate: Date;
    nextPayoutDate: Date;
    status: "pending" | "active" | "completed" | "cancelled";
    /** Số kỳ đã trả lãi (cron cập nhật). */
    payCount: number;
    /** Tối đa kỳ khi returnFor=period; null = không giới hạn (lifetime). */
    maxPayCount: number | null;
    /** Lãi mỗi kỳ (snapshot lúc đăng ký). */
    interestPerPeriod: number;
    /** Khoảng cách giữa các kỳ (ms), snapshot từ plan.times. */
    periodMs: number;
    /** 1 = hoàn gốc sau kỳ cuối (theo plan.capitalBack). */
    capitalBack: 0 | 1;
    createdAt: Date;
    updatedAt: Date;
}

const InvestLogSchema = new mongoose.Schema<IInvestLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
        planId: { type: Schema.Types.ObjectId, ref: "plans" },
        trxId: { type: String, required: true, unique: true },
        gateway: { type: String, default: "Balance" },
        amount: { type: Number, required: true },
        currency: { type: String, default: "VND" },
        remuneration: { type: Number, default: 0 },
        payoutDate: { type: Date },
        nextPayoutDate: { type: Date },
        status: { type: String, enum: ["pending", "active", "completed", "cancelled"], default: "active" },
        payCount: { type: Number, default: 0 },
        maxPayCount: { type: Number, default: null },
        interestPerPeriod: { type: Number, default: 0 },
        periodMs: { type: Number, default: 86400000 },
        capitalBack: { type: Number, enum: [0, 1], default: 0 }
    },
    { timestamps: true }
);

InvestLogSchema.plugin(toJSON);
InvestLogSchema.index({ userId: 1, status: 1, createdAt: -1 });
InvestLogSchema.index({ nextPayoutDate: 1, status: 1 });

const InvestLogModel = mongoose.model<IInvestLog>("invest-logs", InvestLogSchema);
export default InvestLogModel;
