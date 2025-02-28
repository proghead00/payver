"use client";

import { Edit, Delete, PersonAdd, ExitToApp } from "@mui/icons-material";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import ExpenseForm from "../ExpenseForm/ExpenseForm";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import { useState } from "react";
import { Expense } from "@/config/types";
import { useExpenseItemLogic } from "./expenseItem.logic";
import LoadingSpinner from "@/components/Common/LoadingSpinner";

const ExpenseItem: React.FC<{
  expense: Expense;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ expense, isSelected, onSelect }) => {
  const {
    currentUserId,
    updateExpense,
    deleteExpense,
    joinExpense,
    leaveExpense,
    group,
    isDeleting,
    setSelectedExpenseId,
  } = useGroupContext();

  if (!group) {
    return <LoadingSpinner />;
  }

  const {
    isUserInExpense,
    isExpenseCreator,
    memberNames,
    // fetchExpenses,
  } = useExpenseItemLogic({
    expense,
    currentUserId,
    group,
    handleDeleteExpense: deleteExpense,
    handleLeaveExpense: leaveExpense,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const calculateIndividualAmount = () => {
    return expense.amount / expense.splitDetails.length;
  };

  const handleEdit = () => setIsEditing(true);

  const confirmDelete = async () => {
    await deleteExpense(expense._id, currentUserId);
    setShowDeleteModal(false);
  };

  const confirmLeave = async () => {
    await leaveExpense(expense._id);
    setShowLeaveModal(false);
  };

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-md mb-4 ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${isUserInExpense ? "border-l-4 border-blue-500" : ""}`}
    >
      {isEditing ? (
        <ExpenseForm
          initialData={{
            description: expense.description,
            amount: expense.amount,
            paidBy: expense.paidBy._id,
            splitDetails: expense.splitDetails.map((split) => ({
              user:
                typeof split.user === "object" ? split.user._id : split.user,
              amount: split.amount,
            })),
            splitMethod: "equal",
          }}
          group={group}
          onSubmit={async (updatedData) => {
            await updateExpense(expense._id, updatedData);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
          currentUserId={currentUserId}
        />
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-lg font-semibold">{expense.description}</h4>
            <p>Total Amount: ₹{expense.amount.toFixed(2)}</p>
            <p>Paid by: {expense.paidBy.name}</p>
            <p>Individual Share: ₹{calculateIndividualAmount().toFixed(2)}</p>
            <p className="text-sm text-gray-600">Members: {memberNames}</p>
          </div>

          <div className="flex gap-2">
            {isExpenseCreator ? (
              <>
                <button
                  onClick={handleEdit}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md flex items-center gap-1"
                >
                  <Edit fontSize="small" /> Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md flex items-center gap-1"
                >
                  <Delete fontSize="small" /> Delete Expense
                </button>
              </>
            ) : isUserInExpense ? (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded-md flex items-center gap-1"
              >
                <ExitToApp fontSize="small" /> Leave Expense
              </button>
            ) : (
              <button
                onClick={() => joinExpense(expense._id)}
                className="bg-green-500 text-white px-3 py-1 rounded-md flex items-center gap-1"
              >
                <PersonAdd fontSize="small" /> Join Expense
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmButtonText="Delete Expense"
        isConfirming={isDeleting}
      />

      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={confirmLeave}
        title="Leave Expense"
        message="Are you sure you want to leave this expense?"
        confirmButtonText="Leave Expense"
        isConfirming={false}
      />
    </div>
  );
};

export default ExpenseItem;
