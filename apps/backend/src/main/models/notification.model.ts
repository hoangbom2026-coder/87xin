import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId?: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  [key: string]: any;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String },
    type: { type: String },
    title: { type: String },
    message: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
export default NotificationModel;
