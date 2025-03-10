import React, { useState, useEffect } from "react";
import { Edit, Delete, PersonAdd, ExitToApp } from "@mui/icons-material";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import ExpenseForm from "../ExpenseForm/ExpenseForm";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import { Expense } from "@/config/types";
import { useExpenseItemLogic } from "./expenseItem.logic";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import UPIPaymentButton from "@/components/UPIPayment/UPIPaymentButton";
import axios from "axios";

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
    fetchGroupData,
    smartBalanceMode,
    getSimplifiedBalances,
  } = useGroupContext();

  const [paymentStatus, setPaymentStatus] = useState<
    "initial" | "pending" | "completed" | "rejected"
  >("initial");

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-status`,
          {
            params: {
              expenseId: expense._id,
              userId: currentUserId,
            },
            withCredentials: true,
          }
        );
        setPaymentStatus(response.data.status);
      } catch (error) {
        console.error("Error fetching payment status:", error);
      }
    };

    if (currentUserId && expense._id) {
      fetchPaymentStatus();
    }
  }, [currentUserId, expense._id]);

  if (!group) {
    return <LoadingSpinner />;
  }

  const { isUserInExpense, isExpenseCreator, memberNames } =
    useExpenseItemLogic({
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

  const handlePaymentComplete = async () => {
    await fetchGroupData();
  };

  const currentUserOwes = expense.splitDetails.find(
    (split) => split.user.toString() === currentUserId && split.amount > 0
  );

  const simplifiedBalances = getSimplifiedBalances();
  const currentUserOwesInSmartMode = simplifiedBalances.find(
    (balance) =>
      balance.from === currentUserId && balance.to === expense.paidBy._id
  );

  const payableAmount = smartBalanceMode
    ? currentUserOwesInSmartMode?.amount || 0
    : currentUserOwes?.amount || 0;

  const shouldShowPayViaUPI = payableAmount > 0;

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
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Edit fontSize="small" /> Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Delete fontSize="small" /> Delete Expense
                </button>
              </>
            ) : isUserInExpense ? (
              <>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <ExitToApp fontSize="small" /> Leave Expense
                </button>

                <UPIPaymentButton
                  expenseId={expense._id}
                  amount={payableAmount}
                  recipientName={expense.paidBy.name}
                  recipientId={expense.paidBy._id}
                  groupId={group._id}
                  currentUserId={currentUserId}
                  onPaymentComplete={handlePaymentComplete}
                  smartBalanceMode={smartBalanceMode}
                  smartBalanceAmount={currentUserOwesInSmartMode?.amount}
                  paymentStatus={paymentStatus}
                  setPaymentStatus={setPaymentStatus}
                />
              </>
            ) : (
              <button
                onClick={() => joinExpense(expense._id)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
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
