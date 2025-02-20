"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import ExpenseItem from "./ExpenseItem";
import BalanceItem from "./BalanceItem";
import ExpenseForm from "./ExpenseForm";
import { Expense, Group, User } from "../config/types";

interface GroupDetailsProps {
  group: Group | null;
  expenses: Expense[];
  // handlePayment: (amount: number, userId: string) => void;
  handleAddExpense: (expenseData: any) => Promise<void>;
  currentUserId: string;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  expenses,
  // handlePayment,
  handleAddExpense,
  currentUserId,
}) => {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null
  );
  const [smartBalanceMode, setSmartBalanceMode] = useState(true);
  const [showAllBalances, setShowAllBalances] = useState(false);

  if (!group) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate equal split amount based on total members
  const calculateEqualSplitAmount = (
    totalAmount: number,
    memberCount: number
  ) => {
    return totalAmount / memberCount;
  };

  // Calculate actual balances (original amounts owed)
  const calculateActualBalances = () => {
    console.log("calllll");
    const balances: Record<string, Record<string, number>> = {};
    // balances ultimately example:
    // "user1": { "user2": 50, "user3": 30 },
    // "user2": { "user1": -50, "user3": 20 },
    // "user3": { "user1": -30, "user2": 10 }

    // Initialize balances
    console.log({ ggs: group });
    group?.members.forEach((member) => {
      balances[member._id] = {};
      group.members.forEach((otherMember) => {
        if (member._id !== otherMember._id) {
          balances[member._id][otherMember._id] = 0;
        }
      });
    });

    // Process each expense
    expenses.forEach((expense) => {
      const payerId = expense.paidBy._id;

      expense.splitDetails.forEach((split) => {
        const userId =
          typeof split.user === "string"
            ? split.user
            : (split.user as { _id: string })._id;

        const amount = split.amount;

        if (payerId !== userId) {
          // This person owes the payer
          balances[userId][payerId] = (balances[userId][payerId] || 0) + amount;
        }
      });
    });

    return balances;
  };

  // Calculate simplified balances (with net amounts)
  const calculateSimplifiedBalances = () => {
    const balances: Record<string, Record<string, number>> = {};

    // Initialize balances
    group?.members.forEach((member) => {
      balances[member._id] = {};
      group.members.forEach((otherMember) => {
        if (member._id !== otherMember._id) {
          balances[member._id][otherMember._id] = 0;
        }
      });
    });

    // Process each expense
    expenses.forEach((expense) => {
      const payerId = expense.paidBy._id;
      const memberCount = group.members.length; // Use total members for division
      const equalSplitAmount = calculateEqualSplitAmount(
        expense.amount,
        memberCount
      );

      // Only apply debts to non-payers
      group.members.forEach((member) => {
        const userId = member._id;
        if (payerId !== userId) {
          // Non-payers owe the payer their share
          balances[userId][payerId] =
            (balances[userId][payerId] || 0) + equalSplitAmount;
        }
      });
    });

    // Calculate net balances
    const netBalances: Record<string, Record<string, number>> = {};

    // First, initialize all entries to ensure they exist
    group?.members.forEach((member) => {
      netBalances[member._id] = {};
      group.members.forEach((otherMember) => {
        if (member._id !== otherMember._id) {
          netBalances[member._id][otherMember._id] = 0;
        }
      });
    });

    // Now calculate net balances
    group?.members.forEach((member) => {
      group.members.forEach((otherMember) => {
        if (member._id !== otherMember._id) {
          const amountOwed = balances[member._id][otherMember._id] || 0;
          const amountOwing = balances[otherMember._id][member._id] || 0;

          // Only process each pair once
          if (amountOwed > amountOwing) {
            netBalances[member._id][otherMember._id] = amountOwed - amountOwing;
            netBalances[otherMember._id][member._id] = 0;
          } else if (amountOwing > amountOwed) {
            netBalances[member._id][otherMember._id] = 0;
            netBalances[otherMember._id][member._id] = amountOwing - amountOwed;
          } else {
            netBalances[member._id][otherMember._id] = 0;
            netBalances[otherMember._id][member._id] = 0;
          }
        }
      });
    });

    return netBalances;
  };

  // Get balances based on the current mode
  const getBalances = () => {
    return smartBalanceMode
      ? calculateSimplifiedBalances()
      : calculateActualBalances();
  };

  // Get simplified balances to display
  const getSimplifiedBalances = () => {
    const balances = getBalances();
    const simplifiedBalances: {
      from: string;
      to: string;
      amount: number;
      originalAmount: number;
    }[] = [];

    // Process the balances into a displayable format
    Object.entries(balances).forEach(([userId, userBalances]) => {
      Object.entries(userBalances).forEach(([otherUserId, amount]) => {
        if (amount > 0) {
          // Only add to the list if there's an actual debt
          simplifiedBalances.push({
            from: userId, // Person who owes money
            to: otherUserId, // Person who is owed money
            amount: amount, // The amount owed
            originalAmount: amount, // Keep the original amount for reference
          });
        }
      });
    });

    return simplifiedBalances;
  };

  const simplifiedBalances = getSimplifiedBalances();

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
        <p className="text-gray-600 mb-4">{group.members.length} members</p>
        {/* Smart Balance Toggle */}
        {/* <div className="flex items-center mb-4">
          <span className="mr-2 text-sm font-medium text-gray-700">
            {smartBalanceMode
              ? "Smart Balance Mode: On"
              : "Smart Balance Mode: Off"}
          </span>
          <button
            onClick={() => setSmartBalanceMode(!smartBalanceMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              smartBalanceMode ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                smartBalanceMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div> */}
        {/* Expense Form */}
        {showExpenseForm && (
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
              onSubmit={handleAddExpense}
              onCancel={() => setShowExpenseForm(false)}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Balances Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">
              Balance Summary
            </h3>

            {/* Smart Balance Toggle */}
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium text-gray-700">
                {smartBalanceMode ? "Smart Balance: On" : "Smart Balance: Off"}
              </span>
              <button
                onClick={() => setSmartBalanceMode(!smartBalanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  smartBalanceMode ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    smartBalanceMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Two-Column Layout for Personal Balances */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Left Column: Money People Owe Me */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-green-800">
                  Money People Owe Me
                </h4>
              </div>
              <div className="divide-y divide-gray-100">
                {simplifiedBalances
                  .filter((balance) => balance.to === currentUserId)
                  .map((balance, index) => {
                    const fromUser = group.members.find(
                      (m) => m._id === balance.from
                    );
                    if (!fromUser) return null;

                    return (
                      <div
                        key={`receive-${index}`}
                        className="p-4 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <span className="font-medium">{fromUser.name}</span>
                          {smartBalanceMode && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              Smart
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-medium">
                            ₹{balance.amount.toFixed(2)}
                          </span>
                          <span className="text-amber-600 text-sm">
                            Pending
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {simplifiedBalances.filter(
                  (balance) => balance.to === currentUserId
                ).length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No one owes you money
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Money I Owe */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-blue-800">Money I Owe</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {simplifiedBalances
                  .filter((balance) => balance.from === currentUserId)
                  .map((balance, index) => {
                    const toUser = group.members.find(
                      (m) => m._id === balance.to
                    );
                    if (!toUser) return null;

                    return (
                      <div
                        key={`pay-${index}`}
                        className="p-4 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <span className="font-medium">{toUser.name}</span>
                          {smartBalanceMode && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              Smart
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-600 font-medium">
                            ₹{balance.amount.toFixed(2)}
                          </span>
                          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition duration-200">
                            Mark as Paid
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {simplifiedBalances.filter(
                  (balance) => balance.from === currentUserId
                ).length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    You don't owe anyone
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Toggle for All Group Balances */}
          <div className="mt-8 mb-4">
            <button
              onClick={() => setShowAllBalances(!showAllBalances)}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <span className="mr-2 font-medium">
                {showAllBalances ? "Hide" : "Show"} All Group Balances
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  showAllBalances ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* All Group Balances Section (Toggleable) */}
          {showAllBalances && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-2">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-700">
                  All Group Balances
                </h4>
              </div>
              <div className="divide-y divide-gray-100">
                {simplifiedBalances.length > 0 ? (
                  simplifiedBalances.map((balance, index) => {
                    const fromUser = group.members.find(
                      (m) => m._id === balance.from
                    );
                    const toUser = group.members.find(
                      (m) => m._id === balance.to
                    );
                    if (!fromUser || !toUser) return null;

                    const isUserInvolved =
                      fromUser._id === currentUserId ||
                      toUser._id === currentUserId;

                    return (
                      <div
                        key={`all-${index}`}
                        className={`p-4 flex justify-between items-center ${
                          isUserInvolved ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <span
                            className={
                              fromUser._id === currentUserId
                                ? "font-medium"
                                : ""
                            }
                          >
                            {fromUser._id === currentUserId
                              ? "You"
                              : fromUser.name}
                          </span>
                          <span className="text-gray-500">owes</span>
                          <span
                            className={
                              toUser._id === currentUserId ? "font-medium" : ""
                            }
                          >
                            {toUser._id === currentUserId ? "you" : toUser.name}
                          </span>
                          {smartBalanceMode && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              Smart
                            </span>
                          )}
                        </div>
                        <span className="text-gray-800 font-medium">
                          ₹{balance.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Everyone is settled up! No balances due.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expenses Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-800">
            Recent Expenses
          </h3>

          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <ExpenseItem
                  key={expense._id}
                  expense={expense}
                  currentUserId={currentUserId}
                  users={group.members}
                  handleUpdateExpense={async (
                    expenseId: string,
                    updatedData: any
                  ) => {
                    return Promise.resolve();
                  }}
                  handleDeleteExpense={async (expenseId: string) => {
                    return Promise.resolve();
                  }}
                  handleJoinExpense={async (expenseId: string) => {
                    return Promise.resolve();
                  }}
                  isSelected={selectedExpenseId === expense._id}
                  onSelect={() => setSelectedExpenseId(expense._id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No expenses recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
