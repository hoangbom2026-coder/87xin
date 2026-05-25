import httpStatus from "http-status";
import { Response } from "express";
import catchAsync from "@utils/catchAsync";
import UserModel from "@main/models/user.model";

export const getReagentTree = catchAsync(async (req: any, res: Response) => {
  const userId = String(req.user._id);
  const { Types } = require("mongoose");
  console.log('Fetching tree for userId:', userId);
  
  const users = await UserModel.aggregate([
    { 
      $match: { 
        $or: [
          { path: userId },
          { path: new Types.ObjectId(userId) }
        ]
      } 
    },
    {
      $lookup: {
        from: 'balances',
        localField: '_id',
        foreignField: 'userId',
        as: 'balances'
      }
    },
    {
      $project: {
        username: 1,
        invitorId: 1,
        reagentEnrolled: 1,
        role: 1,
        createdAt: 1,
        depositCount: 1,
        balance: { $ifNull: [{ $arrayElemAt: ["$balances.amount", 0] }, 0] }
      }
    }
  ]);

  console.log('Found users for tree:', users.length);

  const formatted = users.map(u => ({
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