import mongoose, { Schema, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';

export interface ITicket extends Document {
    userId: Schema.Types.ObjectId | string;
    subject: string;
    message: string;
    status: 'open' | 'answered' | 'replied' | 'closed';
    priority: 'low' | 'medium' | 'high';
    replies: Array<{
        adminId?: Schema.Types.ObjectId;
        userId?: Schema.Types.ObjectId;
        message: string;
        createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const TicketSchema = new mongoose.Schema<ITicket>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
        subject: { type: String, required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ['open', 'answered', 'replied', 'closed'], default: 'open' },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        replies: [
            {
                adminId: { type: Schema.Types.ObjectId, ref: 'users' },
                userId: { type: Schema.Types.ObjectId, ref: 'users' },
                message: { type: String, required: true },
                createdAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

TicketSchema.plugin(toJSON);
TicketSchema.plugin(paginate);
TicketSchema.index({ userId: 1, status: 1, createdAt: -1 });
TicketSchema.index({ status: 1, priority: 1, updatedAt: -1 });

const TicketModel = mongoose.model<ITicket>('tickets', TicketSchema);
export default TicketModel;
