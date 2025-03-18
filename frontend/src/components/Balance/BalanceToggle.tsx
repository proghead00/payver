import React, { useState } from "react";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import * as groupServices from "@/services/groupServices";
import { toast } from "sonner";

interface BalanceToggleProps {
  smartBalanceMode?: boolean;
  showAllBalances?: boolean;
}

const BalanceToggle: React.FC<BalanceToggleProps> = ({
  smartBalanceMode,
  showAllBalances,
}) => {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const {
    smartBalanceMode: isSmartMode,
    setSmartBalanceMode,
    group,
  } = useGroupContext();

  const handleToggleSmartMode = () => {
    if (!isSmartMode) {
      setIsConfirmationModalOpen(true); // Show confirmation modal before enabling Smart Mode
    }
  };

  const handleConfirmSmartMode = async () => {
    try {
      if (!group?._id) {
        throw new Error("Group ID is undefined");
      }

      // Update Smart Mode state in the database
      const response = await groupServices.updateSmartBalanceMode(
        group._id, // Now group._id is guaranteed to be a string
        true
      );

      if (response.success) {
        setSmartBalanceMode(true); // Update context state
        setIsConfirmationModalOpen(false); // Close the confirmation modal
      }
    } catch (error) {
      console.error("Error enabling Smart Mode:", error);
      toast.error("Failed to enable Smart Mode");
    }
  };

  return (
    <>
      <div className="flex items-center relative group">
        <span
          className={`mr-2 text-sm font-medium ${
            isSmartMode ? "text-gray-500" : "text-gray-700"
          }`}
        >
          {isSmartMode ? "Smart Balance: On" : "Smart Balance: Off"}
        </span>

        {isSmartMode && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-sm px-3 py-2 rounded-md shadow-lg whitespace-normal max-w-[200px] sm:max-w-xs text-center">
            You cannot turn off smart mode once turned on
          </div>
        )}

        <button
          onClick={handleToggleSmartMode}
          disabled={isSmartMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isSmartMode
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-300 hover:bg-gray-400"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSmartMode ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Confirmation Modal for Enabling Smart Mode */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmSmartMode}
        title="Enable Smart Mode"
        message="Enabling Smart Mode is irreversible. All calculations for payments in this group will be done by netting off mutual debts. Are you sure you want to proceed?"
        confirmButtonText="Enable Smart Mode"
        isConfirming={false} // No loading state for this modal
      />
    </>
  );
};

export default BalanceToggle;
