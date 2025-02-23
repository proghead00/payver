"use client";

import React from "react";
import { Expense, Group } from "../../config/types";
import { useGroupDetailsLogic } from "./groupDetails.logic";
import MembersSection from "../Members/MembersSection";
import ExpenseFormSection from "../Expense/ExpenseFormSection/ExpenseFormSection";
import BalancesSection from "../Balance/BalancesSection";
import ExpensesSection from "../Expense/ExpensesSection";
import LoadingSpinner from "@/components/Common/LoadingSpinner";

interface GroupDetailsProps {
  group: Group | null;
  expenses: Expense[];
  handleAddExpense: (expenseData: any) => Promise<void>;
  currentUserId: string;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  expenses,
  handleAddExpense,
  currentUserId,
}) => {
  const {
    showExpenseForm,
    setShowExpenseForm,
    selectedExpenseId,
    setSelectedExpenseId,
    smartBalanceMode,
    setSmartBalanceMode,
    showAllBalances,
    setShowAllBalances,
    loading,
    getSimplifiedBalances,
    handleUpdateExpense,
    handleDeleteExpense,
    handleJoinExpense,
    handleMarkAsPaid,
    handleLeaveExpense,
  } = useGroupDetailsLogic({
    group,
    expenses,
    currentUserId,
  });

  const simplifiedBalances = getSimplifiedBalances();

  if (!group) {
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

        <MembersSection group={group} currentUserId={currentUserId} />

        <ExpenseFormSection
          showExpenseForm={showExpenseForm}
          group={group}
          currentUserId={currentUserId}
          handleAddExpense={handleAddExpense}
          setShowExpenseForm={setShowExpenseForm}
        />

        <BalancesSection
          loading={loading}
          simplifiedBalances={simplifiedBalances}
          group={group}
          currentUserId={currentUserId}
          smartBalanceMode={smartBalanceMode}
          setSmartBalanceMode={setSmartBalanceMode}
          showAllBalances={showAllBalances}
          setShowAllBalances={setShowAllBalances}
          handleMarkAsPaid={handleMarkAsPaid}
        />

        <ExpensesSection
          expenses={expenses}
          group={group}
          currentUserId={currentUserId}
          selectedExpenseId={selectedExpenseId}
          setSelectedExpenseId={setSelectedExpenseId}
          handleUpdateExpense={handleUpdateExpense}
          handleDeleteExpense={handleDeleteExpense}
          handleJoinExpense={handleJoinExpense}
          handleLeaveExpense={handleLeaveExpense}
        />
      </div>
    </div>
  );
};

export default GroupDetails;
