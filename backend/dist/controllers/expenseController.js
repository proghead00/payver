import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import { updateGroupBalances } from "../utils/balanceUtils.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
export const createExpense = async (req, res) => {
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
        const splitDetails = groupDoc.members.map((member) => ({
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
        res.status(500).json({ success: false, message: error });
    }
};
export const updateExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const { updatedData } = req.body;
        const reason = updatedData.reason;
        const userId = req.userId;
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            res.status(404).json({ success: false, message: "Expense not found" });
            return;
        }
        // Check if payments have been made
        const hasPayments = expense.splitDetails.some((split) => split.completedPaymentByOwer || split.paymentConfirmedByReceiver);
        if (hasPayments) {
            res.status(400).json({
                success: false,
                message: "Cannot edit expense after payments have been made",
            });
            return;
        }
        // Find the user making the edit
        const editedByUser = await User.findById(userId);
        if (!editedByUser) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Track changes
        const changes = [];
        const fieldsToProcess = Object.keys(updatedData).filter((field) => field !== "reason");
        for (const field of fieldsToProcess) {
            try {
                let oldValue, newValue;
                if (field === "splitDetails") {
                    // Calculate the split amount for all members, including the payer
                    const totalMembers = expense.splitDetails.length;
                    const splitAmount = expense.amount / totalMembers;
                    oldValue = expense.splitDetails.map((split) => ({
                        user: split.user,
                        amount: splitAmount, // Use the calculated split amount for all members
                        completedPaymentByOwer: split.completedPaymentByOwer || false,
                        paymentConfirmedByReceiver: split.paymentConfirmedByReceiver || null,
                    }));
                    // Calculate the split amount for the updated data
                    const updatedTotalMembers = updatedData.splitDetails.length;
                    const updatedSplitAmount = updatedData.amount / updatedTotalMembers;
                    newValue = updatedData.splitDetails.map((split) => ({
                        user: split.user,
                        amount: updatedSplitAmount, // Use the calculated split amount for all members
                        completedPaymentByOwer: split.completedPaymentByOwer || false,
                        paymentConfirmedByReceiver: split.paymentConfirmedByReceiver || null,
                    }));
                }
                else if (field === "paidBy") {
                    // Fetch the user details for oldValue and newValue
                    const oldPaidByUser = await User.findById(expense.paidBy);
                    const newPaidByUser = await User.findById(updatedData.paidBy);
                    if (!oldPaidByUser || !newPaidByUser) {
                        throw new Error("User not found for paidBy field");
                    }
                    oldValue = {
                        _id: oldPaidByUser._id,
                        email: oldPaidByUser.email,
                        name: oldPaidByUser.name,
                    };
                    newValue = {
                        _id: newPaidByUser._id,
                        email: newPaidByUser.email,
                        name: newPaidByUser.name,
                    };
                }
                else {
                    oldValue = expense[field];
                    newValue = updatedData[field];
                }
                changes.push({
                    field,
                    oldValue,
                    newValue,
                });
            }
            catch (error) {
                console.error(`Error processing field '${field}':`, error);
            }
        }
        // If no valid changes, return early
        if (changes.length === 0) {
            res.status(200).json({
                success: true,
                message: "No valid changes detected",
                expense,
            });
            return;
        }
        const historyEntry = {
            editedBy: {
                _id: editedByUser._id,
                name: editedByUser.name,
                email: editedByUser.email,
            },
            timestamp: new Date(),
            changes,
            reason: reason || "No reason provided",
        };
        const updatedExpense = await Expense.findByIdAndUpdate(expenseId, {
            $set: {
                ...updatedData,
                // Exclude reason from being set directly on the expense
                reason: undefined,
            },
            $push: { editHistory: historyEntry },
        }, { new: true }).populate("paidBy", "name email"); // Populate the paidBy field with name and email
        if (!updatedExpense) {
            res.status(404).json({
                success: false,
                message: "Expense not found after update",
            });
            return;
        }
        // Format the response to include paidBy details
        const responseExpense = {
            ...updatedExpense.toObject(),
            paidBy: {
                _id: updatedExpense.paidBy._id,
                name: updatedExpense.paidBy.name,
                email: updatedExpense.paidBy.email,
            },
        };
        res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            expense: responseExpense,
            changes,
        });
    }
    catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const deleteExpense = async (req, res) => {
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
                message: "Only the creator or the payer can delete this expense",
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
    }
    catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const joinExpense = async (req, res) => {
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
        const isUserInSplit = expense.splitDetails.some((split) => split.user.toString() === userId);
        if (isUserInSplit) {
            res
                .status(400)
                .json({ success: false, message: "User is already in split" });
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
        expense.splitDetails = expense.splitDetails.map((split) => ({
            ...split,
            amount: newSplitAmount,
        }));
        await expense.save();
        res.status(200).json({
            success: true,
            message: "User joined expense successfully, split amount updated",
            expense,
        });
    }
    catch (error) {
        console.error("Error joining expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const getGroupBalances = async (req, res) => {
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
        const actualBalances = {};
        const netBalances = {};
        group.members.forEach((member) => {
            actualBalances[member._id] = {};
            netBalances[member._id] = {};
            group.members.forEach((otherMember) => {
                if (member._id !== otherMember._id) {
                    actualBalances[member._id][otherMember._id] = 0;
                    netBalances[member._id][otherMember._id] = 0;
                }
            });
        });
        // Calculate actual balances (who owes whom)
        expenses.forEach((expense) => {
            const paidById = expense.paidBy._id;
            expense.splitDetails.forEach((split) => {
                const userId = split.user._id;
                if (paidById !== userId && !split.paid && !split.paymentCompleted) {
                    actualBalances[userId][paidById] += split.amount;
                }
            });
        });
        // Calculate net balances (smart balance)
        group.members.forEach((member) => {
            group.members.forEach((otherMember) => {
                if (member._id !== otherMember._id) {
                    const amountUserOwes = actualBalances[member._id][otherMember._id];
                    const amountUserIsOwed = actualBalances[otherMember._id][member._id];
                    if (amountUserOwes > amountUserIsOwed) {
                        netBalances[member._id][otherMember._id] =
                            amountUserOwes - amountUserIsOwed;
                        netBalances[otherMember._id][member._id] = 0;
                    }
                    else {
                        netBalances[otherMember._id][member._id] =
                            amountUserIsOwed - amountUserOwes;
                        netBalances[member._id][otherMember._id] = 0;
                    }
                }
            });
        });
        // Format the response
        const groupBalances = group.members.map((member) => ({
            user: member,
            amount: Object.values(actualBalances[member._id]).reduce((sum, amount) => sum + amount, 0),
        }));
        const smartBalances = group.members.map((member) => ({
            user: member,
            amount: Object.values(netBalances[member._id]).reduce((sum, amount) => sum + amount, 0),
        }));
        res.status(200).json({
            success: true,
            balances: groupBalances,
            smartBalances: smartBalances,
        });
    }
    catch (error) {
        console.error("Error fetching balances:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const leaveExpense = async (req, res) => {
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
                message: "The payer cannot leave the expense. You can delete the expense instead.",
            });
            return;
        }
        // Check if user is part of the expense
        const userSplitIndex = expense.splitDetails.findIndex((split) => split.user.toString() === userId);
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
                message: "Cannot leave expense - at least one person must be in the split",
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
    }
    catch (error) {
        console.error("Error leaving expense:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const removeExpenseMember = async (req, res) => {
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
                message: "Only the creator or the payer can remove members from the expense",
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
        const userSplitIndex = expense.splitDetails.findIndex((split) => split.user.toString() === userId);
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
                message: "Cannot remove last member - at least one person must be in the split",
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
    }
    catch (error) {
        console.error("Error removing expense member:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ---------------- NOTIFICATION STUFF
export const markPaymentAsCompletedByOwer = async (req, res) => {
    try {
        const { expenseId, payerId, amount, isSmartBalancePayment = false, } = req.body;
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            res.status(404).json({ success: false, message: "Expense not found" });
            return;
        }
        // Find the split detail for the user who is making the payment
        const splitDetail = expense.splitDetails.find((split) => split.user.toString() === payerId);
        if (!splitDetail) {
            res
                .status(404)
                .json({ success: false, message: "User not found in expense split" });
            return;
        }
        // Mark as payment completed by the payer - do this for both regular and smart balance payments
        splitDetail.completedPaymentByOwer = true;
        await expense.save();
        // Get the group to store the smart balance mode info
        const group = await Group.findById(expense.group);
        if (!group) {
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }
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
                isSmartBalancePayment: isSmartBalancePayment, // Add this field to track if it's a smart payment
            });
        }
        else {
            // Update the existing notification
            notification.status = "pending"; // Ensure status is "pending"
            notification.amount = amount;
            notification.isSmartBalancePayment = isSmartBalancePayment;
        }
        await notification.save();
        // Update group balances
        await updateGroupBalances(expense.group._id);
        res.status(200).json({
            success: true,
            message: "Payment marked as completed",
            expense,
            notification,
        });
    }
    catch (error) {
        console.error("Error marking payment as completed:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const paymentConfirmedByReceiverFromNotification = async (req, res) => {
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
        // Find the associated expense for the current notification
        const expense = await Expense.findById(notification.expenseId);
        if (!expense) {
            res.status(404).json({ success: false, message: "Expense not found" });
            return;
        }
        // Get the group to check if smart balance mode is enabled
        const group = await Group.findById(expense.group);
        if (!group) {
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }
        // Find the split detail for the payer in the current expense
        const splitDetail = expense.splitDetails.find((split) => split.user.toString() === notification.payerId.toString());
        if (!splitDetail) {
            res
                .status(404)
                .json({ success: false, message: "Split detail not found" });
            return;
        }
        if (status === "completed") {
            // Check if this payment was made in smart balance mode
            if (group.smartMode) {
                // Step 1: Get all expenses in the group
                const allGroupExpenses = await Expense.find({ group: group._id });
                // Step 2: Calculate how much the payer owes to the recipient across all expenses
                const payerOwesToRecipient = allGroupExpenses.reduce((total, exp) => {
                    const split = exp.splitDetails.find((s) => s.user.toString() === notification.payerId.toString() &&
                        exp.paidBy.toString() === notification.recipientId.toString());
                    return total + (split?.amount || 0);
                }, 0);
                // Step 3: Calculate how much the recipient owes to the payer across all expenses
                const recipientOwesToPayer = allGroupExpenses.reduce((total, exp) => {
                    const split = exp.splitDetails.find((s) => s.user.toString() === notification.recipientId.toString() &&
                        exp.paidBy.toString() === notification.payerId.toString());
                    return total + (split?.amount || 0);
                }, 0);
                // Step 4: Determine the actual payment flow and amount
                const paidAmount = notification.amount;
                let remainingAmount = paidAmount;
                // Step 5: Update the split details across all expenses
                if (payerOwesToRecipient > recipientOwesToPayer) {
                    // Payer owes more to recipient, so update expenses where payer owes recipient
                    for (const exp of allGroupExpenses) {
                        // Only process if payer owes in this expense and recipient is the payer of the expense
                        if (exp.paidBy.toString() === notification.recipientId.toString()) {
                            const split = exp.splitDetails.find((s) => s.user.toString() === notification.payerId.toString());
                            if (split && split.amount > 0 && remainingAmount > 0) {
                                // Determine how much to pay for this expense
                                const amountToDeduct = Math.min(split.amount, remainingAmount);
                                split.amount -= amountToDeduct;
                                remainingAmount -= amountToDeduct;
                                // Mark payment status appropriately
                                if (split.amount <= 0) {
                                    split.completedPaymentByOwer = true;
                                    split.paymentConfirmedByReceiver = true;
                                }
                                // Save each expense after updating
                                await exp.save();
                                // Stop if we've allocated the entire payment
                                if (remainingAmount <= 0)
                                    break;
                            }
                        }
                    }
                }
                else {
                    // Recipient owes more to payer, so update expenses where recipient owes payer
                    // This is a reverse flow payment, so we need to update expenses where recipient owes
                    for (const exp of allGroupExpenses) {
                        // Only process if recipient owes in this expense and payer is the expense payer
                        if (exp.paidBy.toString() === notification.payerId.toString()) {
                            const split = exp.splitDetails.find((s) => s.user.toString() === notification.recipientId.toString());
                            if (split && split.amount > 0 && remainingAmount > 0) {
                                // Determine how much to pay for this expense
                                const amountToDeduct = Math.min(split.amount, remainingAmount);
                                split.amount -= amountToDeduct;
                                remainingAmount -= amountToDeduct;
                                // Mark payment status appropriately
                                if (split.amount <= 0) {
                                    split.completedPaymentByOwer = true;
                                    split.paymentConfirmedByReceiver = true;
                                }
                                // Save each expense after updating
                                await exp.save();
                                // Stop if we've allocated the entire payment
                                if (remainingAmount <= 0)
                                    break;
                            }
                        }
                    }
                }
            }
            else {
                // Regular payment flow for a specific expense
                splitDetail.paymentConfirmedByReceiver = true;
                splitDetail.amount = 0; // Set the amount to 0 since the payment is confirmed
                // Save this specific expense
                await expense.save();
            }
        }
        else if (status === "rejected") {
            // Revert payment status
            splitDetail.paymentConfirmedByReceiver = false;
            await expense.save();
        }
        // Delete the notification regardless of outcome
        await Notification.findByIdAndDelete(notificationId);
        // Update group balances after all changes
        await updateGroupBalances(expense.group._id);
        res.status(200).json({
            success: true,
            message: `Payment ${status} and notification deleted`,
        });
    }
    catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const paymentConfirmedByReceiverFromMarkAsPaid = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const receiverId = req.userId; // The current user (receiver) confirming the payment
        // Find all expenses where the payer is `userId` and the receiver is `receiverId`
        const expenses = await Expense.find({
            paidBy: userId,
            "splitDetails.user": receiverId,
        });
        if (!expenses || expenses.length === 0) {
            res.status(404).json({ success: false, message: "No expenses found" });
            return;
        }
        let remainingAmount = amount; // Track the remaining amount to be settled
        // Iterate through expenses and update the split details
        for (const expense of expenses) {
            const splitDetail = expense.splitDetails.find((split) => split.user.toString() !== receiverId);
            if (splitDetail && splitDetail.amount > 0) {
                // Determine how much to deduct from this split detail
                const amountToDeduct = Math.min(splitDetail.amount, remainingAmount);
                // Update the split detail
                splitDetail.amount -= amountToDeduct;
                splitDetail.completedPaymentByOwer = true;
                splitDetail.paymentConfirmedByReceiver = true;
                // Deduct the amount from the remaining total
                remainingAmount -= amountToDeduct;
                // Save the updated expense
                await expense.save();
                // If the remaining amount is fully allocated, break the loop
                if (remainingAmount <= 0)
                    break;
            }
        }
        // Update group balances
        await updateGroupBalances(expenses[0].group);
        res.status(200).json({
            success: true,
            message: "Payment marked as paid",
        });
    }
    catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const getPendingPaymentNotifications = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const getPaymentStatus = async (req, res) => {
    const { expenseId, userId } = req.query;
    try {
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        const splitDetail = expense.splitDetails.find((split) => split.user.toString() === userId);
        if (!splitDetail) {
            res.status(404).json({ message: "User not found in expense" });
            return;
        }
        // Check if there's a notification for this expense and user
        const notification = await Notification.findOne({
            expenseId: expense._id,
            payerId: userId,
            recipientId: expense.paidBy,
        });
        let status = "initial";
        // this would be needed since notification once confirmed/ rejected is deleted
        // so for showing payment confirmed later, this is needed:
        if (splitDetail.completedPaymentByOwer === true) {
            if (splitDetail.paymentConfirmedByReceiver === true) {
                status = "completed";
            }
            else if (splitDetail.paymentConfirmedByReceiver === false) {
                status = "rejected";
            }
            else if (notification && notification.status === "pending") {
                status = "pending";
            }
        }
        // If notification exists, use its status as the source of truth
        if (notification) {
            if (notification.status === "completed") {
                status = "completed";
            }
            else if (notification.status === "rejected") {
                status = "rejected";
            }
            else if (notification.status === "pending" &&
                splitDetail.completedPaymentByOwer === true) {
                status = "pending";
            }
        }
        res.status(200).json({ status });
    }
    catch (error) {
        console.error("Error fetching payment status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const resetPaymentStatus = async (req, res) => {
    const { expenseId, userId } = req.body;
    try {
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
        }
        const splitDetail = expense.splitDetails.find((split) => split.user.toString() === userId);
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
    }
    catch (error) {
        console.error("Error resetting payment status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
