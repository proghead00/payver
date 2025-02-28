// src/components/Expense/ExpenseFormSection/ExpenseFormSection.tsx
import React from "react";
import { useGroupContext } from "@/context/GroupContext";
import ExpenseForm from "../ExpenseForm/ExpenseForm";

const ExpenseFormSection: React.FC = () => {
  const {
    showExpenseForm,
    group,
    currentUserId,
    handleAddExpense,
    setShowExpenseForm,
  } = useGroupContext();

  if (!showExpenseForm || !group) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <ExpenseForm
        initialData={{
          description: "",
          amount: 0,
          paidBy: currentUserId,
          splitDetails: group.members.map((member) => ({
            user: member._id,
            amount: 0,
          })),
          splitMethod: "equal",
        }}
        group={group}
        onSubmit={async (data) => {
          await handleAddExpense(data);
          setShowExpenseForm(false);
        }}
        onCancel={() => setShowExpenseForm(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default ExpenseFormSection;
