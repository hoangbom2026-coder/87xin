import InvestLogModel, { IInvestLog } from "@main/models/invest-log.model";
import { Types } from "mongoose";

export const investLogService = {
  async queryLogs(filter: any, options: any) {
    const { page = 1, limit = 10, sort } = options;
    const skip = (page - 1) * limit;

    const query = InvestLogModel.find(filter).sort(sort || { createdAt: -1 }); // Default sort if not provided

    if (limit) {
        query.limit(limit);
    }
    if (skip) {
        query.skip(skip);
    }

    const docs = await query.exec();
    const totalDocs = await InvestLogModel.countDocuments(filter).exec();
    const totalPages = Math.ceil(totalDocs / limit);

    return {
        docs,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        limit,
        totalDocs,
    };
  },

  async getLogsByUserId(userId: string, filter: any = {}) {
    const q = { userId: new Types.ObjectId(userId), ...filter };
    return InvestLogModel.find(q).sort({ createdAt: -1 });
  },

  async createLog(data: Partial<IInvestLog>) {
    const doc = new InvestLogModel(data);
    return doc.save();
  }
};