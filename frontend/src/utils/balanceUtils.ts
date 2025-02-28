import { Expense } from "@/config/types";

/**
 * Calculate balances between users based on expenses
 * @param expenseList List of expenses to calculate balances from
 * @returns Array of simplified balances between users
 */
export const calculateBalances = (expenseList: Expense[]) => {
  // Initial balances array
  const balances: any[] = [];

  // Process each expense
  expenseList.forEach((expense) => {
    if (!expense.paidBy || !expense.splitDetails) return;

    const paidById =
      typeof expense.paidBy === "string" ? expense.paidBy : expense.paidBy._id;

    expense.splitDetails.forEach((split) => {
      const userId =
        typeof split.user === "string" ? split.user : split.user._id;

      if (userId === paidById || split.amount <= 0) return;

      // Add to balances
      balances.push({
        from: userId,
        to: paidById,
        amount: split.amount,
        expenseId: expense._id,
        description: expense.description,
      });
    });
  });

  // Combine balances between same pairs of users
  const combinedBalances = new Map();

  balances.forEach((balance) => {
    const key = `${balance.from}-${balance.to}`;
    const reverseKey = `${balance.to}-${balance.from}`;

    if (combinedBalances.has(reverseKey)) {
      const existing = combinedBalances.get(reverseKey);
      if (existing.amount > balance.amount) {
        existing.amount -= balance.amount;
      } else {
        combinedBalances.delete(reverseKey);
        if (existing.amount < balance.amount) {
          combinedBalances.set(key, {
            from: balance.from,
            to: balance.to,
            amount: balance.amount - existing.amount,
            expenseId: balance.expenseId,
            description: balance.description,
          });
        }
      }
    } else if (combinedBalances.has(key)) {
      const existing = combinedBalances.get(key);
      existing.amount += balance.amount;
    } else {
      combinedBalances.set(key, { ...balance });
    }
  });

  return Array.from(combinedBalances.values());
};

/**
 * Get original transactions from expenses without simplification
 * @param expenses List of expenses to extract transactions from
 * @returns Array of original transactions between users
 */
export const getOriginalTransactions = (expenses: Expense[]) => {
  const originalBalances: any[] = [];

  // Process each expense to extract original transactions
  if (!expenses) return originalBalances;

  expenses.forEach((expense: any) => {
    if (!expense.paidBy || !expense.splitDetails) return;

    const paidById =
      typeof expense.paidBy === "string" ? expense.paidBy : expense.paidBy._id;

    // Skip if we can't determine who paid
    if (!paidById) return;

    expense.splitDetails.forEach((split: any) => {
      const userId =
        typeof split.user === "string" ? split.user : (split.user as any)?._id;

      // Skip if user paid for themselves or amount is invalid
      if (userId === paidById || !userId || split.amount <= 0) return;

      // Add to original balances - this is a direct transaction
      originalBalances.push({
        from: userId,
        to: paidById,
        amount: split.amount,
        originalAmount: split.amount,
        expenseId: expense._id,
        description: expense.description,
      });
    });
  });

  return originalBalances;
};
