import React from "react";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import ExpenseForm from "../ExpenseForm/ExpenseForm";

interface ExpenseFormSectionProps {
  isEditing?: boolean;
  expenseId?: string;
}

const ExpenseFormSection: React.FC<ExpenseFormSectionProps> = ({
  isEditing = false,
  expenseId,
}) => {
  const {
    showExpenseForm,
    group,
    currentUserId,
    addExpense,
    updateExpense,
    setShowExpenseForm,
    expenses,
  } = useGroupContext();

  if (!showExpenseForm || !group) return null;

  const expenseToEdit = isEditing
    ? expenses.find((expense) => expense._id === expenseId)
    : null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <ExpenseForm
        initialData={{
          description: expenseToEdit ? expenseToEdit.description : "",
          amount: expenseToEdit ? expenseToEdit.amount : 0,
          paidBy: expenseToEdit ? expenseToEdit.paidBy._id : currentUserId,
          splitDetails: expenseToEdit
            ? expenseToEdit.splitDetails.map((split) => ({
                user: split.user,
                amount: split.amount,
              }))
            : group.members.map((member) => ({
                user: member._id,
                amount: 0,
              })),
          splitMethod: "equal",
        }}
        group={group}
        onSubmit={async (data) => {
          if (isEditing && expenseId) {
            await updateExpense(expenseId, data);
          } else {
            await addExpense(data);
          }
          setShowExpenseForm(false);
        }}
        onCancel={() => setShowExpenseForm(false)}
        currentUserId={currentUserId}
        isEditing={isEditing}
        expenseId={expenseId}
      />
    </div>
  );
};

export default ExpenseFormSection;
