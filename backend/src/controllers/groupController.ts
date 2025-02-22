import mongoose from "mongoose";
import Group from "../models/Group.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { decodeInviteLink } from "../utils/decodeInviteLink.js";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;
    const picture = req.files?.picture;

    const createdBy = req.userId;

    // Validate required fields
    if (!name) {
      res.status(400).json({ success: false, message: "Name is required" });
      return;
    }

    // Handle file upload (if picture is provided)
    let pictureUrl = null;
    if (picture) {
      // Construct the upload path using path.resolve()
      const uploadPath = path.resolve(__dirname, "../uploads", picture.name);
      // Move the file to the upload directory
      await picture.mv(uploadPath);

      // Save the file path or URL
      pictureUrl = "/uploads/" + picture.name;
    }

    // Create the group
    const newGroup = new Group({
      name,
      picture: pictureUrl,
      createdBy,
      members: [createdBy], // Add the creator as the first member
    });

    await newGroup.save();

    // Add the group to the user's groups list
    await User.findByIdAndUpdate(createdBy, {
      $push: { groups: newGroup._id },
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const joinGroup: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { inviteLink } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId); // Ensure this is an ObjectId !!!

    // Decode the invite link to get the group ID
    let groupId;
    try {
      groupId = decodeInviteLink(inviteLink);
    } catch (decodeError) {
      res.status(400).json({ success: false, message: decodeError.message });
      return;
    }

    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).json({ success: false, message: "Group not found" });
      return;
    }

    // Check if the user is already a member
    if (group.members.some((member) => member.equals(userId))) {
      res
        .status(400)
        .json({ success: false, message: "User already in group" });
      return;
    }

    // Add the user to the group
    group.members.push(userId);
    await group.save();

    // Add the group to the user's groups list
    await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

    res.status(200).json({
      success: true,
      message: "Joined group successfully",
      group,
    });
    return;
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
};

export const getGroupDetails: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId)
      .populate("createdBy", "name email")
      .populate("members", "name email")
      .populate("expenses");

    if (!group) {
      res.status(404).json({ success: false, message: "Group not found" });
      return;
    }

    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getExpensesByGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).json({ success: false, message: "Group ID is required" });
      return;
    }

    // Find all expenses for the given groupId
    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("group", "name");

    // if (!expenses.length) {
    //   res
    //     .status(404)
    //     .json({ success: false, message: "No expenses found for this group" });
    //   return;
    // }

    res.status(200).json({ success: true, expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteGroup: RequestHandler = async (req, res): Promise<void> => {
  try {
    const groupId = req.params.id;
    const userId = req.userId;

    // Find the group
    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ success: false, message: "Group not found" });
      return;
    }

    // Check if the user is the creator
    if (group.createdBy.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "Only the creator of the group can delete it",
      });
      return;
    }

    // Delete all expenses related to the group
    await Expense.deleteMany({ group: groupId });

    // Remove the group from all users who are members
    await User.updateMany({ groups: groupId }, { $pull: { groups: groupId } });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res
      .status(200)
      .json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id;
    const userId = req.body.currentUserId;

    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ success: false, message: "Group not found" });
      return;
    }

    // Check if the user is a member of the group
    const isMember = group.members.includes(userId);
    if (!isMember) {
      res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
      return;
    }

    // Prevent the group creator from leaving
    if (group.createdBy.toString() === userId.toString()) {
      res.status(400).json({
        success: false,
        message:
          "Group creator cannot leave the group. You can delete the group instead",
      });
      return;
    }

    // Remove the user from the group's members array
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    // Remove the user from all expenses in the group
    await Expense.updateMany(
      { group: groupId },
      { $pull: { splitDetails: { user: userId } } }
    );

    // Recalculate split amounts for all expenses in the group
    const expenses = await Expense.find({ group: groupId });

    for (const expense of expenses) {
      const totalMembers = expense.splitDetails.length;
      if (totalMembers > 0) {
        const newSplitAmount = expense.amount / totalMembers;
        expense.splitDetails = expense.splitDetails.map((split) => ({
          ...split,
          amount: newSplitAmount,
        }));
        await expense.save();
      }
    }

    // Save the updated group
    await group.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the group",
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
