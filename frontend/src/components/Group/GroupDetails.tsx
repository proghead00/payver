// src/components/Group/GroupDetails.tsx
"use client";

import React from "react";
import { useGroupContext } from "@/context/GroupContext";
import MembersSection from "../Members/MembersSection";
import ExpenseFormSection from "../Expense/ExpenseFormSection/ExpenseFormSection";
import BalancesSection from "../Balance/BalancesSection";
import ExpensesSection from "../Expense/ExpensesSection";
import LoadingSpinner from "@/components/Common/LoadingSpinner";

const GroupDetails: React.FC = () => {
  const {
    group,
    expenses,
    currentUserId,
    isLoading,
    showExpenseForm,
    setShowExpenseForm,
    selectedExpenseId,
    setSelectedExpenseId,
    smartBalanceMode,
    setSmartBalanceMode,
    showAllBalances,
    setShowAllBalances,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleJoinExpense,
    handleLeaveExpense,
    handleMarkAsPaid,
    getSimplifiedBalances,
  } = useGroupContext();

  const simplifiedBalances = getSimplifiedBalances();

  if (isLoading || !group) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {group.name}
          </h2>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            {showExpenseForm ? "Cancel" : "Add Expense"}
          </button>
        </div>

        <MembersSection />

        <ExpenseFormSection />

        <BalancesSection />

        <ExpensesSection />
      </div>
    </div>
  );
};

export default GroupDetails;
