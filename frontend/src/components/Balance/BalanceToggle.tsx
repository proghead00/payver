import React, { useCallback, useState } from "react";
import {
  useGroupContext,
  ActionTypes,
} from "@/context/GroupContext/GroupContext";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import { toast } from "react-toastify";

interface BalanceToggleProps {
  smartBalanceMode?: boolean;
  showAllBalances?: boolean;
  isPreviewMode?: boolean;
}

const BalanceToggle: React.FC<BalanceToggleProps> = ({
  smartBalanceMode = false, // Default to false
  showAllBalances,
  isPreviewMode = false,
}) => {
  const { dispatch } = useGroupContext();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleToggleSmartBalance = useCallback(() => {
    if (smartBalanceMode) {
      toast.info("Smart Balance mode cannot be turned off once enabled.");
      return;
    }
    setShowConfirmationModal(true); // Show confirmation modal
  }, [smartBalanceMode]);

  const handleConfirmSmartBalance = useCallback(() => {
    dispatch({
      type: ActionTypes.TOGGLE_SMART_BALANCE,
      payload: true,
    });
    setShowConfirmationModal(false);
    toast.success("Smart Balance mode has been enabled.");
  }, [dispatch]);

  if (smartBalanceMode !== undefined) {
    return (
      <div className="flex items-center">
        <span className="mr-2 text-sm font-medium text-gray-700">
          {smartBalanceMode
            ? "Smart Balance: On"
            : isPreviewMode
            ? "Smart Balance Preview"
            : "Smart Balance: Off"}
        </span>
        <button
          onClick={handleToggleSmartBalance}
          disabled={isPreviewMode || smartBalanceMode} // Disable if preview mode or already enabled
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            smartBalanceMode ? "bg-blue-500" : "bg-gray-300"
          } ${
            isPreviewMode || smartBalanceMode
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              smartBalanceMode ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>

        {!isPreviewMode && (
          <ConfirmationModal
            isOpen={showConfirmationModal}
            onClose={() => setShowConfirmationModal(false)}
            onConfirm={handleConfirmSmartBalance}
            title="Enable Smart Balance"
            message="Are you sure you want to enable Smart Balance? This will simplify balances by netting off mutual debts and is irreversible."
            confirmButtonText="Enable"
            isConfirming={false}
          />
        )}
      </div>
    );
  }

  if (showAllBalances !== undefined) {
    return (
      <div className="mt-8 mb-4">
        <button
          onClick={() =>
            dispatch({
              type: ActionTypes.TOGGLE_ALL_BALANCES,
              payload: !showAllBalances,
            })
          }
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
