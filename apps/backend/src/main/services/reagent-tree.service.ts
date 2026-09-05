import { Types } from "mongoose";
import UserModel from "@main/models/user.model";

export const getReagentTreeUsers = async (userId: string) => {
  return UserModel.aggregate([
    {
      $match: {
        $or: [{ path: userId }, { path: new Types.ObjectId(userId) }]
      }
    },
    {
      $lookup: {
        from: "balances",
        localField: "_id",
        foreignField: "userId",
        as: "balances"
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
};