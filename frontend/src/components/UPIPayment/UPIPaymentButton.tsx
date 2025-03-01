import React, { useEffect, useState } from "react";
import { generateUPILink, generateTransactionId } from "@/utils/upiHelpers";
import { toast } from "react-toastify";
import axios from "axios";
import UPIPaymentModal from "./UPIPaymentModal";

interface UPIPaymentButtonProps {
  amount: number; // Original amount
  smartBalanceAmount?: number; // Amount after smart balance calculation
  smartBalanceMode: boolean; // Whether smart balance is enabled
  recipientName: string;
  recipientId: string;
  groupId: string;
  currentUserId: string;
  onPaymentComplete: () => void;
  disabled?: boolean;
}

const UPIPaymentButton: React.FC<UPIPaymentButtonProps> = ({
  amount,
  smartBalanceAmount,
  smartBalanceMode,
  recipientName,
  recipientId,
  groupId,
  currentUserId,
  onPaymentComplete,
  disabled = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recipientUpiId, setRecipientUpiId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "initial" | "pending" | "completed" | "failed"
  >("initial");

  const payableAmount = smartBalanceMode
    ? smartBalanceAmount || 0 // Fallback to 0 if smartBalanceAmount is undefined
    : amount;

  const isButtonDisabled = disabled || payableAmount <= 0;

  useEffect(() => {
    const fetchRecipientUpiId = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${recipientId}/upiId`
        );
        setRecipientUpiId(response.data.upiId);
      } catch (error) {
        console.error("Error fetching recipient's UPI ID:", error);
        toast.error("Could not fetch recipient's UPI ID");
      }
    };

    fetchRecipientUpiId();
  }, [recipientId]);

  const handleOpenDialog = () => {
    if (isButtonDisabled) return;
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setPaymentStatus("initial");
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
    window.location.href = upiLink;
  };

  const handlePaymentConfirmation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/confirm`,
        {
          transactionId: generateTransactionId(
            groupId,
            currentUserId,
            recipientId
          ),
          userId: recipientId,
        }
      );

      if (response.data.success) {
        setPaymentStatus("completed");
        toast.success(
          `Successfully paid ₹${payableAmount} to ${recipientName}`
        );
        onPaymentComplete();
      } else {
        toast.error("Failed to confirm payment");
        setPaymentStatus("failed");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("An error occurred while confirming payment");
      setPaymentStatus("failed");
    } finally {
      setIsLoading(false);
    }
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
      <button
        onClick={handleOpenDialog}
        disabled={isButtonDisabled}
        className={`bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg border border-blue-200 ${
          isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <img src="/upiLogo.svg" alt="UPI Logo" className="w-6 h-6" />
        <span className="font-medium">Pay via UPI</span>
      </button>

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
