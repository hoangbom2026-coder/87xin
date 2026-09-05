// model
import NewsletterSubscriberModel from '@main/models/newsletter-subscriber.model';

const subscribe = async (email: string, source: string, ip: string) => {
    return await NewsletterSubscriberModel.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, source, ip }, $set: { status: 'active' } },
        { upsert: true, new: true }
    );
};

const unsubscribe = async (email: string) => {
    return await NewsletterSubscriberModel.updateOne({ email }, { status: 'unsubscribed' });
};

const adminList = async (keyword: string, status: string, page: number, limit: number) => {
    const cond: Record<string, unknown> = {};
    if (status && ['active', 'unsubscribed'].includes(status)) cond.status = status;
    if (keyword) cond.email = { $regex: new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
    const [items, total, activeCount] = await Promise.all([
        NewsletterSubscriberModel.find(cond)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        NewsletterSubscriberModel.countDocuments(cond),
        NewsletterSubscriberModel.countDocuments({ status: 'active' })
    ]);
    return { items, total, activeCount };
};

const adminDelete = async (id: string) => {
    return await NewsletterSubscriberModel.findByIdAndDelete(id);
};

const adminUpdate = async (id: string, status: string | undefined, tags: string[] | undefined) => {
    const update: Record<string, unknown> = {};
    if (status && ['active', 'unsubscribed'].includes(status)) update.status = status;
    if (Array.isArray(tags)) update.tags = tags.map((t) => String(t).slice(0, 32));
    return await NewsletterSubscriberModel.findByIdAndUpdate(id, update, { new: true });
};

const adminExportCsv = async (status: string) => {
    const cond: Record<string, unknown> = {};
    if (status && ['active', 'unsubscribed'].includes(status)) cond.status = status;
    return await NewsletterSubscriberModel.find(cond).sort({ createdAt: -1 }).lean();
};

export default {
    subscribe,
    unsubscribe,
    adminList,
    adminDelete,
    adminUpdate,
    adminExportCsv
};