import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { generateTransactionId, generateUPILink } from "@/utils/upiHelpers";
import UPIPaymentModal from "./UPIPaymentModal";
import {
  CheckCircle,
  Error,
  HourglassBottom,
  Payment,
} from "@mui/icons-material";

interface UPIPaymentButtonProps {
  amount: number;
  smartBalanceAmount?: number;
  smartBalanceMode: boolean;
  recipientName: string;
  recipientId: string;
  groupId: string;
  currentUserId: string;
  expenseId?: string;
  onPaymentComplete: () => void;
  disabled?: boolean;
  paymentStatus: "initial" | "pending" | "completed" | "rejected";
  setPaymentStatus: (
    status: "initial" | "pending" | "completed" | "rejected"
  ) => void;
}

const UPIPaymentButton: React.FC<UPIPaymentButtonProps> = ({
  amount,
  smartBalanceAmount,
  smartBalanceMode,
  recipientName,
  recipientId,
  groupId,
  currentUserId,
  expenseId,
  onPaymentComplete,
  disabled = false,
  paymentStatus,
  setPaymentStatus,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recipientUpiId, setRecipientUpiId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const payableAmount = smartBalanceMode ? smartBalanceAmount || 0 : amount;

  const isButtonDisabled = payableAmount <= 0 || paymentStatus === "completed";

  useEffect(() => {
    const fetchRecipientUpiId = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${recipientId}/upiId`
        );
        setRecipientUpiId(response.data.upiId);
      } catch (error) {
        console.error("Error fetching recipient UPI ID:", error);
      }
    };

    fetchRecipientUpiId();
  }, [recipientId]);

  const handleOpenDialog = async () => {
    if (paymentStatus === "rejected") {
      try {
        // Reset the payment status in the backend
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/expense/reset-payment-status`,
          {
            expenseId: expenseId,
            userId: currentUserId,
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          // Reset the payment status in the frontend
          setPaymentStatus("initial");
        } else {
          toast.error("Failed to reset payment status");
        }
      } catch (error) {
        console.error("Error resetting payment status:", error);
        toast.error("An error occurred while resetting payment status");
      }
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => setIsDialogOpen(false);

  const handlePaymentConfirmation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-completed-by-ower`,
        {
          expenseId: expenseId,
          payerId: currentUserId,
          amount: payableAmount,
          isSmartBalancePayment: smartBalanceMode,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the status to "completed"
        setPaymentStatus("completed");
        toast.success(`Payment notification sent to ${recipientName}`);
        onPaymentComplete(); // Refresh group data or update the UI
      } else {
        toast.error("Failed to record payment completion");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("An error occurred while recording payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!recipientUpiId) {
      toast.error("Recipient UPI ID not available");
      return;
    }

    const transactionId = generateTransactionId(
      groupId,
      currentUserId,
      recipientId
    );
    const upiLink = generateUPILink(
      recipientUpiId,
      payableAmount,
      recipientName,
      transactionId
    );

    setPaymentStatus("pending");
    window.location.href = upiLink; // Redirect to UPI app
  };

  const upiPaymentLink = recipientUpiId
    ? generateUPILink(
        recipientUpiId,
        payableAmount,
        recipientName,
        generateTransactionId(groupId, currentUserId, recipientId)
      )
    : "";

  return (
    <>
      {paymentStatus === "pending" ? (
        <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <HourglassBottom className="text-yellow-600" fontSize="small" />
          <span className="text-yellow-700 text-sm font-medium">
            Awaiting Confirmation
          </span>
        </div>
      ) : paymentStatus === "completed" ? (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle className="text-green-600" fontSize="small" />
          <span className="text-green-700 text-sm font-medium">
            Payment Completed
          </span>
        </div>
      ) : paymentStatus === "rejected" ? (
        <div className="flex flex-col items-center space-y-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <Error className="text-red-600" fontSize="small" />
            <span className="text-red-700 text-sm font-medium">
              Payment Rejected
            </span>
          </div>
          <button
            onClick={handleOpenDialog}
            disabled={isButtonDisabled || disabled}
            className={`
    flex items-center justify-center 
    min-w-[140px] 
    px-4 py-2 
    rounded-lg 
    transition-all duration-200 
    space-x-2
    ${
      isButtonDisabled || disabled
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-blue-100 text-gray-700 hover:bg-blue-200 shadow-sm"
    }
  `}
          >
            <img src="/upiLogo.svg" alt="UPI Logo" className="w-5 h-5" />
            <span className="font-medium">Retry Payment</span>
          </button>
        </div>
      ) : (
        <div className="relative group">
          <button
            onClick={handleOpenDialog}
            disabled={isButtonDisabled || disabled}
            className={`
            flex items-center justify-center 
            min-w-[140px] 
            px-4 py-2 
            rounded-lg 
            transition-all duration-200 
            space-x-2
            ${
              isButtonDisabled || disabled
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-100 text-gray-700 hover:bg-blue-200 shadow-sm"
            }
          `}
          >
            <img src="/upiLogo.svg" alt="UPI Logo" className="w-5 h-5" />
            <span className="font-medium">Pay via UPI</span>
          </button>

          {/* Tooltip for disabled state */}
          {(isButtonDisabled || disabled) && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              {payableAmount <= 0 && "Payable amount is zero"}
              {disabled && "Button is disabled."}
            </div>
          )}
        </div>
      )}

      <UPIPaymentModal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        amount={payableAmount}
        recipientName={recipientName}
        recipientUpiId={recipientUpiId}
        upiPaymentLink={upiPaymentLink}
        paymentStatus={paymentStatus}
        isLoading={isLoading}
        onPayNow={handlePayNow}
        onPaymentConfirmation={handlePaymentConfirmation}
      />
    </>
  );
};

export default UPIPaymentButton;
