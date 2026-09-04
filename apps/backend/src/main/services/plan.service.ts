import PlanModel, { IPlan } from '@main/models/plan.model';
import { Types } from 'mongoose';

export const planService = {
  async getAll(filter?: {
    status?: 'active' | 'inactive' | 'all';
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<IPlan[] | { items: IPlan[]; total: number; page: number; limit: number }> {
    if (!filter) {
      return PlanModel.find().sort({ createdAt: 1 });
    }
    const page = Math.max(Number(filter.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filter.limit) || 20, 1), 200);
    const q: Record<string, unknown> = {};
    if (filter.status && filter.status !== 'all') q.status = filter.status;
    if (filter.keyword && filter.keyword.trim()) {
      const re = new RegExp(filter.keyword.trim(), 'i');
      q.$or = [{ name: re }, { description: re }];
    }
    const [items, total] = await Promise.all([
      PlanModel.find(q)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PlanModel.countDocuments(q),
    ]);
    return { items, total, page, limit };
  },

  async getById(id: string): Promise<IPlan | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return PlanModel.findById(id);
  },

  async create(data: Partial<IPlan>) {
    const doc = new PlanModel(data);
    return doc.save();
  },

  async update(id: string, data: Partial<IPlan>) {
    if (!Types.ObjectId.isValid(id)) return null;
    return PlanModel.findByIdAndUpdate(id, data, { new: true });
  },

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return PlanModel.findByIdAndDelete(id);
  },

  async duplicate(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const src = await PlanModel.findById(id);
    if (!src) return null;
    const copy = new PlanModel({
      ...src.toObject(),
      _id: undefined,
      name: `${src.name} (Copy)`,
      status: 'inactive',
    });
    return copy.save();
  },
};
