import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
export const createExpense = async (req, res) => {
    try {
        const { description, amount, paidBy, group } = req.body;
        // Validate required fields
        if (!description || !amount || !paidBy || !group) {
            res
                .status(400)
                .json({ success: false, message: "All fields are required" });
        }
        else {
            // Create the expense
            const newExpense = new Expense({
                description,
                amount,
                paidBy,
                group,
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
        }
    }
    catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const getExpenseById = async (req, res) => {
    try {
        const expenseId = req.params.id;
        // Find the expense by ID
        const expense = await Expense.findById(expenseId)
            .populate("paidBy", "name email")
            .populate("group", "name");
        if (!expense) {
            res.status(404).json({ success: false, message: "Expense not found" });
        }
        else {
            res.status(200).json({ success: true, expense });
        }
    }
    catch (error) {
        console.error("Error fetching expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const updateExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const { description, amount, paidBy } = req.body;
        // Find and update the expense
        const updatedExpense = await Expense.findByIdAndUpdate(expenseId, { description, amount, paidBy }, { new: true } // Return the updated document
        );
        if (!updatedExpense) {
            res.status(404).json({ success: false, message: "Expense not found" });
        }
        else {
            res.status(200).json({
                success: true,
                message: "Expense updated successfully",
                expense: updatedExpense,
            });
        }
    }
    catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const deleteExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        // Find and delete the expense
        const deletedExpense = await Expense.findByIdAndDelete(expenseId);
        if (!deletedExpense) {
            res.status(404).json({ success: false, message: "Expense not found" });
        }
        else {
            // Remove the expense from the group's expenses array
            await Group.findByIdAndUpdate(deletedExpense.group, {
                $pull: { expenses: deletedExpense._id },
            });
            res.status(200).json({
                success: true,
                message: "Expense deleted successfully",
            });
        }
    }
    catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
