// ExpenseItem.tsx
"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import ExpenseForm from "./ExpenseForm";
import { User } from "@/config/types";

interface ExpenseItemProps {
  expense: {
    _id: string;
    description: string;
    amount: number;
    paidBy: {
      _id: string;
      name: string;
    };
    splitDetails: Array<{
      user: string | { _id: string; name: string };
      amount: number;
    }>;
  };
  currentUserId: string;
  handleUpdateExpense: (expenseId: string, updatedData: any) => Promise<void>;
  handleDeleteExpense: (expenseId: string) => Promise<void>;
  handleJoinExpense: (expenseId: string) => Promise<void>;
  isSelected: boolean;
  onSelect: () => void;
  users?: User[];
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  currentUserId,
  handleUpdateExpense,
  handleDeleteExpense,
  handleJoinExpense,
  isSelected,
  onSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    onSelect(); // Select this expense before editing
    setIsEditing(true);
  };

  const calculateIndividualAmount = () => {
    const totalMembers = expense.splitDetails.length;
    return expense.amount / totalMembers;
  };

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-md mb-4 ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {isEditing ? (
        <ExpenseForm
          initialData={{
            description: expense.description,
            amount: expense.amount,
            paidBy: expense.paidBy._id,
            splitDetails: expense.splitDetails,
          }}
          onSubmit={async (updatedData) => {
            await handleUpdateExpense(expense._id, updatedData);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
          currentUserId={currentUserId}
        />
      ) : (
        <>
          <h4 className="text-lg font-semibold">{expense.description}</h4>
          <p>Total Amount: ₹{expense.amount.toFixed(2)}</p>
          <p>Paid by: {expense.paidBy.name}</p>
          <p>Individual Share: ₹{calculateIndividualAmount().toFixed(2)}</p>
          <div className="mt-2">
            <button
              onClick={handleEdit}
              className="bg-yellow-500 text-white px-3 py-1 rounded-md mr-2"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteExpense(expense._id)}
              className="bg-red-500 text-white px-3 py-1 rounded-md"
            >
              Delete
            </button>
            {!expense.splitDetails.some(
              (split: any) => split.user._id === currentUserId
            ) && (
              <button
                onClick={() => handleJoinExpense(expense._id)}
                className="bg-green-500 text-white px-3 py-1 rounded-md ml-2"
              >
                Join Expense
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseItem;
