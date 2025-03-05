import mongoose from "mongoose";
import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

// Calculate actual balances for a group
export const calculateActualBalances = async (groupId: string) => {
  const group = await Group.findById(groupId).populate("members").lean();
  if (!group) throw new Error("Group not found");

  const expenses = await Expense.find({ group: groupId })
    .populate("paidBy splitDetails.user")
    .lean();

  // Initialize actual balances
  const actualBalances: Record<string, number> = {};

  group.members.forEach((member: any) => {
    actualBalances[member._id.toString()] = 0;
  });

  // Aggregate balances from all expenses
  expenses.forEach((expense: any) => {
    const payerId = expense.paidBy._id.toString();

    expense.splitDetails.forEach((split: any) => {
      const userId = split.user._id.toString();

      if (userId !== payerId && !split.paid && !split.paymentCompleted) {
        actualBalances[userId] = (actualBalances[userId] || 0) + split.amount;
      }
    });
  });

  return actualBalances;
};

// Calculate smart balances for a group
export const calculateSmartBalances = async (groupId: string) => {
  const group = await Group.findById(groupId).populate("members").lean();
  if (!group) throw new Error("Group not found");

  const expenses = await Expense.find({ group: groupId })
    .populate("paidBy splitDetails.user")
    .lean();

  // Initialize balances
  const balances: Record<string, Record<string, number>> = {};

  group.members.forEach((member: any) => {
    balances[member._id.toString()] = {};
    group.members.forEach((otherMember: any) => {
      if (member._id.toString() !== otherMember._id.toString()) {
        balances[member._id.toString()][otherMember._id.toString()] = 0;
      }
    });
  });

  // Aggregate balances from all expenses
  expenses.forEach((expense: any) => {
    const payerId = expense.paidBy._id.toString();

    expense.splitDetails.forEach((split: any) => {
      const userId = split.user._id.toString();

      if (userId !== payerId && !split.paid && !split.paymentCompleted) {
        balances[userId][payerId] =
          (balances[userId][payerId] || 0) + split.amount;
      }
    });
  });

  // Calculate net balances
  const smartBalances: Record<string, number> = {};

  group.members.forEach((member: any) => {
    let netBalance = 0;

    group.members.forEach((otherMember: any) => {
      if (member._id.toString() !== otherMember._id.toString()) {
        netBalance +=
          (balances[member._id.toString()][otherMember._id.toString()] || 0) -
          (balances[otherMember._id.toString()][member._id.toString()] || 0);
      }
    });

    smartBalances[member._id.toString()] = netBalance;
  });

  return smartBalances;
};

// Update balances in the group
export const updateGroupBalances = async (groupId: mongoose.Types.ObjectId) => {
  const group = await Group.findById(groupId).populate("members").lean();

  if (!group) throw new Error("Group not found");

  const expenses = await Expense.find({ group: groupId })
    .populate("paidBy splitDetails.user")
    .lean();
  // Initialize balances
  const actualBalances: Record<string, number> = {};
  const smartBalances: Record<string, number> = {};

  group.members.forEach((member: any) => {
    actualBalances[member._id.toString()] = 0;
    smartBalances[member._id.toString()] = 0;
  });

  // Aggregate balances from all expenses
  expenses.forEach((expense: any) => {
    const payerId = expense.paidBy._id.toString();

    expense.splitDetails.forEach((split: any) => {
      const userId = split.user._id.toString();

      if (userId !== payerId && !split.paid && !split.paymentCompleted) {
        actualBalances[userId] = (actualBalances[userId] || 0) + split.amount;
      }
    });
  });

  // Calculate net balances
  group.members.forEach((member: any) => {
    group.members.forEach((otherMember: any) => {
      if (member._id.toString() !== otherMember._id.toString()) {
        const amountUserOwes =
          actualBalances[member._id.toString()]?.[otherMember._id.toString()] ||
          0;
        const amountUserIsOwed =
          actualBalances[otherMember._id.toString()]?.[member._id.toString()] ||
          0;

        if (amountUserOwes > amountUserIsOwed) {
          smartBalances[member._id.toString()] =
            (smartBalances[member._id.toString()] || 0) +
            (amountUserOwes - amountUserIsOwed);
        } else {
          smartBalances[otherMember._id.toString()] =
            (smartBalances[otherMember._id.toString()] || 0) +
            (amountUserIsOwed - amountUserOwes);
        }
      }
    });
  });

  // Save updated balances to the database
  await Group.findByIdAndUpdate(groupId, {
    $set: {
      balances: Object.entries(actualBalances).map(([user, amount]) => ({
        user,
        amount,
      })),
      smartBalances: Object.entries(smartBalances).map(([user, amount]) => ({
        user,
        amount,
      })),
    },
  });
};
