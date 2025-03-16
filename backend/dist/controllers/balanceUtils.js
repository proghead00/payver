import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
// Calculate actual balances for a group
export const calculateActualBalances = async (groupId) => {
    const group = await Group.findById(groupId).populate("members").lean();
    if (!group)
        throw new Error("Group not found");
    const expenses = await Expense.find({ group: groupId })
        .populate("paidBy splitDetails.user")
        .lean();
    // Initialize actual balances
    const actualBalances = {};
    group.members.forEach((member) => {
        actualBalances[member._id.toString()] = 0;
    });
    // Aggregate balances from all expenses
    expenses.forEach((expense) => {
        const payerId = expense.paidBy._id.toString();
        expense.splitDetails.forEach((split) => {
            const userId = split.user._id.toString();
            if (userId !== payerId && !split.paid && !split.paymentCompleted) {
                actualBalances[userId] = (actualBalances[userId] || 0) + split.amount;
            }
        });
    });
    return actualBalances;
};
// Calculate smart balances for a group
export const calculateSmartBalances = async (groupId) => {
    const group = await Group.findById(groupId).populate("members").lean();
    if (!group)
        throw new Error("Group not found");
    const expenses = await Expense.find({ group: groupId })
        .populate("paidBy splitDetails.user")
        .lean();
    // Initialize balances
    const balances = {};
    group.members.forEach((member) => {
        balances[member._id.toString()] = {};
        group.members.forEach((otherMember) => {
            if (member._id.toString() !== otherMember._id.toString()) {
                balances[member._id.toString()][otherMember._id.toString()] = 0;
            }
        });
    });
    // Aggregate balances from all expenses
    expenses.forEach((expense) => {
        const payerId = expense.paidBy._id.toString();
        expense.splitDetails.forEach((split) => {
            const userId = split.user._id.toString();
            if (userId !== payerId && !split.paid && !split.paymentCompleted) {
                balances[userId][payerId] =
                    (balances[userId][payerId] || 0) + split.amount;
            }
        });
    });
    // Calculate net balances
    const smartBalances = {};
    group.members.forEach((member) => {
        let netBalance = 0;
        group.members.forEach((otherMember) => {
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
export const updateGroupBalances = async (groupId) => {
    const actualBalances = await calculateActualBalances(groupId);
    const smartBalances = await calculateSmartBalances(groupId);
    await Group.findByIdAndUpdate(groupId, {
        $set: {
            actualBalances: Object.entries(actualBalances).map(([user, amount]) => ({
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
