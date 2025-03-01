import React, { useEffect, useMemo } from "react";
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

  // Aggregate balances by user
  const aggregatedBalances = useMemo(() => {
    const payMap = new Map();
    const receiveMap = new Map();
    const allMap = new Map();

    allBalances.forEach((balance) => {
      // For "Money I Should Pay To" section
      if (balance.from === currentUserId) {
        const key = balance.to;
        if (payMap.has(key)) {
          payMap.set(key, payMap.get(key) + balance.amount);
        } else {
          payMap.set(key, balance.amount);
        }
      }

      // For "Money People Must Pay Me" section
      if (balance.to === currentUserId) {
        const key = balance.from;
        if (receiveMap.has(key)) {
          receiveMap.set(key, receiveMap.get(key) + balance.amount);
        } else {
          receiveMap.set(key, balance.amount);
        }
      }

      // For "All Group Balances" section
      const key = `${balance.from}-${balance.to}`;
      if (allMap.has(key)) {
        allMap.set(key, {
          ...allMap.get(key),
          amount: allMap.get(key).amount + balance.amount,
        });
      } else {
        allMap.set(key, {
          from: balance.from,
          to: balance.to,
          amount: balance.amount,
        });
      }
    });

    // Convert maps to arrays
    const aggregatedPay = Array.from(payMap, ([to, amount]) => ({
      from: currentUserId,
      to,
      amount,
    }));

    const aggregatedReceive = Array.from(receiveMap, ([from, amount]) => ({
      from,
      to: currentUserId,
      amount,
    }));

    const aggregatedAll = Array.from(allMap.values());

    return {
      pay: aggregatedPay,
      receive: aggregatedReceive,
      all: aggregatedAll,
    };
  }, [allBalances, currentUserId]);

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
              balances={aggregatedBalances.receive}
              group={group}
              currentUserId={currentUserId}
              smartBalanceMode={smartBalanceMode}
              type="receive"
            />
            <BalanceCard
              title="Money I Should Pay To"
              balances={aggregatedBalances.pay}
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
              balances={aggregatedBalances.all}
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
