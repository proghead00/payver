// import { Request, Response, NextFunction } from "express";
// import Group from "../models/Group.js";
// import mongoose from "mongoose";
// import { UnauthorizedError } from "../utils/errors.js";
export {};
// export const validateGroupAccess = async (
//   req: Request<{ groupId: string }>,
//   res: Response,
//   next: NextFunction
// ) => {
//   const groupId = req.params.groupId;
//   const userId = req.userId; // `userId` is a string
//   if (!mongoose.Types.ObjectId.isValid(groupId)) {
//     res.status(400).json({ success: false, message: "Invalid group ID" });
//     return;
//   }
//   const group = await Group.findById(groupId);
//   if (!group) {
//     res.status(404).json({ success: false, message: "Group not found" });
//     return;
//   }
//   // Convert `userId` to an ObjectId
//   const userIdAsObjectId = new mongoose.Types.ObjectId(userId);
//   // Check if the user is a member of the group
//   const isMember = group.members.includes(userIdAsObjectId);
//   if (!isMember) {
//     throw new UnauthorizedError("You do not have access to this group");
//   }
//   next();
// };
