import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "@utils/catchAsync";
import { getReagentTreeUsers } from "@main/services/reagent-tree.service";

export const getReagentTree = catchAsync(async (req: any, res: Response) => {
  const userId = String(req.user!._id);
  console.log("Fetching tree for userId:", userId);

  const users = await getReagentTreeUsers(userId);

  console.log("Found users for tree:", users.length);

  const formatted = users.map((u: any) => ({
    id: String(u._id),
    username: u.username,
    parentId: u.invitorId ? String(u.invitorId) : null,
    role: u.role,
    enrolled: u.reagentEnrolled,
    balance: u.balance,
    joinedAt: u.createdAt,
    depositCount: u.depositCount || 0
  }));

  res.send({ success: true, data: formatted });
});