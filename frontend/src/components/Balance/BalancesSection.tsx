import React from "react";
import BalanceCard from "./BalanceCard";
import BalanceToggle from "./BalanceToggle";
import { Group } from "../../config/types";
import LoadingSpinner from "../Common/LoadingSpinner";

interface BalancesSectionProps {
  loading: boolean;
  simplifiedBalances: any[];
  group: Group;
  currentUserId: string;
  smartBalanceMode: boolean;
  setSmartBalanceMode: (mode: boolean) => void;
  showAllBalances: boolean;
  setShowAllBalances: (show: boolean) => void;
  handleMarkAsPaid: (userId: string, amount: number) => void;
}

const BalancesSection: React.FC<BalancesSectionProps> = ({
  loading,
  simplifiedBalances,
  group,
  currentUserId,
  smartBalanceMode,
  setSmartBalanceMode,
  showAllBalances,
  setShowAllBalances,
  handleMarkAsPaid,
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800">Balance Summary</h3>
      <BalanceToggle
        smartBalanceMode={smartBalanceMode}
        setSmartBalanceMode={setSmartBalanceMode}
      />
    </div>

    {loading ? (
      <LoadingSpinner />
    ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <BalanceCard
            title="Money People Must Pay Me"
            balances={simplifiedBalances.filter(
              (balance) => balance.to === currentUserId
            )}
            group={group}
            currentUserId={currentUserId}
            smartBalanceMode={smartBalanceMode}
            type="receive"
          />
          <BalanceCard
            title="Money I Should Pay To"
            balances={simplifiedBalances.filter(
              (balance) => balance.from === currentUserId
            )}
            group={group}
            currentUserId={currentUserId}
            smartBalanceMode={smartBalanceMode}
            type="pay"
            handleMarkAsPaid={handleMarkAsPaid}
          />
        </div>

        <BalanceToggle
          showAllBalances={showAllBalances}
          setShowAllBalances={setShowAllBalances}
        />

        {showAllBalances && (
          <BalanceCard
            title="All Group Balances"
            balances={simplifiedBalances}
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

export default BalancesSection;
