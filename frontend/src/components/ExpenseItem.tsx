"use client";

import { useState } from "react";
import ExpenseForm from "./ExpenseForm";
import { Group, User } from "@/config/types";
import { Edit, Delete, PersonAdd, ExitToApp } from "@mui/icons-material";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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
  group: Group;
  currentUserId: string;
  handleUpdateExpense: (expenseId: string, updatedData: any) => Promise<void>;
  handleDeleteExpense: (expenseId: string) => Promise<void>;
  handleJoinExpense: (expenseId: string) => Promise<void>;
  handleLeaveExpense: (expenseId: string) => Promise<void>;
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
  handleLeaveExpense,
  isSelected,
  onSelect,
  group,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleEdit = () => {
    onSelect();
    setIsEditing(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await handleDeleteExpense(expense._id);
    } catch (error) {
      console.error("Error deleting expense:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const confirmLeave = async () => {
    setIsLeaving(true);
    try {
      await handleLeaveExpense(expense._id);
    } catch (error) {
      console.error("Error leaving expense:", error);
    } finally {
      setIsLeaving(false);
      setShowLeaveModal(false);
    }
  };

  const calculateIndividualAmount = () => {
    const totalMembers = expense.splitDetails.length;
    return expense.amount / totalMembers;
  };

  const isUserInExpense = expense.splitDetails.some(
    (split) =>
      (typeof split.user === "object" ? split.user._id : split.user) ===
      currentUserId
  );

  const isExpenseCreator = expense.paidBy._id === currentUserId;

  const memberNames = expense.splitDetails
    .map((split) => {
      const user = group.members.find(
        (member) =>
          member._id ===
          (typeof split.user === "object" ? split.user._id : split.user)
      );
      return user ? user.name : null;
    })
    .filter((name) => name !== null)
    .join(", ");

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
            await handleUpdateExpense(expense._id, updatedData);
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
            {isExpenseCreator && (
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
                  <Delete fontSize="small" /> Delete
                </button>
              </>
            )}

            {!isUserInExpense ? (
              <button
                onClick={() => handleJoinExpense(expense._id)}
                className="bg-green-500 text-white px-3 py-1 rounded-md flex items-center gap-1"
              >
                <PersonAdd fontSize="small" /> Join Expense
              </button>
            ) : (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded-md flex items-center gap-1"
              >
                <ExitToApp fontSize="small" /> Leave Expense
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmButtonText="Delete Expense"
        isConfirming={isDeleting}
      />

      {/* Leave Expense Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={confirmLeave}
        title="Leave Expense"
        message="Are you sure you want to leave this expense?"
        confirmButtonText="Leave Expense"
        isConfirming={isLeaving}
      />
    </div>
  );
};

export default ExpenseItem;
