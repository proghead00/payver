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

    // Calculate split amount excluding the payer
    const splitMembers = groupDoc.members.filter(
      (member: any) => member._id.toString() !== paidBy.toString()
    );

    const splitAmount =
      splitMembers.length > 0 ? amount / splitMembers.length : 0;

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
