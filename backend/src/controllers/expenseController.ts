import { Request, Response } from "express";
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";

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
    });

    await newExpense.save();

    // Add the expense to the group's expenses array
    await Group.findByIdAndUpdate(group, {
      $push: { expenses: newExpense._id },
    });

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
    const { description, amount, paidBy } = req.body;

    // Find and update the expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      { description, amount, paidBy },
      { new: true } // Return the updated document
    );

    if (!updatedExpense) {
      res.status(404).json({ success: false, message: "Expense not found" });
    } else {
      res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense,
      });
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ success: false, message: error });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;

    // Find and delete the expense
    const deletedExpense = await Expense.findByIdAndDelete(expenseId);

    if (!deletedExpense) {
      res.status(404).json({ success: false, message: "Expense not found" });
    } else {
      // Remove the expense from the group's expenses array
      await Group.findByIdAndUpdate(deletedExpense.group, {
        $pull: { expenses: deletedExpense._id },
      });

      res.status(200).json({
        success: true,
        message: "Expense deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ success: false, message: error });
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
    expense.splitDetails.push({ user: userId, amount: 0 });

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
      const payerId = expense.paidBy._id;
      console.log({ xx: expense.splitDetails });

      expense.splitDetails.forEach((split: any) => {
        const userId = split.user._id;
        if (payerId !== userId) {
          actualBalances[userId][payerId] =
            (actualBalances[userId][payerId] || 0) + split.amount;
        }
      });
    });

    // Calculate net balances (smart balance)
    group.members.forEach((member: any) => {
      group.members.forEach((otherMember: any) => {
        if (member._id !== otherMember._id) {
          const amountUserOwes =
            actualBalances[member._id][otherMember._id] || 0;
          const amountUserIsOwed =
            actualBalances[otherMember._id][member._id] || 0;

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

    // Save balances to the database
    await Group.findByIdAndUpdate(groupId, {
      $set: {
        actualBalances,
        netBalances,
      },
    });

    // Return balances to the frontend
    res.status(200).json({ success: true, actualBalances, netBalances });
  } catch (error) {
    console.error("Error fetching balances:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
