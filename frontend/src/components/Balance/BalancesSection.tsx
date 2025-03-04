import React, { useMemo } from "react";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import BalanceCard from "./BalanceCard";
import BalanceToggle from "./BalanceToggle";
import LoadingSpinner from "../Common/LoadingSpinner";

interface Balance {
  from: string;
  to: string;
  amount: number;
}

const BalancesSection: React.FC = () => {
  const {
    isLoading,
    group,
    currentUserId,
    smartBalanceMode,
    showAllBalances,
    getSimplifiedBalances,
  } = useGroupContext();

  const balances = useMemo(() => {
    const simplifiedBalances = getSimplifiedBalances();

    // Convert simplified balances to frontend-friendly format
    const payBalances: Balance[] = [];
    const receiveBalances: Balance[] = [];
    const allBalances: Balance[] = [];

    Object.keys(simplifiedBalances).forEach((from) => {
      Object.keys(simplifiedBalances[from]).forEach((to) => {
        const amount = simplifiedBalances[from][to];

        if (amount > 0) {
          const balanceEntry = { from, to, amount };

          if (from === currentUserId) {
            payBalances.push(balanceEntry);
          }

          if (to === currentUserId) {
            receiveBalances.push(balanceEntry);
          }

          allBalances.push(balanceEntry);
        }
      });
    });

    return {
      pay: payBalances,
      receive: receiveBalances,
      all: allBalances,
    };
  }, [smartBalanceMode, group, currentUserId, getSimplifiedBalances]);

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
              balances={balances.receive}
              group={group}
              currentUserId={currentUserId}
              smartBalanceMode={smartBalanceMode}
              type="receive"
            />
            <BalanceCard
              title="Money I Should Pay To"
              balances={balances.pay}
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
              balances={balances.all}
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
