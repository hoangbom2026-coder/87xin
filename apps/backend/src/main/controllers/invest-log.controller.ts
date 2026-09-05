import { Response } from "express";
import { Types } from "mongoose";
import catchAsync from "@utils/catchAsync";
import { investLogService } from "@main/services/invest-log.service";
import pick from "@utils/pick";

export const getMyInvestLogs = catchAsync(async (req: any, res: Response) => {
  const filter = pick(req.query, ["trxId", "status"]);
  if (req.query.date) {
    const date = new Date(req.query.date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    filter.createdAt = { $gte: date, $lt: nextDay };
  }
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const userId = req.user!._id;
  const logs = await investLogService.getLogsByUserId(String(userId), filter);
  res.send({ success: true, data: logs });
});

export const getAllInvestLogs = catchAsync(async (req: any, res: Response) => {
  const filter: Record<string, unknown> = pick(req.query, ["trxId", "status"]);
  const rawUserId = req.query.userId as string | undefined;
  if (rawUserId && Types.ObjectId.isValid(rawUserId)) {
    filter.userId = new Types.ObjectId(rawUserId);
  }
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const result = await investLogService.queryLogs(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
  });
  const docs = (result as { docs?: unknown[] }).docs || [];
  const results = docs.map((d: any) => {
    const o = typeof d?.toJSON === "function" ? d.toJSON() : { ...d };
    return { ...o, id: o.id ?? String(o._id) };
  });
  res.send({
    success: true,
    data: {
      results,
      totalResults: (result as { totalDocs?: number }).totalDocs ?? 0,
      page: (result as { currentPage?: number }).currentPage ?? page,
      limit: (result as { limit?: number }).limit ?? limit,
    },
  });
});