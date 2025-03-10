import { Request, Response } from "express";
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import { updateGroupBalances } from "../utils/balanceUtils.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { description, amount, paidBy, group } = req.body;

    if (!description || !amount || !paidBy || !group) {
      res
        .status(400)
        .json({ success: false, message: "All fields are required" });
      return;
    }

    // Fetch group details to get members
    const groupDoc = await Group.findById(group).populate("members");
    if (!groupDoc || !groupDoc.members || groupDoc.members.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "Group not found or has no members" });
      return;
    }

    // Include the payer in the split calculation
    const totalMembers = groupDoc.members.length;
    const splitAmount = amount / totalMembers;

    // Create splitDetails for all members, including the payer
    const splitDetails = groupDoc.members.map((member: any) => ({
      user: member._id,
      amount: member._id.toString() === paidBy.toString() ? 0 : splitAmount, // Payer owes 0
    }));

    // Create and save the expense
    const newExpense = new Expense({
      description,
      amount,
      paidBy,
      group,
      splitDetails,
      createdBy: paidBy, // Set the creator as the payer
    });

    await newExpense.save();

    // Add the expense to the group's expenses array
    await Group.findByIdAndUpdate(group, {
      $push: { expenses: newExpense._id },
    });

    // Update group balances
    await updateGroupBalances(group);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: newExpense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;

    // Find the expense by ID
    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "name email")
      .populate("group", "name");

    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
    } else {
      res.status(200).json({ success: true, expense });
    }
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ success: false, message: error });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;
    const { description, amount, paidBy, currentUserId } = req.body.updatedData;

    const expense = await Expense.findById(expenseId).populate("group");

    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    // Check if the user making the request is the creator of the expense
    if (expense.createdBy.toString() !== currentUserId) {
      res.status(403).json({
        success: false,
        message: "Only the creator of the expense can update it",
      });
      return;
    }

    // Fetch group details to get members
    const group = await Group.findById(expense.group).populate("members");
    if (!group || !group.members || group.members.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "Group not found or has no members" });
      return;
    }

    // Recalculate splitDetails based on the new payer and amount
    const totalMembers = group.members.length;
    const splitAmount = amount / totalMembers;

    const newSplitDetails = group.members.map((member: any) => ({
      user: member._id,
      amount: member._id.toString() === paidBy.toString() ? 0 : splitAmount, // Payer owes 0
    }));

    // Update the expense with new details
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        description,
        amount,
        paidBy,
        splitDetails: newSplitDetails,
      },
      { new: true } // Return the updated document
    );

    if (!updatedExpense) {
      res.status(404).json({ success: false, message: "Expense not found" });
    } else {
      // Ensure expense.group is a valid ObjectId

      const groupId = expense.group._id;

      // Update group balances
      await updateGroupBalances(groupId);

      res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense,
      });
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;
    const userId = req.body.userId;

    // Find the expense and populate paidBy and createdBy
    const expense = await Expense.findById(expenseId)
      .populate("paidBy")
      .populate("createdBy");

    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    // Allow deletion if the user is the creator or the payer
    const isCreator = expense.createdBy._id.toString() === userId;
    const isPayer = expense.paidBy._id.toString() === userId;

    if (!isCreator && !isPayer) {
      res.status(403).json({
        success: false,
        message: "Only the creator or the payer can delete this expense.",
      });
      return;
    }

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    // Remove the expense from the associated group
    await Group.findByIdAndUpdate(expense.group, {
      $pull: { expenses: expense._id },
    });

    // Update group balances
    await updateGroupBalances(expense.group._id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const joinExpense = async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;
    const { userId } = req.body;

    // Find the expense
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    // Check if the user is already part of the split
    const isUserInSplit = expense.splitDetails.some(
      (split: any) => split.user.toString() === userId
    );

    if (isUserInSplit) {
      res
        .status(400)
        .json({ success: false, message: "User already in split" });
      return;
    }

    // Add the user to the split
    expense.splitDetails.push({
      user: userId,
      amount: 0,
      completedPaymentByOwer: false,
      paymentConfirmedByReceiver: false,
    });

    // Recalculate split amounts
    const totalAmount = expense.amount;
    const totalMembers = expense.splitDetails.length;
    const newSplitAmount = totalAmount / totalMembers;

    // Update each member's amount
    expense.splitDetails = expense.splitDetails.map((split: any) => ({
      ...split,
      amount: newSplitAmount,
    }));

    await expense.save();

    res.status(200).json({
      success: true,
      message: "User joined expense successfully, split amount updated",
      expense,
    });
  } catch (error) {
    console.error("Error joining expense:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getGroupBalances = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id;

    // Fetch the group and populate members
    const group = await Group.findById(groupId).populate("members").lean();
    if (!group) {
      res.status(404).json({ success: false, message: "Group not found" });
      return;
    }

    // Fetch all expenses for the group
    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy splitDetails.user")
      .lean();

    // Initialize balances
    const actualBalances: Record<string, Record<string, number>> = {};
    const netBalances: Record<string, Record<string, number>> = {};

    group.members.forEach((member: any) => {
      actualBalances[member._id] = {};
      netBalances[member._id] = {};
      group.members.forEach((otherMember: any) => {
        if (member._id !== otherMember._id) {
          actualBalances[member._id][otherMember._id] = 0;
          netBalances[member._id][otherMember._id] = 0;
        }
      });
    });

    // Calculate actual balances (who owes whom)
    expenses.forEach((expense: any) => {
      const paidById = expense.paidBy._id;
      expense.splitDetails.forEach((split: any) => {
        const userId = split.user._id;
        if (paidById !== userId && !split.paid && !split.paymentCompleted) {
          actualBalances[userId][paidById] += split.amount;
        }
      });
    });

    // Calculate net balances (smart balance)
    group.members.forEach((member: any) => {
      group.members.forEach((otherMember: any) => {
        if (member._id !== otherMember._id) {
          const amountUserOwes = actualBalances[member._id][otherMember._id];
          const amountUserIsOwed = actualBalances[otherMember._id][member._id];

          if (amountUserOwes > amountUserIsOwed) {
            netBalances[member._id][otherMember._id] =
              amountUserOwes - amountUserIsOwed;
            netBalances[otherMember._id][member._id] = 0;
          } else {
            netBalances[otherMember._id][member._id] =
              amountUserIsOwed - amountUserOwes;
            netBalances[member._id][otherMember._id] = 0;
          }
        }
      });
    });

    // Format the response
    const groupBalances = group.members.map((member: any) => ({
      user: member,
      amount: Object.values(actualBalances[member._id]).reduce(
        (sum, amount) => sum + amount,
        0
      ),
    }));

    const smartBalances = group.members.map((member: any) => ({
      user: member,
      amount: Object.values(netBalances[member._id]).reduce(
        (sum, amount) => sum + amount,
        0
      ),
    }));

    res.status(200).json({
      success: true,
      balances: groupBalances,
      smartBalances: smartBalances,
    });
  } catch (error) {
    console.error("Error fetching balances:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const leaveExpense = async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;
    const userId = req.body.userId;

    // Find the expense and populate paidBy
    const expense = await Expense.findById(expenseId).populate("paidBy");
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    // Prevent the payer from leaving
    if (expense.paidBy._id.toString() === userId) {
      res.status(400).json({
        success: false,
        message:
          "The payer cannot leave the expense. You can delete the expense instead.",
      });
      return;
    }

    // Check if user is part of the expense
    const userSplitIndex = expense.splitDetails.findIndex(
      (split) => split.user.toString() === userId
    );

    if (userSplitIndex === -1) {
      res.status(400).json({ success: false, message: "User not in expense" });
      return;
    }

    // Remove user from split
    expense.splitDetails.splice(userSplitIndex, 1);

    // If no one is left in the split, return error
    if (expense.splitDetails.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "Cannot leave expense - at least one person must be in the split",
      });
      return;
    }

    // Recalculate split amounts
    const totalAmount = expense.amount;
    const totalMembers = expense.splitDetails.length;
    const newSplitAmount = totalAmount / totalMembers;

    // Update split amounts
    expense.splitDetails = expense.splitDetails.map((split) => ({
      user: split.user,
      amount: newSplitAmount,
    }));

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the expense",
      expense,
    });
  } catch (error) {
    console.error("Error leaving expense:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const removeExpenseMember = async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;
    const { userId, removerId } = req.body;

    // Find the expense and populate paidBy and createdBy
    const expense = await Expense.findById(expenseId)
      .populate("paidBy")
      .populate("createdBy");

    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    // Check if remover is the creator or the payer
    const isCreator = expense.createdBy._id.toString() === removerId;
    const isPayer = expense.paidBy._id.toString() === removerId;

    if (!isCreator && !isPayer) {
      res.status(403).json({
        success: false,
        message:
          "Only the creator or the payer can remove members from the expense",
      });
      return;
    }

    // Prevent removing the payer
    if (expense.paidBy._id.toString() === userId) {
      res.status(400).json({
        success: false,
        message: "Cannot remove the payer from the expense",
      });
      return;
    }

    // Check if user is part of the expense
    const userSplitIndex = expense.splitDetails.findIndex(
      (split) => split.user.toString() === userId
    );

    if (userSplitIndex === -1) {
      res.status(400).json({ success: false, message: "User not in expense" });
      return;
    }

    // Remove user from split
    expense.splitDetails.splice(userSplitIndex, 1);

    // If no one is left in the split, return error
    if (expense.splitDetails.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "Cannot remove last member - at least one person must be in the split",
      });
      return;
    }

    // Recalculate split amounts
    const totalAmount = expense.amount;
    const totalMembers = expense.splitDetails.length;
    const newSplitAmount = totalAmount / totalMembers;

    // Update split amounts
    expense.splitDetails = expense.splitDetails.map((split) => ({
      user: split.user,
      amount: newSplitAmount,
    }));

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      expense,
    });
  } catch (error) {
    console.error("Error removing expense member:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- NOTIFICATION STUFF
export const markPaymentAsCompletedByOwer = async (
  req: Request,
  res: Response
) => {
  try {
    const { expenseId, payerId, amount } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    // Find the split detail for the user who is making the payment
    const splitDetail = expense.splitDetails.find(
      (split) => split.user.toString() === payerId
    );

    if (!splitDetail) {
      res
        .status(404)
        .json({ success: false, message: "User not found in expense split" });
      return;
    }

    // Mark as payment completed by the payer
    splitDetail.completedPaymentByOwer = true;

    // Check if a notification already exists
    let notification = await Notification.findOne({
      expenseId: expense._id,
      payerId: payerId,
      recipientId: expense.paidBy,
      status: "pending", // Ensure status is "pending"
    });

    if (!notification) {
      // Create a new notification if it doesn't exist
      notification = new Notification({
        type: "payment_pending",
        expenseId: expense._id,
        groupId: expense.group,
        payerId: payerId,
        recipientId: expense.paidBy,
        amount: amount,
        status: "pending", // Ensure status is "pending"
        timestamp: new Date(),
      });
    } else {
      // Update the existing notification
      notification.status = "pending"; // Ensure status is "pending"
      notification.amount = amount;
    }

    await notification.save();
    await expense.save();

    // Update group balances
    await updateGroupBalances(expense.group._id);

    res.status(200).json({
      success: true,
      message: "Payment marked as completed",
      expense,
      notification,
    });
  } catch (error) {
    console.error("Error marking payment as completed:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const paymentConfirmedByReceiver = async (
  req: Request,
  res: Response
) => {
  try {
    const { notificationId, status } = req.body;

    // Validate status
    if (status !== "completed" && status !== "rejected") {
      res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'completed' or 'rejected'",
      });
      return;
    }

    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      res
        .status(404)
        .json({ success: false, message: "Notification not found" });
      return;
    }

    // Find the associated expense
    const expense = await Expense.findById(notification.expenseId);
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }

    // Find the split detail for the payer
    const splitDetail = expense.splitDetails.find(
      (split) => split.user.toString() === notification.payerId.toString()
    );

    if (!splitDetail) {
      res
        .status(404)
        .json({ success: false, message: "Split detail not found" });
      return;
    }

    if (status === "completed") {
      // Mark as both paymentCompleted and paymentConfirmedByReceiver
      splitDetail.paymentCompleted = true;
      splitDetail.paymentConfirmedByReceiver = true;
      splitDetail.amount = 0; // Set the amount to 0 since the payment is confirmed
    } else if (status === "rejected") {
      // Revert paymentCompleted status
      splitDetail.paymentCompleted = false;
      splitDetail.paymentConfirmedByReceiver = false;
    }

    // Save the expense
    await expense.save();

    // Delete the notification
    await Notification.findByIdAndDelete(notificationId);

    // Update group balances
    await updateGroupBalances(expense.group._id);

    res.status(200).json({
      success: true,
      message: `Payment ${status} and notification deleted`,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPendingPaymentNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.params.userId;

    // Find notifications where the user is the recipient and status is pending
    const notifications = await Notification.find({
      recipientId: userId,
      status: "pending",
      type: "payment_pending",
    })
      .populate("payerId", "name email")
      .populate("expenseId", "description amount")
      .populate("groupId", "name")
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// export const getPaymentStatus = async (req: Request, res: Response) => {
//   try {
//     const { expenseId, payerId } = req.query;

//     // Validate input
//     if (!expenseId || !payerId) {
//       res.status(400).json({
//         success: false,
//         message: "expenseId and payerId are required",
//       });
//       return;
//     }

//     // Cast expenseId and payerId to string
//     const expenseIdStr = expenseId as string;
//     const payerIdStr = payerId as string;

//     // Validate if expenseId and payerId are valid ObjectId
//     if (
//       !mongoose.Types.ObjectId.isValid(expenseIdStr) ||
//       !mongoose.Types.ObjectId.isValid(payerIdStr)
//     ) {
//       res.status(400).json({
//         success: false,
//         message: "Invalid expenseId or payerId",
//       });
//       return;
//     }

//     // Find the notification for the given expense and payer
//     const notification = await Notification.findOne({
//       expenseId: new mongoose.Types.ObjectId(expenseIdStr),
//       payerId: new mongoose.Types.ObjectId(payerIdStr),
//     });

//     console.log({ expenseIdStr, payerIdStr });

//     if (!notification) {
//       res.status(404).json({
//         success: false,
//         message: "Payment status not found",
//       });
//       return;
//     }

//     // Return the payment status
//     res.status(200).json({
//       success: true,
//       status: notification.status, // 'pending', 'completed', or 'rejected'
//     });
//   } catch (error) {
//     console.error("Error fetching payment status:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

export const getPaymentStatus = async (req: Request, res: Response) => {
  const { expenseId, userId } = req.query;
  try {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    const splitDetail = expense.splitDetails.find(
      (split) => split.user.toString() === userId
    );

    if (!splitDetail) {
      res.status(404).json({ message: "User not found in expense" });
      return;
    }

    let status = "initial";
    if (splitDetail.completedPaymentByOwer === true) {
      if (splitDetail.paymentConfirmedByReceiver === true) {
        status = "completed";
      } else if (splitDetail.paymentConfirmedByReceiver === false) {
        status = "rejected";
      } else if (splitDetail.paymentConfirmedByReceiver === null) {
        status = "pending";
      }
    }

    // console.log({ status });
    res.status(200).json({ status });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPaymentStatus = async (req: Request, res: Response) => {
  const { expenseId, userId } = req.body;

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
    }

    const splitDetail = expense.splitDetails.find(
      (split) => split.user.toString() === userId
    );

    if (!splitDetail) {
      res.status(404).json({ message: "User not found in expense" });
      return;
    }

    // Reset the payment status
    splitDetail.completedPaymentByOwer = false;
    splitDetail.paymentConfirmedByReceiver = null;

    // Save the updated expense
    await expense.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error resetting payment status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
