import { useState } from "react";
import { Expense, Group } from "@/config/types";
import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";

export const useExpenseItemLogic = ({
  expense,
  currentUserId,
  group,
  handleDeleteExpense,
  handleLeaveExpense,
}: {
  expense: Expense;
  currentUserId: string;
  group: Group;
  handleDeleteExpense: (
    expenseId: string,
    currentUserId: string
  ) => Promise<void>;
  handleLeaveExpense: (expenseId: string) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await handleDeleteExpense(expense._id, currentUserId);
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
    (split) => split.user === currentUserId
  );

  const isExpenseCreator = expense.paidBy._id === currentUserId;

  const memberNames = expense.splitDetails
    .map((split) => {
      const user = group.members.find((member) => member._id === split.user);
      return user ? user.name : null;
    })
    .filter((name) => name !== null)
    .join(", ");

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/expenses/${group._id}`,
        { withCredentials: true }
      );
      setExpenses(response.data.expenses);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      console.error("Error fetching expenses:", error);
    }
  };

  return {
    isEditing,
    setIsEditing,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    showLeaveModal,
    setShowLeaveModal,
    isLeaving,
    handleEdit,
    confirmDelete,
    confirmLeave,
    calculateIndividualAmount,
    isUserInExpense,
    isExpenseCreator,
    memberNames,
    fetchExpenses,
  };
};
