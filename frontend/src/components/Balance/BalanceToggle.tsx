import React from "react";

interface BalanceToggleProps {
  smartBalanceMode?: boolean;
  setSmartBalanceMode?: (mode: boolean) => void;
  showAllBalances?: boolean;
  setShowAllBalances?: (show: boolean) => void;
}

const BalanceToggle: React.FC<BalanceToggleProps> = ({
  smartBalanceMode,
  setSmartBalanceMode,
  showAllBalances,
  setShowAllBalances,
}) => {
  if (smartBalanceMode !== undefined && setSmartBalanceMode !== undefined) {
    return (
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
    );
  }

  if (showAllBalances !== undefined && setShowAllBalances !== undefined) {
    return (
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
    );
  }

  return null;
};

export default BalanceToggle;
