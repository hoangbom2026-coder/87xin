import NotificationModel from '@main/models/notification.model';

const createNotification = async (data: {
    userId?: string;
    type?: string;
    title?: string;
    message?: string;
    read?: boolean;
}) => {
    return await NotificationModel.create({ read: false, ...data });
};

const getNotificationsByUserId = async (userId: string, limit = 20) => {
    return await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
};

const markAsRead = async (userId: string, notificationId?: string) => {
    const filter: any = { userId };
    if (notificationId) filter._id = notificationId;
    return await NotificationModel.updateMany(filter, { read: true });
};

export default {
    createNotification,
    getNotificationsByUserId,
    markAsRead,
};