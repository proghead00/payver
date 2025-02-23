import React from "react";
import { Group } from "../../../config/types";
import ExpenseForm from "../ExpenseForm/ExpenseForm";

interface ExpenseFormSectionProps {
  showExpenseForm: boolean;
  group: Group;
  currentUserId: string;
  handleAddExpense: (expenseData: any) => Promise<void>;
  setShowExpenseForm: (show: boolean) => void;
}

const ExpenseFormSection: React.FC<ExpenseFormSectionProps> = ({
  showExpenseForm,
  group,
  currentUserId,
  handleAddExpense,
  setShowExpenseForm,
}) => {
  if (!showExpenseForm) return null;

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
