import React, { useEffect } from "react";
import {
  useGroupContext,
  ActionTypes,
} from "@/context/GroupContext/GroupContext";
import BalanceCard from "./BalanceCard";
import BalanceToggle from "./BalanceToggle";
import LoadingSpinner from "../Common/LoadingSpinner";

const BalancesSection: React.FC = () => {
  const {
    isLoading,
    group,
    currentUserId,
    smartBalanceMode,
    showAllBalances,
    getSimplifiedBalances,
  } = useGroupContext();

  // Calculate balances based on smart mode
  const allBalances = React.useMemo(() => {
    // If smart balance mode is on, use the optimized balances from context
    if (smartBalanceMode) {
      console.log("Smart Balance Mode is ON, using optimized balances");
      return getSimplifiedBalances();
    }

    // If smart balance mode is off, calculate original balances from expenses
    console.log("Smart Balance Mode is OFF, showing original transactions");

    const originalBalances: any[] = [];

    console.log({ group });
    // Process each expense to extract original transactions
    if (group && group.expenses) {
      group.expenses.forEach((expense: any) => {
        if (!expense.paidBy || !expense.splitDetails) return;

        const paidById =
          typeof expense.paidBy === "string"
            ? expense.paidBy
            : expense.paidBy._id;

        // Skip if we can't determine who paid
        if (!paidById) return;

        expense.splitDetails.forEach((split: any) => {
          const userId =
            typeof split.user === "string"
              ? split.user
              : (split.user as any)?._id;

          // Skip if user paid for themselves or amount is invalid
          if (userId === paidById || !userId || split.amount <= 0) return;

          // Add to original balances - this is a direct transaction
          originalBalances.push({
            from: userId,
            to: paidById,
            amount: split.amount,
            originalAmount: split.amount,
            expenseId: expense._id,
            description: expense.description,
          });
        });
      });
    }

    console.log("Original transactions:", originalBalances);

    return originalBalances;
  }, [smartBalanceMode, group, getSimplifiedBalances]);

  console.log({ allBalances });

  if (!group) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800">Balance Summary</h3>
        <BalanceToggle smartBalanceMode={smartBalanceMode} />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <BalanceCard
              title="Money People Must Pay Me"
              balances={allBalances.filter(
                (balance) => balance.to === currentUserId
              )}
              group={group}
              currentUserId={currentUserId}
              smartBalanceMode={smartBalanceMode}
              type="receive"
            />
            <BalanceCard
              title="Money I Should Pay To"
              balances={allBalances.filter(
                (balance) => balance.from === currentUserId
              )}
              group={group}
              currentUserId={currentUserId}
              smartBalanceMode={smartBalanceMode}
              type="pay"
            />
          </div>

          <BalanceToggle showAllBalances={showAllBalances} />

          {showAllBalances && (
            <BalanceCard
              title="All Group Balances"
              balances={allBalances}
              group={group}
              currentUserId={currentUserId}
              smartBalanceMode={smartBalanceMode}
              type="all"
            />
          )}
        </>
      )}
    </div>
  );
};

export default BalancesSection;
