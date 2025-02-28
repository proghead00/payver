import React from "react";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import ExpenseItem from "./ExpenseItem/ExpenseItem";

const ExpensesSection: React.FC = () => {
  const { expenses, group, selectedExpenseId, setSelectedExpenseId } =
    useGroupContext();

  if (!group) return null;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-800">
        Recent Expenses
      </h3>
      {expenses.length > 0 ? (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <ExpenseItem
              key={expense._id}
              expense={expense}
              isSelected={selectedExpenseId === expense._id}
              onSelect={() => setSelectedExpenseId(expense._id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">
          No expenses recorded yet.
        </p>
      )}
    </div>
  );
};

export default ExpensesSection;
