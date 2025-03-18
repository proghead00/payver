"use client";
import React from "react";
import {
  useGroupContext,
  ActionTypes,
} from "@/context/GroupContext/GroupContext";
import MembersSection from "../Members/MembersSection";
import ExpenseFormSection from "../Expense/ExpenseFormSection/ExpenseFormSection";
import BalancesSection from "../Balance/BalancesSection";
import ExpensesSection from "../Expense/ExpensesSection";
import LoadingSpinner from "@/components/Common/LoadingSpinner";

const GroupDetails: React.FC = () => {
  const { group, isLoading, showExpenseForm, dispatch, getSimplifiedBalances } =
    useGroupContext();

  if (isLoading || !group) {
    return <LoadingSpinner />;
  }

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const groupBannerUrl = `${backendBaseUrl}${group.picture}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        {group.picture && (
          <div className="mb-6">
            <img
              src={groupBannerUrl}
              alt={`${group.name} Banner`}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Group header with consistent alignment */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{group.name}</h2>
          <button
            onClick={() =>
              dispatch({
                type: ActionTypes.TOGGLE_EXPENSE_FORM,
                payload: !showExpenseForm,
              })
            }
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
