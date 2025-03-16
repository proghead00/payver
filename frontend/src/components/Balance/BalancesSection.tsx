import React, { useMemo } from "react";
import {
  useGroupContext,
  ActionTypes,
} from "@/context/GroupContext/GroupContext";
import BalanceCard from "./BalanceCard";
import LoadingSpinner from "../Common/LoadingSpinner";
import BalanceToggle from "./BalanceToggle";

const BalancesSection: React.FC = () => {
  const {
    isLoading,
    group,
    currentUserId,
    smartBalanceMode,
    showAllBalances,
    getSimplifiedBalances,
  } = useGroupContext();

  const aggregateBalances = (balances: any[]) => {
    const aggregated: { [key: string]: number } = {};

    balances.forEach((balance) => {
      const key = balance.from === currentUserId ? balance.to : balance.from;
      if (!aggregated[key]) {
        aggregated[key] = 0;
      }
      aggregated[key] += balance.amount;
    });

    return Object.entries(aggregated).map(([userId, amount]) => ({
      from: currentUserId,
      to: userId,
      amount,
    }));
  };

  const allBalances = useMemo(() => {
    if (smartBalanceMode) {
      return getSimplifiedBalances();
    }

    const originalBalances: any[] = [];

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

    return originalBalances;
  }, [smartBalanceMode, group, getSimplifiedBalances]);

  if (!group) return null;

  const aggregatedReceiveBalances = aggregateBalances(
    allBalances.filter((balance) => balance.to === currentUserId)
  );
  const aggregatedPayBalances = aggregateBalances(
    allBalances.filter((balance) => balance.from === currentUserId)
  );

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
              balances={aggregatedReceiveBalances}
              group={group}
              currentUserId={currentUserId}
              smartBalanceMode={smartBalanceMode}
              type="receive"
            />
            <BalanceCard
              title="Money I Should Pay To"
              balances={aggregatedPayBalances}
              group={group}
              currentUserId={currentUserId}
              smartBalanceMode={smartBalanceMode}
              type="pay"
            />
          </div>

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
